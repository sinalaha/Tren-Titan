import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardMissionClient } from "@/components/dashboard/DashboardMissionClient";
import { DashboardStarfieldLazy } from "@/components/dashboard/DashboardStarfieldLazy";
import {
  DashboardCaloriesConsole,
  DashboardProteinConsole,
  DashboardWorkloadConsole
} from "@/components/dashboard/DashboardTelemetryConsoles";
import { QuickWaterLog } from "@/components/dashboard/QuickWaterLog";
import { createServerApi } from "@/lib/trpc/server";

/** Auth + Prisma on each request; avoid serving a cached shell without session/overview. */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const api = await createServerApi();
  let overview;
  try {
    overview = await api.dashboard.getOverview();
  } catch (error) {
    if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
      redirect("/login");
    }
    throw error;
  }

  return (
    <>
      <DashboardStarfieldLazy />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <DashboardHero />
        <DashboardMissionClient initial={overview} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <DashboardWorkloadConsole />
          <DashboardCaloriesConsole />
          <DashboardProteinConsole />
          <QuickWaterLog />
        </div>
      </div>
    </>
  );
}
