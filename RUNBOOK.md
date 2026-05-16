# Tren Titan Runbook

## Service health

- Primary health endpoint: `/api/health`
- Expected response: `{ ok: true, db: "up" }`

## Incident: Stripe webhook failures

1. Check logs for scope `stripe.webhook.handler`.
2. Confirm `STRIPE_WEBHOOK_SECRET` is set correctly.
3. Replay failed events from Stripe dashboard.
4. Verify subscription row updates:
   - `plan`
   - `status`
   - `stripeSubscriptionId`

## Incident: AI coach/scan failures

1. Check logs:
   - `ai.coach.start`, `ai.coach.stream`
   - `ai.food.scan`
2. Verify provider keys:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
3. Confirm rate-limit backend:
   - Upstash env vars or in-memory fallback.

## Incident: Database unavailable

1. Check `/api/health` output.
2. Validate `DATABASE_URL`.
3. Confirm Prisma connectivity and migration state:
   - `npx prisma validate`
   - `npx prisma migrate status`

## Recovery tasks

- Re-run production migrations: `npx prisma migrate deploy`
- Rebuild/restart app instance
- Re-check `/api/health`
