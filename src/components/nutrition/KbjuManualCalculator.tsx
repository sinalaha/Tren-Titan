"use client";

import { useEffect, useMemo, useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  type ActivityLevel,
  type BodyGoal,
  computeKbjuPlan,
  type Sex
} from "@/lib/nutrition/kbju-calculator";
import {
  clearKbjuScanStored,
  loadKbjuScanStored,
  persistKbjuScanStored
} from "@/lib/nutrition/kbju-scan-storage";
import { cn } from "@/lib/utils";

const ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active"
];

const INPUT =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50";

function parseLocaleNumber(raw: string): number {
  const n = Number(String(raw).replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
}

export function KbjuManualCalculator() {
  const { t } = useLocaleContext();
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("28");
  const [heightCm, setHeightCm] = useState("178");
  const [weightKg, setWeightKg] = useState("78");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<BodyGoal>("fat_loss");
  const [remember, setRemember] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadKbjuScanStored();
    if (saved) {
      setSex(saved.sex);
      setAge(saved.age);
      setHeightCm(saved.heightCm);
      setWeightKg(saved.weightKg);
      setActivity(saved.activity);
      setGoal(saved.goal);
      setRemember(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (remember) {
      persistKbjuScanStored({ sex, age, heightCm, weightKg, activity, goal });
    } else {
      clearKbjuScanStored();
    }
  }, [remember, sex, age, heightCm, weightKg, activity, goal, hydrated]);

  const plan = useMemo(() => {
    const w = parseLocaleNumber(weightKg);
    const h = parseLocaleNumber(heightCm);
    const a = parseLocaleNumber(age);
    return computeKbjuPlan({
      weightKg: w,
      heightCm: h,
      ageYears: Math.round(a),
      sex,
      activity,
      goal
    });
  }, [activity, age, goal, heightCm, sex, weightKg]);

  return (
    <GlassCard className="p-6" glow="cyan" hover={false}>
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">
        {t("nutrition.kbjuCalcEyebrow")}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">{t("nutrition.kbjuCalcTitle")}</h2>
      <p className="mt-2 text-sm text-white/65">{t("nutrition.kbjuCalcSubtitle")}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/45">
        {t("nutrition.kbjuCalcMethod")}
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] px-4 py-3 transition hover:border-cyan-400/35">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-black/40 text-cyan-500 focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-0"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          aria-label={t("nutrition.kbjuRememberAria")}
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-white">
            {t("nutrition.kbjuRememberTitle")}
          </span>
          <span className="mt-1 block text-xs leading-snug text-white/55">
            {t("nutrition.kbjuRememberHint")}
          </span>
        </span>
      </label>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
            {t("nutrition.kbjuSex")}
          </p>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-black/25 p-1">
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-xs font-medium transition",
                  sex === s ? "bg-cyan-500/25 text-cyan-200" : "text-white/55 hover:bg-white/5"
                )}
              >
                {t(`nutrition.kbjuSex.${s}`)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label
            className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/40"
            htmlFor="kbju-age"
          >
            {t("nutrition.kbjuAge")}
          </label>
          <input
            id="kbju-age"
            className={INPUT}
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={15}
            max={90}
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/40"
            htmlFor="kbju-height"
          >
            {t("nutrition.kbjuHeight")}
          </label>
          <input
            id="kbju-height"
            className={INPUT}
            inputMode="decimal"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/40"
            htmlFor="kbju-weight"
          >
            {t("nutrition.kbjuWeight")}
          </label>
          <input
            id="kbju-weight"
            className={INPUT}
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
            {t("nutrition.kbjuActivity")}
          </p>
          <select
            className={cn(INPUT, "cursor-pointer")}
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            aria-label={t("nutrition.kbjuActivity")}
          >
            {ACTIVITY_LEVELS.map((key) => (
              <option key={key} value={key} className="bg-zinc-900">
                {t(`nutrition.kbjuActivity.${key}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
            {t("nutrition.kbjuGoal")}
          </p>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-black/25 p-1">
            <button
              type="button"
              onClick={() => setGoal("fat_loss")}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition",
                goal === "fat_loss"
                  ? "bg-cyan-500/25 text-cyan-200"
                  : "text-white/55 hover:bg-white/5"
              )}
            >
              {t("nutrition.kbjuGoal.loss")}
            </button>
            <button
              type="button"
              onClick={() => setGoal("muscle_gain")}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition",
                goal === "muscle_gain"
                  ? "bg-cyan-500/25 text-cyan-200"
                  : "text-white/55 hover:bg-white/5"
              )}
            >
              {t("nutrition.kbjuGoal.gain")}
            </button>
          </div>
        </div>
      </div>

      {plan ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
            {t("nutrition.kbjuResultTitle")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] text-white/45">{t("nutrition.kbjuBmr")}</p>
              <p className="mt-0.5 text-lg font-semibold text-white">{plan.bmrRounded}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/45">{t("nutrition.kbjuTdee")}</p>
              <p className="mt-0.5 text-lg font-semibold text-white">{plan.tdeeRounded}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] text-white/45">{t("nutrition.kbjuTargetKcal")}</p>
              <p className="mt-0.5 text-lg font-semibold text-cyan-200">{plan.targetKcalRounded}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="text-[10px] text-white/45">{t("aiResult.protein")}</p>
              <p className="mt-0.5 text-base font-semibold text-white">{plan.proteinG} g</p>
            </div>
            <div>
              <p className="text-[10px] text-white/45">{t("aiResult.fats")}</p>
              <p className="mt-0.5 text-base font-semibold text-white">{plan.fatG} g</p>
            </div>
            <div>
              <p className="text-[10px] text-white/45">{t("aiResult.carbs")}</p>
              <p className="mt-0.5 text-base font-semibold text-white">{plan.carbsG} g</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200/95">
          {t("nutrition.kbjuInvalid")}
        </p>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-white/35">
        {t("nutrition.kbjuDisclaimer")}
      </p>
    </GlassCard>
  );
}
