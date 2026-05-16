## Summary

- ## What changed:
- ## Why:

## Release Risk

- Risk level: `low` / `medium` / `high`
- Risk areas (check all that apply):
  - [ ] Auth/session
  - [ ] Billing/Stripe/webhooks
  - [ ] AI endpoints (coach / food scan)
  - [ ] Database / Prisma
  - [ ] Dashboard critical flow
  - [ ] Admin flow
- ## Notes:

## Database / Migration

- [ ] No schema changes
- [ ] Prisma schema changed
- [ ] Migration created and committed
- [ ] Migration tested on staging-like data
- [ ] Backward compatibility checked

### Migration commands used

-

### Affected tables / models

-

### Data backfill required

- [ ] No
- [ ] Yes — describe below:

## Environment / Config

- New env vars introduced:
  - [ ] No
  - [ ] Yes (list below)
- Changed env behavior:
  - [ ] No
  - [ ] Yes (describe)

Env list:

-

## Test Plan

Automated:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npx prisma validate`
- [ ] `npm run test:e2e` (Playwright; needs local Postgres + migrated DB)

Manual smoke:

- [ ] Auth flow
- [ ] Dashboard load
- [ ] Training log
- [ ] Nutrition / food scan
- [ ] AI coach (if affected)
- [ ] Stripe checkout/webhook/portal (if affected)
- [ ] Admin metrics (if affected)

### Evidence / execution notes

-

## Rollback Note

### Safe rollback method

-

### Post-rollback validation

-

- Any non-reversible changes:
  - [ ] No
  - [ ] Yes (describe)

## Release Notes Input

- ## User-visible changes:
- ## Operational changes:
