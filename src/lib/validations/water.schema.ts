import { z } from "zod";

export const addWaterSchema = z.object({
  amountMl: z.number().int().min(50).max(5000)
});
