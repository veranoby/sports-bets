-- ================================================================
-- BETTING UX OPTIMIZATION - DATABASE MIGRATIONS
-- ================================================================
-- CRITICAL: Execute these migrations IN ORDER during maintenance window
-- TESTED: Syntax validated for PostgreSQL 14+
-- BACKUP: Take full database backup before executing
-- ================================================================

-- ================================================================
-- MIGRATION 01: Add betting_status column to fights
-- ================================================================
-- Purpose: Decouple betting control from fight physical status
-- Duration: ~5 seconds (depends on table size)
-- Reversible: Yes (rollback provided below)

BEGIN;

-- Step 1: Add column with default
ALTER TABLE fights
ADD COLUMN betting_status VARCHAR(20) DEFAULT 'closed' NOT NULL;

-- Step 2: Add check constraint
ALTER TABLE fights
ADD CONSTRAINT fights_betting_status_check
CHECK (betting_status IN ('closed', 'open', 'locked'));

-- Step 3: Add indexes for performance
CREATE INDEX idx_fights_betting_status
ON fights(betting_status);

CREATE INDEX idx_fights_event_betting
ON fights(event_id, betting_status)
WHERE betting_status='open';

-- Step 4: Migrate existing data based on current status
UPDATE fights SET betting_status = CASE
  WHEN status = 'betting' THEN 'open'
  WHEN status = 'live' THEN 'locked'
  ELSE 'closed'
END;

COMMIT;

-- Validation query (run after migration):
-- SELECT status, betting_status, COUNT(*) FROM fights GROUP BY status, betting_status;


-- ROLLBACK for Migration 01 (if needed):
/*
BEGIN;
DROP INDEX IF EXISTS idx_fights_event_betting;
DROP INDEX IF EXISTS idx_fights_betting_status;
ALTER TABLE fights DROP CONSTRAINT IF EXISTS fights_betting_status_check;
ALTER TABLE fights DROP COLUMN IF EXISTS betting_status;
COMMIT;
*/


-- ================================================================
-- MIGRATION 02: Add owner/breeder columns to fights
-- ================================================================
-- Purpose: Display owner/breeder names for roosters
-- Duration: ~2 seconds
-- Reversible: Yes

BEGIN;

ALTER TABLE fights
ADD COLUMN red_owner VARCHAR(255),
ADD COLUMN blue_owner VARCHAR(255);

COMMIT;

-- Validation query (run after migration):
-- SELECT id, red_corner, red_owner, blue_corner, blue_owner FROM fights LIMIT 5;


-- ROLLBACK for Migration 02 (if needed):
/*
BEGIN;
ALTER TABLE fights
DROP COLUMN IF EXISTS blue_owner,
DROP COLUMN IF EXISTS red_owner;
COMMIT;
*/


-- ================================================================
-- MIGRATION 03: Enable multiple bets per user per fight
-- ================================================================
-- Purpose: Allow users to create, cancel, and recreate bets
-- Duration: ~3 seconds
-- Reversible: Partially (cannot restore unique constraint if data exists)
-- ⚠️ WARNING: This changes bet uniqueness semantics

BEGIN;

-- Step 1: Drop unique constraint
-- NOTE: Constraint name might vary. Check with:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'bets'::regclass AND contype = 'u';
ALTER TABLE bets
DROP CONSTRAINT IF EXISTS bets_fight_id_user_id_key;

-- Alternative names to try if above fails:
-- ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_user_id_fight_id_key;
-- ALTER TABLE bets DROP CONSTRAINT IF EXISTS idx_bets_user_fight;

-- Step 2: Add cancelled_at column for auditing
ALTER TABLE bets
ADD COLUMN cancelled_at TIMESTAMP;

-- Step 3: Add index for efficient active bets queries
CREATE INDEX idx_bets_user_fight_active
ON bets(user_id, fight_id, status)
WHERE status IN ('pending', 'active');

COMMIT;

-- Validation query (run after migration):
-- SELECT user_id, fight_id, COUNT(*) as bet_count FROM bets GROUP BY user_id, fight_id HAVING COUNT(*) > 1;
-- (Should return 0 rows initially, but multiple rows allowed going forward)


-- ROLLBACK for Migration 03 (if needed):
/*
BEGIN;
DROP INDEX IF EXISTS idx_bets_user_fight_active;
ALTER TABLE bets DROP COLUMN IF EXISTS cancelled_at;
-- NOTE: Cannot restore unique constraint if multiple bets per user/fight exist
-- To restore, must first delete duplicate bets:
-- DELETE FROM bets WHERE id NOT IN (
--   SELECT MIN(id) FROM bets GROUP BY user_id, fight_id
-- );
-- ALTER TABLE bets ADD CONSTRAINT bets_fight_id_user_id_key UNIQUE (fight_id, user_id);
COMMIT;
*/


-- ================================================================
-- MIGRATION 04: Simplify bet amounts to fixed values
-- ================================================================
-- ⚠️⚠️⚠️ CRITICAL BREAKING CHANGE ⚠️⚠️⚠️
-- Purpose: Change amount from DECIMAL to INTEGER with fixed values [5,10,20,50,100,200,500]
-- Duration: ~10-30 seconds (depends on bet history size)
-- Reversible: NO - Data loss occurs (amounts rounded to nearest fixed value)
--
-- PREREQUISITES:
-- 1. Maintenance window active (no users placing bets)
-- 2. No active or pending bets exist
-- 3. Full database backup taken
-- 4. Staging environment tested successfully
--
-- VALIDATION BEFORE RUNNING:
-- Run this query first:
-- SELECT COUNT(*) FROM bets WHERE status IN ('pending', 'active');
-- Result MUST be 0. If not, wait for bets to complete or cancel them.

