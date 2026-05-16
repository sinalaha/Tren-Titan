import { z } from "zod";

export const coachChatBodySchema = z.object({
  message: z.string().min(1).max(6000)
});
