"use client";

import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { GlassCard } from "@/components/shared/GlassCard";
import type { FoodAnalysisResult } from "@/server/ai/foodAnalysis";

interface AIResultCardProps {
  result: FoodAnalysisResult;
}

export function AIResultCard({ result }: AIResultCardProps) {
  const { t } = useLocaleContext();
  return (
    <GlassCard glow="blue" className="p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{t("aiResult.title")}</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{result.foodName}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/80 sm:grid-cols-4">
        <div>
          <p className="text-white/40">{t("aiResult.calories")}</p>
          <p className="font-semibold">{Math.round(result.calories)}</p>
        </div>
        <div>
          <p className="text-white/40">{t("aiResult.protein")}</p>
          <p className="font-semibold">{Math.round(result.protein)} g</p>
        </div>
        <div>
          <p className="text-white/40">{t("aiResult.fats")}</p>
          <p className="font-semibold">{Math.round(result.fats)} g</p>
        </div>
        <div>
          <p className="text-white/40">{t("aiResult.carbs")}</p>
          <p className="font-semibold">{Math.round(result.carbs)} g</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-white/50">
        {t("aiResult.confidence")} {Math.round(result.confidenceScore * 100)}%
      </p>
    </GlassCard>
  );
}
