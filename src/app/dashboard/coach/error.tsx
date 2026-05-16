"use client";

import Link from "next/link";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

interface CoachErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CoachError({ error, reset }: CoachErrorProps) {
  const { t } = useLocaleContext();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <GlassCard className="space-y-4 p-8" glow="crimson" hover={false}>
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          {t("errorPage.coach.eyebrow")}
        </p>
        <h1 className="text-xl font-semibold text-white">{t("errorPage.coach.title")}</h1>
        <p className="text-sm text-white/70">{error.message || t("errorPage.coach.fallback")}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300"
          >
            {t("common.retry")}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/85"
          >
            {t("common.dashboard")}
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
