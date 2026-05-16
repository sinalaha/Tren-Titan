-- Composite index for per-day water aggregates; account lookups by user for OAuth cleanup.

CREATE INDEX "WaterLog_userId_date_idx" ON "WaterLog"("userId", "date");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
