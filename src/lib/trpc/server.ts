import { createAppCaller } from "@/server/trpc/caller";
import { createTRPCContext } from "@/server/trpc/context";

export async function createServerApi() {
  return createAppCaller(await createTRPCContext());
}
