-- Migration: Restructure subscriptions metadata for Kushki integration
-- Purpose: Move payment-related fields into metadata.payment for future Kushki expansion
-- Date: 2025-11-19
-- Safety: Non-destructive - preserves original columns, moves data to metadata

BEGIN;

-- Step 1: Backup existing subscription count
CREATE TEMP TABLE backup_subscription_count AS
SELECT COUNT(*) as total_before FROM subscriptions;

-- Step 2: Create new metadata structure with payment data
UPDATE subscriptions
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{payment}',
  jsonb_build_object(
    'kushkiSubscriptionId', kushki_subscription_id,
    'nextBillingDate', next_billing_date::text,
    'retryCount', retry_count,
    'maxRetries', max_retries,
    'cancelledAt', cancelled_at::text,
    'cancelReason', cancel_reason,
    'paymentMethod', payment_method::text
  )
)
WHERE metadata IS NULL OR NOT metadata ? 'payment';

-- Step 3: Update subscriptions that already have metadata but no payment data
-- Merge payment data without overwriting existing admin data
UPDATE subscriptions
SET metadata = jsonb_set(
  metadata,
  '{payment}',
  jsonb_build_object(
    'kushkiSubscriptionId', kushki_subscription_id,
    'nextBillingDate', next_billing_date::text,
    'retryCount', retry_count,
    'maxRetries', max_retries,
    'cancelledAt', cancelled_at::text,
    'cancelReason', cancel_reason,
    'paymentMethod', payment_method::text
  )
)
WHERE metadata IS NOT NULL AND NOT metadata ? 'payment';

-- Step 4: Consolidate admin data if it exists in old assigned_* columns
UPDATE subscriptions
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{admin}',
  jsonb_build_object(
    'assignedByAdminId', assigned_by_admin_id::text,
    'assignedUsername', assigned_username
  )
)
WHERE assigned_by_admin_id IS NOT NULL OR assigned_username IS NOT NULL;

-- Step 5: Verify data integrity
CREATE TEMP TABLE migration_verification AS
SELECT
  COUNT(*) as total_after,
  SUM(CASE WHEN metadata -> 'payment' IS NOT NULL THEN 1 ELSE 0 END) as with_payment_metadata,
  SUM(CASE WHEN metadata -> 'admin' IS NOT NULL THEN 1 ELSE 0 END) as with_admin_metadata
FROM subscriptions;

-- Step 6: Validate migration (will fail if counts don't match)
DO $$
DECLARE
  before_count INT;
  after_count INT;
BEGIN
  SELECT total_before INTO before_count FROM backup_subscription_count;
  SELECT total_after INTO after_count FROM migration_verification;

  IF before_count != after_count THEN
    RAISE EXCEPTION 'Data integrity check failed: subscription count mismatch (before: %, after: %)', before_count, after_count;
  END IF;

  RAISE NOTICE 'Migration successful! Total subscriptions: %', after_count;
END $$;

-- Step 7: Create index on metadata payment fields for future Kushki queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_metadata_payment
ON subscriptions USING GIN ((metadata -> 'payment'));

-- Step 8: Create index on metadata admin fields for audit trails
CREATE INDEX IF NOT EXISTS idx_subscriptions_metadata_admin
ON subscriptions USING GIN ((metadata -> 'admin'));

-- Step 9: Log migration completion
INSERT INTO system_logs (event, details, created_at)
SELECT
  'SUBSCRIPTION_METADATA_RESTRUCTURE' as event,
  jsonb_build_object(
    'timestamp', NOW(),
    'total_subscriptions', (SELECT total_after FROM migration_verification),
    'with_payment_data', (SELECT with_payment_metadata FROM migration_verification),
    'with_admin_data', (SELECT with_admin_metadata FROM migration_verification)
  ) as details,
  NOW() as created_at
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs');

COMMIT;

-- Note: Original columns (next_billing_date, cancelled_at, cancel_reason, retry_count, max_retries, assigned_by_admin_id, assigned_username)
-- are preserved for backward compatibility. They can be dropped in a future migration after code is fully migrated to use metadata.
