"use client";

import { useEffect, useMemo, useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

interface SocialButtonsProps {
  googleEnabled: boolean;
  appleEnabled: boolean;
}

export function SocialButtons({ googleEnabled, appleEnabled }: SocialButtonsProps) {
  const { t } = useLocaleContext();
  const canonical = useMemo(
    () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    []
  );
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);

  const oauthEnabled = googleEnabled || appleEnabled;
  const wrongOrigin =
    oauthEnabled &&
    origin &&
    canonical &&
    origin !== canonical &&
    /^(127\.0\.0\.1|\[::1\]|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      new URL(origin).hostname
    );

  const appBase = (origin ?? canonical).replace(/\/$/, "");
  const callbackAfterLogin = `${appBase}/dashboard`;
  const cb = encodeURIComponent(callbackAfterLogin);
  const canGoogle = googleEnabled && !wrongOrigin;
  const canApple = appleEnabled && !wrongOrigin;
  const googleSignInHref = `/api/auth/signin/google?callbackUrl=${cb}`;
  const appleSignInHref = `/api/auth/signin/apple?callbackUrl=${cb}`;

  const linkClass = (enabled: boolean) =>
    cn(
      "flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-center text-sm text-white transition",
      enabled ? "hover:bg-white/10" : "pointer-events-none cursor-not-allowed opacity-50"
    );

  return (
    <GlassCard className="space-y-2 p-4" glow="purple">
      {wrongOrigin ? (
        <p className="mb-1 text-xs text-amber-200/90">
          {t("social.wrongOriginBefore")}{" "}
          <a href={`${canonical}/login`} className="underline hover:text-amber-100">
            {canonical}
          </a>{" "}
          {t("social.wrongOriginAfter")}
        </p>
      ) : null}
      <a
        href={canGoogle ? googleSignInHref : undefined}
        aria-disabled={!canGoogle}
        className={linkClass(canGoogle)}
        onClick={(e) => {
          if (!canGoogle) e.preventDefault();
        }}
      >
        {t("social.continueGoogle")}
      </a>
      <a
        href={canApple ? appleSignInHref : undefined}
        aria-disabled={!canApple}
        className={linkClass(canApple)}
        onClick={(e) => {
          if (!canApple) e.preventDefault();
        }}
      >
        {t("social.continueApple")}
      </a>
      {!googleEnabled ? (
        <p className="pt-1 text-xs text-white/50">{t("social.googleDisabled")}</p>
      ) : null}
      {!appleEnabled ? (
        <p className="pt-1 text-xs text-white/50">{t("social.appleDisabled")}</p>
      ) : null}
    </GlassCard>
  );
}
