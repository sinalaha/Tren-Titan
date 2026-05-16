"use client";

import { useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";

interface BillingActionsProps {
  isPremium: boolean;
}

export function BillingActions({ isPremium }: BillingActionsProps) {
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openCheckout() {
    setLoading("checkout");
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const payload = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !payload.url) throw new Error(payload.message ?? "Checkout failed");
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const payload = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !payload.url) throw new Error(payload.message ?? "Portal failed");
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal failed");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openCheckout}
          disabled={loading !== null}
          className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {loading === "checkout"
            ? t("billing.openingCheckout")
            : isPremium
              ? t("billing.changePlan")
              : t("billing.upgrade")}
        </button>
        <button
          type="button"
          onClick={openPortal}
          disabled={loading !== null}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading === "portal" ? t("billing.openingPortal") : t("billing.managePortal")}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
