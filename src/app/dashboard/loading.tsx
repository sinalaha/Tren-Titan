import { DashboardPageSkeleton } from "@/components/dashboard/DashboardPageSkeleton";
import { StarField } from "@/components/three/StarField";

export default function DashboardLoading() {
  return (
    <>
      <StarField />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <DashboardPageSkeleton />
      </div>
    </>
  );
}
