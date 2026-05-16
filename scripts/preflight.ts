import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Matches Next.js-style `.env` enough for local `npm run preflight`. Does not override existing `process.env`. */
function applyDotEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

applyDotEnvFile();

type Check = { key: string; required: boolean; note?: string };

const checks: Check[] = [
  { key: "DATABASE_URL", required: true },
  { key: "NEXTAUTH_URL", required: true },
  { key: "NEXT_PUBLIC_APP_URL", required: true },
  {
    key: "STRIPE_SECRET_KEY",
    required: false,
    note: "billing: omit only for local dev without payments"
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    required: false,
    note: "billing: omit only for local dev without payments"
  },
  {
    key: "STRIPE_PREMIUM_PRICE_ID",
    required: false,
    note: "billing: omit only for local dev without payments"
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    required: false,
    note: "billing: omit only for local dev without payments"
  },
  { key: "OPENAI_API_KEY", required: false, note: "required for food scan AI" },
  { key: "ANTHROPIC_API_KEY", required: false, note: "required for coach AI" },
  { key: "UPSTASH_REDIS_REST_URL", required: false, note: "optional distributed rate-limit" },
  { key: "UPSTASH_REDIS_REST_TOKEN", required: false, note: "optional distributed rate-limit" }
];

let failed = false;

const hasAuthSecret =
  Boolean(process.env.AUTH_SECRET?.trim()) || Boolean(process.env.NEXTAUTH_SECRET?.trim());
if (!hasAuthSecret) {
  failed = true;
  process.stderr.write(
    "[missing] AUTH_SECRET or NEXTAUTH_SECRET (need one for Auth.js cookies/JWT)\n"
  );
}

for (const check of checks) {
  const value = process.env[check.key];
  if (check.required && !value) {
    failed = true;
    process.stderr.write(`[missing] ${check.key}\n`);
  } else if (!value && check.note) {
    process.stdout.write(`[optional-missing] ${check.key} (${check.note})\n`);
  }
}

if (failed) {
  process.stderr.write("Preflight failed: required environment variables are missing.\n");
  process.exit(1);
}

process.stdout.write("Preflight OK.\n");
