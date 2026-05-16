"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  DASHBOARD_CALORIES_GOAL_KCAL,
  DASHBOARD_PROTEIN_GOAL_G,
  DEFAULT_WORKOUT_RPE
} from "@/lib/constants";
import { trpc } from "@/lib/trpc/react";

function finite0(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function DashboardWorkloadConsole() {
  const { t } = useLocaleContext();
  const { data: workouts } = trpc.training.getRollingWeekWorkouts.useQuery(undefined, {
    refetchInterval: 60_000
  });

  const { workloadPct, avgRpe } = useMemo(() => {
    const list = workouts ?? [];
    if (list.length === 0) {
      return { workloadPct: 0, avgRpe: 0 };
    }
    const avg =
      list.reduce((s, w) => s + finite0(w.rpe != null ? w.rpe : DEFAULT_WORKOUT_RPE), 0) /
      list.length;
    const safeAvg = Number.isFinite(avg) ? avg : 0;
    return {
      workloadPct: Math.min(100, Math.round((safeAvg / 10) * 100)),
      avgRpe: Math.round(safeAvg * 10) / 10
    };
  }, [workouts]);

  return (
    <GlassCard className="p-5" glow="purple" hover={false}>
      <p className="text-xs uppercase tracking-[0.14em] text-white/45">{t("workload.console")}</p>
      <p className="mt-1 text-xs text-white/50">{t("workload.subtitle")}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-white">{workloadPct}%</p>
          <p className="text-xs text-white/55">
            {t("workload.rpe")} ~{avgRpe} · {workouts?.length ?? 0}{" "}
            {workouts?.length === 1 ? t("workload.session") : t("workload.sessions")}
          </p>
        </div>
        <p className="text-sm text-purple-200">~{avgRpe}</p>
      </div>
      <div className="mt-3 h-2 rounded bg-white/10">
        <div
          className="h-2 rounded bg-purple-400/80 transition-all"
          style={{ width: `${workloadPct}%` }}
        />
      </div>
      <div className="mt-4">
        <Link
          href="/dashboard/training/log"
          className="inline-flex rounded-lg border border-purple-400/40 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200 transition hover:bg-purple-500/20"
        >
          {t("workload.openLog")}
        </Link>
      </div>
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
          {t("workload.timeline")}
        </p>
        {!workouts || workouts.length === 0 ? (
          <p className="mt-2 text-xs text-white/50">{t("workload.noSessions")}</p>
        ) : (
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
            {workouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between text-xs text-white/75">
                <span className="min-w-0 truncate pr-2">
                  {new Date(w.date).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}{" "}
                  · {w.name ?? t("sessions.workoutDefault")}
                </span>
                <span className="shrink-0 text-purple-200">
                  {t("workload.rpe")} {w.rpe ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}

export function DashboardCaloriesConsole() {
  const { t } = useLocaleContext();
  const utils = trpc.useUtils();
  const { data: meals } = trpc.nutrition.getToday.useQuery(undefined, { refetchInterval: 60_000 });

  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");

  const totalKcal = useMemo(
    () => (meals ?? []).reduce((s, m) => s + finite0(m.calories), 0),
    [meals]
  );
  const pct = Math.min(
    100,
    Math.round((totalKcal / Math.max(1, DASHBOARD_CALORIES_GOAL_KCAL)) * 100)
  );

  const logMutation = trpc.nutrition.logMeal.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.nutrition.getToday.invalidate(),
        utils.dashboard.getOverview.invalidate()
      ]);
      setName("");
      setKcal("");
      setProtein("");
    }
  });

  return (
    <GlassCard className="p-5" glow="blue" hover={false}>
      <p className="text-xs uppercase tracking-[0.14em] text-white/45">
        {t("macros.caloriesConsole")}
      </p>
      <p className="mt-1 text-xs text-white/50">{t("macros.caloriesHint")}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-white">{Math.round(totalKcal)}</p>
          <p className="text-xs text-white/55">
            {t("hydration.goal")} {DASHBOARD_CALORIES_GOAL_KCAL} {t("macros.kcalDay")}
          </p>
        </div>
        <p className="text-sm text-cyan-200">{pct}%</p>
      </div>
      <div className="mt-3 h-2 rounded bg-white/10">
        <div className="h-2 rounded bg-cyan-400/80 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
          {t("macros.quickMeal")}
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          placeholder={t("macros.mealName")}
        />
        <div className="flex flex-wrap gap-2">
          <input
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            inputMode="decimal"
            className="min-w-[100px] flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            placeholder={t("macros.kcal")}
          />
          <input
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            inputMode="decimal"
            className="min-w-[100px] flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            placeholder={t("macros.proteinG")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={logMutation.isPending || !name.trim()}
            onClick={() => {
              const c = Number(kcal);
              const p = Number(protein);
              if (!Number.isFinite(c) || c < 0 || !Number.isFinite(p) || p < 0) return;
              logMutation.mutate({
                name: name.trim(),
                calories: Math.round(c),
                protein: Math.round(p * 10) / 10,
                fats: 0,
                carbs: 0
              });
            }}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {logMutation.isPending ? t("workout.saving") : t("macros.saveMeal")}
          </button>
          <Link
            href="/dashboard/nutrition/scan"
            className="inline-flex rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/10"
          >
            {t("macros.foodScan")}
          </Link>
        </div>
        {logMutation.isError ? (
          <p className="text-xs text-rose-300">{logMutation.error.message}</p>
        ) : null}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
          {t("macros.timeline")}
        </p>
        {!meals || meals.length === 0 ? (
          <p className="mt-2 text-xs text-white/50">{t("macros.noMeals")}</p>
        ) : (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
            {meals.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 text-xs text-white/75"
              >
                <span className="min-w-0 truncate">
                  {new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                  · {m.name ?? "—"}
                </span>
                <span className="shrink-0 text-cyan-200">+{Math.round(finite0(m.calories))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}

export function DashboardProteinConsole() {
  const { t } = useLocaleContext();
  const { data: meals } = trpc.nutrition.getToday.useQuery(undefined, { refetchInterval: 60_000 });

  const totalP = useMemo(() => (meals ?? []).reduce((s, m) => s + finite0(m.protein), 0), [meals]);
  const pct = Math.min(100, Math.round((totalP / Math.max(1, DASHBOARD_PROTEIN_GOAL_G)) * 100));

  return (
    <GlassCard className="p-5" glow="cyan" hover={false}>
      <p className="text-xs uppercase tracking-[0.14em] text-white/45">
        {t("macros.proteinConsole")}
      </p>
      <p className="mt-1 text-xs text-white/50">{t("macros.proteinHint")}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-white">{Math.round(totalP)} g</p>
          <p className="text-xs text-white/55">
            {t("hydration.goal")} {DASHBOARD_PROTEIN_GOAL_G} {t("macros.proteinDay")}
          </p>
        </div>
        <p className="text-sm text-cyan-200">{pct}%</p>
      </div>
      <div className="mt-3 h-2 rounded bg-white/10">
        <div className="h-2 rounded bg-cyan-400/80 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-4 text-xs text-white/50">{t("macros.addMealsHint")}</p>
      <div className="mt-3">
        <Link
          href="/dashboard/nutrition/scan"
          className="inline-flex rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
        >
          {t("macros.foodScan")}
        </Link>
      </div>
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
          {t("macros.timeline")}
        </p>
        {!meals || meals.length === 0 ? (
          <p className="mt-2 text-xs text-white/50">{t("macros.noMeals")}</p>
        ) : (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
            {meals.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 text-xs text-white/75"
              >
                <span className="min-w-0 truncate">
                  {new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                  · {m.name ?? "—"}
                </span>
                <span className="shrink-0 text-cyan-200">+{Math.round(finite0(m.protein))} g</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
