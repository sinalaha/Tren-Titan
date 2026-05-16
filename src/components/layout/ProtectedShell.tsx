import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TopBar } from "@/components/layout/TopBar";
import { prisma } from "@/server/db/client";
import { applyDevPremiumToTopBarSubscription } from "@/server/subscription/dev-premium-grant";

interface ProtectedShellProps {
  children: React.ReactNode;
}

export async function ProtectedShell({ children }: ProtectedShellProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const subscription = applyDevPremiumToTopBarSubscription(
    await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: {
        plan: true,
        status: true,
        aiScansUsed: true,
        aiScansLimit: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true
      }
    })
  );

  return (
    <div className="min-h-screen">
      <TopBar
        userName={session.user.name}
        userEmail={session.user.email}
        userRole={session.user.role}
        subscription={subscription}
      />
      {children}
    </div>
  );
}
