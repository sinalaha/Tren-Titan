"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

export function DashboardHero() {
  const { t } = useLocaleContext();

  return (
    <GlassCard className="p-6" glow="cyan">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{t("dashboard.tagline")}</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">{t("dashboard.title")}</h1>
      <p className="mt-3 max-w-2xl text-white/70">{t("dashboard.subtitle")}</p>
    </GlassCard>
  );
}
