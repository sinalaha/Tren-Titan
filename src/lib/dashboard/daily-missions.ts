/** Values match Prisma enum `DailyMissionsFocus` (no import from generated client). */
import {
  type ActivityLevel,
  type BodyGoal,
  computeKbjuPlan,
  type KbjuPlan,
  type Sex
} from "@/lib/nutrition/kbju-calculator";

export type DailyMissionsFocus = "FAT_LOSS" | "MUSCLE_GAIN";

export function normalizeDailyMissionsFocus(raw: string | null | undefined): DailyMissionsFocus {
  return raw === "MUSCLE_GAIN" ? "MUSCLE_GAIN" : "FAT_LOSS";
}

export type MissionProgressMode = "atLeast" | "atMost";

export type DailyMissionStats = {
  mealsCount: number;
  workoutsCount: number;
  waterMl: number;
  waterLogsCount: number;
  proteinSum: number;
  caloriesSum: number;
  carbsSum: number;
  fatSum: number;
  fiberSum: number;
};

/** Срез профиля для персонализации миссий (как антропометрия в калькуляторе КБЖУ на скане). */
export type DailyMissionProfileInput = {
  heightCm: number;
  weightKg: number;
  ageYears: number;
  gender: string | null | undefined;
  trainingFreq: number | null | undefined;
};

export function dailyMissionProfileFromDb(
  profile:
    | {
        height: number | null | undefined;
        weight: number | null | undefined;
        age: number | null | undefined;
        gender: string | null | undefined;
        trainingFreq: number | null | undefined;
      }
    | null
    | undefined
): DailyMissionProfileInput | null {
  if (!profile) return null;
  const { height, weight, age, gender, trainingFreq } = profile;
  if (
    height == null ||
    weight == null ||
    age == null ||
    !Number.isFinite(height) ||
    !Number.isFinite(weight) ||
    !Number.isFinite(age)
  ) {
    return null;
  }
  return {
    heightCm: height,
    weightKg: weight,
    ageYears: age,
    gender,
    trainingFreq: trainingFreq ?? undefined
  };
}

function inferSex(gender: string | null | undefined): Sex {
  const g = (gender ?? "").toLowerCase().trim();
  if (g.includes("female") || g.includes("жен") || g === "f" || g === "2") return "female";
  return "male";
}

