"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import { tAchievement } from "@/lib/i18n/t-achievement";
import { trpc } from "@/lib/trpc/react";
import type { FoodAnalysisResult } from "@/server/ai/foodAnalysis";

import { AIResultCard } from "./AIResultCard";

export function FoodScanUploader() {
  const { t } = useLocaleContext();
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockToast, setUnlockToast] = useState<string[] | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const remainingRef = useRef(4500);
  const startedAtRef = useRef(0);
  const utils = trpc.useUtils();

  function clearDismissTimer() {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  const scheduleDismiss = useCallback(() => {
    clearDismissTimer();
    if (!unlockToast) return;
    startedAtRef.current = Date.now();
    timeoutRef.current = window.setTimeout(() => {
      setUnlockToast(null);
      remainingRef.current = 4500;
      timeoutRef.current = null;
    }, remainingRef.current);
  }, [unlockToast]);

  useEffect(() => {
    if (!unlockToast) {
      clearDismissTimer();
      remainingRef.current = 4500;
      return;
    }
    remainingRef.current = 4500;
    scheduleDismiss();
    return clearDismissTimer;
  }, [scheduleDismiss, unlockToast]);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setPreview(URL.createObjectURL(file));
      setLoading(true);
      setError(null);
      setUnlockToast(null);
      setResult(null);

      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/ai/analyze-food", { method: "POST", body: fd });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            message?: string;
            retryAfterSec?: number;
          };
          if (res.status === 429 && payload.retryAfterSec != null) {
            throw new Error(
              `${t("foodScan.rateLimitedBefore")}${payload.retryAfterSec}${t("foodScan.rateLimitedAfter")}`
            );
          }
          throw new Error(payload.message ?? t("foodScan.analysisFailed"));
        }
        const data = (await res.json()) as FoodAnalysisResult & {
          unlockedAchievements?: Array<{ type: string; title: string }>;
        };
        setResult(data);
        const unlocked =
          data.unlockedAchievements?.map((a) => tAchievement(a.type, a.title, t)) ?? [];
        setUnlockToast(unlocked.length > 0 ? unlocked : null);
        void utils.dashboard.getOverview.invalidate();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("foodScan.genericError"));
      } finally {
        setLoading(false);
      }
    },
    [utils, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    maxSize: 10_000_000
  });

  return (
    <div className="space-y-4">
      <GlassCard glow="cyan" className="relative p-1">
        <AnimatePresence>
          {unlockToast ? (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={() => {
                if (timeoutRef.current == null) return;
                const elapsed = Date.now() - startedAtRef.current;
                remainingRef.current = Math.max(0, remainingRef.current - elapsed);
                clearDismissTimer();
              }}
              onMouseLeave={() => {
                if (remainingRef.current <= 0) {
                  setUnlockToast(null);
                  remainingRef.current = 4500;
                  return;
                }
                scheduleDismiss();
              }}
              className="absolute right-3 top-3 z-10 max-w-[85%] rounded-xl border border-emerald-400/45 bg-black/80 px-3 py-2 pr-8 text-xs text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.25)] backdrop-blur"
            >
              {t("foodScan.achievementUnlocked")} {unlockToast.join(", ")}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUnlockToast(null);
                }}
                className="absolute right-1 top-1 h-5 w-5 rounded text-emerald-200/80 transition hover:bg-emerald-500/20 hover:text-emerald-100"
                aria-label={t("foodScan.closeAchievementAria")}
              >
                ×
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div
          {...getRootProps()}
          className={`relative min-h-[240px] cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-300 ${
            isDragActive
              ? "border-[#00ffe7]/60 bg-[#00ffe7]/5"
              : "border-white/10 hover:border-[#00ffe7]/30 hover:bg-white/[0.02]"
          } flex items-center justify-center`}
        >
          <input {...getInputProps()} />
          {preview ? (
            <Image
              src={preview}
              alt={t("foodScan.previewAlt")}
              width={320}
              height={176}
              unoptimized
              className="max-h-44 rounded-lg object-cover"
            />
          ) : (
            <p className="text-center text-sm text-white/60">
              {isDragActive ? t("foodScan.dropActive") : t("foodScan.dropHint")}
            </p>
          )}
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
              <p className="font-mono text-sm text-[#00ffe7]">{t("foodScan.analyzing")}</p>
            </div>
          ) : null}
        </div>
      </GlassCard>

      {error ? <p className="text-center text-sm text-[#ff2d55]">{error}</p> : null}

      <AnimatePresence>
        {result ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <AIResultCard result={result} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
