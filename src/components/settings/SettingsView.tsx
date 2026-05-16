"use client";

import Link from "next/link";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { BillingActions } from "@/components/settings/BillingActions";
import { PlanTierCards } from "@/components/settings/PlanTierCards";
import { GlassCard } from "@/components/shared/GlassCard";
import { SubscriptionBadge } from "@/components/shared/SubscriptionBadge";

export type SerializedInvoice = {
  id: string;
  amountPaid: number;
  currency: string;
  created: number;
  status: string | null;
  hostedInvoiceUrl: string | null;
};

export type SettingsSubscriptionView = {
  plan: string;
  status: string;
  aiScansUsed: number;
  aiScansLimit: number;
  stripeCustomerId: string | null;
} | null;

interface SettingsViewProps {
  subscription: SettingsSubscriptionView;
  invoices: SerializedInvoice[];
  showBillingWarning: boolean;
  failedInvoiceUrl: string | null;
}

export function SettingsView({
  subscription,
  invoices,
  showBillingWarning,
  failedInvoiceUrl
}: SettingsViewProps) {
  const { t, locale, setLocale } = useLocaleContext();
  const isPro = subscription?.plan === "premium";
  const planLabel = isPro ? "PRO" : "FREE";

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <GlassCard className="p-6" glow="blue">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t("locale.title")}</p>
        <p className="mt-2 text-sm text-white/65">{t("locale.hint")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["en", "ru"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                locale === code
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                  : "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/25"
              }`}
            >
              {t(`locale.${code}`)}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6" glow="purple">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
              {t("settings.accountSettings")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{t("settings.billingTitle")}</h1>
            <p className="mt-3 text-white/70">{t("settings.billingSubtitle")}</p>
          </div>
          <SubscriptionBadge
            plan={subscription?.plan ?? "free"}
            status={subscription?.status ?? "FREE"}
            className="shrink-0"
          />
        </div>
      </GlassCard>

      <PlanTierCards isPro={isPro} />

      <GlassCard id="settings-billing" className="space-y-4 p-6" glow="cyan">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label={t("settings.plan")} value={planLabel} />
          <Metric label={t("settings.status")} value={subscription?.status ?? "FREE"} />
          <Metric
            label={t("settings.aiScansUsed")}
            value={String(subscription?.aiScansUsed ?? 0)}
          />
          <Metric
            label={t("settings.aiScansLimit")}
            value={String(subscription?.aiScansLimit ?? 10)}
          />
        </div>
        <BillingActions isPremium={isPro} />
      </GlassCard>

      {showBillingWarning ? (
        <GlassCard className="space-y-3 p-6" glow="crimson">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-300/85">
            {t("settings.billingWarningTitle")}
          </p>
          <p className="text-sm text-white/85">{t("settings.billingWarningBody")}</p>
          <div className="flex flex-wrap gap-3">
            {failedInvoiceUrl ? (
              <a
                href={failedInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/20"
              >
                {t("settings.retryInvoice")}
              </a>
            ) : null}
          </div>
        </GlassCard>
      ) : null}

      <GlassCard className="space-y-4 p-6" glow="blue">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">
          {t("settings.paymentsTitle")}
        </p>
        {invoices.length === 0 ? (
          <p className="text-sm text-white/65">{t("settings.noInvoices")}</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm text-white/90">
                    {(invoice.amountPaid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                  </p>
                  <p className="text-xs text-white/45">
                    {new Date(invoice.created * 1000).toLocaleDateString(
                      locale === "ru" ? "ru-RU" : "en-US"
                    )}{" "}
                    — {invoice.status ?? "—"}
                  </p>
                </div>
                {invoice.hostedInvoiceUrl ? (
                  <a
                    href={invoice.hostedInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
                  >
                    {t("settings.openInvoice")}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="space-y-2 p-6" glow="none" hover={false}>
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t("settings.legal")}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/privacy" className="text-cyan-200 transition hover:text-cyan-100">
            {t("settings.privacy")}
          </Link>
          <Link href="/terms" className="text-cyan-200 transition hover:text-cyan-100">
            {t("settings.terms")}
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
