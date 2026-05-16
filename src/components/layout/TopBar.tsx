"use client";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import type { AppLocale } from "@/lib/i18n/types";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/trpc/root";

export interface TopBarSubscription {
  plan: string;
  status: string;
  aiScansUsed: number;
  aiScansLimit: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

interface TopBarProps {
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string;
  subscription?: TopBarSubscription | null;
}

const navItems = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/dashboard/nutrition/scan", key: "nav.scan" },
  { href: "/dashboard/training/log", key: "nav.train" },
  { href: "/dashboard/coach", key: "nav.coach" },
  { href: "/settings", key: "nav.settings" }
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscriptionBadge(
  sub: TopBarSubscription | null | undefined,
  t: (key: string) => string,
  locale: AppLocale
): {
  label: string;
  className: string;
  sublabel?: string;
} {
  if (!sub) {
    return {
      label: t("topbar.free"),
      className: "border-white/20 bg-white/5 text-white/70"
    };
  }
  if (sub.status === "PAST_DUE" || sub.status === "CANCELLED") {
    return {
      label: sub.status === "PAST_DUE" ? t("topbar.pastDue") : t("topbar.cancelled"),
      className: "border-rose-400/45 bg-rose-500/15 text-rose-200"
    };
  }
  if (sub.plan === "premium" && sub.status === "ACTIVE") {
    const dateLocale = locale === "ru" ? "ru-RU" : "en-US";
    const renewalDate =
      sub.currentPeriodEnd != null
        ? sub.currentPeriodEnd.toLocaleDateString(dateLocale)
        : undefined;
    const renewal = renewalDate != null ? `${t("topbar.renews")} ${renewalDate}` : undefined;
    return {
      label: t("topbar.premium"),
      className: "border-cyan-400/50 bg-cyan-500/15 text-cyan-200",
      sublabel: sub.cancelAtPeriodEnd ? t("topbar.cancelsEnd") : renewal
    };
  }
  return {
    label: t("topbar.free"),
    className: "border-white/20 bg-white/5 text-white/70",
    sublabel: `${sub.aiScansUsed}/${sub.aiScansLimit} ${t("topbar.scansLabel")}`
  };
}

type SubscriptionRow = NonNullable<inferRouterOutputs<AppRouter>["subscription"]["getCurrent"]>;

function toTopBarSubscription(row: SubscriptionRow): TopBarSubscription {
  return {
    plan: row.plan,
    status: row.status,
    aiScansUsed: row.aiScansUsed,
    aiScansLimit: row.aiScansLimit,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd
  };
}

export function TopBar({ userName, userEmail, userRole, subscription }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useLocaleContext();
  const { data: liveSubscription } = trpc.subscription.getCurrent.useQuery(undefined, {
    refetchInterval: 45_000,
    refetchOnWindowFocus: true
  });

  const mergedSubscription =
    liveSubscription != null ? toTopBarSubscription(liveSubscription) : (subscription ?? null);

  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";
  const items = isAdmin ? [...navItems, { href: "/admin", key: "nav.admin" as const }] : navItems;
  const badge = subscriptionBadge(mergedSubscription, t, locale);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:border-cyan-400/35 hover:bg-cyan-500/10 hover:text-cyan-200"
            aria-label={t("topbar.back")}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
          <span className="truncate text-sm font-semibold tracking-wide text-white/90">
            Tren Titan
          </span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition",
                  active
                    ? "border border-cyan-400/40 bg-cyan-500/10 text-cyan-300"
                    : "border border-transparent text-white/60 hover:border-white/10 hover:text-white/90"
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-white/90">{userName ?? t("topbar.athlete")}</p>
            <p className="text-[11px] text-white/45">{userEmail ?? ""}</p>
          </div>
          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <span
              className={cn(
                "inline-flex rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                badge.className
              )}
            >
              {badge.label}
            </span>
            {badge.sublabel ? (
              <span className="max-w-[140px] truncate text-[10px] text-white/45">
                {badge.sublabel}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-rose-300 transition hover:bg-rose-500/20"
          >
            {t("topbar.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
