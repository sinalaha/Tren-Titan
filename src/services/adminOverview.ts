import type { PrismaClient } from "@prisma/client";

export interface AdminOverviewStats {
  users: number;
  activeSubscriptions: number;
  subscriptionsPastDue: number;
  nutritionLogs24h: number;
  aiRecommendations24h: number;
  coachRecommendations24h: number;
}

export async function getAdminOverview(prisma: PrismaClient): Promise<AdminOverviewStats> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    users,
    activeSubscriptions,
    subscriptionsPastDue,
    nutritionLogs24h,
    aiRecommendations24h,
    coachRecommendations24h
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "PAST_DUE" } }),
    prisma.nutritionLog.count({ where: { date: { gte: dayAgo } } }),
    prisma.aIRecommendation.count({ where: { generatedAt: { gte: dayAgo } } }),
    prisma.aIRecommendation.count({ where: { generatedAt: { gte: dayAgo }, type: "COACH" } })
  ]);

  return {
    users,
    activeSubscriptions,
    subscriptionsPastDue,
    nutritionLogs24h,
    aiRecommendations24h,
    coachRecommendations24h
  };
}
