import { GlassCard } from "@/components/shared/GlassCard";

export default function CoachLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <GlassCard className="p-8" glow="none" hover={false}>
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-10 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-20 w-full animate-pulse rounded bg-white/5" />
      </GlassCard>
      <GlassCard className="p-0" glow="none" hover={false}>
        <div className="space-y-3 p-4">
          <div className="h-16 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
        </div>
        <div className="flex gap-2 border-t border-white/10 p-3">
          <div className="h-[88px] flex-1 animate-pulse rounded-xl bg-white/[0.05]" />
          <div className="h-12 w-24 shrink-0 animate-pulse rounded-xl bg-white/[0.06]" />
        </div>
      </GlassCard>
    </div>
  );
}
