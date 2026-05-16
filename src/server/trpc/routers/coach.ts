import { createTRPCRouter, protectedProcedure } from "../router";

export const coachRouter = createTRPCRouter({
  listRecent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.aIRecommendation.findMany({
      where: { userId: ctx.session.user.id, type: "COACH" },
      orderBy: { generatedAt: "desc" },
      take: 25,
      select: {
        id: true,
        content: true,
        generatedAt: true,
        metadata: true
      }
    });
  })
});
