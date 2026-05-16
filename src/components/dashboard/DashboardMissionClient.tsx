"use client";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { getTrpcUserMessage } from "@/lib/errors/trpc-user-message";
import { tAchievement } from "@/lib/i18n/t-achievement";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/trpc/root";

export type DashboardOverview = inferRouterOutputs<AppRouter>["dashboard"]["getOverview"];

const REFETCH_MS = 90_000;

function missionProgressWidthPct(mission: {
  current: number;
  target: number;
  done: boolean;
  progressMode: string;
}): number {
  if (mission.done) return 100;
  const target = Math.max(1, mission.target);
  if (mission.progressMode === "atMost") {
    if (mission.current <= mission.target) return 100;
    return Math.min(100, Math.round((mission.target / mission.current) * 100));
  }
  return Math.min(100, Math.round((mission.current / target) * 100));
}

function formatMissionNumber(n: number): string {
  return Math.round(n).toString();
}

interface DashboardMissionClientProps {
  initial: DashboardOverview;
}

export function DashboardMissionClient({ initial }: DashboardMissionClientProps) {
  const { t } = useLocaleContext();
  const utils = trpc.useUtils();
  const setDailyFocus = trpc.profile.setDailyMissionsFocus.useMutation({
    onSuccess: async () => {
      await utils.dashboard.getOverview.invalidate();
    }
  });
  const { data, isError, isFetching, error, refetch } = trpc.dashboard.getOverview.useQuery(
    undefined,
    {
      initialData: initial,
      staleTime: 45_000,
      refetchInterval: REFETCH_MS,
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 10_000)
    }
  );

  const overview = data ?? initial;
  const syncMessage = isError ? getTrpcUserMessage(error) : null;

  return (
    <>
      {isError ? (
        <GlassCard
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          glow="crimson"
          hover={false}
        >
          <p className="text-sm text-white/85">
            {syncMessage} {t("dashboard.syncLiveFailed")}
            {isFetching ? ` ${t("dashboard.retrying")}` : null}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-white/90 transition hover:bg-white/10"
          >
            {t("dashboard.retrySync")}
          </button>
        </GlassCard>
      ) : null}
      {!overview.isPremium ? (
        <GlassCard className="flex items-center justify-between gap-4 p-5" glow="purple">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">
              {t("dashboard.premiumUpgrade")}
            </p>
            <p className="mt-2 text-white/85">{t("dashboard.premiumUpgradeBody")}</p>
          </div>
          <Link
            href="/settings"
            className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {t("billing.upgradeShort")}
          </Link>
        </GlassCard>
      ) : (
        <GlassCard className="p-5" glow="cyan">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-300/90">
            {t("dashboard.premiumActive")}
          </p>
          <p className="mt-2 text-white/85">{t("dashboard.premiumActiveBody")}</p>
        </GlassCard>
      )}
      <GlassCard className="p-5" glow="purple" hover={false}>
        <p className="text-xs uppercase tracking-[0.18em] text-purple-200/80">
          {t("dashboard.phaseProgression")}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40">
              {t("dashboard.streakCurrent")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {overview.gamification.currentStreak}
            </p>
            <p className="text-[11px] text-white/45">{t("dashboard.streakUtcHint")}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40">
              {t("dashboard.streakBest")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {overview.gamification.longestStreak}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40">
              {t("dashboard.titanXp")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-cyan-200">{overview.gamification.xp}</p>
          </div>
        </div>
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            {t("dashboard.recentBadges")}
          </p>
          {overview.gamification.achievements.length === 0 ? (
            <p className="mt-2 text-sm text-white/55">{t("dashboard.recentBadgesEmpty")}</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {overview.gamification.achievements.map((a) => (
                <li
                  key={`${a.type}-${String(a.unlockedAt)}`}
                  className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-100"
                  title={new Date(a.unlockedAt).toLocaleString()}
                >
                  {tAchievement(a.type, a.title, t)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassCard>
      <GlassCard className="p-5" glow="blue" hover={false}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
            {t("dashboard.dailyMissions")}
          </p>
          <div
            className="flex shrink-0 gap-0.5 rounded-lg border border-white/15 bg-black/25 p-0.5"
            role="group"
            aria-label={t("dashboard.dm.focusGroupAria")}
          >
            <button
              type="button"
              disabled={setDailyFocus.isPending}
              onClick={() => setDailyFocus.mutate({ focus: "FAT_LOSS" })}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition",
                overview.dailyMissionsFocus === "FAT_LOSS"
                  ? "bg-cyan-500/25 text-cyan-200"
                  : "text-white/50 hover:bg-white/5 hover:text-white/85"
              )}
            >
              {t("dashboard.dm.focusLoss")}
            </button>
            <button
              type="button"
              disabled={setDailyFocus.isPending}
              onClick={() => setDailyFocus.mutate({ focus: "MUSCLE_GAIN" })}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition",
                overview.dailyMissionsFocus === "MUSCLE_GAIN"
                  ? "bg-cyan-500/25 text-cyan-200"
                  : "text-white/50 hover:bg-white/5 hover:text-white/85"
              )}
            >
              {t("dashboard.dm.focusGain")}
            </button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-white/45">{t("dashboard.dm.utcDayHint")}</p>
        <p className="mt-2 text-[11px] leading-snug text-white/40">
          {t("dashboard.dm.missionProfileHint")}
        </p>
        <div className="mt-3 space-y-2">
          {overview.missions.map((mission) => {
            const pct = missionProgressWidthPct(mission);
            const valueLabel = mission.done
              ? t("dashboard.missionDone")
              : mission.progressMode === "atMost"
                ? `${formatMissionNumber(mission.current)}≤${formatMissionNumber(mission.target)}`
                : `${formatMissionNumber(mission.current)}/${formatMissionNumber(mission.target)}`;
            return (
              <div
                key={mission.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <p className="text-white/85">{t(mission.labelKey, mission.labelVars)}</p>
                  <p className={mission.done ? "text-emerald-300" : "text-white/60"}>
                    {valueLabel}
                  </p>
                </div>
                <div className="mt-2 h-1.5 rounded bg-white/10">
                  <div className="h-1.5 rounded bg-cyan-400/80" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.kpis.map((kpi) => (
          <GlassCard key={kpi.id} className="p-5" glow={kpi.tone}>
            <p className="text-xs uppercase tracking-wider text-white/40">{t(kpi.labelKey)}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{kpi.value}</p>
          </GlassCard>
        ))}
      </section>
    </>
  );
}
