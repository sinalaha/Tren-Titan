"use client";

import { useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { DASHBOARD_HYDRATION_GOAL_ML } from "@/lib/constants";
import { trpc } from "@/lib/trpc/react";

const PRESETS = [250, 500, 750] as const;

export function QuickWaterLog() {
  const { t } = useLocaleContext();
  const utils = trpc.useUtils();
  const { data } = trpc.water.getTodayTotal.useQuery(undefined, { refetchInterval: 45_000 });
  const { data: logs } = trpc.water.getTodayLogs.useQuery(undefined, { refetchInterval: 45_000 });
  const [customMl, setCustomMl] = useState("300");

  const mutation = trpc.water.addLog.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.water.getTodayTotal.invalidate(),
        utils.water.getTodayLogs.invalidate(),
        utils.dashboard.getOverview.invalidate()
      ]);
    }
  });

  const totalMl = data?.totalMl ?? 0;
  const progress = Math.min(100, Math.round((totalMl / DASHBOARD_HYDRATION_GOAL_ML) * 100));

  return (
    <GlassCard className="p-5" glow="blue" hover={false}>
      <p className="text-xs uppercase tracking-[0.14em] text-white/45">{t("hydration.console")}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-white">{totalMl} ml</p>
          <p className="text-xs text-white/55">
            {t("hydration.goal")} {DASHBOARD_HYDRATION_GOAL_ML} {t("hydration.mlPerDay")}
          </p>
        </div>
        <p className="text-sm text-cyan-200">{progress}%</p>
      </div>
      <div className="mt-3 h-2 rounded bg-white/10">
        <div
          className="h-2 rounded bg-cyan-400/80 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => mutation.mutate({ amountMl: ml })}
            disabled={mutation.isPending}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/10 disabled:opacity-50"
          >
            +{ml} ml
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={customMl}
          onChange={(e) => setCustomMl(e.target.value)}
          inputMode="numeric"
          className="w-24 rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400/50"
          placeholder={t("hydration.placeholderMl")}
        />
        <button
          type="button"
          disabled={mutation.isPending || !customMl}
          onClick={() => {
            const amountMl = Number(customMl);
            if (!Number.isFinite(amountMl) || amountMl < 50) {
              return;
            }
            mutation.mutate({ amountMl: Math.round(amountMl) });
          }}
          className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {t("hydration.addCustom")}
        </button>
      </div>
      {mutation.isError ? (
        <p className="mt-2 text-xs text-rose-300">{mutation.error.message}</p>
      ) : null}
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
          {t("hydration.todayTimeline")}
        </p>
        {!logs || logs.length === 0 ? (
          <p className="mt-2 text-xs text-white/50">{t("hydration.noLogs")}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between text-xs text-white/75">
                <span>
                  {new Date(log.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
                <span className="text-cyan-200">+{log.amountMl} ml</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
