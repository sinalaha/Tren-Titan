import { TRPCError } from "@trpc/server";

import { utcDayStart } from "@/lib/datetime/utc-day-start";
import { analyzeFoodSchema, logMealSchema } from "@/lib/validations/nutrition.schema";
import { analyzeFoodImage } from "@/server/ai/foodAnalysis";
import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";
import { recordQualifyingActivity } from "@/services/gamification";

import { createTRPCRouter, protectedProcedure } from "../router";

export const nutritionRouter = createTRPCRouter({
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const todayUtcStart = utcDayStart(new Date());
    return ctx.prisma.nutritionLog.findMany({
      where: { userId: ctx.session.user.id, date: { gte: todayUtcStart } },
      orderBy: { date: "asc" }
    });
  }),

  getWeeklyTrend: protectedProcedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return ctx.prisma.nutritionLog.groupBy({
      by: ["date"],
      where: { userId: ctx.session.user.id, date: { gte: since } },
      _sum: { calories: true, protein: true, fats: true, carbs: true }
    });
  }),

  logMeal: protectedProcedure.input(logMealSchema).mutation(async ({ ctx, input }) => {
    const log = await ctx.prisma.nutritionLog.create({
      data: { ...input, userId: ctx.session.user.id, isManual: true }
    });
    const unlockedAchievements = await recordQualifyingActivity(
      ctx.prisma,
      ctx.session.user.id,
      "nutrition"
    );
    return { log, unlockedAchievements };
  }),

  analyzeFood: protectedProcedure.input(analyzeFoodSchema).mutation(async ({ ctx, input }) => {
    const rawSub = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id }
    });
    const sub = mergeSubscriptionWithDevPremium(rawSub, ctx.session.user.id);
    if (sub && sub.aiScansUsed >= sub.aiScansLimit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "AI scan limit reached. Upgrade to Premium."
      });
    }
    const result = await analyzeFoodImage(input.base64, input.mime);
    if (rawSub) {
      await ctx.prisma.subscription.update({
        where: { userId: ctx.session.user.id },
        data: { aiScansUsed: { increment: 1 } }
      });
    }
    return result;
  })
});
