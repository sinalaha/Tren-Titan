"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

export function TermsContent() {
  const { t } = useLocaleContext();
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <GlassCard className="space-y-4 p-6" glow="purple">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t("legal.tag")}</p>
        <h1 className="text-3xl font-semibold text-white">{t("legal.termsTitle")}</h1>
        <p className="text-sm text-white/75">{t("legal.termsP1")}</p>
        <p className="text-sm text-white/75">{t("legal.termsP2")}</p>
        <p className="text-sm text-white/75">{t("legal.termsP3")}</p>
      </GlassCard>
    </main>
  );
}
