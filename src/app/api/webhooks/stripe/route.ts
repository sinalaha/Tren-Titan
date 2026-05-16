import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { logError } from "@/lib/observability";
import { prisma } from "@/server/db/client";
import { stripe } from "@/services/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logError("stripe.webhook.signature", error);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = String(session.customer ?? "");
        const subscriptionId = String(session.subscription ?? "");
        if (customerId && subscriptionId) {
          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              stripeSubscriptionId: subscriptionId,
              plan: "premium",
              status: "ACTIVE",
              aiScansLimit: 999
            }
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status:
              sub.status === "active"
                ? "ACTIVE"
                : sub.status === "past_due"
                  ? "PAST_DUE"
                  : "CANCELLED",
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: new Date(sub.current_period_end * 1000)
          }
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            plan: "free",
            status: "CANCELLED",
            aiScansLimit: 10,
            cancelAtPeriodEnd: false
          }
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = String(invoice.customer ?? "");
        if (customerId) {
          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: { status: "PAST_DUE" }
          });
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logError("stripe.webhook.handler", error, { eventType: event.type, eventId: event.id });
    return NextResponse.json({ message: "Webhook handling failed" }, { status: 500 });
  }
}
