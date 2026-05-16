"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { tAchievement } from "@/lib/i18n/t-achievement";
import { QUICK_LOG_MUSCLE_GROUPS, type QuickLogMuscleValue } from "@/lib/training/muscle-groups";
import { trpc } from "@/lib/trpc/react";

const INPUT_CLASS =
  "rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50";
const MAX_QUICK_SETS = 20;
const MAX_REPS = 200;
const STEPPER_BTN =
  "flex h-[42px] w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-lg leading-none text-cyan-200/90 transition hover:border-cyan-400/40 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-35";

function repCellDisplay(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") return "—";
  const r = Number(trimmed);
  if (!Number.isFinite(r) || r < 1) return "—";
  return String(Math.floor(r));
}

function repsInRangeForRow(raw: string): boolean {
  const r = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(r) && r >= 1;
}

function parseRepsForSubmit(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

function makeRowId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type SetRow = { id: string; reps: string };

export function QuickWorkoutLog() {
  const { t } = useLocaleContext();
  const [muscleGroup, setMuscleGroup] = useState<QuickLogMuscleValue>("legs");
  const [repsBySet, setRepsBySet] = useState<SetRow[]>(() => [
    { id: makeRowId(), reps: "8" },
    { id: makeRowId(), reps: "8" },
    { id: makeRowId(), reps: "8" }
  ]);
  const [unlockToast, setUnlockToast] = useState<string[] | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const remainingRef = useRef(4500);
  const startedAtRef = useRef(0);

  function clearDismissTimer() {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  const scheduleDismiss = useCallback(() => {
    clearDismissTimer();
    if (!unlockToast) return;
    startedAtRef.current = Date.now();
    timeoutRef.current = window.setTimeout(() => {
      setUnlockToast(null);
      remainingRef.current = 4500;
      timeoutRef.current = null;
    }, remainingRef.current);
  }, [unlockToast]);

  useEffect(() => {
    if (!unlockToast) {
      clearDismissTimer();
      remainingRef.current = 4500;
      return;
    }
    remainingRef.current = 4500;
    scheduleDismiss();
    return clearDismissTimer;
  }, [scheduleDismiss, unlockToast]);

  const utils = trpc.useUtils();
  const mutation = trpc.training.logWorkout.useMutation({
    onSuccess: async (data) => {
      await utils.training.getRecent.invalidate();
      await utils.dashboard.getOverview.invalidate();
      const unlocked = data.unlockedAchievements.map((a) => tAchievement(a.type, a.title, t));
      setUnlockToast(unlocked.length > 0 ? unlocked : null);
    }
  });

  const setCount = Math.max(1, Math.min(MAX_QUICK_SETS, repsBySet.length));
  const muscleLabelKey =
    QUICK_LOG_MUSCLE_GROUPS.find((opt) => opt.value === muscleGroup)?.labelKey ??
    "workout.muscleGroupPlaceholder";

  function bumpRepsAt(index: number, delta: number) {
    setRepsBySet((rows) => {
      const next = rows.map((r) => ({ ...r }));
      const row = next[index];
      if (!row) return rows;
      const trimmed = row.reps.trim();
      if (trimmed === "") {
        if (delta > 0) row.reps = "1";
        return next;
      }
      const cur = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(cur) || cur < 1) {
        if (delta > 0) row.reps = "1";
        return next;
      }
      const n = cur + delta;
      if (n < 1) {
        row.reps = "";
        return next;
      }
      row.reps = String(Math.min(MAX_REPS, n));
      return next;
    });
  }

  function updateRepsAt(index: number, value: string) {
    setRepsBySet((rows) => rows.map((r, i) => (i === index ? { ...r, reps: value } : r)));
  }

  function addSetRow() {
    setRepsBySet((rows) => {
      if (rows.length >= MAX_QUICK_SETS) return rows;
      const last = rows[rows.length - 1]?.reps ?? "";
      const reps = last.trim() === "" ? "" : last;
      return [...rows, { id: makeRowId(), reps }];
    });
  }

  function removeSetRow(index: number) {
    setRepsBySet((rows) => {
      if (rows.length <= 1) return rows;
      return rows.filter((_, i) => i !== index);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rows = repsBySet.slice(0, MAX_QUICK_SETS);
    if (rows.length < 1) return;
    const exerciseLabel = t(muscleLabelKey);
    mutation.mutate({
      sets: rows.map((row, i) => ({
        exercise: exerciseLabel,
        muscleGroup: muscleGroup.trim(),
        setNumber: i + 1,
        reps: parseRepsForSubmit(row.reps)
      }))
    });
  }

  return (
    <GlassCard className="relative p-6" glow="blue" hover={false}>
      <AnimatePresence>
        {unlockToast ? (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => {
              if (timeoutRef.current == null) return;
              const elapsed = Date.now() - startedAtRef.current;
              remainingRef.current = Math.max(0, remainingRef.current - elapsed);
              clearDismissTimer();
            }}
            onMouseLeave={() => {
              if (remainingRef.current <= 0) {
                setUnlockToast(null);
                remainingRef.current = 4500;
                return;
              }
              scheduleDismiss();
            }}
            className="absolute right-4 top-4 z-10 max-w-[85%] rounded-xl border border-emerald-400/45 bg-black/80 px-3 py-2 pr-8 text-xs text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.25)] backdrop-blur"
          >
            {t("workout.achievementUnlocked")} {unlockToast.join(", ")}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUnlockToast(null);
              }}
              className="absolute right-1 top-1 h-5 w-5 rounded text-emerald-200/80 transition hover:bg-emerald-500/20 hover:text-emerald-100"
              aria-label={t("workout.closeAchievementAria")}
            >
              ×
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t("workout.quickLog")}</p>
      <h2 className="mt-2 text-lg font-semibold text-white">{t("workout.logOneSet")}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="min-w-[6.5rem] flex-1 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
            {t("workout.muscleGroupPlaceholder")}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-white">{t(muscleLabelKey)}</p>
        </div>
        <div className="min-w-[5.5rem] flex-1 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
            {t("workout.plaqueSets")}
          </p>
          <p className="mt-1 text-sm font-medium tabular-nums text-white">{setCount}</p>
        </div>
        <div className="min-w-[6.5rem] max-h-36 flex-1 overflow-y-auto rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
            {t("workout.plaqueReps")}
          </p>
          <ul className="mt-1.5 space-y-1">
            {repsBySet.map((row, i) => (
              <li key={row.id} className="text-xs tabular-nums text-white">
                {t("workout.setRowPrefix")} {i + 1}: {repCellDisplay(row.reps)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3">
        <select
          value={muscleGroup}
          onChange={(ev) => setMuscleGroup(ev.target.value as QuickLogMuscleValue)}
          required
          className={`${INPUT_CLASS} cursor-pointer`}
          aria-label={t("workout.muscleGroupPlaceholder")}
        >
          {QUICK_LOG_MUSCLE_GROUPS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
              {t(opt.labelKey)}
            </option>
          ))}
        </select>

        <div className="space-y-2">
          {repsBySet.map((row, index) => {
            const repStr = row.reps;
            const rParsed = Number.parseInt(repStr.trim(), 10);
            const rOk = Number.isFinite(rParsed) && rParsed >= 1;
            return (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 sm:flex-nowrap"
              >
                <span className="w-full shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-white/50 sm:w-[5.5rem]">
                  {t("workout.setRowPrefix")} {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 gap-2">
                  <button
                    type="button"
                    className={STEPPER_BTN}
                    aria-label={t("workout.stepperMinusRepsAria")}
                    disabled={!repsInRangeForRow(repStr)}
                    onClick={() => bumpRepsAt(index, -1)}
                  >
                    −
                  </button>
                  <input
                    value={repStr}
                    onChange={(ev) => updateRepsAt(index, ev.target.value)}
                    inputMode="numeric"
                    className={`${INPUT_CLASS} min-w-0 flex-1 text-center tabular-nums`}
                    placeholder={t("workout.repsPlaceholder")}
                    aria-label={`${t("workout.repsPlaceholder")} · ${t("workout.setRowPrefix")} ${index + 1}`}
                  />
                  <button
                    type="button"
                    className={STEPPER_BTN}
                    aria-label={t("workout.stepperPlusRepsAria")}
                    disabled={rOk && rParsed >= MAX_REPS}
                    onClick={() => bumpRepsAt(index, 1)}
                  >
                    +
                  </button>
                </div>
                {repsBySet.length > 1 ? (
                  <button
                    type="button"
                    className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white/60 transition hover:border-rose-400/35 hover:bg-rose-500/10 hover:text-rose-200"
                    aria-label={t("workout.removeSetRowAria")}
                    onClick={() => removeSetRow(index)}
                  >
                    ×
                  </button>
                ) : (
                  <span className="w-9 shrink-0 sm:inline-block" aria-hidden />
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={repsBySet.length >= MAX_QUICK_SETS}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-400/35 bg-cyan-500/[0.06] py-2.5 text-sm font-medium text-cyan-200/90 transition hover:border-cyan-400/50 hover:bg-cyan-500/12 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-6"
          aria-label={t("workout.addSetButton")}
          onClick={addSetRow}
        >
          <span className="text-lg leading-none">+</span>
          {t("workout.addSetButton")}
        </button>

        {mutation.isError ? (
          <p className="text-sm text-rose-400">{mutation.error.message}</p>
        ) : null}
        {mutation.isSuccess ? (
          <p className="text-sm text-emerald-400">{t("workout.saved")}</p>
        ) : null}
        <div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {mutation.isPending ? t("workout.saving") : t("workout.save")}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
