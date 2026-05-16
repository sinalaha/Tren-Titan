import { TRPCError } from "@trpc/server";

import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";
import { PLANS, stripe } from "@/services/stripe";

import { createTRPCRouter, protectedProcedure } from "../router";

export const subscriptionRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const row = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id }
    });
    return mergeSubscriptionWithDevPremium(row, ctx.session.user.id);
  }),

  createCheckoutSession: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: { subscription: true }
    });
    if (!user?.email) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Missing user email" });
    }

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
      await ctx.prisma.subscription.upsert({
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

    if (!checkout.url) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe checkout url missing"
      });
    }

    return { url: checkout.url };
  })
});
