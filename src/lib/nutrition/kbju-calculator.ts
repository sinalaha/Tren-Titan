/** Manual KBJU targets from anthropometry (common clinical / sports-nutrition practice). */

export type Sex = "male" | "female";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

/** Cut vs lean bulk — adjusts calories relative to TDEE. */
export type BodyGoal = "fat_loss" | "muscle_gain";

/** Activity × TDEE multipliers (widely published, e.g. ACSM-style ranges). */
export const ACTIVITY_TDEE_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

/** Resting metabolic rate (kcal/day) — Mifflin–St Jeor, used in many dietetics references. */
export function mifflinStJeorBmr(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: Sex
): number {
  const core = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === "male" ? core + 5 : core - 161;
}

export function tdeeKcal(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_TDEE_FACTOR[activity];
}

/** ~20% deficit for loss, ~15% surplus for gain (typical coaching band; not medical prescription). */
export function goalAdjustedTargetKcal(tdee: number, goal: BodyGoal): number {
  return goal === "fat_loss" ? tdee * 0.8 : tdee * 1.15;
}

const PROTEIN_G_PER_KG: Record<BodyGoal, number> = {
  fat_loss: 2.0,
  muscle_gain: 1.8
};

export type KbjuPlan = {
  bmrRounded: number;
  tdeeRounded: number;
  targetKcalRounded: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

export function computeKbjuPlan(input: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex;
  activity: ActivityLevel;
  goal: BodyGoal;
}): KbjuPlan | null {
  const { weightKg, heightCm, ageYears, sex, activity, goal } = input;
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || !Number.isFinite(ageYears))
    return null;
  if (weightKg < 30 || weightKg > 250 || heightCm < 120 || heightCm > 230) return null;
  if (ageYears < 15 || ageYears > 90) return null;

  const bmr = mifflinStJeorBmr(weightKg, heightCm, ageYears, sex);
  const tdee = tdeeKcal(bmr, activity);
  const targetKcal = goalAdjustedTargetKcal(tdee, goal);

  const proteinG = Math.round(weightKg * PROTEIN_G_PER_KG[goal]);

  const fatKcalTarget = targetKcal * 0.25;
  let fatG = Math.max(0, Math.round(fatKcalTarget / 9));

  let carbKcal = targetKcal - proteinG * 4 - fatG * 9;
  if (carbKcal < 0) {
    fatG = Math.max(0, Math.round((targetKcal * 0.2) / 9));
    carbKcal = targetKcal - proteinG * 4 - fatG * 9;
  }
  const carbsG = Math.max(0, Math.round(carbKcal / 4));

  return {
    bmrRounded: Math.round(bmr),
    tdeeRounded: Math.round(tdee),
    targetKcalRounded: Math.round(targetKcal),
    proteinG,
    fatG,
    carbsG
  };
}
