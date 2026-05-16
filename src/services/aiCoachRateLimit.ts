import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { AI_COACH_MAX_REQUESTS_PER_WINDOW, AI_COACH_RATE_WINDOW_MS } from "@/lib/constants";

export type AiCoachRateOutcome = { ok: true } | { ok: false; retryAfterSec: number };

const memoryBuckets = new Map<string, number[]>();

function memoryAssertAiCoachRateLimit(userId: string): AiCoachRateOutcome {
  const now = Date.now();
  const key = `coach:${userId}`;
  const timestamps = memoryBuckets.get(key) ?? [];
  const withinWindow = timestamps.filter((t) => now - t < AI_COACH_RATE_WINDOW_MS);

  if (withinWindow.length >= AI_COACH_MAX_REQUESTS_PER_WINDOW) {
    const oldest = withinWindow[0]!;
    const retryAfterMs = AI_COACH_RATE_WINDOW_MS - (now - oldest);
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    memoryBuckets.set(key, withinWindow);
    return { ok: false, retryAfterSec };
  }

  withinWindow.push(now);
  memoryBuckets.set(key, withinWindow);
  return { ok: true };
}

let upstashCoach: Ratelimit | null | undefined;

function getUpstashCoachRatelimit(): Ratelimit | null {
  if (upstashCoach !== undefined) {
    return upstashCoach;
  }
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstashCoach = null;
    return null;
  }

  const redis = Redis.fromEnv();
  const windowSec = Math.max(1, Math.floor(AI_COACH_RATE_WINDOW_MS / 1000));
  upstashCoach = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AI_COACH_MAX_REQUESTS_PER_WINDOW, `${windowSec} s`),
    prefix: "tren-titan:ai-coach"
  });
  return upstashCoach;
}

export async function assertAiCoachRateLimit(userId: string): Promise<AiCoachRateOutcome> {
  const rl = getUpstashCoachRatelimit();
  if (rl) {
    const outcome = await rl.limit(userId);
    if (outcome.success) {
      return { ok: true };
    }
    const retryAfterSec = Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  }

  return memoryAssertAiCoachRateLimit(userId);
}
