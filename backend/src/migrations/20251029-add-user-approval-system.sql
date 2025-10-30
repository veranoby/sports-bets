-- User Approval System Migration
-- Purpose: Add 'approved' column to users table for atomic user creation + approval workflow
-- Date: 2025-10-29
-- Status: CRITICAL - Required for public registration & admin approval workflow
-- Implemented by: Claude
-- Validation: Sequelize model expects this column in auth middleware

BEGIN;

-- 1. Add 'approved' column to users table with NOT NULL constraint
-- Default: false (new public registrations require approval)
-- Existing users: will be set to true (admin-created users are auto-approved)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;

-- 2. Create composite index for approval status checks in auth middleware
-- Used by: authenticate middleware (backend/src/middleware/auth.ts:91-96)
-- Query pattern: WHERE role IN ('venue', 'gallera') AND approved = false
-- Performance: Prevents full table scans on every venue/gallera user request
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_approved
ON users(role, approved)
WHERE role IN ('venue', 'gallera');

-- 3. Create index for admin approval workflow (list pending users)
-- Used by: GET /admin/users?pending=true (Administrators.tsx)
-- Query pattern: WHERE approved = false AND role IN ('venue', 'gallera')
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_pending_approval
ON users(approved, role, is_active)
WHERE approved = false AND role IN ('venue', 'gallera');

-- 4. Auto-approve existing venue/gallera users
-- Rationale: Existing users were manually created by admins → should be auto-approved
-- Only updates users that don't have approval status yet (approved = default false)
UPDATE users SET approved = true
WHERE role IN ('venue', 'gallera') AND approved = false;

-- 5. Keep admin/operator users auto-approved (they were created by admins)
UPDATE users SET approved = true
WHERE role IN ('admin', 'operator') AND approved = false;

-- 6. Verify migration success
-- Expected result: All users have approved value (not NULL)
-- New public registrations will have approved = false (requires admin approval)
-- Admin-created users have approved = true (auto-approved)

COMMIT;
