import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { GlassCard } from "@/components/shared/GlassCard";
import { createAppCaller } from "@/server/trpc/caller";
import { createTRPCContext } from "@/server/trpc/context";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role ?? "USER";
  if (!["ADMIN", "SUPERADMIN"].includes(role)) {
    redirect("/dashboard");
  }

  const ctx = await createTRPCContext();
  const caller = createAppCaller(ctx);

  let overview;
  try {
    overview = await caller.admin.overview();
  } catch (error) {
    if (error instanceof TRPCError && error.code === "FORBIDDEN") {
      redirect("/dashboard");
    }
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <GlassCard className="p-6" glow="crimson">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">Admin Control</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Tren Titan Admin</h1>
        <p className="mt-3 text-white/70">
          Live overview is loaded through the tRPC procedure{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">admin.overview</code>. REST
          consumers can use{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">GET /api/admin/overview</code>{" "}
          with the same role checks.
        </p>
      </GlassCard>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <AdminStat label="Total users" value={overview.users} accent="cyan" />
        <AdminStat
          label="Active subscriptions"
          value={overview.activeSubscriptions}
          accent="green"
        />
        <AdminStat label="Past due" value={overview.subscriptionsPastDue} accent="rose" />
        <AdminStat label="Nutrition logs (24h)" value={overview.nutritionLogs24h} accent="purple" />
        <AdminStat label="AI recs (24h)" value={overview.aiRecommendations24h} accent="cyan" />
        <AdminStat
          label="Coach replies (24h)"
          value={overview.coachRecommendations24h}
          accent="green"
        />
      </section>
    </main>
  );
}

function AdminStat({
  label,
  value,
  accent
}: {
  label: string;
  value: number;
  accent: "cyan" | "green" | "rose" | "purple";
}) {
  const accentMap = {
    cyan: "border-cyan-400/35 text-cyan-200",
    green: "border-emerald-400/35 text-emerald-200",
    rose: "border-rose-400/35 text-rose-200",
    purple: "border-purple-400/35 text-purple-200"
  };

  return (
    <GlassCard className={`p-5 ${accentMap[accent]}`} glow="none" hover={false}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold text-white">{value}</p>
    </GlassCard>
  );
}
