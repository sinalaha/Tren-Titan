"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";

export function AuthDivider() {
  const { t } = useLocaleContext();
  return (
    <p className="text-center text-xs uppercase tracking-[0.22em] text-white/45">
      {t("auth.dividerOr")}
    </p>
  );
}
