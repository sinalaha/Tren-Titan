import { z } from "zod";

import type { DailyMissionsFocus } from "@/lib/dashboard/daily-missions";

import { createTRPCRouter, protectedProcedure } from "../router";

const dailyFocusSchema = z.object({
  focus: z.enum(["FAT_LOSS", "MUSCLE_GAIN"])
});

export const profileRouter = createTRPCRouter({
  setDailyMissionsFocus: protectedProcedure
    .input(dailyFocusSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const focus: DailyMissionsFocus = input.focus;

      const existing = await ctx.prisma.profile.findUnique({ where: { userId } });
      if (existing) {
        return ctx.prisma.profile.update({
          where: { userId },
          data: { dailyMissionsFocus: focus }
        });
      }

      return ctx.prisma.profile.create({
        data: {
          userId,
          dailyMissionsFocus: focus
        }
      });
    })
});
