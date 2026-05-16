"use client";

import Link from "next/link";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

export function CoachPageHero() {
  const { t } = useLocaleContext();
  return (
    <GlassCard className="p-8" glow="cyan" hover={false}>
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
        {t("coach.heroEyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-white">{t("coach.heroTitle")}</h1>
      <p className="mt-4 text-white/75">{t("coach.heroSubtitle")}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300"
        >
          {t("coach.backDashboard")}
        </Link>
        <Link
          href="/dashboard/nutrition/scan"
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85"
        >
          {t("coach.logNutrition")}
        </Link>
      </div>
    </GlassCard>
  );
}
