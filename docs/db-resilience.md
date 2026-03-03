# DB Resilience (Steps 1-5)

## 1) Baseline write-risk map
- `app/api/auth/register/route.ts`
  Writes: `user.create`, `UPDATE "User"` for verification fields.
- `app/api/auth/request-password-reset/route.ts`
  Writes: `UPDATE "User"` reset token fields.
- `app/api/auth/reset-password/route.ts`
  Writes: `UPDATE "User"` password reset fields.
- `app/api/auth/request-email-verification/route.ts`
  Writes: `UPDATE "User"` verification token fields.
- `app/api/auth/verify-email/route.ts`
  Writes: `UPDATE "User"` email verification fields.
- `app/api/subscription/save/route.ts`
  Writes: `subscription.upsert`.
- `app/api/webhook/route.ts`
  Writes: `subscription.update` on PayPal events.
- `lib/prisma.ts`
  Shared writes: analytics cache upsert and audit log create.

Primary outage risk before this change: storage exhaustion or DB unavailability produced generic `500`s in several write routes.

## 2) Stability patch (graceful degraded mode)
- Added shared write-failure handler in `lib/db-resilience.ts`.
- Storage-full cases now return:
  - HTTP `503`
  - `code: "DB_STORAGE_FULL"`
  - `mode: "read_only"`
- Connection or initialization failures now return deterministic `503` degraded responses.
- All key write routes now use this handler.

## 2b) Idempotency keys for critical writes
- Added shared idempotency helper in `lib/idempotency.ts`.
- Enabled on:
  - `POST /api/auth/register` (scope: `auth-register`)
  - `POST /api/auth/reset-password` (scope: `auth-reset-password`)
  - `POST /api/subscription/save` (scope: `subscription-save`)
- Client header: `x-idempotency-key: <unique-value-per-user-action>`
- Behavior:
  - Same key + same payload: previous response is replayed.
  - Same key + different payload: `409` conflict.
  - Concurrent duplicate in-flight request: `409` with `IDEMPOTENCY_REQUEST_IN_PROGRESS`.
- TTL:
  - `IDEMPOTENCY_TTL_HOURS` (default `24`).

## 3) Protection layer (monitoring hooks)
- Added in-memory write failure metrics in `lib/db-metrics.ts`.
- `GET /api/health` now returns:
  - DB provider label (`DATABASE_PROVIDER`)
  - write-failure counters by category/scope
  - optional storage threshold status from:
    - `DB_STORAGE_USAGE_PERCENT`
    - `DB_STORAGE_ALERT_PERCENT` (default `85`)

## 4) Storage hygiene (retention job)
- Added `scripts/db-retention.ts` (dry-run by default).
- Cleanup targets:
  - Expired/old `AnalyticsCache`
  - Old `AuditLog`
  - Expired idempotency records (if `IdempotencyKey` table exists)
- Commands:
  - `npm run db:retention:check`
  - `npm run db:retention:run`
- Tunables:
  - `ANALYTICS_CACHE_RETENTION_DAYS` (default `30`)
  - `AUDIT_LOG_RETENTION_DAYS` (default `90`)

## 5) Migration readiness
- Added provider/url resolution in `lib/db-config.ts`.
- URL resolution order:
  1. `PRIMARY_DATABASE_URL`
  2. `DATABASE_URL`
  3. `POSTGRES_PRISMA_URL`
  4. `POSTGRES_URL`
- Provider tagging:
  - `DATABASE_PROVIDER` supported values: `neon`, `postgres`, `supabase`, `rds`.
- This makes cutover easier by changing env vars without code changes.
