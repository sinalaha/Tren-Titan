import { getAdminOverview } from "@/services/adminOverview";

import { adminProcedure, createTRPCRouter } from "../router";

export const adminRouter = createTRPCRouter({
  overview: adminProcedure.query(async ({ ctx }) => {
    return getAdminOverview(ctx.prisma);
  })
});
