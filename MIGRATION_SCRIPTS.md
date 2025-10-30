# GalloBets Data Migration Scripts
## Consolidación: venues + galleras → profile_info.businessEntities

**Timeline**: Ejecuta estos scripts EN ORDEN en el SQL editor de Neon.tech

**Important**: Each script is self-contained and idempotent (safe to run multiple times)

---

## STEP 1: Add 'approved' column to users table + Initialize by role
**Purpose**: Fix the login error ("column approved does not exist")
**Safe**: ✅ Adds column, initializes based on user role
**Time**: ~2-5 seconds
**Logic**:
  - role='admin' or 'operator' → approved = TRUE (created by system/admin)
  - role='user', 'venue', 'gallera' → approved = FALSE (public registration needs approval)

```sql
-- SCRIPT 1: Add missing 'approved' column and initialize by role
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- Initialize approved status based on role
-- Admin-created users (admin, operator) should be auto-approved
UPDATE users
SET approved = TRUE
WHERE role IN ('admin', 'operator');

-- Public-registered users (user, venue, gallera) require approval (default FALSE already)
-- No action needed - they keep approved = FALSE

-- Create index for approval status queries
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);

-- Create composite index for filtering
CREATE INDEX IF NOT EXISTS idx_users_role_approved ON users(role, approved);

-- Verify initialization
SELECT
  role,
  COUNT(*) as total_users,
  SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN approved = false THEN 1 ELSE 0 END) as pending_count
FROM users
GROUP BY role
ORDER BY role;
```

---

## STEP 2: Migrate Venues data → profile_info.businessEntities.venue
**Purpose**: Move venue data from separate table into users.profile_info JSON
**Safe**: ✅ Reads from venues table, writes to profile_info JSON only
**Time**: ~5-30 seconds (depends on data volume)
**Rollback**: If needed, venues table still exists until script 4

```sql
-- SCRIPT 2: Migrate venues → profile_info.businessEntities.venue
BEGIN TRANSACTION;

-- For each venue owner, merge venue data into their profile_info
UPDATE users u
SET profile_info = COALESCE(profile_info, '{}'::jsonb) || jsonb_build_object(
  'businessEntities',
  COALESCE(
    (profile_info->'businessEntities')::jsonb || jsonb_build_object(
      'venue', jsonb_build_object(
        'id', v.id::text,
        'name', v.name,
        'location', v.location,
        'description', v.description,
        'contactInfo', COALESCE(v.contact_info, '{}'::jsonb),
        'status', v.status::text,
        'isVerified', v.is_verified,
        'images', COALESCE(to_jsonb(v.images), '[]'::jsonb),
        'createdAt', v.created_at::text,
        'updatedAt', v.updated_at::text
      )
    ),
    jsonb_build_object(
      'venue', jsonb_build_object(
        'id', v.id::text,
        'name', v.name,
        'location', v.location,
        'description', v.description,
        'contactInfo', COALESCE(v.contact_info, '{}'::jsonb),
        'status', v.status::text,
        'isVerified', v.is_verified,
        'images', COALESCE(to_jsonb(v.images), '[]'::jsonb),
        'createdAt', v.created_at::text,
        'updatedAt', v.updated_at::text
      )
    )
  )
)
FROM venues v
WHERE u.id = v.owner_id AND u.role = 'venue';

-- Verify migration
SELECT
  u.id,
  u.username,
  u.role,
  u.profile_info->'businessEntities'->'venue'->>'name' as venue_name,
  u.profile_info->'businessEntities'->'venue'->>'status' as venue_status
FROM users u
WHERE u.role = 'venue'
  AND u.profile_info->'businessEntities'->'venue' IS NOT NULL
LIMIT 10;

-- Count venues migrated
SELECT COUNT(*) as venues_migrated
FROM users u
WHERE u.role = 'venue'
  AND u.profile_info->'businessEntities'->'venue' IS NOT NULL;

COMMIT;
```

---

## STEP 3: Migrate Galleras data → profile_info.businessEntities.gallera
**Purpose**: Move gallera data from separate table into users.profile_info JSON
**Safe**: ✅ Reads from galleras table, writes to profile_info JSON only
**Time**: ~5-30 seconds (depends on data volume)
**Rollback**: If needed, galleras table still exists until script 4

