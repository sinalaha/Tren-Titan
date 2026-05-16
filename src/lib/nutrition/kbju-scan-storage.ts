import type { ActivityLevel, BodyGoal, Sex } from "@/lib/nutrition/kbju-calculator";

const STORAGE_KEY = "kbju-scan-anthropometry-v1";

export type KbjuScanStoredV1 = {
  v: 1;
  remember: true;
  sex: Sex;
  age: string;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel;
  goal: BodyGoal;
};

const ACTIVITIES: ActivityLevel[] = ["sedentary", "light", "moderate", "active", "very_active"];

function isSex(x: unknown): x is Sex {
  return x === "male" || x === "female";
}

function isGoal(x: unknown): x is BodyGoal {
  return x === "fat_loss" || x === "muscle_gain";
}

function isActivity(x: unknown): x is ActivityLevel {
  return typeof x === "string" && (ACTIVITIES as readonly string[]).includes(x);
}

export function loadKbjuScanStored(): KbjuScanStoredV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (p.v !== 1 || p.remember !== true) return null;
    if (!isSex(p.sex) || !isGoal(p.goal) || !isActivity(p.activity)) return null;
    if (
      typeof p.age !== "string" ||
      typeof p.heightCm !== "string" ||
      typeof p.weightKg !== "string"
    )
      return null;
    return {
      v: 1,
      remember: true,
      sex: p.sex,
      age: p.age,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      activity: p.activity,
      goal: p.goal
    };
  } catch {
    return null;
  }
}

export function persistKbjuScanStored(data: Omit<KbjuScanStoredV1, "v" | "remember">): void {
  if (typeof window === "undefined") return;
  const payload: KbjuScanStoredV1 = { v: 1, remember: true, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearKbjuScanStored(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
