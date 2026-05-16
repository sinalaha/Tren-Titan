"use client";

import Link from "next/link";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

interface SettingsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SettingsError({ error, reset }: SettingsErrorProps) {
  const { t } = useLocaleContext();
  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <GlassCard className="space-y-4 p-8" glow="crimson" hover={false}>
        <p className="text-xs uppercase tracking-[0.2em] text-rose-300/90">
          {t("errorPage.settings.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold text-white">{t("errorPage.settings.title")}</h1>
        <p className="text-sm text-white/70">{error.message || t("errorPage.settings.fallback")}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300"
          >
            {t("common.retry")}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85"
          >
            {t("common.dashboard")}
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
