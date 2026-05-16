---
name: Release Template
about: Standardized release issue for staging/prod rollout
title: "release: YYYY-MM-DD / vX.Y.Z"
labels: ["release"]
assignees: []
---

## Release Summary

- Version/tag:
- Target environment: staging / production
- Release owner:
- On-call:
- Planned deployment window:

## Scope

- Included PRs:
  - #
  - #
- ## Notable changes:
  -

## Risk Assessment

- Risk level: low / medium / high
- Risk areas:
  - Auth
  - Billing/Stripe
  - AI endpoints
  - Database migrations
- ## Rollback strategy:

## Pre-Deploy Checks

- [ ] CI green
- [ ] Migrations reviewed
- [ ] Secrets verified
- [ ] Staging checklist complete (for prod release)

## Deployment Checklist

- [ ] Run migrations
- [ ] Deploy app
- [ ] Verify `/api/health`
- [ ] Smoke test auth, dashboard, training, nutrition
- [ ] Smoke test Stripe checkout/webhook/portal
- [ ] Smoke test AI coach + food scan

## Post-Deploy Validation (15-30 min)

- [ ] Error rate normal
- [ ] Latency normal
- [ ] No webhook processing regressions
- [ ] Support channel checked for incidents

## Sign-off

- [ ] QA
- [ ] Product
- [ ] Engineering

## Notes

-
