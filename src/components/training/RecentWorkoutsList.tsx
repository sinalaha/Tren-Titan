"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { trpc } from "@/lib/trpc/react";

export function RecentWorkoutsList() {
  const { t } = useLocaleContext();
  const { data, isPending, isError, error, refetch } = trpc.training.getRecent.useQuery(undefined, {
    staleTime: 30_000
  });

  if (isPending) {
    return (
      <GlassCard className="space-y-3 p-6" glow="none" hover={false}>
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
        ))}
      </GlassCard>
    );
  }

  if (isError) {
    return (
      <GlassCard className="space-y-3 p-6" glow="crimson" hover={false}>
        <p className="text-sm text-white/85">{error.message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/90"
        >
          {t("common.retry")}
        </button>
      </GlassCard>
    );
  }

  if (!data?.length) {
    return (
      <GlassCard className="p-6" glow="blue" hover={false}>
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t("sessions.title")}</p>
        <p className="mt-2 text-sm text-white/65">{t("sessions.empty")}</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6" glow="blue" hover={false}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t("sessions.title")}</p>
      <ul className="mt-4 space-y-3">
        {data.map((workout) => (
          <li
            key={workout.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">
                {workout.name ?? t("sessions.workoutDefault")}
              </p>
              <p className="text-xs text-white/45">
                {new Date(workout.date).toLocaleString()} · {workout.exercises.length}{" "}
                {t("sessions.sets")}
                {workout.rpe != null ? ` · RPE ${workout.rpe}` : ""}
              </p>
            </div>
            <span className="font-mono text-xs text-cyan-200/90">
              {workout.exercises
                .slice(0, 2)
                .map((ex) => ex.exercise)
                .join(", ")}
              {workout.exercises.length > 2 ? "…" : ""}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
