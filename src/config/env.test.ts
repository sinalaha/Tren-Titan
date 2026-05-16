import { describe, expect, it } from "vitest";

import { serverEnvSchema } from "./env";

describe("serverEnvSchema", () => {
  it("accepts a minimal valid server env", () => {
    const r = serverEnvSchema.safeParse({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ci",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "tren-titan-ci-build-secret-min-32-chars-ok"
    });
    expect(r.success).toBe(true);
  });

  it("rejects when both auth secrets are missing", () => {
    const r = serverEnvSchema.safeParse({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ci",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000"
    });
    expect(r.success).toBe(false);
  });
});
