-- GalloBets Database Performance Monitoring
-- Monitor users table performance after auth fix
-- Expected: Dramatic reduction in update ratio

-- Current table statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    CASE 
        WHEN n_tup_ins = 0 THEN 'N/A'
        ELSE ROUND((n_tup_upd::float / n_tup_ins::float), 2)::text
    END as update_ratio,
    CASE
        WHEN n_tup_upd::float / NULLIF(n_tup_ins, 0) > 10 THEN '🚨 HIGH WRITE LOAD'
        WHEN n_tup_upd::float / NULLIF(n_tup_ins, 0) > 5 THEN '⚠️ MODERATE LOAD'
        ELSE '✅ NORMAL LOAD'
    END as status
FROM pg_stat_user_tables 
WHERE tablename IN ('users', 'events', 'fights', 'bets', 'wallets')
ORDER BY n_tup_upd DESC;

-- Users table specific monitoring
SELECT 
    'USERS TABLE PERFORMANCE CHECK' as analysis,
    n_tup_ins as total_user_registrations,
    n_tup_upd as total_user_updates,
    ROUND((n_tup_upd::float / NULLIF(n_tup_ins, 0)::float), 2) as current_ratio,
    CASE 
        WHEN n_tup_upd::float / NULLIF(n_tup_ins, 0) < 2 THEN '✅ PERFORMANCE FIX SUCCESSFUL'
        WHEN n_tup_upd::float / NULLIF(n_tup_ins, 0) < 10 THEN '⚠️ STILL HIGH - MONITOR'
        ELSE '🚨 FIX NOT EFFECTIVE - INVESTIGATE'
    END as performance_status
FROM pg_stat_user_tables 
WHERE tablename = 'users';

-- Show recent login activity patterns
SELECT 
    'RECENT LOGIN PATTERNS' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 hour' THEN 1 END) as active_last_hour,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 day' THEN 1 END) as active_last_day
FROM users;