"use client";

import { useRouter } from "next/navigation";

import { useLocaleContext } from "@/components/providers/LocaleProvider";

/** Same back control as TopBar; fixed top-left for login/register. */
export function AuthBackButton() {
  const router = useRouter();
  const { t } = useLocaleContext();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="fixed left-4 top-4 z-[100] flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/50 text-white/80 backdrop-blur-md transition hover:border-cyan-400/35 hover:bg-cyan-500/10 hover:text-cyan-200"
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
  );
}
