import { utcDayStart } from "@/lib/datetime/utc-day-start";
import { addWaterSchema } from "@/lib/validations/water.schema";

import { createTRPCRouter, protectedProcedure } from "../router";

export const waterRouter = createTRPCRouter({
  getTodayTotal: protectedProcedure.query(async ({ ctx }) => {
    const todayUtcStart = utcDayStart(new Date());

    const aggregate = await ctx.prisma.waterLog.aggregate({
      where: { userId: ctx.session.user.id, date: { gte: todayUtcStart } },
      _sum: { amountMl: true }
    });

    return {
      totalMl: aggregate._sum.amountMl ?? 0
    };
  }),

  getTodayLogs: protectedProcedure.query(async ({ ctx }) => {
    const todayUtcStart = utcDayStart(new Date());

    return ctx.prisma.waterLog.findMany({
      where: { userId: ctx.session.user.id, date: { gte: todayUtcStart } },
      orderBy: { date: "desc" },
      take: 8,
      select: {
        id: true,
        amountMl: true,
        date: true
      }
    });
  }),

  addLog: protectedProcedure.input(addWaterSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.waterLog.create({
      data: {
        userId: ctx.session.user.id,
        amountMl: input.amountMl
      }
    });
  })
});
