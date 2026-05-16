"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

interface PlanTierCardsProps {
  isPro: boolean;
}

export function PlanTierCards({ isPro }: PlanTierCardsProps) {
  const { t } = useLocaleContext();

  const freeFeatures = [
    t("settings.tier.freeF1"),
    t("settings.tier.freeF2"),
    t("settings.tier.freeF3"),
    t("settings.tier.freeF4")
  ];
  const proFeatures = [
    t("settings.tier.proF1"),
    t("settings.tier.proF2"),
    t("settings.tier.proF3"),
    t("settings.tier.proF4"),
    t("settings.tier.proF5"),
    t("settings.tier.proF6"),
    t("settings.tier.proF7")
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <GlassCard
        className={cn(
          "relative space-y-4 p-6",
          !isPro && "ring-2 ring-white/25 ring-offset-2 ring-offset-black/40"
        )}
        glow="none"
        hover={false}
      >
        {!isPro ? (
          <span className="absolute right-3 top-3 rounded-lg border border-cyan-400/45 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
            {t("settings.tier.currentPlan")}
          </span>
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            {t("settings.tier.freeEyebrow")}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[0.12em] text-white">FREE</h2>
          <p className="mt-2 text-sm text-white/70">{t("settings.tier.freeSubtitle")}</p>
        </div>
        <ul className="space-y-2.5 text-sm text-white/80">
          {freeFeatures.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard
        className={cn(
          "relative space-y-4 p-6",
          isPro && "ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-black/40"
        )}
        glow="purple"
        hover={false}
      >
        {isPro ? (
          <span className="absolute right-3 top-3 rounded-lg border border-cyan-400/45 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
            {t("settings.tier.currentPlan")}
          </span>
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-200/80">
            {t("settings.tier.proEyebrow")}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[0.12em] text-white">PRO</h2>
          <p className="mt-2 text-sm text-white/70">{t("settings.tier.proSubtitle")}</p>
        </div>
        <ul className="space-y-2.5 text-sm text-white/85">
          {proFeatures.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
