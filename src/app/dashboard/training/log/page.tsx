import { auth } from "@/auth";
import { QuickWorkoutLog } from "@/components/training/QuickWorkoutLog";
import { RecentWorkoutsList } from "@/components/training/RecentWorkoutsList";
import { TrainingLogHero } from "@/components/training/TrainingLogHero";
import { WorkingWeightProgressionPanel } from "@/components/training/WorkingWeightProgressionPanel";
import { prisma } from "@/server/db/client";
import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";

export default async function TrainingLogPage() {
  const session = await auth();
  const subRow = session?.user?.id
    ? await prisma.subscription.findUnique({
        where: { userId: session.user.id }
      })
    : null;
  const subscription = session?.user?.id
    ? mergeSubscriptionWithDevPremium(subRow, session.user.id)
    : null;
  const isPro = subscription?.plan === "premium";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <TrainingLogHero />
      <QuickWorkoutLog />
      <RecentWorkoutsList />
      <WorkingWeightProgressionPanel isPro={isPro} />
    </div>
  );
}
