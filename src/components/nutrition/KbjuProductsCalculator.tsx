"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";

const INPUT =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50";
const DEBOUNCE_MS = 750;
const MAX_ROWS = 15;

function parseGrams(raw: string): number {
  const n = Number(String(raw).replace(",", ".").trim());
  if (!Number.isFinite(n)) return NaN;
  return n;
}

function makeRowId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type MacroRow = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  fiber?: number;
};

type EditorRow = { id: string; name: string; grams: string };

export function KbjuProductsCalculator() {
  const { t } = useLocaleContext();
  const [rows, setRows] = useState<EditorRow[]>(() => [
    { id: makeRowId(), name: "", grams: "100" }
  ]);
  const [results, setResults] = useState<MacroRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineEstimate, setOfflineEstimate] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildPayload = useCallback(() => {
    const items: Array<{ name: string; grams: number }> = [];
    for (const r of rows) {
      const name = r.name.trim();
      const g = parseGrams(r.grams);
      if (name.length < 2) continue;
      if (!Number.isFinite(g) || g < 1 || g > 5000) continue;
      items.push({ name, grams: Math.round(g * 10) / 10 });
    }
    return items;
  }, [rows]);

  const runFetch = useCallback(async () => {
    const items = buildPayload();
    if (items.length === 0) {
      setResults(null);
      setError(null);
      setOfflineEstimate(false);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/analyze-food-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        signal: ac.signal
      });

      const ct = res.headers.get("content-type") ?? "";
      const payload = ct.includes("application/json")
        ? ((await res.json()) as {
            message?: string;
            retryAfterSec?: number;
            rows?: MacroRow[];
            heuristic?: boolean;
          })
        : {};

      if (!res.ok) {
        if (res.status === 429 && payload.retryAfterSec != null) {
          throw new Error(
            `${t("foodScan.rateLimitedBefore")}${payload.retryAfterSec}${t("foodScan.rateLimitedAfter")}`
          );
        }
        throw new Error(payload.message ?? t("nutrition.kbjuProductsFailed"));
      }
      if (!payload.rows?.length) {
        throw new Error(t("nutrition.kbjuProductsFailed"));
      }
      setResults(payload.rows);
      setOfflineEstimate(Boolean(payload.heuristic));
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setResults(null);
      setOfflineEstimate(false);
      setError(e instanceof Error ? e.message : t("nutrition.kbjuProductsFailed"));
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [buildPayload, t]);

  useEffect(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void runFetch();
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    };
  }, [rows, runFetch]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const totals =
    results?.reduce(
      (acc, r) => ({
        calories: acc.calories + r.calories,
        protein: acc.protein + r.protein,
        fats: acc.fats + r.fats,
        carbs: acc.carbs + r.carbs,
        fiber: acc.fiber + (r.fiber ?? 0)
      }),
      { calories: 0, protein: 0, fats: 0, carbs: 0, fiber: 0 }
    ) ?? null;

  function addRow() {
    setRows((prev) =>
      prev.length >= MAX_ROWS ? prev : [...prev, { id: makeRowId(), name: "", grams: "100" }]
    );
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  return (
    <GlassCard className="p-6" glow="purple" hover={false}>
      <p className="text-xs uppercase tracking-[0.2em] text-purple-200/85">
        {t("nutrition.kbjuProductsEyebrow")}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">{t("nutrition.kbjuProductsTitle")}</h2>
      <p className="mt-2 text-sm text-white/65">{t("nutrition.kbjuProductsSubtitle")}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/45">
        {t("nutrition.kbjuProductsAutoHint")}
      </p>

      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1">
              <label
                className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-white/40"
                htmlFor={`kbju-p-${row.id}`}
              >
                {t("nutrition.kbjuProductsProduct")} {index + 1}
              </label>
              <input
                id={`kbju-p-${row.id}`}
                className={INPUT}
                value={row.name}
                placeholder={t("nutrition.kbjuProductsPlaceholder")}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, name: v } : r)));
                }}
                autoComplete="off"
              />
            </div>
            <div className="w-full sm:w-28">
              <label
                className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-white/40"
                htmlFor={`kbju-g-${row.id}`}
              >
                {t("nutrition.kbjuProductsGrams")}
              </label>
              <input
                id={`kbju-g-${row.id}`}
                className={INPUT}
                inputMode="decimal"
                value={row.grams}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, grams: v } : r)));
                }}
                min={1}
                max={5000}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className={cn(
                "shrink-0 rounded-xl border border-white/15 px-3 py-2.5 text-xs text-white/70 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200",
                rows.length <= 1 && "pointer-events-none opacity-35"
              )}
              aria-label={t("nutrition.kbjuProductsRemove")}
            >
              {t("nutrition.kbjuProductsRemove")}
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={rows.length >= MAX_ROWS}
        className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.04] py-2.5 text-sm font-medium text-white/85 transition hover:border-purple-400/35 hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("nutrition.kbjuProductsAdd")}
      </button>

      {offlineEstimate ? (
        <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/95">
          {t("nutrition.kbjuProductsHeuristicHint")}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-center text-sm text-cyan-200/85">
          {t("nutrition.kbjuProductsCalculating")}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200/95">
          {error}
        </p>
      ) : null}

      {results && results.length > 0 && totals ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
              {t("nutrition.kbjuProductsPerItem")}
            </p>
            <ul className="mt-3 space-y-2">
              {results.map((r, ri) => (
                <li
                  key={`${r.name}-${r.grams}-${ri}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="text-white/90">
                    {r.name}{" "}
                    <span className="text-white/45">
                      ({r.grams} {t("nutrition.kbjuProductsGramsShort")})
                    </span>
                  </span>
                  <span className="text-right font-mono text-xs text-cyan-200/90 sm:max-w-[min(100%,420px)]">
                    {r.calories} kcal · {t("nutrition.kbjuProductsMacroP")} {r.protein} ·{" "}
                    {t("nutrition.kbjuProductsMacroF")} {r.fats} ·{" "}
                    {t("nutrition.kbjuProductsMacroC")} {r.carbs}
                    {r.fiber != null ? ` · ${t("nutrition.kbjuProductsFiber")} ${r.fiber}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-purple-400/25 bg-purple-500/[0.08] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">
              {t("nutrition.kbjuProductsTotal")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] text-white/45">{t("aiResult.calories")}</p>
                <p className="mt-0.5 text-lg font-semibold text-white">
                  {Math.round(totals.calories)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/45">{t("aiResult.protein")}</p>
                <p className="mt-0.5 text-lg font-semibold text-white">
                  {Math.round(totals.protein * 10) / 10} g
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/45">{t("aiResult.fats")}</p>
                <p className="mt-0.5 text-lg font-semibold text-white">
                  {Math.round(totals.fats * 10) / 10} g
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/45">{t("aiResult.carbs")}</p>
                <p className="mt-0.5 text-lg font-semibold text-white">
                  {Math.round(totals.carbs * 10) / 10} g
                </p>
              </div>
            </div>
            {totals.fiber > 0 ? (
              <p className="mt-2 text-xs text-white/55">
                {t("nutrition.kbjuProductsFiber")}: {Math.round(totals.fiber * 10) / 10} g
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-[10px] leading-relaxed text-white/35">
        {t("nutrition.kbjuProductsDisclaimer")}
      </p>
    </GlassCard>
  );
}
