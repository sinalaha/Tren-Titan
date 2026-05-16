import { z } from "zod";

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const logMealSchema = z.object({
  name: z.string().min(1),
  mealType: mealTypeSchema.optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  fats: z.number().min(0),
  carbs: z.number().min(0),
  fiber: z.number().min(0).optional(),
  imageUrl: z.string().url().optional()
});

export const analyzeFoodSchema = z.object({
  base64: z.string().min(10),
  mime: z.string().min(3)
});
