-- ================================================================
-- BETTING UX OPTIMIZATION - DATABASE MIGRATIONS
-- ================================================================
-- CRITICAL: Execute these migrations IN ORDER during maintenance window
-- TESTED: Syntax validated for PostgreSQL 14+
-- BACKUP: Take full database backup before executing
-- ================================================================
--
-- ARCHITECTURE DECISION:
-- - Changed Fight.status from 5 states to 7 states for clarity
-- - NO separate betting_status column (simpler architecture)
-- - Betting logic inferred from status: betting_open = can bet
-- ================================================================

-- ================================================================
-- MIGRATION 01: Update Fight.status enum to 7 states
-- ================================================================
-- Purpose: Replace 5-state system with clearer 7-state workflow
-- Duration: ~10 seconds (depends on table size)
-- Reversible: Partial (data mapped to nearest old state)
--
-- OLD STATES: upcoming, betting, live, completed, cancelled
-- NEW STATES: draft, scheduled, ready, betting_open, in_progress, completed, cancelled
--
-- MAPPING:
--   upcoming → scheduled (visible in lineup)
--   betting  → betting_open (betting window open)
--   live     → in_progress (fight physically happening)
--   completed → completed (no change)
--   cancelled → cancelled (no change)

BEGIN;

-- Step 1: Add new status column (temporary)
ALTER TABLE fights
ADD COLUMN status_new VARCHAR(20);

-- Step 2: Migrate data to new states
UPDATE fights SET status_new = CASE
  WHEN status = 'upcoming' THEN 'scheduled'
  WHEN status = 'betting' THEN 'betting_open'
  WHEN status = 'live' THEN 'in_progress'
  WHEN status = 'completed' THEN 'completed'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'draft'  -- Fallback (shouldn't happen)
END;

-- Step 3: Drop old status column
ALTER TABLE fights
DROP COLUMN status;

-- Step 4: Rename new column
ALTER TABLE fights
RENAME COLUMN status_new TO status;

-- Step 5: Add NOT NULL constraint
ALTER TABLE fights
ALTER COLUMN status SET NOT NULL;

-- Step 6: Set default for new rows
ALTER TABLE fights
ALTER COLUMN status SET DEFAULT 'draft';

-- Step 7: Add check constraint for new states
ALTER TABLE fights
ADD CONSTRAINT fights_status_check
CHECK (status IN ('draft', 'scheduled', 'ready', 'betting_open', 'in_progress', 'completed', 'cancelled'));

-- Step 8: Add indexes for performance
CREATE INDEX idx_fights_status
ON fights(status);

CREATE INDEX idx_fights_event_status
ON fights(event_id, status)
WHERE status IN ('betting_open', 'in_progress');

COMMIT;

-- Validation queries (run after migration):
-- SELECT status, COUNT(*) FROM fights GROUP BY status ORDER BY status;
-- (Should show only new states: draft, scheduled, ready, betting_open, in_progress, completed, cancelled)


-- ROLLBACK for Migration 01 (if needed):
/*
BEGIN;

-- Re-create old status column
ALTER TABLE fights ADD COLUMN status_old VARCHAR(20);

-- Map back to old states (data loss: draft/ready/scheduled all become 'upcoming')
UPDATE fights SET status_old = CASE
  WHEN status IN ('draft', 'scheduled', 'ready') THEN 'upcoming'
  WHEN status = 'betting_open' THEN 'betting'
  WHEN status = 'in_progress' THEN 'live'
  WHEN status = 'completed' THEN 'completed'
  WHEN status = 'cancelled' THEN 'cancelled'
  ELSE 'upcoming'
END;

-- Drop new column and indexes
DROP INDEX IF EXISTS idx_fights_event_status;
DROP INDEX IF EXISTS idx_fights_status;
ALTER TABLE fights DROP CONSTRAINT IF EXISTS fights_status_check;
ALTER TABLE fights DROP COLUMN status;

-- Restore old column
ALTER TABLE fights RENAME COLUMN status_old TO status;
ALTER TABLE fights ALTER COLUMN status SET NOT NULL;
ALTER TABLE fights ALTER COLUMN status SET DEFAULT 'upcoming';

-- Re-add old constraint
ALTER TABLE fights
ADD CONSTRAINT fights_status_check
CHECK (status IN ('upcoming', 'betting', 'live', 'completed', 'cancelled'));

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

-- Step 1: Drop unique constraint (allows multiple bets per user per fight)
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

-- Step 4: Add index for matching pending bets (auto-match optimization)
CREATE INDEX idx_bets_fight_amount_side_pending
ON bets(fight_id, amount, side)
WHERE status = 'pending';

COMMIT;

-- Validation query (run after migration):
-- SELECT user_id, fight_id, COUNT(*) as bet_count FROM bets GROUP BY user_id, fight_id HAVING COUNT(*) > 1;
-- (Should return 0 rows initially, but multiple rows allowed going forward)


-- ROLLBACK for Migration 03 (if needed):
/*
BEGIN;
DROP INDEX IF EXISTS idx_bets_fight_amount_side_pending;
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
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM bets WHERE status IN ('pending', 'active');

  IF active_count > 0 THEN
    RAISE NOTICE 'Found % active/pending bets. Auto-cancelling with full refund...', active_count;

    -- Refund wallets for all active/pending bets
    UPDATE wallets w
    SET balance = balance + b.amount
    FROM bets b
    WHERE b.user_id = w.user_id
      AND b.status IN ('pending', 'active');

    -- Cancel all active/pending bets
    UPDATE bets SET status = 'cancelled', cancelled_at = NOW()
    WHERE status IN ('pending', 'active');

    RAISE NOTICE 'Refunded and cancelled % bets', active_count;
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
  AND column_name IN ('status', 'red_owner', 'blue_owner')
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
  AND conname LIKE '%status%';
-- Expected: fights_status_check with IN clause (7 states)

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
  AND (indexname LIKE '%status%' OR indexname LIKE '%betting%' OR indexname LIKE '%amount%')
ORDER BY tablename, indexname;
-- Expected: idx_fights_status, idx_fights_event_status, idx_bets_user_fight_active, idx_bets_fight_amount_side_pending

-- 5. Verify no orphaned data
SELECT
  status,
  COUNT(*) as count
FROM fights
GROUP BY status
ORDER BY status;
-- Check all values are valid new states

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
-- Option 2: Bets are auto-cancelled with refund by the migration
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
  AND (indexname LIKE '%status%' OR indexname LIKE '%betting%' OR indexname LIKE '%amount%')
ORDER BY idx_scan DESC;
*/

-- ================================================================
-- END OF MIGRATIONS
-- ================================================================
