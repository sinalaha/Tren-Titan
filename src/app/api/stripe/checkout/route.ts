import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logError } from "@/lib/observability";
import { prisma } from "@/server/db/client";
import { PLANS, stripe } from "@/services/stripe";

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PREMIUM_PRICE_ID) {
      return NextResponse.json({ message: "Billing is not configured" }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const customerId =
      user.subscription?.stripeCustomerId ??
      (
        await stripe.customers.create({
          email: user.email,
          name: user.name ?? undefined,
          metadata: { userId: user.id }
        })
      ).id;

    if (!user.subscription?.stripeCustomerId) {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { stripeCustomerId: customerId },
        create: { userId: user.id, stripeCustomerId: customerId, plan: "free", status: "FREE" }
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PLANS.premium.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=cancelled`
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    logError("stripe.checkout", error);
    return NextResponse.json({ message: "Could not start checkout" }, { status: 500 });
  }
}
