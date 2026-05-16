"use client";

import Link from "next/link";

import { useLocaleContext } from "@/components/providers/LocaleProvider";

export function AuthPageFooter({ mode }: { mode: "login" | "register" }) {
  const { t } = useLocaleContext();

  if (mode === "login") {
    return (
      <p className="text-center text-sm text-white/60">
        {t("auth.footerNoAccount")}{" "}
        <Link href="/register" className="text-cyan-300 hover:text-cyan-200">
          {t("auth.footerRegister")}
        </Link>
      </p>
    );
  }

  return (
    <p className="text-center text-sm text-white/60">
      {t("auth.footerHasAccount")}{" "}
      <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
        {t("auth.footerSignIn")}
      </Link>
    </p>
  );
}
