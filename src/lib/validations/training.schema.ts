import { z } from "zod";

export const workoutSetSchema = z.object({
  exercise: z.string().min(1),
  muscleGroup: z.string().min(1),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1).optional(),
  weight: z.number().min(0).optional(),
  rpe: z.number().int().min(1).max(10).optional()
});

export const logWorkoutSchema = z.object({
  name: z.string().optional(),
  notes: z.string().max(1000).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  durationMin: z.number().int().min(1).max(360).optional(),
  sets: z.array(workoutSetSchema).min(1)
});
