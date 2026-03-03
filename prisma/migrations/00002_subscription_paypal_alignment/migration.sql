DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Subscription'
      AND column_name = 'stripeSubscriptionId'
  ) THEN
    ALTER TABLE "Subscription" RENAME COLUMN "stripeSubscriptionId" TO "paypalSubscriptionId";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Subscription'
      AND column_name = 'stripePriceId'
  ) THEN
    ALTER TABLE "Subscription" RENAME COLUMN "stripePriceId" TO "paypalPlanId";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Subscription'
      AND column_name = 'stripeCurrentPeriodEnd'
  ) THEN
    ALTER TABLE "Subscription" RENAME COLUMN "stripeCurrentPeriodEnd" TO "paypalCurrentPeriodEnd";
  END IF;
END
$$;

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paypalSubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paypalPlanId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paypalCurrentPeriodEnd" TIMESTAMP(3);

UPDATE "Subscription"
SET "paypalSubscriptionId" = COALESCE("paypalSubscriptionId", 'legacy-sub-' || "id")
WHERE "paypalSubscriptionId" IS NULL;

UPDATE "Subscription"
SET "paypalPlanId" = COALESCE("paypalPlanId", 'legacy-plan')
WHERE "paypalPlanId" IS NULL;

UPDATE "Subscription"
SET "paypalCurrentPeriodEnd" = COALESCE("paypalCurrentPeriodEnd", NOW())
WHERE "paypalCurrentPeriodEnd" IS NULL;

ALTER TABLE "Subscription" ALTER COLUMN "paypalSubscriptionId" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "paypalPlanId" SET NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "paypalCurrentPeriodEnd" SET NOT NULL;

DROP INDEX IF EXISTS "Subscription_stripeSubscriptionId_key";
DROP INDEX IF EXISTS "Subscription_stripeSubscriptionId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_paypalSubscriptionId_key" ON "Subscription"("paypalSubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_paypalSubscriptionId_idx" ON "Subscription"("paypalSubscriptionId");
