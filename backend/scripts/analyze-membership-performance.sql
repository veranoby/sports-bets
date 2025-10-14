-- ANALYZE MEMBERSHIP REQUESTS PERFORMANCE
-- Phase 4: Identify bottlenecks in membership-requests endpoint
-- Expected slow performance: 255-1091ms (CRITICAL)

-- Query 1: Check current indexes on membership_change_requests table
-- These were created per MEMBERSHIP_REQUESTS_IMPLEMENTATION_SUMMARY.md:
-- 1. idx_membership_requests_user_status (user_id, status)
-- 2. idx_membership_requests_pending (status, requested_at) WHERE status = 'pending'
-- 3. idx_membership_requests_processor (processed_by)
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'membership_change_requests'
ORDER BY indexname;

-- Query 2: EXPLAIN ANALYZE for the typical membership-requests query
-- This simulates what happens in GET /api/membership-requests/pending
-- Expected slow performance due to JOIN with users table and potential N+1 issues
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    mcr.id,
    mcr.user_id,
    mcr.current_membership_type,
    mcr.requested_membership_type,
    mcr.status,
    mcr.request_notes,
    mcr.payment_proof_url,
    mcr.requested_at,
    mcr.processed_at,
    mcr.processed_by,
    mcr.rejection_reason,
    mcr.admin_notes,
    mcr.created_at,
    mcr.updated_at,
    -- User information joined in the query
    u.username,
    u.email,
    u.subscription
FROM membership_change_requests mcr
LEFT JOIN users u ON mcr.user_id = u.id
WHERE mcr.status = 'pending'
ORDER BY mcr.requested_at DESC
LIMIT 100;

-- Query 3: Check for potentially missing indexes that could improve the query
-- Based on the typical usage patterns:
-- - Admin dashboard: filtering by status and ordered by requested_at
-- - User history: filtering by user_id and status
-- - Processor tracking: filtering by processed_by
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
    AND tablename = 'membership_change_requests'
ORDER BY n_distinct DESC;

-- Query 4: Analyze the most common query pattern - pending requests with user details
-- This query may suffer from N+1 if executed in a loop for each request
-- Check if there are any statistics on query performance
SELECT 
    s.query,
    s.calls,
    s.total_time,
    s.mean_time,
    s.rows
FROM pg_stat_statements s
JOIN pg_stat_user_tables t ON s.query ILIKE '%' || t.relname || '%'
WHERE t.relname = 'membership_change_requests'
    AND s.query ILIKE '%pending%'
ORDER BY s.mean_time DESC;

-- Query 5: Identify potential composite index improvements
-- Current indexes may not be optimal for the JOIN query with users
-- Proposed additional indexes (COMMENTED - Claude executes these):
/*
-- Index to optimize the JOIN between membership_change_requests and users
-- For the admin dashboard query joining on user information
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_requests_pending_with_user 
ON membership_change_requests 
USING btree (status, requested_at DESC) 
WHERE status = 'pending';

-- Composite index for the most common query pattern: status + user info
-- This should help with queries that need to JOIN with users table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_requests_status_user_joined
ON membership_change_requests (status, user_id, requested_at DESC);
*/

-- Query 6: Check for any existing N+1 query patterns
-- This would be queries executed in loops rather than a single JOIN
-- Look for multiple small queries instead of one efficient query
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
WHERE tablename LIKE '%membership%'
ORDER BY seq_scan DESC;

-- Query 7: Performance impact estimation
-- Current performance: 255-1091ms for pending request queries
-- With proper indexing, we expect improvement to <100ms
-- Potential improvement: 60-90% reduction in query time
-- Expected after optimization: 25-90ms average response time

-- Query 8: Check current foreign key performance 
-- Ensure user_id and processed_by foreign keys have proper indexes
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'membership_change_requests'
ORDER BY tc.constraint_name;

-- Query 9: Estimated performance gain with proposed optimizations
-- Current: 255-1091ms average for GET /api/membership-requests/pending
-- Expected after optimization: <100ms (70-90% improvement)
-- With proper indexing and query optimization
/*
-- POTENTIAL OPTIMIZATIONS (to be implemented by Claude):
1. CREATE INDEX idx_membership_requests_pending_optimized 
   ON membership_change_requests (status, requested_at DESC, user_id)
   WHERE status = 'pending';  -- For admin dashboard queries
   
2. Consider caching strategy for the admin endpoint since it's not frequently changing
   - TTL: 30-60 seconds for pending requests list
   - Cache key: membership-requests:pending:{adminId}
   
3. Optimize the Sequelize query to select only needed columns instead of *
   - Reduce data transfer between DB and application
*/