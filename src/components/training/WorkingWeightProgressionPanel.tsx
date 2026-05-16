"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

function formatPeriodLabel(periodKey: string, grain: "week" | "month", lang: string): string {
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  if (grain === "month") {
    const parts = periodKey.split("-").map(Number);
    const y = parts[0] ?? 0;
    const m = parts[1] ?? 1;
    return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: "short", year: "numeric" });
  }
  return new Date(`${periodKey}T12:00:00.000Z`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric"
  });
}

interface WorkingWeightProgressionPanelProps {
  isPro: boolean;
}

export function WorkingWeightProgressionPanel({ isPro }: WorkingWeightProgressionPanelProps) {
  const { t, locale } = useLocaleContext();
  const [grain, setGrain] = useState<"week" | "month">("week");

  const { data, isPending } = trpc.training.getWeightProgression.useQuery(
    { grain },
    { enabled: isPro, staleTime: 60_000 }
  );

  const layout = useMemo(() => {
    const pts = data?.points ?? [];
    if (pts.length === 0) return null;

    const weights = pts.map((p) => p.maxWeightKg);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const span = Math.max(maxW - minW, 1);

    const W = 640;
    const H = 260;
    const padL = 56;
    const padR = 28;
    const padT = 32;
    const padB = 52;
    const iw = W - padL - padR;
    const ih = H - padT - padB;

    const scaled = pts.map((p, i) => {
      const x = padL + (pts.length === 1 ? iw / 2 : (i / Math.max(pts.length - 1, 1)) * iw);
      const norm = (p.maxWeightKg - minW) / span;
      const y = padT + ih - norm * (ih * 0.88) - ih * 0.06;
      return { x, y, ...p };
    });

    const lineD = scaled.map((p) => `${p.x},${p.y}`).join(" ");

    const yTicks = 4;
    const tickLabels: { y: number; val: number }[] = [];
    for (let i = 0; i <= yTicks; i++) {
      const frac = i / yTicks;
      const val = minW + (1 - frac) * (maxW - minW);
      const y = padT + frac * ih * 0.88 + ih * 0.06;
      tickLabels.push({ y, val: Math.round(val * 10) / 10 });
    }

    const labelStep = Math.max(1, Math.ceil(pts.length / 7));

    return { W, H, padL, padT, iw, ih, scaled, lineD, tickLabels, labelStep };
  }, [data?.points]);

  return (
    <GlassCard className="relative overflow-hidden p-6" glow="cyan" hover={false}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">
            {t("training.progression.eyebrow")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {t("training.progression.title")}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            {t("training.progression.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setGrain("week")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              grain === "week"
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-white/55 hover:bg-white/5 hover:text-white/85"
            )}
          >
            {t("training.progression.week")}
          </button>
          <button
            type="button"
            onClick={() => setGrain("month")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              grain === "month"
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-white/55 hover:bg-white/5 hover:text-white/85"
            )}
          >
            {t("training.progression.month")}
          </button>
        </div>
      </div>

      <div className="relative mt-6 min-h-[200px] w-full">
        {isPro && isPending ? (
          <div className="flex h-[240px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="h-8 w-8 animate-pulse rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
          </div>
        ) : null}

        {isPro && !isPending && layout ? (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${layout.W} ${layout.H}`}
              className="h-auto w-full min-w-[320px]"
              role="img"
              aria-label={t("training.progression.title")}
            >
              <defs>
                <linearGradient id="wwpFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {layout.tickLabels.map(({ y, val }, i) => (
                <g key={i}>
                  <line
                    x1={layout.padL}
                    y1={y}
                    x2={layout.padL + layout.iw}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={layout.padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-white/40 text-[10px]"
                  >
                    {val}
                  </text>
                </g>
              ))}

              <text
                x={12}
                y={layout.padT + layout.ih / 2}
                className="fill-white/35 text-[10px]"
                transform={`rotate(-90 12 ${layout.padT + layout.ih / 2})`}
              >
                {t("training.progression.kgAxis")}
              </text>

              {layout.scaled.length >= 2 ? (
                <polygon
                  points={`${layout.lineD} ${layout.scaled[layout.scaled.length - 1]?.x},${layout.H - 36} ${layout.scaled[0]?.x},${layout.H - 36}`}
                  fill="url(#wwpFill)"
                />
              ) : null}

              <polyline
                fill="none"
                stroke="rgb(34,211,238)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={layout.lineD}
              />

              {layout.scaled.map((p, i) => (
                <circle
                  key={`${p.periodKey}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="rgb(15,23,32)"
                  stroke="rgb(34,211,238)"
                  strokeWidth="2"
                >
                  <title>
                    {formatPeriodLabel(p.periodKey, grain, locale)} — {p.maxWeightKg} kg —{" "}
                    {p.topExercise}
                  </title>
                </circle>
              ))}

              {layout.scaled.map((p, i) =>
                i % layout.labelStep === 0 || i === layout.scaled.length - 1 ? (
                  <text
                    key={`lbl-${p.periodKey}`}
                    x={p.x}
                    y={layout.H - 18}
                    textAnchor="middle"
                    className="fill-white/45 text-[9px]"
                  >
                    {formatPeriodLabel(p.periodKey, grain, locale)}
                  </text>
                ) : null
              )}
            </svg>
          </div>
        ) : null}

        {isPro && !isPending && !layout ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] py-12 text-center text-sm text-white/55">
            {t("training.progression.empty")}
          </p>
        ) : null}
      </div>

      {!isPro ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-black/78 px-6 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold text-white/95">{t("training.progression.proOnly")}</p>
          <p className="max-w-sm text-xs text-white/60">{t("training.progression.proOnlyHint")}</p>
          <Link
            href="/settings#settings-billing"
            className="rounded-xl border border-cyan-400/45 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/25"
          >
            {t("training.progression.upgradeLink")}
          </Link>
        </div>
      ) : null}
    </GlassCard>
  );
}
