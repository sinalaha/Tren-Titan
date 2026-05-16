import { DASHBOARD_HYDRATION_GOAL_ML, DEFAULT_WORKOUT_RPE } from "@/lib/constants";
import {
  buildDailyMissions,
  dailyMissionProfileFromDb,
  type DailyMissionStats,
  normalizeDailyMissionsFocus
} from "@/lib/dashboard/daily-missions";
import { utcDayStart } from "@/lib/datetime/utc-day-start";
import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";
import { ACHIEVEMENT_TITLE } from "@/services/gamification";

import { createTRPCRouter, protectedProcedure } from "../router";

type SubscriptionMergeInput = Parameters<typeof mergeSubscriptionWithDevPremium>[0];

function finiteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

type TodayNutritionRow = {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  fiber: number | null;
};
type WeekWorkoutRpeRow = { rpe: number | null };
type AchievementSummaryRow = { type: string; unlockedAt: Date };

export const dashboardRouter = createTRPCRouter({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const todayUtcStart = utcDayStart(now);
    const rollingWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      subscription,
      profileRow,
      todayNutrition,
      todayWorkoutsCount,
      weekWorkouts,
      todayWater,
      todayWaterLogsCount,
      streak,
      achievementRows
    ] = await Promise.all([
      ctx.prisma.subscription
        .findUnique({ where: { userId } })
        .then((row: SubscriptionMergeInput) => mergeSubscriptionWithDevPremium(row, userId)),
      ctx.prisma.profile.findUnique({
        where: { userId },
        select: {
          dailyMissionsFocus: true,
          height: true,
          weight: true,
          age: true,
          gender: true,
          trainingFreq: true
        }
      }),
      ctx.prisma.nutritionLog.findMany({
        where: { userId, date: { gte: todayUtcStart } },
        select: { calories: true, protein: true, fats: true, carbs: true, fiber: true }
      }),
      ctx.prisma.workout.count({
        where: { userId, date: { gte: todayUtcStart } }
      }),
      ctx.prisma.workout.findMany({
        where: { userId, date: { gte: rollingWeekStart } },
        select: { rpe: true }
      }),
      ctx.prisma.waterLog.aggregate({
        where: { userId, date: { gte: todayUtcStart } },
        _sum: { amountMl: true }
      }),
      ctx.prisma.waterLog.count({
        where: { userId, date: { gte: todayUtcStart } }
      }),
      ctx.prisma.streak.findUnique({ where: { userId } }),
      ctx.prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
        take: 8,
        select: { type: true, unlockedAt: true }
      })
    ]);

    const dailyMissionsFocus = normalizeDailyMissionsFocus(profileRow?.dailyMissionsFocus);
    const dayKey = todayUtcStart.toISOString().slice(0, 10);
    const missionProfile = dailyMissionProfileFromDb(profileRow);

    const caloriesToday = todayNutrition.reduce(
      (sum: number, item: TodayNutritionRow) => sum + finiteNumber(item.calories),
      0
    );
    const proteinToday = todayNutrition.reduce(
      (sum: number, item: TodayNutritionRow) => sum + finiteNumber(item.protein),
      0
    );
    const fatToday = todayNutrition.reduce(
      (sum: number, item: TodayNutritionRow) => sum + finiteNumber(item.fats),
      0
    );
    const carbsToday = todayNutrition.reduce(
      (sum: number, item: TodayNutritionRow) => sum + finiteNumber(item.carbs),
      0
    );
    const fiberToday = todayNutrition.reduce(
      (sum: number, item: TodayNutritionRow) => sum + finiteNumber(item.fiber),
      0
    );
    const avgRpe =
      weekWorkouts.length === 0
        ? 0
        : weekWorkouts.reduce(
            (sum: number, workout: WeekWorkoutRpeRow) =>
              sum + finiteNumber(workout.rpe ?? DEFAULT_WORKOUT_RPE, DEFAULT_WORKOUT_RPE),
            0
          ) / weekWorkouts.length;
    const safeAvgRpe = finiteNumber(avgRpe);
    const workloadScore = Math.min(Math.round((safeAvgRpe / 10) * 100), 100);
    const waterMlToday = finiteNumber(todayWater._sum.amountMl);
    const hydrationGoal = Math.max(1, DASHBOARD_HYDRATION_GOAL_ML);
    const hydrationPct = Math.min(100, Math.round((waterMlToday / hydrationGoal) * 100));

    const isPremium = subscription?.plan === "premium";

    const missionStats: DailyMissionStats = {
      mealsCount: todayNutrition.length,
      workoutsCount: todayWorkoutsCount,
      waterMl: waterMlToday,
      waterLogsCount: todayWaterLogsCount,
      proteinSum: proteinToday,
      caloriesSum: caloriesToday,
      carbsSum: carbsToday,
      fatSum: fatToday,
      fiberSum: fiberToday
    };
    const missions = buildDailyMissions(
      dailyMissionsFocus,
      userId,
      dayKey,
      missionStats,
      missionProfile
    );

    return {
      isPremium,
      dailyMissionsFocus,
      gamification: {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        xp: streak?.xp ?? 0,
        achievements: achievementRows.map((a: AchievementSummaryRow) => ({
          type: a.type,
          title: ACHIEVEMENT_TITLE[a.type] ?? a.type,
          unlockedAt: a.unlockedAt
        }))
      },
      missions,
      kpis: [
        {
          id: "calories",
          labelKey: "dashboard.kpi.calories",
          value: `${Math.round(caloriesToday)}`,
          tone: "blue" as const
        },
        {
          id: "protein",
          labelKey: "dashboard.kpi.protein",
          value: `${Math.round(proteinToday)}g`,
          tone: "cyan" as const
        },
        {
          id: "workload",
          labelKey: "dashboard.kpi.workload",
          value: `${workloadScore}%`,
          tone: "purple" as const
        },
        {
          id: "hydration",
          labelKey: "dashboard.kpi.hydration",
          value: `${hydrationPct}%`,
          tone: "crimson" as const
        }
      ]
    };
  })
});
