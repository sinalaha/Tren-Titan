import { auth } from "@/auth";
import { canAccessAiCoach } from "@/lib/coachAccess";
import { logError } from "@/lib/observability";
import { coachChatBodySchema } from "@/lib/validations/coach.schema";
import { buildCoachContextSnapshot } from "@/server/ai/coachContext";
import { createCoachMessageStream } from "@/server/ai/coachEngine";
import { prisma } from "@/server/db/client";
import { mergeSubscriptionWithDevPremium } from "@/server/subscription/dev-premium-grant";
import { assertAiCoachRateLimit } from "@/services/aiCoachRateLimit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const parsed = coachChatBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ message: "Invalid body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const [user, subRow] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
    prisma.subscription.findUnique({ where: { userId: session.user.id } })
  ]);
  const subscription = mergeSubscriptionWithDevPremium(subRow, session.user.id);

  if (!canAccessAiCoach(user?.role ?? "USER", subscription)) {
    return new Response(JSON.stringify({ message: "Premium required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const limit = await assertAiCoachRateLimit(session.user.id);
  if (!limit.ok) {
    return new Response(
      JSON.stringify({ message: "Too many requests", retryAfterSec: limit.retryAfterSec }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(limit.retryAfterSec)
        }
      }
    );
  }

  const messageTrimmed = parsed.data.message.trim();
  let snapshot;
  try {
    snapshot = await buildCoachContextSnapshot(prisma, session.user.id);
  } catch (error) {
    logError("ai.coach.context", error, { userId: session.user.id });
    return new Response(JSON.stringify({ message: "Could not load context" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let stream;
  try {
    stream = createCoachMessageStream(snapshot, messageTrimmed);
  } catch (e) {
    logError("ai.coach.start", e, { userId: session.user.id });
    if (e instanceof Error && e.message.includes("ANTHROPIC_API_KEY")) {
      return new Response(JSON.stringify({ message: "Coach unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ message: "Could not start coach" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const encoder = new TextEncoder();
  let full = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const t = event.delta.text;
            full += t;
            controller.enqueue(encoder.encode(t));
          }
        }
        controller.close();
      } catch (error) {
        logError("ai.coach.stream", error, { userId: session.user.id });
        controller.error(new Error("Stream failed"));
        return;
      }

      if (full.trim()) {
        try {
          await prisma.aIRecommendation.create({
            data: {
              userId: session.user.id,
              type: "COACH",
              content: full,
              metadata: { promptPreview: messageTrimmed.slice(0, 500) }
            }
          });
        } catch {
          /* history write is best-effort */
        }
      }
    }
  });

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
