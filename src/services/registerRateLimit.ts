import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { REGISTER_MAX_ATTEMPTS_PER_IP_PER_WINDOW, REGISTER_RATE_WINDOW_MS } from "@/lib/constants";

export type RegisterRateOutcome = { ok: true } | { ok: false; retryAfterSec: number };

const memoryBuckets = new Map<string, number[]>();

function memoryAssertRegisterRate(clientKey: string): RegisterRateOutcome {
  const now = Date.now();
  const timestamps = memoryBuckets.get(clientKey) ?? [];
  const withinWindow = timestamps.filter((t) => now - t < REGISTER_RATE_WINDOW_MS);

  if (withinWindow.length >= REGISTER_MAX_ATTEMPTS_PER_IP_PER_WINDOW) {
    const oldest = withinWindow[0]!;
    const retryAfterMs = REGISTER_RATE_WINDOW_MS - (now - oldest);
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    memoryBuckets.set(clientKey, withinWindow);
    return { ok: false, retryAfterSec };
  }

  withinWindow.push(now);
  memoryBuckets.set(clientKey, withinWindow);
  return { ok: true };
}

let upstashRegister: Ratelimit | null | undefined;

function getUpstashRegisterRatelimit(): Ratelimit | null {
  if (upstashRegister !== undefined) {
    return upstashRegister;
  }
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstashRegister = null;
    return null;
  }

  const redis = Redis.fromEnv();
  const windowSec = Math.max(1, Math.floor(REGISTER_RATE_WINDOW_MS / 1000));
  upstashRegister = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(REGISTER_MAX_ATTEMPTS_PER_IP_PER_WINDOW, `${windowSec} s`),
    prefix: "tren-titan:register"
  });
  return upstashRegister;
}

export function getRegistrationClientKey(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return `ip:${realIp}`;
  return "ip:unknown";
}

export async function assertRegisterRateLimit(clientKey: string): Promise<RegisterRateOutcome> {
  const rl = getUpstashRegisterRatelimit();
  if (rl) {
    const outcome = await rl.limit(clientKey);
    if (outcome.success) {
      return { ok: true };
    }
    const retryAfterSec = Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  }

  return memoryAssertRegisterRate(clientKey);
}
