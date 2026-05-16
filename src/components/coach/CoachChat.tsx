"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { canAccessAiCoach } from "@/lib/coachAccess";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function CoachChat() {
  const { t } = useLocaleContext();
  const { data: session } = useSession();
  const { data: sub } = trpc.subscription.getCurrent.useQuery();
  const utils = trpc.useUtils();
  const { data: past } = trpc.coach.listRecent.useQuery();

  const allowed = useMemo(
    () => canAccessAiCoach(session?.user?.role, sub ?? undefined),
    [session?.user?.role, sub]
  );

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming || !allowed) return;

    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: ac.signal
      });

      if (res.status === 401) {
        setMessages((m) => m.slice(0, -2));
        setError(t("coach.errSession"));
        return;
      }

      if (res.status === 403) {
        setMessages((m) => m.slice(0, -2));
        setError(t("coach.errPremium"));
        return;
      }

      if (res.status === 429) {
        const payload = (await res.json().catch(() => ({}))) as { retryAfterSec?: number };
        const sec = payload.retryAfterSec ?? 60;
        setMessages((m) => m.slice(0, -2));
        setError(`${t("coach.errRateBefore")}${sec}${t("coach.errRateAfter")}`);
        return;
      }

      if (res.status === 503) {
        setMessages((m) => m.slice(0, -2));
        setError(t("coach.err503"));
        return;
      }

      if (!res.ok || !res.body) {
        setMessages((m) => m.slice(0, -2));
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        setError(payload.message ?? t("coach.errGeneric"));
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => {
          if (m.length === 0) return m;
          const copy = [...m];
          const lastIdx = copy.length - 1;
          const last = copy[lastIdx];
          if (last?.role === "assistant") {
            copy[lastIdx] = { ...last, content: acc };
          }
          return copy;
        });
      }

      void utils.coach.listRecent.invalidate();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      setMessages((m) => m.slice(0, -2));
      setError(t("coach.errNetwork"));
    } finally {
      setStreaming(false);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }, [allowed, input, streaming, utils, t]);

  return (
    <div className="space-y-4">
      {!allowed ? (
        <GlassCard className="border-amber-400/25 bg-amber-500/5 p-5" glow="purple" hover={false}>
          <p className="text-sm text-amber-100/90">
            {t("coach.lockedIntro")}{" "}
            <span className="font-medium text-cyan-200">{t("coach.lockedPremium")}</span>{" "}
            {t("coach.lockedOutro")}
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-flex rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
          >
            {t("coach.viewPlans")}
          </Link>
        </GlassCard>
      ) : null}

      {past && past.length > 0 ? (
        <details className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
          <summary className="cursor-pointer select-none text-xs uppercase tracking-[0.2em] text-white/45">
            {t("coach.recentBriefs")}
          </summary>
          <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-white/55">
            {past.slice(0, 8).map((row) => (
              <li key={row.id} className="border-b border-white/5 pb-2 last:border-0">
                <span className="text-[10px] text-white/35">
                  {new Date(row.generatedAt).toLocaleString()}
                </span>
                <p className="line-clamp-2 text-white/75">{row.content}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <GlassCard className="flex max-h-[min(520px,70vh)] flex-col p-0" glow="cyan" hover={false}>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-white/50">{t("coach.emptyState")}</p>
          ) : null}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-8 border border-cyan-500/25 bg-cyan-500/10 text-white/90"
                  : "mr-4 border border-white/10 bg-white/[0.04] text-white/80 whitespace-pre-wrap"
              )}
            >
              {msg.content ||
                (msg.role === "assistant" && streaming ? t("coach.thinkingEllipsis") : null)}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <p className="border-t border-white/10 px-4 py-2 text-xs text-rose-300">{error}</p>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-white/10 p-3 sm:flex-row sm:items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={!allowed || streaming}
            placeholder={allowed ? t("coach.placeholderOpen") : t("coach.placeholderLocked")}
            rows={3}
            className="min-h-[88px] flex-1 resize-y rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-cyan-400/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!allowed || streaming || !input.trim()}
            className="shrink-0 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-5 py-3 text-sm font-medium text-cyan-100 disabled:opacity-40"
          >
            {streaming ? t("coach.thinking") : t("coach.send")}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
