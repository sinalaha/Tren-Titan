import { createTRPCRouter } from "./router";
import { adminRouter } from "./routers/admin";
import { coachRouter } from "./routers/coach";
import { dashboardRouter } from "./routers/dashboard";
import { healthRouter } from "./routers/health";
import { nutritionRouter } from "./routers/nutrition";
import { profileRouter } from "./routers/profile";
import { subscriptionRouter } from "./routers/subscription";
import { trainingRouter } from "./routers/training";
import { waterRouter } from "./routers/water";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  coach: coachRouter,
  dashboard: dashboardRouter,
  health: healthRouter,
  nutrition: nutritionRouter,
  profile: profileRouter,
  subscription: subscriptionRouter,
  training: trainingRouter,
  water: waterRouter
});

export type AppRouter = typeof appRouter;
