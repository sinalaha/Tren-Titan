import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  type SerializedInvoice,
  type SettingsSubscriptionView,
  SettingsView
} from "@/components/settings/SettingsView";
import { prisma } from "@/server/db/client";
import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";
import { stripe } from "@/services/stripe";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const subRow = await prisma.subscription.findUnique({
    where: { userId: session.user.id }
  });
  const subscription = mergeSubscriptionWithDevPremium(subRow, session.user.id);

  const subscriptionView: SettingsSubscriptionView = subscription
    ? {
        plan: subscription.plan,
        status: subscription.status,
        aiScansUsed: subscription.aiScansUsed,
        aiScansLimit: subscription.aiScansLimit,
        stripeCustomerId: subscription.stripeCustomerId
      }
    : null;

  const invoices = subscription?.stripeCustomerId
    ? await stripe.invoices
        .list({
          customer: subscription.stripeCustomerId,
          limit: 8
        })
        .then((res) => res.data)
        .catch(() => [])
    : [];

  const serializedInvoices: SerializedInvoice[] = invoices.map((inv) => ({
    id: inv.id,
    amountPaid: inv.amount_paid,
    currency: inv.currency,
    created: inv.created,
    status: inv.status,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null
  }));

  const failedInvoice = invoices.find(
    (invoice) => invoice.status === "open" || invoice.status === "uncollectible"
  );
  const showBillingWarning = subscription?.status === "PAST_DUE" || Boolean(failedInvoice);

  return (
    <SettingsView
      subscription={subscriptionView}
      invoices={serializedInvoices}
      showBillingWarning={showBillingWarning}
      failedInvoiceUrl={failedInvoice?.hosted_invoice_url ?? null}
    />
  );
}
