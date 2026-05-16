import { GlassCard } from "@/components/shared/GlassCard";

export default function NutritionScanLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <GlassCard className="p-6" glow="none" hover={false}>
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-9 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
      </GlassCard>
      <GlassCard className="p-6" glow="none" hover={false}>
        <div className="h-52 animate-pulse rounded-xl bg-white/5" />
      </GlassCard>
    </div>
  );
}
