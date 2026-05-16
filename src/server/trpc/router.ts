import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required." });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session
    }
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = ctx.session.user.role;
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });
  }
  return next();
});

export const baseInput = z.object({});
