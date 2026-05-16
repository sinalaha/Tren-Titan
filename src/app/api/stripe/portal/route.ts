import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logError } from "@/lib/observability";
import { prisma } from "@/server/db/client";
import { stripe } from "@/services/stripe";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    });
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ message: "Stripe customer is not initialized." }, { status: 400 });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url:
        process.env.STRIPE_PORTAL_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/settings`
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    logError("stripe.portal", error);
    return NextResponse.json(
      { message: "Could not create billing portal session." },
      { status: 500 }
    );
  }
}
