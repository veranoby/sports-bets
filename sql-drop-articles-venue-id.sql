-- ============================================
-- DROP articles.venue_id COLUMN
-- Generated: 2025-11-24
-- Purpose: Remove obsolete venue_id from articles table
-- IMPORTANT: Execute ONLY AFTER backend code cleanup is committed
-- ============================================

-- STEP 1: Drop foreign key constraint
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_venue_id_fkey;

-- STEP 2: Drop index on venue_id
DROP INDEX IF EXISTS idx_articles_venue_id;

-- STEP 3: Drop the column
ALTER TABLE articles DROP COLUMN IF EXISTS venue_id;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify column no longer exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'articles'
ORDER BY ordinal_position;

-- Verify constraint removed
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'articles';

-- Verify index removed
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'articles';

-- ============================================
-- SUCCESS CRITERIA
-- ============================================
-- ✅ venue_id column NOT in articles table
-- ✅ articles_venue_id_fkey constraint NOT exists
-- ✅ idx_articles_venue_id index NOT exists
-- ✅ Articles CRUD operations work normally
