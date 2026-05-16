import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logError } from "@/lib/observability";
import { analyzeFoodImage } from "@/server/ai/foodAnalysis";
import { prisma } from "@/server/db/client";
import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";
import { assertAiFoodAnalyzeRateLimit } from "@/services/aiRateLimit";
import { recordQualifyingActivity } from "@/services/gamification";

const MAX_FILE_SIZE = 10_000_000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ message: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "File too large (max 10MB)" }, { status: 400 });
    }

    const limit = await assertAiFoodAnalyzeRateLimit(session.user.id);
    if (!limit.ok) {
      return NextResponse.json(
        {
          message: "Too many scan requests. Try again shortly.",
          retryAfterSec: limit.retryAfterSec
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const rawSub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
    const subscription = mergeSubscriptionWithDevPremium(rawSub, session.user.id);
    if (subscription && subscription.aiScansUsed >= subscription.aiScansLimit) {
      return NextResponse.json({ message: "AI scan limit reached" }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const result = await analyzeFoodImage(base64, file.type);

    const createdLog = await prisma.nutritionLog.create({
      data: {
        userId: session.user.id,
        mealType: result.mealType,
        name: result.foodName,
        calories: result.calories,
        protein: result.protein,
        fats: result.fats,
        carbs: result.carbs,
        fiber: result.fiber,
        aiConfidence: result.confidenceScore,
        isManual: false
      }
    });

    let unlockedAchievements: { type: string; title: string }[] = [];
    try {
      unlockedAchievements = await recordQualifyingActivity(prisma, session.user.id, "nutrition");
    } catch (error) {
      logError("ai.food.gamification", error, { userId: session.user.id });
      /* streak/achievement write must not break scan */
    }

    if (rawSub) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { aiScansUsed: { increment: 1 } }
      });
    }

    return NextResponse.json({ ...result, logId: createdLog.id, unlockedAchievements });
  } catch (error) {
    logError("ai.food.scan", error);
    return NextResponse.json({ message: "Could not analyze image" }, { status: 500 });
  }
}
