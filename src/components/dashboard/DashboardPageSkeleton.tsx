export function DashboardPageSkeleton() {
  return (
    <>
      <div className="h-48 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04]"
          />
        ))}
      </div>
    </>
  );
}
