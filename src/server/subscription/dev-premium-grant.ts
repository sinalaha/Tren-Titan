import type { Subscription } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";

function isTruthyEnv(value: string | undefined): boolean {
  if (value == null) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/** When NODE_ENV is development and DEV_GRANT_PREMIUM is set, app behaves as PRO without Stripe/DB changes. */
export function isDevPremiumGranted(): boolean {
  return process.env.NODE_ENV === "development" && isTruthyEnv(process.env.DEV_GRANT_PREMIUM);
}

export function patchDevPremiumGatingFields<
  T extends { plan: string; status: SubscriptionStatus; aiScansLimit: number }
>(row: T): T {
  return {
    ...row,
    plan: "premium",
    status: SubscriptionStatus.ACTIVE,
    aiScansLimit: 999
  };
}

/** Full row for tRPC / coach when user has no Subscription record but dev grant is on. */
export function syntheticDevPremiumSubscription(userId: string): Subscription {
  const now = new Date();
  return {
    id: `dev-premium-grant:${userId}`,
    userId,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    plan: "premium",
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    aiScansUsed: 0,
    aiScansLimit: 999,
    updatedAt: now
  };
}

export function mergeSubscriptionWithDevPremium(
  row: Subscription | null,
  userId: string
): Subscription | null {
  if (!isDevPremiumGranted()) return row;
  if (row == null) return syntheticDevPremiumSubscription(userId);
  return patchDevPremiumGatingFields(row);
}

/** TopBar subscription select shape from ProtectedShell. */
export type TopBarSubscriptionSelect = {
  plan: string;
  status: SubscriptionStatus;
  aiScansUsed: number;
  aiScansLimit: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export function applyDevPremiumToTopBarSubscription(
  row: TopBarSubscriptionSelect | null
): TopBarSubscriptionSelect | null {
  if (!isDevPremiumGranted()) return row;
  if (row == null) {
    return {
      plan: "premium",
      status: SubscriptionStatus.ACTIVE,
      aiScansUsed: 0,
      aiScansLimit: 999,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    };
  }
  return patchDevPremiumGatingFields(row);
}
