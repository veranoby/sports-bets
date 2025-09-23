-- ⚡ CRITICAL PERFORMANCE INDEXES for N+1 Query Optimization
-- Created: 2025-09-22
-- Purpose: Eliminate critical performance bottlenecks identified in backend logs

-- Index for system_settings lookup by key (most frequent query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_key
ON system_settings(key);

-- Index for system_settings public lookup (second most frequent)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_public
ON system_settings(is_public)
WHERE is_public = true;

-- Index for user lookups by authentication
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_active
ON users(id, is_active)
WHERE is_active = true;

-- Index for bets with user and status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_user_status
ON bets(user_id, status)
WHERE status IN ('pending', 'active', 'won', 'lost');

-- Index for fights with event and status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fights_event_status
ON fights(event_id, status)
WHERE status IN ('upcoming', 'betting', 'live', 'completed');

-- Index for transactions with wallet and date ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_wallet_date
ON transactions(wallet_id, created_at DESC);

-- Index for events with scheduled date and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_scheduled_status
ON events(scheduled_date, status)
WHERE status IN ('scheduled', 'live', 'completed');

-- Index for articles with status and published date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_status_published
ON articles(status, published_at DESC)
WHERE status = 'published';

-- Index for subscriptions with user and active status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_active
ON subscriptions(user_id, status, expires_at)
WHERE status = 'active' AND expires_at > NOW();

-- Index for notifications with user and read status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read
ON notifications(user_id, is_read, created_at DESC);

-- Composite index for wallets with user_id (most common lookup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallets_user_id
ON wallets(user_id);

COMMIT;