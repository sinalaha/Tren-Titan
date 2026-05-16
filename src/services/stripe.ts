import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20"
});

export const PLANS = {
  free: {
    name: "Free",
    aiScansLimit: 10
  },
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
    aiScansLimit: 999
  }
} as const;
