-- ============================================================================
-- Migration: Add HLS Status Tracking (Separate from RTMP Ingest Status)
-- Date: 2025-12-16
-- Purpose: Enable distinct "OBS Conectado" (RTMP) vs "Stream Público" (HLS) badges
-- ============================================================================

-- STEP 1: Create ENUM type for HLS distribution status
-- PostgreSQL requires ENUM type creation before column addition
CREATE TYPE enum_events_hls_status AS ENUM (
  'offline',      -- No HLS stream available (default state)
  'processing',   -- RTMP connected but HLS transcoding in progress (~2-3s delay)
  'ready',        -- HLS playlist (.m3u8) ready for public consumption
  'error'         -- HLS transcoding failed (RTMP ok but HLS broken)
);

-- STEP 2: Add hls_status column to events table
-- Default: 'offline' (safe default, matches current behavior)
-- NOT NULL: Ensures every event has explicit HLS status
ALTER TABLE events
ADD COLUMN hls_status enum_events_hls_status DEFAULT 'offline'::enum_events_hls_status NOT NULL;

-- STEP 3: Create index for performance (HLS status filtering queries)
-- Use case: SELECT * FROM events WHERE hls_status = 'ready' (find all streamable events)
CREATE INDEX idx_events_hls_status ON events(hls_status);

-- STEP 4: Create composite index for common query pattern
-- Use case: SELECT * FROM events WHERE stream_status = 'connected' AND hls_status = 'ready'
-- (Find events where both RTMP and HLS are active)
CREATE INDEX idx_events_stream_and_hls ON events(stream_status, hls_status);

-- STEP 5: Add column comments for documentation
COMMENT ON COLUMN events.stream_status IS
  'RTMP ingest status (OBS connection state). Use for "OBS Conectado" badge. Values: offline|connecting|connected|paused|disconnected';

COMMENT ON COLUMN events.hls_status IS
  'HLS distribution status (public stream availability). Use for "Stream Público" badge. Values: offline|processing|ready|error';

-- STEP 6: Initialize hls_status based on existing stream_status
-- Assumption: If streamStatus='connected', assume HLS is also ready (legacy behavior)
-- This preserves backward compatibility for existing active streams
UPDATE events
SET hls_status = CASE
  WHEN stream_status = 'connected' THEN 'ready'::enum_events_hls_status
  WHEN stream_status = 'connecting' THEN 'processing'::enum_events_hls_status
  ELSE 'offline'::enum_events_hls_status
END
WHERE hls_status = 'offline'; -- Only update defaults, preserve any manually set values

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to verify success)
-- ============================================================================

-- Verify column exists and has correct type
-- Expected: Should show hls_status column with enum_events_hls_status type
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'events' AND column_name = 'hls_status';

-- Verify index exists
-- Expected: Should show idx_events_hls_status and idx_events_stream_and_hls
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'events' AND indexname LIKE '%hls%';

-- Verify enum type exists
-- Expected: Should show enum values: offline, processing, ready, error
-- SELECT e.enumlabel
-- FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
-- WHERE t.typname = 'enum_events_hls_status'
-- ORDER BY e.enumsortorder;

-- Count events by hls_status (sanity check)
-- Expected: Should show distribution of statuses after migration
-- SELECT hls_status, COUNT(*)
-- FROM events
-- GROUP BY hls_status;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (If migration fails or needs reversal)
-- ============================================================================

-- Rollback STEP 6: Reset hls_status to default (optional)
-- UPDATE events SET hls_status = 'offline';

-- Rollback STEP 5: Remove column comments (optional)
-- COMMENT ON COLUMN events.stream_status IS NULL;
-- COMMENT ON COLUMN events.hls_status IS NULL;

-- Rollback STEP 4: Drop composite index
-- DROP INDEX IF EXISTS idx_events_stream_and_hls;

-- Rollback STEP 3: Drop hls_status index
-- DROP INDEX IF EXISTS idx_events_hls_status;

-- Rollback STEP 2: Drop hls_status column
-- ALTER TABLE events DROP COLUMN IF EXISTS hls_status;

-- Rollback STEP 1: Drop enum type (must be done AFTER column drop)
-- DROP TYPE IF EXISTS enum_events_hls_status;

-- ============================================================================
-- NOTES FOR MANUAL EXECUTION
-- ============================================================================
-- 1. Review this entire file before executing
-- 2. Execute in a transaction for safety:
--    BEGIN;
--    [paste SQL here]
--    -- Verify with SELECT * FROM events LIMIT 5;
--    COMMIT; (or ROLLBACK if issues)
-- 3. Restart backend server after migration
-- 4. Clear frontend cache (Ctrl+Shift+R) after backend restart
-- ============================================================================
