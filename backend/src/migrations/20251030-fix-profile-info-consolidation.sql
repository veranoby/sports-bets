-- Migration: Fix profile_info default and initialize businessEntities
-- Purpose: Ensure profile_info has the correct consolidated structure
-- Date: 2025-10-30
-- Status: CRITICAL - Required for QWEN/Gemini implementation

-- Step 1: Update the DEFAULT value of profile_info column
-- This ensures all NEW users created will have the correct structure
ALTER TABLE users
ALTER COLUMN profile_info
SET DEFAULT '{
  "verificationLevel": "none",
  "businessEntities": {}
}'::jsonb;

-- Step 2: Initialize existing users with businessEntities structure
-- This updates all users whose profile_info is missing the businessEntities root
UPDATE users
SET profile_info = jsonb_set(
  COALESCE(profile_info, '{"verificationLevel": "none"}'::jsonb),
  '{businessEntities}',
  CASE
    WHEN role = 'venue' THEN '{"venue": {}}'::jsonb
    WHEN role = 'gallera' THEN '{"gallera": {}}'::jsonb
    ELSE '{}'::jsonb
  END
)
WHERE profile_info -> 'businessEntities' IS NULL
   OR profile_info::text = '{"verificationLevel":"none"}';

-- Step 3: Verification - Check that all users now have correct structure
-- This should return rows with both verificationLevel and businessEntities
SELECT
  id,
  username,
  role,
  approved,
  profile_info,
  (profile_info ? 'verificationLevel') as has_verification,
  (profile_info ? 'businessEntities') as has_business_entities
FROM users
WHERE role IN ('venue', 'gallera', 'admin', 'operator')
LIMIT 20;

-- Step 4: Summary
-- If all rows show: has_verification = true AND has_business_entities = true
-- Then migration is SUCCESSFUL