```sql
-- SCRIPT 3: Migrate galleras → profile_info.businessEntities.gallera
BEGIN TRANSACTION;

-- For each gallera owner, merge gallera data into their profile_info
UPDATE users u
SET profile_info = COALESCE(profile_info, '{}'::jsonb) || jsonb_build_object(
  'businessEntities',
  COALESCE(
    (profile_info->'businessEntities')::jsonb || jsonb_build_object(
      'gallera', jsonb_build_object(
        'id', g.id::text,
        'name', g.name,
        'location', g.location,
        'description', g.description,
        'contactInfo', COALESCE(g.contact_info, '{}'::jsonb),
        'specialties', COALESCE(g.specialties, '{}'::jsonb),
        'activeRoosters', g.active_roosters,
        'fightRecord', COALESCE(g.fight_record, '{}'::jsonb),
        'status', g.status::text,
        'isVerified', g.is_verified,
        'images', COALESCE(to_jsonb(g.images), '[]'::jsonb),
        'createdAt', g.created_at::text,
        'updatedAt', g.updated_at::text
      )
    ),
    jsonb_build_object(
      'gallera', jsonb_build_object(
        'id', g.id::text,
        'name', g.name,
        'location', g.location,
        'description', g.description,
        'contactInfo', COALESCE(g.contact_info, '{}'::jsonb),
        'specialties', COALESCE(g.specialties, '{}'::jsonb),
        'activeRoosters', g.active_roosters,
        'fightRecord', COALESCE(g.fight_record, '{}'::jsonb),
        'status', g.status::text,
        'isVerified', g.is_verified,
        'images', COALESCE(to_jsonb(g.images), '[]'::jsonb),
        'createdAt', g.created_at::text,
        'updatedAt', g.updated_at::text
      )
    )
  )
)
FROM galleras g
WHERE u.id = g.owner_id AND u.role = 'gallera';

-- Verify migration
SELECT
  u.id,
  u.username,
  u.role,
  u.profile_info->'businessEntities'->'gallera'->>'name' as gallera_name,
  u.profile_info->'businessEntities'->'gallera'->>'status' as gallera_status
FROM users u
WHERE u.role = 'gallera'
  AND u.profile_info->'businessEntities'->'gallera' IS NOT NULL
LIMIT 10;

-- Count galleras migrated
SELECT COUNT(*) as galleras_migrated
FROM users u
WHERE u.role = 'gallera'
  AND u.profile_info->'businessEntities'->'gallera' IS NOT NULL;

COMMIT;
```

---

## STEP 4: Drop foreign keys and tables
**Warning**: ⚠️ DESTRUCTIVE - Only run if steps 1-3 completed successfully
**Safe**: ✅ After data is migrated, safe to drop
**Time**: ~2-5 seconds
**Note**: Run each DROP statement separately to avoid cascade issues

```sql
-- SCRIPT 4A: Drop foreign key constraints from dependent tables
-- First, drop FKs from events table if exists
ALTER TABLE IF EXISTS events
DROP CONSTRAINT IF EXISTS fk_events_venue_id CASCADE;

-- Then drop FKs from articles table if exists
ALTER TABLE IF EXISTS articles
DROP CONSTRAINT IF EXISTS fk_articles_venue_id CASCADE;

-- Drop FK from venues to users
ALTER TABLE venues
DROP CONSTRAINT IF EXISTS venues_owner_id_fkey CASCADE;

-- Drop FK from galleras to users
ALTER TABLE galleras
DROP CONSTRAINT IF EXISTS galleras_owner_id_fkey CASCADE;

-- Verify FKs were dropped
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_name IN ('venues', 'galleras', 'events', 'articles')
AND constraint_type = 'FOREIGN KEY';
```

```sql
-- SCRIPT 4B: Drop the venues and galleras tables
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS galleras CASCADE;

-- Drop the ENUM types if they exist (and are no longer used)
DROP TYPE IF EXISTS enum_venues_status CASCADE;
DROP TYPE IF EXISTS enum_galleras_status CASCADE;

-- Verify tables were dropped
SELECT tablename FROM pg_tables
WHERE tablename IN ('venues', 'galleras');
-- (Should return 0 rows)
```

---

## STEP 5: Create GIN indexes for JSON search (OPTIONAL but recommended)
**Purpose**: Performance optimization for profile_info JSON queries
**Safe**: ✅ Adds indexes only, doesn't modify data
**Time**: ~5-10 seconds

```sql
-- SCRIPT 5: Add GIN indexes for efficient JSON searches
CREATE INDEX IF NOT EXISTS idx_users_profile_info_gin
ON users USING GIN (profile_info);

CREATE INDEX IF NOT EXISTS idx_users_business_entities
ON users USING GIN ((profile_info->'businessEntities'));

CREATE INDEX IF NOT EXISTS idx_users_venue_status
ON users ((profile_info->'businessEntities'->'venue'->>'status'))
WHERE role = 'venue';

CREATE INDEX IF NOT EXISTS idx_users_gallera_status
ON users ((profile_info->'businessEntities'->'gallera'->>'status'))
WHERE role = 'gallera';

-- Verify indexes were created
SELECT indexname FROM pg_indexes
WHERE tablename = 'users'
AND indexname LIKE 'idx_users_%'
ORDER BY indexname;
```

