import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/server/db/client";

export const createTRPCContext = cache(async () => {
  const session = await auth();
  return { session, prisma };
});

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
