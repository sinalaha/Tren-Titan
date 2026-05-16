import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { logError } from "@/lib/observability";
import { analyzeFoodItemsText } from "@/server/ai/foodAnalysis";
import { estimateFoodItemsTextHeuristic, hasOpenAiApiKey } from "@/server/ai/foodTextHeuristic";
import { prisma } from "@/server/db/client";
import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";
import { assertAiFoodAnalyzeRateLimit } from "@/services/aiRateLimit";

const requestSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        grams: z.number().min(1).max(5000)
      })
    )
    .min(1)
    .max(20)
});

function mapRows(
  items: Array<{ name: string; grams: number }>,
  macros: Array<{ calories: number; protein: number; fats: number; carbs: number; fiber?: number }>
) {
  return items.map((inp, i) => {
    const m = macros[i]!;
    return {
      name: inp.name,
      grams: inp.grams,
      calories: Math.round(m.calories),
      protein: Math.round(m.protein * 10) / 10,
      fats: Math.round(m.fats * 10) / 10,
      carbs: Math.round(m.carbs * 10) / 10,
      fiber: m.fiber != null ? Math.round(m.fiber * 10) / 10 : undefined
    };
  });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const json = (await request.json()) as unknown;
    const body = requestSchema.safeParse(json);
    if (!body.success) {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    const items = body.data.items.map((row) => ({
      name: row.name.trim(),
      grams: row.grams
    }));

    if (!hasOpenAiApiKey()) {
      const macros = estimateFoodItemsTextHeuristic(items);
      return NextResponse.json({ rows: mapRows(items, macros), heuristic: true });
    }

    const limit = await assertAiFoodAnalyzeRateLimit(session.user.id);
    if (!limit.ok) {
      return NextResponse.json(
        { message: "Too many requests. Try again shortly.", retryAfterSec: limit.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const rawSub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
    const subscription = mergeSubscriptionWithDevPremium(rawSub, session.user.id);
    if (subscription && subscription.aiScansUsed >= subscription.aiScansLimit) {
      return NextResponse.json({ message: "AI scan limit reached" }, { status: 403 });
    }

    const macros = await analyzeFoodItemsText(items);

    if (rawSub) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { aiScansUsed: { increment: 1 } }
      });
    }

    return NextResponse.json({ rows: mapRows(items, macros), heuristic: false });
  } catch (error) {
    logError("ai.food.text", error);
    return NextResponse.json({ message: "Could not estimate foods" }, { status: 500 });
  }
}
