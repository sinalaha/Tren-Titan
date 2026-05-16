import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const onboardingSchema = z.object({
  height: z.number().min(100).max(250).optional(),
  weight: z.number().min(30).max(300).optional(),
  age: z.number().int().min(12).max(100).optional(),
  gender: z.string().max(40).optional(),
  goal: z.enum(["FAT_LOSS", "MUSCLE_GAIN", "RECOMPOSITION", "MAINTENANCE", "STRENGTH"]),
  trainingFreq: z.number().int().min(1).max(14).optional()
});
