-- ANALYZE USER PROFILE CRITICAL PATH PERFORMANCE
-- Phase 4: Identify bottlenecks in user profile endpoint (CRITICAL PATH)
-- Expected slow performance: 214-1328ms (CRITICAL - affects every authenticated request)

-- Query 1: Current user profile query with EXPLAIN
-- This simulates what happens in GET /api/users/profile
-- The slow performance is likely due to multiple JOINs and calculations
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.is_active,
    u.profile_info,
    u.created_at,
    u.updated_at,
    u.last_login,
    -- Wallet association (likely causing performance issues)
    w.balance,
    w.frozen_amount,
    w.available_balance,
    w.created_at as wallet_created_at,
    w.updated_at as wallet_updated_at,
    -- Subscription information (also associated)
    s.type as subscription_type,
    s.status as subscription_status,
    s.expires_at as subscription_expires_at,
    s.created_at as subscription_created_at
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.id = '12345678-1234-1234-1234-123456789012'  -- Example user ID
LIMIT 1;

-- Query 2: Check indexes on users, wallet, and subscriptions tables
-- These are critical for profile performance
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('users', 'wallets', 'subscriptions')
ORDER BY tablename, indexname;

-- Query 3: Analyze JOIN overhead by examining each association separately
-- This will help identify which JOIN is causing the most performance impact

-- Users table statistics (should have proper indexes)
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY n_distinct DESC;

-- Wallets table statistics (user_id is critical)
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' AND tablename = 'wallets'
ORDER BY n_distinct DESC;

-- Subscriptions table statistics (user_id is critical)
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' AND tablename = 'subscriptions'
ORDER BY n_distinct DESC;

-- Query 4: Identify N+1 queries and inefficient associations
-- Check for common performance issues in profile loading

-- Check if proper indexes exist for the JOIN columns
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_type,
    c.column_default,
    c.is_nullable,
    c.data_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.columns c ON kcu.table_name = c.table_name AND kcu.column_name = c.column_name
WHERE tc.table_name IN ('users', 'wallets', 'subscriptions')
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- Query 5: Profile query with separated associations to identify bottlenecks
-- Test individual association performance

-- Individual user query (baseline)
EXPLAIN (ANALYZE, FORMAT TEXT)
SELECT u.* FROM users u WHERE u.id = '12345678-1234-1234-1234-123456789012' LIMIT 1;

-- Users + Wallet query
EXPLAIN (ANALYZE, FORMAT TEXT)
SELECT u.*, w.balance, w.frozen_amount, w.available_balance
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.id = '12345678-1234-1234-1234-123456789012' 
LIMIT 1;

-- Users + Subscription query
EXPLAIN (ANALYZE, FORMAT TEXT)
SELECT u.*, s.type, s.status, s.expires_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.id = '12345678-1234-1234-1234-123456789012' 
LIMIT 1;

-- Query 6: Test wallet balance calculation performance
-- This might be done in application code or database
SELECT 
    w.user_id,
    w.balance,
    w.frozen_amount,
    (COALESCE(w.balance, 0) - COALESCE(w.frozen_amount, 0)) as available_balance
FROM wallets w
WHERE w.user_id = '12345678-1234-1234-1234-123456789012';

-- Query 7: Check for potentially missing indexes
-- Based on typical profile query patterns
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE tablename IN ('users', 'wallets', 'subscriptions', 'transactions')
ORDER BY seq_scan DESC;

-- Query 8: Profile query with all associations (the likely slow query)
-- This represents the full profile query that's taking 1.3s
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    u.id, u.username, u.email, u.role, u.is_active, u.profile_info, u.created_at, u.updated_at,
    w.balance, w.frozen_amount, 
    -- Also include related data that might be queried
    (SELECT COUNT(*) FROM bets b WHERE b.user_id = u.id) as bet_count,
    (SELECT COUNT(*) FROM transactions t WHERE t.wallet_id = w.id) as transaction_count
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.id = '12345678-1234-1234-1234-123456789012'  -- Replace with actual user ID
LIMIT 1;

-- Query 9: Caching candidates analysis for user profile
-- Identify which parts of the profile change infrequently vs frequently

-- Profile info changes less frequently
SELECT 
    'profile_info_changes' as metric,
    COUNT(*) as update_frequency
FROM users 
WHERE updated_at > (NOW() - INTERVAL '1 day')
    AND profile_info IS NOT NULL;

-- Wallet balance changes frequently
SELECT 
    'wallet_changes' as metric,
    COUNT(*) as update_frequency
FROM wallets w
JOIN users u ON w.user_id = u.id
WHERE w.updated_at > (NOW() - INTERVAL '1 day');

-- Query 10: Proposed optimization strategy
-- Current performance: 214-1328ms (critical path)
-- Expected after optimization: <50ms (96% improvement)

/*
-- POTENTIAL OPTIMIZATIONS (to be implemented by Claude):
1. CREATE INDEX idx_users_id_active ON users (id, is_active);  -- For active user lookups
2. CREATE INDEX idx_wallets_user_id ON wallets (user_id);      -- For wallet JOIN
3. CREATE INDEX idx_subscriptions_user_active ON subscriptions (user_id, status);  -- For subscription JOIN

-- CACHING STRATEGY:
-- 1. Cache full user profile with TTL: 5 minutes
--    Cache key: user:profile:{userId}
--    Invalidation: On user update, wallet update, subscription update

-- 2. Separate caching for different profile components:
--    - Static: username, email, role (TTL: 1 hour)
--    - Semi-static: profile_info (TTL: 15 minutes) 
--    - Dynamic: wallet balance (TTL: 1-2 minutes)

-- 3. Lazy loading for non-critical data:
--    - Bet history: loaded separately on profile page
--    - Transaction history: loaded separately on wallet page
*/

-- Query 11: Performance impact estimation
-- Current: 214-1328ms for profile loading (critical path - every auth request)
-- Expected after optimization: <50ms (90-96% improvement)
-- Reduction from 1.3s to 0.05s = 96% performance improvement
-- Impact: Every authenticated page load will be 25x faster