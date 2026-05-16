# Staging Deployment Checklist

Use this checklist for every staging deployment.

## 1) Branch and CI

- [ ] Target branch is up to date with `main`.
- [ ] CI is green (`lint`, `typecheck`, `build`, `prisma validate`, job `e2e` with Postgres smoke).
- [ ] Release notes draft is prepared.

## 2) Environment Configuration

- [ ] Staging secrets are present:
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXT_PUBLIC_APP_URL`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `STRIPE_PREMIUM_PRICE_ID`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Optional AI/ratelimit keys set as needed:
  - [ ] `OPENAI_API_KEY`
  - [ ] `ANTHROPIC_API_KEY`
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`

## 3) Data and Migrations

- [ ] Run `npm run db:migrate:deploy`.
- [ ] Verify migration status (no pending/failed).
- [ ] Confirm backup/snapshot exists for staging DB.

## 4) Deploy

- [ ] Deploy application artifact to staging.
- [ ] Confirm startup logs show no fatal errors.
- [ ] Confirm `/api/health` returns `ok: true`.

## 5) Post-Deploy Smoke Tests

- [ ] Auth: register/login/logout works.
- [ ] Onboarding completes and profile persists.
- [ ] Dashboard loads and live query refresh works.
- [ ] Training log creates a workout.
- [ ] Food scan endpoint responds and saves nutrition log.
- [ ] AI coach stream works for allowed users.
- [ ] Stripe checkout session can be created.
- [ ] Stripe webhook events update subscription state.
- [ ] Billing portal link works.

## 6) Staging Sign-off

- [ ] QA sign-off complete.
- [ ] Product sign-off complete.
- [ ] Known issues documented with owner and ETA.
