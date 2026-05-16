"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

const goalIds = ["FAT_LOSS", "MUSCLE_GAIN", "RECOMPOSITION", "MAINTENANCE", "STRENGTH"] as const;

export function OnboardingWizard() {
  const { t } = useLocaleContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        height: Number(formData.get("height") || undefined),
        weight: Number(formData.get("weight") || undefined),
        age: Number(formData.get("age") || undefined),
        gender: String(formData.get("gender") || ""),
        goal: String(formData.get("goal") || "MAINTENANCE"),
        trainingFreq: Number(formData.get("trainingFreq") || undefined)
      };

      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? t("onboarding.saveError"));
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("onboarding.saveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="p-6 sm:p-8" glow="purple">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            {t("onboarding.phase")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{t("onboarding.title")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("onboarding.subtitle")}</p>
        </div>
        <div className="hidden h-12 w-12 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-300 sm:flex">
          NT
        </div>
      </div>
      <form action={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="height"
          type="number"
          placeholder={t("onboarding.height")}
          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <input
          name="weight"
          type="number"
          placeholder={t("onboarding.weight")}
          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <input
          name="age"
          type="number"
          placeholder={t("onboarding.age")}
          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <input
          name="gender"
          type="text"
          placeholder={t("onboarding.gender")}
          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <select
          name="goal"
          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60 sm:col-span-2"
        >
          {goalIds.map((id) => (
            <option key={id} value={id}>
              {t(`onboarding.goal.${id}`)}
            </option>
          ))}
        </select>
        <input
          name="trainingFreq"
          type="number"
          placeholder={t("onboarding.trainingFreq")}
          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60 sm:col-span-2"
        />
        {error ? <p className="sm:col-span-2 text-sm text-rose-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {loading ? t("onboarding.saving") : t("onboarding.finish")}
        </button>
      </form>
    </GlassCard>
  );
}
