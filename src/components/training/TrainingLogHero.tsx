"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

export function TrainingLogHero() {
  const { t } = useLocaleContext();
  return (
    <GlassCard className="p-6" glow="purple" hover={false}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">
        {t("training.heroEyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-white">{t("training.heroTitle")}</h1>
      <p className="mt-3 text-white/70">{t("training.heroSubtitle")}</p>
    </GlassCard>
  );
}
