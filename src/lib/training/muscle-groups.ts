/** Stored `muscleGroup` values for workouts; labels via i18n `workout.muscle.*`. */
export const QUICK_LOG_MUSCLE_GROUPS = [
  { value: "chest", labelKey: "workout.muscle.chest" },
  { value: "back", labelKey: "workout.muscle.back" },
  { value: "shoulders", labelKey: "workout.muscle.shoulders" },
  { value: "biceps", labelKey: "workout.muscle.biceps" },
  { value: "triceps", labelKey: "workout.muscle.triceps" },
  { value: "forearms", labelKey: "workout.muscle.forearms" },
  { value: "traps", labelKey: "workout.muscle.traps" },
  { value: "core", labelKey: "workout.muscle.core" },
  { value: "glutes", labelKey: "workout.muscle.glutes" },
  { value: "quads", labelKey: "workout.muscle.quads" },
  { value: "hamstrings", labelKey: "workout.muscle.hamstrings" },
  { value: "calves", labelKey: "workout.muscle.calves" },
  { value: "legs", labelKey: "workout.muscle.legs" },
  { value: "full_body", labelKey: "workout.muscle.fullBody" }
] as const;

export type QuickLogMuscleValue = (typeof QUICK_LOG_MUSCLE_GROUPS)[number]["value"];
