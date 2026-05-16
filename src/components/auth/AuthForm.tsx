"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";

const AUTH_REMEMBER_KEY = "tren-titan-auth-remember-v1";

interface AuthFormProps {
  mode: "login" | "register";
}

type SavedAuth = { email?: string; name?: string; remember?: boolean };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boot, setBoot] = useState<SavedAuth | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_REMEMBER_KEY);
      setBoot(raw ? (JSON.parse(raw) as SavedAuth) : {});
    } catch {
      setBoot({});
    }
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");
    const rememberMe = formData.get("remember") === "on";

    try {
      if (mode === "register") {
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        if (!registerRes.ok) {
          let message = t("auth.registrationFailed");
          const ct = registerRes.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            try {
              const payload = (await registerRes.json()) as { message?: string };
              if (payload.message) message = payload.message;
            } catch {
              /* ответ не JSON */
            }
          }
          throw new Error(message);
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        remember: rememberMe ? "true" : "false",
        redirect: false
      });

      if (result?.error) {
        throw new Error(t("auth.invalidCredentials"));
      }

      if (rememberMe) {
        const payload: SavedAuth = { email, remember: true };
        if (mode === "register" && name.trim()) payload.name = name.trim();
        localStorage.setItem(AUTH_REMEMBER_KEY, JSON.stringify(payload));
      } else {
        localStorage.removeItem(AUTH_REMEMBER_KEY);
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (boot === null) {
    return (
      <GlassCard className="p-6" glow="cyan" hover={false}>
        <div className="h-44 animate-pulse rounded-xl bg-white/5" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="space-y-4 p-6" glow="cyan">
      <h1 className="text-2xl font-semibold text-white">
        {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
      </h1>
      <form
        action={async (fd) => {
          await handleSubmit(fd);
        }}
        className="space-y-3"
      >
        {mode === "register" ? (
          <input
            type="text"
            name="name"
            placeholder={t("auth.placeholderName")}
            required
            defaultValue={boot.name ?? ""}
            autoComplete="name"
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
          />
        ) : null}
        <input
          type="email"
          name="email"
          placeholder={t("auth.placeholderEmail")}
          required
          defaultValue={boot.email ?? ""}
          autoComplete={mode === "login" ? "username" : "email"}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <input
          type="password"
          name="password"
          placeholder={t("auth.placeholderPassword")}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-white/75">
          <input
            type="checkbox"
            name="remember"
            defaultChecked={boot.remember === true}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/35 bg-black/40 text-cyan-500 focus:ring-cyan-400/40"
          />
          <span>
            <span className="font-medium text-white/90">{t("auth.rememberMe")}</span>
            <span className="mt-0.5 block text-xs text-white/50">{t("auth.rememberMeHint")}</span>
          </span>
        </label>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {loading
            ? t("auth.pleaseWait")
            : mode === "login"
              ? t("auth.signIn")
              : t("auth.createAccountBtn")}
        </button>
      </form>
    </GlassCard>
  );
}