---

## Execution Checklist

```
Before Running:
[ ] Backup your Neon database (if possible)
[ ] Review each script to understand what it does
[ ] Test in development environment first

Execution Order:
[ ] 1. Run SCRIPT 1 (add 'approved' column) - FIXES LOGIN ERROR
[ ] 2. Run SCRIPT 2 (migrate venues)
[ ] 3. Run SCRIPT 3 (migrate galleras)
[ ] 4a. Run SCRIPT 4A (drop foreign keys)
[ ] 4b. Run SCRIPT 4B (drop tables)
[ ] 5. Run SCRIPT 5 (add JSON indexes) - OPTIONAL but recommended

After Migration:
[ ] Verify data integrity with provided SELECT statements
[ ] Test login functionality
[ ] Test admin pages (/admin/users, /admin/venues, /admin/galleras)
[ ] Check that profile_info data loads correctly
```

---

## Rollback Strategy

If something goes wrong:

### After Step 1 (add column):
- No rollback needed - column is harmless

### After Step 2 (venues migrated):
- Data is safe in both venues table AND profile_info
- Can safely proceed

### After Step 3 (galleras migrated):
- Data is safe in both galleras table AND profile_info
- Can safely proceed

### After Step 4 (tables dropped):
- **NO ROLLBACK POSSIBLE** - tables are deleted
- Data only exists in profile_info JSON
- If critical issue occurs:
  1. STOP immediately
  2. Contact support with database backup
  3. Restore from backup before Step 4

**Therefore: Only run Step 4 after thoroughly testing Steps 1-3**

---

## Troubleshooting

### If SCRIPT 1 fails:
```sql
-- Check if column already exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'approved';

-- If exists, you're good to proceed
-- If not, try without IF NOT EXISTS:
ALTER TABLE users ADD COLUMN approved BOOLEAN DEFAULT FALSE;
```

### If SCRIPT 2 fails:
```sql
-- Check how many venues exist
SELECT COUNT(*) FROM venues;

-- Check a sample venue data
SELECT * FROM venues LIMIT 1;

-- Check if owner_id exists in users
SELECT DISTINCT owner_id FROM venues
WHERE owner_id NOT IN (SELECT id FROM users);
```

### If SCRIPT 3 fails:
```sql
-- Check how many galleras exist
SELECT COUNT(*) FROM galleras;

-- Check a sample gallera data
SELECT * FROM galleras LIMIT 1;

-- Check if owner_id exists in users
SELECT DISTINCT owner_id FROM galleras
WHERE owner_id NOT IN (SELECT id FROM users);
```

### If SCRIPT 4 fails:
```sql
-- List all foreign keys
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('venues', 'galleras', 'events', 'articles')
ORDER BY table_name;

-- Try dropping individually with specific constraint name
ALTER TABLE venues DROP CONSTRAINT venues_owner_id_fkey;
```

---

## Verification Queries

Run these AFTER each script to confirm success:

```sql
-- Verify approved column exists and has data
SELECT COUNT(*) as total_users,
       SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) as approved_count,
       SUM(CASE WHEN approved = false THEN 1 ELSE 0 END) as pending_count
FROM users;

-- Verify venues migrated
SELECT COUNT(*) as venues_in_table FROM venues;
SELECT COUNT(*) as venues_migrated_to_profile_info
FROM users
WHERE role = 'venue'
  AND profile_info->'businessEntities'->'venue' IS NOT NULL;

-- Verify galleras migrated
SELECT COUNT(*) as galleras_in_table FROM galleras;
SELECT COUNT(*) as galleras_migrated_to_profile_info
FROM users
WHERE role = 'gallera'
  AND profile_info->'businessEntities'->'gallera' IS NOT NULL;

-- Check data integrity
SELECT u.id, u.username, u.role,
       u.profile_info->'businessEntities'->'venue'->>'name' as venue_name,
       u.profile_info->'businessEntities'->'gallera'->>'name' as gallera_name
FROM users u
WHERE u.role IN ('venue', 'gallera')
LIMIT 20;
```

---

## Notes

- All scripts are **idempotent** (safe to run multiple times)
- Use `IF NOT EXISTS` and `IF EXISTS` clauses for safety
- Data is preserved in JSON format maintaining all fields
- After migration, code changes needed (see IMPLEMENTATION_PLAN.md)
- No downtime required for Steps 1-3
- Step 4 should be coordinated with backend deployment