BEGIN;

-- Safety check: Ensure no active/pending bets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM bets WHERE status IN ('pending', 'active')) THEN
    RAISE EXCEPTION 'MIGRATION ABORTED: Active or pending bets exist. Count: %. Cancel or complete them first.',
      (SELECT COUNT(*) FROM bets WHERE status IN ('pending', 'active'));
  END IF;
END $$;

-- Step 1: Add new integer column
ALTER TABLE bets
ADD COLUMN amount_new INTEGER;

-- Step 2: Migrate existing data (round to nearest allowed value)
UPDATE bets SET amount_new = CASE
  WHEN amount < 7.5 THEN 5
  WHEN amount < 15 THEN 10
  WHEN amount < 35 THEN 20
  WHEN amount < 75 THEN 50
  WHEN amount < 150 THEN 100
  WHEN amount < 350 THEN 200
  ELSE 500
END;

-- Step 3: Drop old decimal column
ALTER TABLE bets
DROP COLUMN amount;

-- Step 4: Rename new column
ALTER TABLE bets
RENAME COLUMN amount_new TO amount;

-- Step 5: Add NOT NULL constraint
ALTER TABLE bets
ALTER COLUMN amount SET NOT NULL;

-- Step 6: Add check constraint for allowed values
ALTER TABLE bets
ADD CONSTRAINT bets_amount_fixed_values_check
CHECK (amount IN (5, 10, 20, 50, 100, 200, 500));

-- Step 7: Update potential_win to match 1:1 ratio
-- (All bets are now symmetric with fixed amounts)
UPDATE bets
SET potential_win = amount * 2;

COMMIT;

-- Validation queries (run after migration):
-- SELECT amount, COUNT(*) FROM bets GROUP BY amount ORDER BY amount;
-- (Should show only values: 5, 10, 20, 50, 100, 200, 500)
--
-- SELECT amount, potential_win FROM bets WHERE potential_win != amount * 2 LIMIT 5;
-- (Should return 0 rows)


-- ROLLBACK for Migration 04:
-- ⚠️ NOT REVERSIBLE - Original decimal amounts are lost
-- If rollback needed, must restore from backup


-- ================================================================
-- POST-MIGRATION VALIDATION QUERIES
-- ================================================================
-- Run ALL of these after completing migrations to verify success

-- 1. Check fights schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fights'
  AND column_name IN ('betting_status', 'red_owner', 'blue_owner')
ORDER BY column_name;
-- Expected: 3 rows with correct types

-- 2. Check bets schema
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bets'
  AND column_name IN ('amount', 'cancelled_at')
ORDER BY column_name;
-- Expected: amount = integer, cancelled_at = timestamp

-- 3. Check constraints
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'fights'::regclass
  AND conname LIKE '%betting%';
-- Expected: fights_betting_status_check with IN clause

SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'bets'::regclass
  AND conname LIKE '%amount%';
-- Expected: bets_amount_fixed_values_check with IN clause

-- 4. Check indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('fights', 'bets')
  AND indexname LIKE '%betting%'
ORDER BY tablename, indexname;
-- Expected: idx_fights_betting_status, idx_fights_event_betting, idx_bets_user_fight_active

-- 5. Verify no orphaned data
SELECT
  status,
  betting_status,
  COUNT(*) as count
FROM fights
GROUP BY status, betting_status
ORDER BY status, betting_status;
-- Check all combinations make sense

SELECT
  amount,
  COUNT(*) as bet_count,
  SUM(potential_win) as total_potential_win
FROM bets
WHERE status IN ('pending', 'active', 'completed')
GROUP BY amount
ORDER BY amount;
-- Check only allowed amounts exist


-- ================================================================
-- TROUBLESHOOTING
-- ================================================================

-- If Migration 01 fails on constraint creation:
-- Likely cause: Invalid status values in existing data
-- Fix:
/*
SELECT DISTINCT status FROM fights WHERE status NOT IN ('upcoming', 'betting', 'live', 'completed', 'cancelled');
-- Update invalid statuses first, then retry migration
*/

-- If Migration 03 fails on dropping constraint:
-- Likely cause: Constraint has different name
-- Fix:
/*
SELECT conname FROM pg_constraint WHERE conrelid = 'bets'::regclass AND contype = 'u';
-- Use the exact constraint name returned
*/

-- If Migration 04 fails on safety check:
-- Likely cause: Active bets still exist
-- Fix:
/*
SELECT id, user_id, fight_id, amount, status FROM bets WHERE status IN ('pending', 'active');
-- Option 1: Wait for bets to complete naturally
-- Option 2: Cancel bets manually (with user notification):
UPDATE bets SET status = 'cancelled', cancelled_at = NOW() WHERE status IN ('pending', 'active');
-- Then retry migration
*/


-- ================================================================
-- PERFORMANCE IMPACT ANALYSIS
-- ================================================================
-- After migrations, analyze query performance

ANALYZE fights;
ANALYZE bets;

-- Check index usage after 24 hours:
/*
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE tablename IN ('fights', 'bets')
  AND indexname LIKE '%betting%'
ORDER BY idx_scan DESC;
*/

-- ================================================================
-- END OF MIGRATIONS
-- ================================================================
