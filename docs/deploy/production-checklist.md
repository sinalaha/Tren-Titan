# Production Deployment Checklist

This checklist is mandatory for production releases.

## 1) Release Readiness

- [ ] Staging passed and is signed off (including automated `e2e` smoke where applicable).
- [ ] Change scope is frozen for this release.
- [ ] Rollback plan is documented.
- [ ] Incident owner + on-call engineer assigned.

## 2) Infrastructure and Secrets

- [ ] Production secrets validated (`npm run preflight` equivalent in runtime environment).
- [ ] Webhook endpoints are reachable from Stripe.
- [ ] DNS/TLS status healthy.
- [ ] Monitoring and alert channels are active.

## 3) Database and Backups

- [ ] Fresh DB backup/snapshot created.
- [ ] `npm run db:migrate:deploy` completed successfully.
- [ ] Post-migration sanity checks passed.

## 4) Deployment Execution

- [ ] Deploy with zero-downtime strategy (or approved maintenance window).
- [ ] Startup logs are clean.
- [ ] `/api/health` returns `ok: true` and `db: "up"`.

## 5) Critical Post-Release Validation

- [ ] Login and session refresh work.
- [ ] Dashboard and core KPI queries load.
- [ ] Training + nutrition log writes are successful.
- [ ] AI coach and food scan endpoints are responsive.
- [ ] Stripe checkout + webhook + portal loop is healthy.
- [ ] Admin overview metrics update correctly.

## 6) Observability and Risk Control

- [ ] Error rate and latency within expected range (15 min after release).
- [ ] No spike in 4xx/5xx for critical APIs.
- [ ] Stripe webhook failure count unchanged.
- [ ] Background retry queues (if any) are stable.

## 7) Release Closure

- [ ] Release announcement posted to team channel.
- [ ] Release notes published.
- [ ] Follow-up tasks captured (bugs, debt, improvements).
- [ ] Mark deployment as complete in tracking board.
