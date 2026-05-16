import { z } from "zod";

import { weightProgressBucketKey } from "@/lib/training/weight-progression-buckets";
import { logWorkoutSchema } from "@/lib/validations/training.schema";
import { recordQualifyingActivity } from "@/services/gamification";

import { createTRPCRouter, protectedProcedure } from "../router";

const weightProgressionInput = z.object({
  grain: z.enum(["week", "month"]).default("week")
});

export const trainingRouter = createTRPCRouter({
  getRecent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.workout.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { date: "desc" },
      take: 20,
      include: { exercises: true }
    });
  }),

  /** Workloads in dashboard: last 7 days, same rolling window as dashboard.getOverview. */
  getRollingWeekWorkouts: protectedProcedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return ctx.prisma.workout.findMany({
      where: { userId: ctx.session.user.id, date: { gte: since } },
      orderBy: { date: "desc" },
      take: 200,
      select: { id: true, name: true, date: true, rpe: true }
    });
  }),

  /**
   * Peak working weight (kg) per calendar week or month from logged sets (non-warmup, weight > 0).
   * Used for PRO progression chart in settings.
   */
  getWeightProgression: protectedProcedure
    .input(weightProgressionInput)
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setUTCMonth(since.getUTCMonth() - 9);

      const rows = await ctx.prisma.workoutSet.findMany({
        where: {
          isWarmup: false,
          weight: { gt: 0 },
          workout: {
            userId: ctx.session.user.id,
            date: { gte: since }
          }
        },
        select: {
          weight: true,
          exercise: true,
          workout: { select: { date: true } }
        },
        take: 8000
      });

      const byPeriod = new Map<string, { maxWeight: number; exercise: string }>();

      for (const row of rows) {
        const w = row.weight;
        if (w == null || !Number.isFinite(w)) continue;
        const key = weightProgressBucketKey(row.workout.date, input.grain);
        const cur = byPeriod.get(key);
        if (!cur || w > cur.maxWeight) {
          byPeriod.set(key, { maxWeight: w, exercise: row.exercise });
        }
      }

      const sorted = [...byPeriod.entries()].sort((a, b) => a[0].localeCompare(b[0]));

      return {
        grain: input.grain,
        points: sorted.map(([periodKey, v]) => ({
          periodKey,
          maxWeightKg: Math.round(v.maxWeight * 10) / 10,
          topExercise: v.exercise
        }))
      };
    }),

  logWorkout: protectedProcedure.input(logWorkoutSchema).mutation(async ({ ctx, input }) => {
    const workout = await ctx.prisma.workout.create({
      data: {
        userId: ctx.session.user.id,
        name: input.name,
        notes: input.notes,
        rpe: input.rpe,
        durationMin: input.durationMin,
        exercises: {
          create: input.sets
        }
      },
      include: { exercises: true }
    });
    const unlockedAchievements = await recordQualifyingActivity(
      ctx.prisma,
      ctx.session.user.id,
      "workout"
    );
    return { workout, unlockedAchievements };
  })
});
