"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import type { AppLocale } from "@/lib/i18n/types";

export function CompactLanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext();

  return (
    <div className="fixed right-4 top-4 z-[100] flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 px-1 py-1 text-xs backdrop-blur-md">
      {(["en", "ru"] as const).map((code: AppLocale) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded-lg px-2 py-1 font-medium uppercase tracking-wide transition ${
            locale === code
              ? "bg-white/15 text-white"
              : "text-white/55 hover:bg-white/10 hover:text-white/90"
          }`}
          aria-pressed={locale === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
