import { createTRPCRouter, publicProcedure } from "../router";

export const healthRouter = createTRPCRouter({
  ping: publicProcedure.query(() => {
    return {
      status: "ok" as const,
      service: "tren-titan-api",
      now: new Date().toISOString()
    };
  })
});
