import Link from "next/link";
import { redirect } from "next/navigation";

/** Minimal marketing shell for static GitHub Pages (no API / auth server). */
function StaticLanding() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-8 px-4 py-12 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-[#090b1f] via-[#0b102e] to-[#050814]" />
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-white/35">GitHub Pages</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Tren Titan
        </h1>
        <p className="text-pretty text-sm text-white/70 sm:text-base">
          Полнофункциональное приложение (дашборд, API, Prisma, оплата) требует Node-хостинг.
          На Pages опубликована только статическая витрина: вход и регистрация без живого сервера
          ограничены.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
          href="/login/"
        >
          Войти
        </Link>
        <Link
          className="rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          href="/register/"
        >
          Регистрация
        </Link>
        <Link
          className="rounded-xl px-5 py-2.5 text-sm text-white/60 underline underline-offset-4 hover:text-white/90"
          href="/privacy/"
        >
          Конфиденциальность
        </Link>
      </div>
    </main>
  );
}

export default function HomePage() {
  if (
    process.env.NEXT_PUBLIC_GITHUB_PAGES === "1" ||
    process.env.NEXT_STATIC_EXPORT === "1"
  ) {
    return <StaticLanding />;
  }
  redirect("/dashboard");
}
