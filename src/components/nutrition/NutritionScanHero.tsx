"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

export function NutritionScanHero() {
  const { t } = useLocaleContext();
  return (
    <GlassCard glow="purple" className="p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">
        {t("nutrition.scanEyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-white">{t("nutrition.scanTitle")}</h1>
      <p className="mt-3 text-white/70">{t("nutrition.scanSubtitle")}</p>
    </GlassCard>
  );
}
