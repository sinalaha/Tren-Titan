import { Goal, type PrismaClient } from "@prisma/client";

import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";

export interface CoachContextSnapshot {
  goal: Goal;
  weightKg: number | null;
  heightCm: number | null;
  trainingDaysPerWeek: number | null;
  currentStreak: number;
  longestStreak: number;
  avgCalories7d: number;
  avgProtein7d: number;
  avgFats7d: number;
  avgCarbs7d: number;
  nutritionDaysLogged7d: number;
  workouts7d: number;
  avgRpe7d: number | null;
  lastWorkoutNames: string[];
  subscriptionPlan: string;
  subscriptionStatus: string;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function buildCoachContextSnapshot(
  prisma: PrismaClient,
  userId: string
): Promise<CoachContextSnapshot> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [profile, streak, subRow, logs, workouts] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.nutritionLog.findMany({
      where: { userId, date: { gte: since } },
      select: { date: true, calories: true, protein: true, fats: true, carbs: true }
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "desc" },
      take: 14,
      select: { name: true, rpe: true, date: true }
    })
  ]);
  const subscription = mergeSubscriptionWithDevPremium(subRow, userId);

  const daysWithLogs = new Set(logs.map((l) => l.date.toISOString().slice(0, 10))).size;
  const totalCal = logs.reduce((s, l) => s + l.calories, 0);
  const totalProtein = logs.reduce((s, l) => s + l.protein, 0);
  const totalFats = logs.reduce((s, l) => s + l.fats, 0);
  const totalCarbs = logs.reduce((s, l) => s + l.carbs, 0);
  const n = Math.max(logs.length, 1);

  const rpeValues = workouts.map((w) => w.rpe).filter((r): r is number => r != null);
  const avgRpe =
    rpeValues.length === 0 ? null : round1(rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length);

  const lastWorkoutNames = [...new Set(workouts.map((w) => w.name).filter(Boolean))] as string[];

  return {
    goal: profile?.goal ?? Goal.MAINTENANCE,
    weightKg: profile?.weight ?? null,
    heightCm: profile?.height ?? null,
    trainingDaysPerWeek: profile?.trainingFreq ?? null,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    avgCalories7d: round1(totalCal / n),
    avgProtein7d: round1(totalProtein / n),
    avgFats7d: round1(totalFats / n),
    avgCarbs7d: round1(totalCarbs / n),
    nutritionDaysLogged7d: daysWithLogs,
    workouts7d: workouts.length,
    avgRpe7d: avgRpe,
    lastWorkoutNames: lastWorkoutNames.slice(0, 6),
    subscriptionPlan: subscription?.plan ?? "free",
    subscriptionStatus: subscription?.status ?? "FREE"
  };
}
