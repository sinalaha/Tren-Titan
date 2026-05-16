import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { AI_ANALYZE_MAX_REQUESTS_PER_WINDOW, AI_ANALYZE_RATE_WINDOW_MS } from "@/lib/constants";

export type AiFoodRateOutcome = { ok: true } | { ok: false; retryAfterSec: number };

const memoryBuckets = new Map<string, number[]>();

function memoryAssertAiFoodAnalyzeRateLimit(userId: string): AiFoodRateOutcome {
  const now = Date.now();
  const timestamps = memoryBuckets.get(userId) ?? [];
  const withinWindow = timestamps.filter((t) => now - t < AI_ANALYZE_RATE_WINDOW_MS);

  if (withinWindow.length >= AI_ANALYZE_MAX_REQUESTS_PER_WINDOW) {
    const oldest = withinWindow[0]!;
    const retryAfterMs = AI_ANALYZE_RATE_WINDOW_MS - (now - oldest);
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    memoryBuckets.set(userId, withinWindow);
    return { ok: false, retryAfterSec };
  }

  withinWindow.push(now);
  memoryBuckets.set(userId, withinWindow);
  return { ok: true };
}

let upstashRatelimit: Ratelimit | null | undefined;

function getUpstashFoodScanRatelimit(): Ratelimit | null {
  if (upstashRatelimit !== undefined) {
    return upstashRatelimit;
  }
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstashRatelimit = null;
    return null;
  }

  const redis = Redis.fromEnv();
  const windowSec = Math.max(1, Math.floor(AI_ANALYZE_RATE_WINDOW_MS / 1000));
  upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AI_ANALYZE_MAX_REQUESTS_PER_WINDOW, `${windowSec} s`),
    prefix: "tren-titan:ai-food-scan"
  });
  return upstashRatelimit;
}

export async function assertAiFoodAnalyzeRateLimit(userId: string): Promise<AiFoodRateOutcome> {
  const rl = getUpstashFoodScanRatelimit();
  if (rl) {
    const outcome = await rl.limit(userId);
    if (outcome.success) {
      return { ok: true };
    }
    const retryAfterSec = Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  }

  return memoryAssertAiFoodAnalyzeRateLimit(userId);
}
