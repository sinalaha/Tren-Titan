import { GlassCard } from "@/components/shared/GlassCard";

export default function SettingsLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <GlassCard className="p-6" glow="none" hover={false}>
        <div className="h-6 w-1/3 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
      </GlassCard>
      <GlassCard className="p-6" glow="none" hover={false}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="mt-4 h-10 w-40 animate-pulse rounded-lg bg-white/10" />
      </GlassCard>
      <GlassCard className="p-6" glow="none" hover={false}>
        <div className="h-48 animate-pulse rounded-xl bg-white/5" />
      </GlassCard>
    </main>
  );
}
