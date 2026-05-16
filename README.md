# Tren Titan — production setup

AI fitness SaaS (Next.js 15, Prisma, PostgreSQL, Auth.js, Stripe, OpenAI/Anthropic).

## Repository layout (`src/`)

| Path             | Purpose                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `src/app`        | App Router pages, API routes, layouts                              |
| `src/components` | Shared UI                                                          |
| `src/features`   | Feature-scoped modules (expand here before growing `components/`)  |
| `src/lib`        | Pure utilities, i18n, validation schemas, tRPC client              |
| `src/hooks`      | Reusable React hooks                                               |
| `src/stores`     | Client state (e.g. future Zustand stores)                          |
| `src/server`     | tRPC routers, Prisma access, AI engines, repositories              |
| `src/services`   | Billing, rate limits, domain services                              |
| `src/styles`     | Global CSS tokens (Tailwind lives with components + `globals.css`) |
| `src/types`      | Ambient / shared TypeScript definitions                            |
| `src/config`     | Env schema (`env.ts`), site helpers                                |
| `prisma/`        | Schema & migrations (stays at repo root)                           |

Path alias: `@/*` → `src/*`.

## Prerequisites

- Node **22+** (see `engines` in `package.json` and `.nvmrc`)
- PostgreSQL 16+ (or managed Neon/Supabase/RDS)

## Verification without local `npm install`

CI installs dependencies on GitHub-hosted runners — you do **not** need `npm install` on your machine to validate the repo.

1. Push your branch to GitHub (or open a pull request).
2. Open **Actions** → workflow **ci** → **Run workflow** to trigger a run manually on the chosen branch.
3. Wait for **validate** (lint, format, typecheck, unit tests, build) and optional **e2e**.

The same checks are available locally via `npm run ci:check` after you install dependencies once.

## Installation

```bash
npm install
```

On Windows, if `postinstall` (`prisma generate`) fails with `EPERM`, close processes locking `node_modules\.prisma` and re-run `npx prisma generate`.

## Environment

Copy [.env.example](.env.example) to `.env` and fill values.

**Required for any environment**

| Variable                           | Notes                                                   |
| ---------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`                     | PostgreSQL connection string                            |
| `NEXTAUTH_URL`                     | Public site origin (e.g. `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_APP_URL`              | Same as public URL — used in absolute links             |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | At least one; used for JWT/session signing              |

**OAuth (Google)**

| Variable               | Notes                                   |
| ---------------------- | --------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Optional if you only use email/password |
| `GOOGLE_CLIENT_SECRET` | Pair with client ID                     |

**Payments**

| Variable                             | Notes                                   |
| ------------------------------------ | --------------------------------------- |
| `STRIPE_SECRET_KEY`                  | Omit only for local dev without billing |
| `STRIPE_WEBHOOK_SECRET`              | From Stripe CLI or dashboard            |
| `STRIPE_PREMIUM_PRICE_ID`            | Price for premium plan                  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js                   |
| `STRIPE_PORTAL_RETURN_URL`           | Usually `https://.../settings`          |

**AI**

| Variable            | Notes                                      |
| ------------------- | ------------------------------------------ |
| `OPENAI_API_KEY`    | Food photo scan + optional product text AI |
| `ANTHROPIC_API_KEY` | AI coach                                   |

**Optional**

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — distributed rate limits (otherwise in-memory per instance)

Typed validation for server-only variables: import `getServerEnv` from `@/config/env` inside API routes / server modules when you want a strict guard (throws if invalid).

## Database

CLI config lives in **`prisma.config.ts`** (seed command and migrations path). The file loads **`.env`** via `dotenv` so `prisma validate` / `migrate` still see `DATABASE_URL` when Prisma skips its built-in env loading.

```bash
npx prisma migrate dev     # local
npx prisma migrate deploy  # production / CI
npm run db:seed            # optional demo users
```

## Local development

```bash
npm run dev
```

Quality gates (mirrors CI):

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

## Auth.js notes

- **Google OAuth** and **credentials** are configured in [src/auth.ts](src/auth.ts).
- Sessions use the **JWT strategy** (`session.strategy: "jwt"`). OAuth **refresh tokens** are still stored on `Account` rows via the Prisma adapter for provider operations; the browser session is a signed JWT with adjustable `maxAge` / `remember me` handling in callbacks.
- Middleware in [src/middleware.ts](src/middleware.ts) protects dashboard and settings routes; `/api/admin/*` checks JWT role (`ADMIN` / `SUPERADMIN`).

## Security (summarized)

- CSP + security headers in [next.config.ts](next.config.ts).
- Zod validation on API bodies (see `src/lib/validations/*` and individual routes).
- Rate limits for registration and AI routes (`src/services/*RateLimit.ts`), backed by Upstash when configured.
- Cookie security: production uses secure cookies via Auth.js / NextAuth defaults; keep `NEXTAUTH_URL` on HTTPS in production.

## GitHub Pages

This app is full-stack (API routes, Auth.js, Prisma). **GitHub Pages only hosts the static export**: a small public shell (/, /login, /register, legal). The workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm run build:pages` (see `scripts/github-pages-prepare.mjs`), then publishes the `out/` directory via [GitHub Actions](https://docs.github.com/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

Enable **Settings → Pages → Build and deployment → Source: GitHub Actions** on the repository.

## Vercel deployment

1. Create a Vercel project from this GitHub repo.
2. Set all production env vars (match `.env.example`).
3. Attach a managed Postgres and set `DATABASE_URL`.
4. **After each release**, run migrations against production (recommended options):
   - `npx prisma migrate deploy` from a protected GitHub Action, or
   - Vercel deploy hook + migration job, or
   - Manual run from an operator machine with prod `DATABASE_URL`.

The repo includes [vercel.json](vercel.json) with `prisma generate && next build` as the build command. **Schema migrations are not run automatically** on Vercel build to avoid accidental cross-environment applies; run `migrate deploy` in your pipeline.

5. Configure Stripe webhooks to point at `https://<domain>/api/webhooks/stripe`.

## GitHub Actions

[.github/workflows/ci.yml](.github/workflows/ci.yml): install → Prisma validate → **lint** → **format check** → **typecheck** → **unit tests** → **production build**; optional Playwright e2e with Postgres service.

## Operations

- [RUNBOOK.md](RUNBOOK.md) — incidents, health checks, Stripe, AI.
- [docs/deploy/](docs/deploy/) — staging/production checklists.

## Demo users (after `db:seed`)

See [prisma/seed.ts](prisma/seed.ts) for emails and the dev-only password.
