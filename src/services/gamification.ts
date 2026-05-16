import type { PrismaClient } from "@prisma/client";

import { utcDayStart } from "@/lib/datetime/utc-day-start";

/** Activity kinds that advance streak / XP (UTC day boundaries). */
export type QualifyingActivityKind = "nutrition" | "workout";
export interface AchievementUnlock {
  type: string;
  title: string;
}

const XP_BY_KIND: Record<QualifyingActivityKind, number> = {
  nutrition: 6,
  workout: 18
};

/** Human-readable titles for dashboard (keys stable for DB `Achievement.type`). */
export const ACHIEVEMENT_TITLE: Record<string, string> = {
  TITAN_FIRST_LOG: "First log",
  TITAN_MEALS_10: "10 meals logged",
  TITAN_MEALS_50: "50 meals logged",
  TITAN_WORKOUTS_5: "5 sessions",
  TITAN_WORKOUTS_25: "25 sessions",
  TITAN_STREAK_3: "3-day streak",
  TITAN_STREAK_7: "7-day streak",
  TITAN_STREAK_14: "14-day streak",
  TITAN_STREAK_30: "30-day streak",
  TITAN_XP_500: "500 XP",
  TITAN_XP_1500: "1.5k XP",
  TITAN_XP_5000: "5k XP"
};

function achievementTypesEligible(args: {
  meals: number;
  workouts: number;
  currentStreak: number;
  xp: number;
}): string[] {
  const { meals, workouts, currentStreak, xp } = args;
  const types: string[] = [];
  if (meals + workouts >= 1) types.push("TITAN_FIRST_LOG");
  if (meals >= 10) types.push("TITAN_MEALS_10");
  if (meals >= 50) types.push("TITAN_MEALS_50");
  if (workouts >= 5) types.push("TITAN_WORKOUTS_5");
  if (workouts >= 25) types.push("TITAN_WORKOUTS_25");
  if (currentStreak >= 3) types.push("TITAN_STREAK_3");
  if (currentStreak >= 7) types.push("TITAN_STREAK_7");
  if (currentStreak >= 14) types.push("TITAN_STREAK_14");
  if (currentStreak >= 30) types.push("TITAN_STREAK_30");
  if (xp >= 500) types.push("TITAN_XP_500");
  if (xp >= 1500) types.push("TITAN_XP_1500");
  if (xp >= 5000) types.push("TITAN_XP_5000");
  return types;
}

function computeNextStreak(
  existing: { currentStreak: number; lastActivity: Date | null } | null,
  todayStart: Date
): number {
  if (!existing) {
    return 1;
  }
  if (!existing.lastActivity) {
    return Math.max(1, existing.currentStreak || 1);
  }

  const lastDay = utcDayStart(existing.lastActivity);
  if (lastDay.getTime() === todayStart.getTime()) {
    return existing.currentStreak;
  }

  const yesterday = new Date(todayStart);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  if (lastDay.getTime() === yesterday.getTime()) {
    return existing.currentStreak + 1;
  }

  return 1;
}

/**
 * Call after a nutrition log or workout row is persisted. Updates streak + XP and unlocks achievements.
 */
export async function recordQualifyingActivity(
  prisma: PrismaClient,
  userId: string,
  kind: QualifyingActivityKind
): Promise<AchievementUnlock[]> {
  const now = new Date();
  const todayStart = utcDayStart(now);
  const xpDelta = XP_BY_KIND[kind];

  return prisma.$transaction(async (tx) => {
    const existing = await tx.streak.findUnique({ where: { userId } });
    const newCurrent = computeNextStreak(existing, todayStart);
    const newLongest = existing ? Math.max(existing.longestStreak, newCurrent) : newCurrent;

    const row = await tx.streak.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastActivity: now,
        xp: xpDelta
      },
      update: {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastActivity: now,
        xp: { increment: xpDelta }
      }
    });

    const [meals, workouts] = await Promise.all([
      tx.nutritionLog.count({ where: { userId } }),
      tx.workout.count({ where: { userId } })
    ]);

    const candidateTypes = achievementTypesEligible({
      meals,
      workouts,
      currentStreak: row.currentStreak,
      xp: row.xp
    });

    if (candidateTypes.length === 0) {
      return [];
    }

    const existingAchievements = await tx.achievement.findMany({
      where: { userId, type: { in: candidateTypes } },
      select: { type: true }
    });
    const existingTypes = new Set(existingAchievements.map((a) => a.type));
    const newTypes = candidateTypes.filter((type) => !existingTypes.has(type));

    if (newTypes.length === 0) {
      return [];
    }

    await tx.achievement.createMany({
      data: newTypes.map((type) => ({ userId, type })),
      skipDuplicates: true
    });

    return newTypes.map((type) => ({
      type,
      title: ACHIEVEMENT_TITLE[type] ?? type
    }));
  });
}