function trainingFreqToActivity(trainingFreq: number | null | undefined): ActivityLevel {
  if (trainingFreq == null || !Number.isFinite(trainingFreq)) return "moderate";
  const n = Math.min(14, Math.max(0, Math.round(trainingFreq)));
  if (n <= 1) return "sedentary";
  if (n <= 3) return "light";
  if (n <= 5) return "moderate";
  if (n <= 6) return "active";
  return "very_active";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

type MissionKind =
  | "meals"
  | "workouts"
  | "water_ml"
  | "water_logs"
  | "protein"
  | "fiber"
  | "carbs"
  | "calories_max"
  | "calories_min"
  | "fat_max";

type MissionTemplate = {
  key: string;
  labelKey: string;
  kind: MissionKind;
  target: number;
  mode: MissionProgressMode;
};

const LOSS_MISSIONS: MissionTemplate[] = [
  {
    key: "L_meals_2",
    labelKey: "dashboard.dm.loss.meals2",
    kind: "meals",
    target: 2,
    mode: "atLeast"
  },
  {
    key: "L_meals_3",
    labelKey: "dashboard.dm.loss.meals3",
    kind: "meals",
    target: 3,
    mode: "atLeast"
  },
  {
    key: "L_workout_1",
    labelKey: "dashboard.dm.loss.workout1",
    kind: "workouts",
    target: 1,
    mode: "atLeast"
  },
  {
    key: "L_workout_2",
    labelKey: "dashboard.dm.loss.workout2",
    kind: "workouts",
    target: 2,
    mode: "atLeast"
  },
  {
    key: "L_water_goal",
    labelKey: "dashboard.dm.loss.waterGoal",
    kind: "water_ml",
    target: 3000,
    mode: "atLeast"
  },
  {
    key: "L_water_logs",
    labelKey: "dashboard.dm.loss.waterLogs",
    kind: "water_logs",
    target: 3,
    mode: "atLeast"
  },
  {
    key: "L_protein_100",
    labelKey: "dashboard.dm.loss.protein100",
    kind: "protein",
    target: 100,
    mode: "atLeast"
  },
  {
    key: "L_protein_120",
    labelKey: "dashboard.dm.loss.protein120",
    kind: "protein",
    target: 120,
    mode: "atLeast"
  },
  {
    key: "L_cal_cap_2100",
    labelKey: "dashboard.dm.loss.calCap2100",
    kind: "calories_max",
    target: 2100,
    mode: "atMost"
  },
  {
    key: "L_cal_cap_2300",
    labelKey: "dashboard.dm.loss.calCap2300",
    kind: "calories_max",
    target: 2300,
    mode: "atMost"
  },
  {
    key: "L_fat_65",
    labelKey: "dashboard.dm.loss.fatMax65",
    kind: "fat_max",
    target: 65,
    mode: "atMost"
  },
  {
    key: "L_fiber_22",
    labelKey: "dashboard.dm.loss.fiber22",
    kind: "fiber",
    target: 22,
    mode: "atLeast"
  }
];

const GAIN_MISSIONS: MissionTemplate[] = [
  {
    key: "G_meals_3",
    labelKey: "dashboard.dm.gain.meals3",
    kind: "meals",
    target: 3,
    mode: "atLeast"
  },
  {
    key: "G_meals_4",
    labelKey: "dashboard.dm.gain.meals4",
    kind: "meals",
    target: 4,
    mode: "atLeast"
  },
  {
    key: "G_workout_1",
    labelKey: "dashboard.dm.gain.workout1",
    kind: "workouts",
    target: 1,
    mode: "atLeast"
  },
  {
    key: "G_workout_2",
    labelKey: "dashboard.dm.gain.workout2",
    kind: "workouts",
    target: 2,
    mode: "atLeast"
  },
  {
    key: "G_water_goal",
    labelKey: "dashboard.dm.gain.waterGoal",
    kind: "water_ml",
    target: 3000,
    mode: "atLeast"
  },
  {
    key: "G_water_logs",
    labelKey: "dashboard.dm.gain.waterLogs",
    kind: "water_logs",
    target: 3,
    mode: "atLeast"
  },
  {
    key: "G_protein_130",
    labelKey: "dashboard.dm.gain.protein130",
    kind: "protein",
    target: 130,
    mode: "atLeast"
  },
  {
    key: "G_protein_155",
    labelKey: "dashboard.dm.gain.protein155",
    kind: "protein",
    target: 155,
    mode: "atLeast"
  },
  {
    key: "G_cal_min_2600",
    labelKey: "dashboard.dm.gain.calMin2600",
    kind: "calories_min",
    target: 2600,
    mode: "atLeast"
  },
  {
    key: "G_cal_min_3000",
    labelKey: "dashboard.dm.gain.calMin3000",
    kind: "calories_min",
    target: 3000,
    mode: "atLeast"
  },
  {
    key: "G_carbs_280",
    labelKey: "dashboard.dm.gain.carbs280",
    kind: "carbs",
    target: 280,
    mode: "atLeast"
  },
  {
    key: "G_carbs_320",
    labelKey: "dashboard.dm.gain.carbs320",
    kind: "carbs",
    target: 320,
    mode: "atLeast"
  },
  {
    key: "G_fiber_20",
    labelKey: "dashboard.dm.gain.fiber20",
    kind: "fiber",
    target: 20,
    mode: "atLeast"
  }
];

function seedForDay(userId: string, dayKey: string, focus: DailyMissionsFocus): number {
  const payload = `${userId}|${dayKey}|${focus}`;
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickMissionsForDay(
  focus: DailyMissionsFocus,
  userId: string,
  dayKey: string
): MissionTemplate[] {
  const pool = focus === "MUSCLE_GAIN" ? GAIN_MISSIONS : LOSS_MISSIONS;
  const rand = mulberry32(seedForDay(userId, dayKey, focus));

  const byKind = new Map<MissionKind, MissionTemplate[]>();
  for (const m of pool) {
    const list = byKind.get(m.kind) ?? [];
    list.push(m);
    byKind.set(m.kind, list);
  }

  const picks: MissionTemplate[] = [];
  for (const variants of byKind.values()) {
    const idx = Math.floor(rand() * variants.length);
    picks.push(variants[idx]!);
  }

  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [picks[i], picks[j]] = [picks[j]!, picks[i]!];
  }

  return picks;
}

function applyKbjuTargetsToTemplates(
  templates: MissionTemplate[],
  plan: KbjuPlan,
  weightKg: number
): MissionTemplate[] {
  const waterMl = Math.round(clamp(weightKg * 35, 2000, 4500));
  const fiberG = Math.round(clamp((plan.targetKcalRounded / 1000) * 14, 18, 40));
  return templates.map((tmpl) => {
    switch (tmpl.kind) {
      case "calories_max":
      case "calories_min":
        return { ...tmpl, target: plan.targetKcalRounded };
      case "protein":
        return { ...tmpl, target: plan.proteinG };
      case "fat_max":
        return { ...tmpl, target: plan.fatG };
      case "carbs":
        return { ...tmpl, target: plan.carbsG };
      case "fiber":
        return { ...tmpl, target: fiberG };
      case "water_ml":
        return { ...tmpl, target: waterMl };
      default:
        return tmpl;
    }
  });
}

function presentationForMission(
  tmpl: MissionTemplate,
  personalized: boolean
): { labelKey: string; labelVars?: Record<string, string | number> } {
  if (!personalized) {
    return { labelKey: tmpl.labelKey };
  }
  switch (tmpl.kind) {
    case "meals":
      return { labelKey: "dashboard.dm.dyn.mealsAtLeast", labelVars: { n: tmpl.target } };
    case "workouts":
      return { labelKey: "dashboard.dm.dyn.workoutsAtLeast", labelVars: { n: tmpl.target } };
    case "water_ml":
      return {
        labelKey: "dashboard.dm.dyn.waterMlTotal",
        labelVars: { ml: tmpl.target, L: (tmpl.target / 1000).toFixed(1) }
      };
    case "water_logs":
      return { labelKey: "dashboard.dm.dyn.waterLogsAtLeast", labelVars: { n: tmpl.target } };
    case "protein":
      return { labelKey: "dashboard.dm.dyn.proteinAtLeast", labelVars: { g: tmpl.target } };
    case "fiber":
      return { labelKey: "dashboard.dm.dyn.fiberAtLeast", labelVars: { g: tmpl.target } };
    case "carbs":
      return { labelKey: "dashboard.dm.dyn.carbsAtLeast", labelVars: { g: tmpl.target } };
    case "calories_max":
      return { labelKey: "dashboard.dm.dyn.caloriesMax", labelVars: { kcal: tmpl.target } };
    case "calories_min":
      return { labelKey: "dashboard.dm.dyn.caloriesMin", labelVars: { kcal: tmpl.target } };
    case "fat_max":
      return { labelKey: "dashboard.dm.dyn.fatMax", labelVars: { g: tmpl.target } };
    default:
      return { labelKey: tmpl.labelKey };
  }
}

function valueForKind(stats: DailyMissionStats, kind: MissionKind): number {
  switch (kind) {
    case "meals":
      return stats.mealsCount;
    case "workouts":
      return stats.workoutsCount;
    case "water_ml":
      return stats.waterMl;
    case "water_logs":
      return stats.waterLogsCount;
    case "protein":
      return stats.proteinSum;
    case "fiber":
      return stats.fiberSum;
    case "carbs":
      return stats.carbsSum;
    case "calories_min":
    case "calories_max":
      return stats.caloriesSum;
    case "fat_max":
      return stats.fatSum;
    default:
      return 0;
  }
}

function evaluateMission(
  template: MissionTemplate,
  stats: DailyMissionStats
): {
  current: number;
  target: number;
  done: boolean;
  progressMode: MissionProgressMode;
} {
  const current = valueForKind(stats, template.kind);
  const { target, mode } = template;

  if (mode === "atLeast") {
    return {
      current,
      target,
      done: current >= target,
      progressMode: mode
    };
  }

  const done = current <= target || target <= 0;
  return {
    current,
    target,
    done,
    progressMode: mode
  };
}

export type BuiltDailyMission = {
  id: string;
  labelKey: string;
  labelVars?: Record<string, string | number>;
  current: number;
  target: number;
  done: boolean;
  progressMode: MissionProgressMode;
};

export function buildDailyMissions(
  focus: DailyMissionsFocus,
  userId: string,
  dayKey: string,
  stats: DailyMissionStats,
  profile: DailyMissionProfileInput | null
): BuiltDailyMission[] {
  const templates = pickMissionsForDay(focus, userId, dayKey);
  const bodyGoal: BodyGoal = focus === "MUSCLE_GAIN" ? "muscle_gain" : "fat_loss";

  const plan =
    profile != null
      ? computeKbjuPlan({
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          ageYears: Math.round(profile.ageYears),
          sex: inferSex(profile.gender),
          activity: trainingFreqToActivity(profile.trainingFreq),
          goal: bodyGoal
        })
      : null;

  const personalized = plan != null;
  const resolved =
    plan != null && profile != null
      ? applyKbjuTargetsToTemplates(templates, plan, profile.weightKg)
      : templates;

  return resolved.map((tmpl) => {
    const ev = evaluateMission(tmpl, stats);
    const { labelKey, labelVars } = presentationForMission(tmpl, personalized);
    return {
      id: `${dayKey}:${tmpl.key}:${tmpl.target}`,
      labelKey,
      labelVars,
      ...ev
    };
  });
}
