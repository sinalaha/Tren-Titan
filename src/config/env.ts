import { z } from "zod";

/** Normalize empty / quoted secrets from `.env` paste. */
function trimOrUndef(val: unknown): string | undefined {
  if (val == null) return undefined;
  let s = String(val).trim();
  if (!s) return undefined;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

/**
 * Validates `process.env` for server runtime. Call from server-only code paths
 * (API routes, Server Actions, tRPC) — not from Edge middleware.
 */
export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.preprocess(trimOrUndef, z.string().min(1)),
    NEXTAUTH_URL: z.preprocess(trimOrUndef, z.string().url()),
    NEXT_PUBLIC_APP_URL: z.preprocess(trimOrUndef, z.string().url()),
    AUTH_SECRET: z.preprocess(trimOrUndef, z.string().min(1).optional()),
    NEXTAUTH_SECRET: z.preprocess(trimOrUndef, z.string().min(1).optional()),
    GOOGLE_CLIENT_ID: z.preprocess(trimOrUndef, z.string().optional()),
    GOOGLE_CLIENT_SECRET: z.preprocess(trimOrUndef, z.string().optional()),
    OPENAI_API_KEY: z.preprocess(trimOrUndef, z.string().optional()),
    ANTHROPIC_API_KEY: z.preprocess(trimOrUndef, z.string().optional()),
    STRIPE_SECRET_KEY: z.preprocess(trimOrUndef, z.string().optional()),
    STRIPE_WEBHOOK_SECRET: z.preprocess(trimOrUndef, z.string().optional()),
    STRIPE_PREMIUM_PRICE_ID: z.preprocess(trimOrUndef, z.string().optional()),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.preprocess(trimOrUndef, z.string().optional()),
    UPSTASH_REDIS_REST_URL: z.preprocess(trimOrUndef, z.string().url().optional()),
    UPSTASH_REDIS_REST_TOKEN: z.preprocess(trimOrUndef, z.string().optional())
  })
  .superRefine((data, ctx) => {
    if (!data.AUTH_SECRET && !data.NEXTAUTH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set AUTH_SECRET or NEXTAUTH_SECRET",
        path: ["AUTH_SECRET"]
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cache: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cache) return cache;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    throw new Error(
      `Invalid environment: ${JSON.stringify({ fieldErrors: flat.fieldErrors, formErrors: flat.formErrors })}`
    );
  }
  cache = parsed.data;
  return cache;
}
