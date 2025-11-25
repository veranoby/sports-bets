-- ============================================
-- POPULATE SYSTEM_SETTINGS WITH ALL CONFIGURATIONS
-- Generated: 2025-11-24
-- Purpose: Centralized configuration for all business rules
-- ============================================

-- Clear existing settings (optional - comment out if you want to preserve)
-- TRUNCATE TABLE system_settings CASCADE;

-- ============================================
-- CATEGORY: WALLETS - Deposit & Withdrawal Rules
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('wallet.deposit_min', '{"amount": 5}', 'object', 'wallets', 'Minimum deposit amount in USD', false, NULL),
('wallet.deposit_max', '{"amount": 1000}', 'object', 'wallets', 'Maximum deposit amount per transaction in USD', false, NULL),
('wallet.deposit_max_daily', '{"amount": 5000}', 'object', 'wallets', 'Maximum total deposits per user per day in USD', false, NULL),
('wallet.withdrawal_min', '{"amount": 10}', 'object', 'wallets', 'Minimum withdrawal amount in USD', false, NULL),
('wallet.withdrawal_max', '{"amount": 500}', 'object', 'wallets', 'Maximum withdrawal amount per transaction in USD', false, NULL),
('wallet.withdrawal_max_daily', '{"amount": 2000}', 'object', 'wallets', 'Maximum total withdrawals per user per day in USD', false, NULL),
('wallet.withdrawal_processing_hours', '{"hours": 48}', 'object', 'wallets', 'Maximum hours for admin to process withdrawal request', false, NULL),
('wallet.require_proof_over', '{"amount": 50}', 'object', 'wallets', 'Require payment proof for deposits over this amount', false, NULL),
('wallet.auto_approve_deposits', '{"enabled": false}', 'object', 'wallets', 'NEVER auto-approve deposits - always require admin review', false, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: BETTING - Bet Limits & Rules
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('betting.min_amount', '{"amount": 1}', 'object', 'betting', 'Minimum bet amount in USD', true, NULL),
('betting.max_amount', '{"amount": 500}', 'object', 'betting', 'Maximum bet amount per fight in USD', true, NULL),
('betting.max_daily_total', '{"amount": 2000}', 'object', 'betting', 'Maximum total bets per user per day in USD', false, NULL),
('betting.pago_timeout_seconds', '{"seconds": 180}', 'object', 'betting', 'PAGO proposal timeout in seconds (3 minutes)', true, NULL),
('betting.window_before_fight', '{"minutes": 5}', 'object', 'betting', 'Close betting window X minutes before fight starts', true, NULL),
('betting.commission_rate', '{"rate": 0.05}', 'object', 'betting', 'Platform commission rate (5% of winnings)', false, NULL),
('betting.max_concurrent_bets', '{"count": 10}', 'object', 'betting', 'Maximum concurrent active bets per user', false, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: STREAMING - Connection & Quality
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('streaming.max_connections_per_ip', '{"count": 3}', 'object', 'streaming', 'Maximum concurrent connections per IP address', false, NULL),
('streaming.max_connections_per_user', '{"count": 2}', 'object', 'streaming', 'Maximum concurrent connections per user', false, NULL),
('streaming.heartbeat_interval_ms', '{"active": 15000, "idle": 60000, "stale": 120000}', 'object', 'streaming', 'Adaptive heartbeat intervals based on connection activity', false, NULL),
('streaming.auto_disconnect_missed', '{"count": 3}', 'object', 'streaming', 'Auto-disconnect after X missed heartbeats', false, NULL),
('streaming.hls_segment_duration', '{"seconds": 6}', 'object', 'streaming', 'HLS segment duration in seconds', false, NULL),
('streaming.hls_playlist_size', '{"segments": 5}', 'object', 'streaming', 'Number of segments in HLS playlist', false, NULL),
('streaming.bitrate_720p', '{"kbps": 2500}', 'object', 'streaming', 'Bitrate for 720p streaming', false, NULL),
('streaming.bitrate_480p', '{"kbps": 1200}', 'object', 'streaming', 'Bitrate for 480p streaming', false, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: CACHE - TTL Configuration
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('cache.users_ttl_seconds', '{"ttl": 300}', 'object', 'cache', 'User cache TTL (5 minutes)', false, NULL),
('cache.events_ttl_seconds', '{"ttl": 120}', 'object', 'cache', 'Events list cache TTL (2 minutes)', false, NULL),
('cache.fights_ttl_seconds', '{"ttl": 60}', 'object', 'cache', 'Fights cache TTL (1 minute)', false, NULL),
('cache.articles_ttl_seconds', '{"ttl": 600}', 'object', 'cache', 'Articles cache TTL (10 minutes)', false, NULL),
('cache.venues_ttl_seconds', '{"ttl": 300}', 'object', 'cache', 'Venues/Galleras cache TTL (5 minutes)', false, NULL),
('cache.adaptive_enabled', '{"enabled": true}', 'object', 'cache', 'Enable adaptive TTL based on access patterns', false, NULL),
('cache.event_history_max_size', '{"count": 100}', 'object', 'cache', 'Maximum events per channel in history', false, NULL),
('cache.event_history_max_age_minutes', '{"minutes": 5}', 'object', 'cache', 'Maximum age of events in history', false, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: SECURITY - Session & Auth
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('security.session_lifetime_hours', '{"hours": 168}', 'object', 'security', 'Session lifetime (7 days)', false, NULL),
('security.max_login_attempts', '{"attempts": 5}', 'object', 'security', 'Maximum failed login attempts before lockout', false, NULL),
('security.lockout_duration_minutes', '{"minutes": 30}', 'object', 'security', 'Account lockout duration after max failed attempts', false, NULL),
('security.password_min_length', '{"length": 8}', 'object', 'security', 'Minimum password length', false, NULL),
('security.require_password_uppercase', '{"enabled": true}', 'object', 'security', 'Require at least one uppercase letter', false, NULL),
('security.require_password_number', '{"enabled": true}', 'object', 'security', 'Require at least one number', false, NULL),
('security.concurrent_login_prevention', '{"enabled": true}', 'object', 'security', 'Prevent concurrent logins (reject new login if active session exists)', false, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: NOTIFICATIONS - Email & Push
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('notifications.email_enabled', '{"enabled": true}', 'object', 'notifications', 'Enable email notifications', false, NULL),
('notifications.push_enabled', '{"enabled": true}', 'object', 'notifications', 'Enable push notifications', false, NULL),
('notifications.retention_days', '{"days": 30}', 'object', 'notifications', 'Days to retain read notifications', false, NULL),
('notifications.batch_size', '{"count": 100}', 'object', 'notifications', 'Maximum notifications to send in single batch', false, NULL),
('notifications.deposit_approval', '{"enabled": true}', 'object', 'notifications', 'Notify user when deposit is approved', true, NULL),
('notifications.withdrawal_processing', '{"enabled": true}', 'object', 'notifications', 'Notify user when withdrawal is being processed', true, NULL),
('notifications.bet_settled', '{"enabled": true}', 'object', 'notifications', 'Notify user when bet is settled', true, NULL),
('notifications.article_rejected', '{"enabled": true}', 'object', 'notifications', 'Notify author when article is rejected', true, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: SYSTEM - General Settings
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('system.maintenance_mode', '{"enabled": false}', 'object', 'system', 'Enable maintenance mode (blocks non-admin users)', true, NULL),
('system.maintenance_message', '{"message": "Sistema en mantenimiento. Volveremos pronto."}', 'object', 'system', 'Message shown during maintenance', true, NULL),
('system.timezone', '{"timezone": "America/Guayaquil"}', 'object', 'system', 'Server timezone (Ecuador)', false, NULL),
('system.currency', '{"currency": "USD"}', 'object', 'system', 'Platform currency', true, NULL),
('system.support_email', '{"email": "soporte@gallobets.com"}', 'object', 'system', 'Support email address', true, NULL),
('system.support_whatsapp', '{"phone": "+593999999999"}', 'object', 'system', 'Support WhatsApp number', true, NULL),
('system.platform_commission_wallet', '{"wallet_id": null}', 'object', 'system', 'Platform wallet ID for commission collection', false, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: LIMITS - Upload & Resource Limits
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('limits.image_max_size_mb', '{"size": 5}', 'object', 'limits', 'Maximum image upload size in MB', true, NULL),
('limits.venue_max_images', '{"count": 2}', 'object', 'limits', 'Maximum images per venue', true, NULL),
('limits.gallera_max_images', '{"count": 3}', 'object', 'limits', 'Maximum images per gallera', true, NULL),
('limits.article_max_images', '{"count": 5}', 'object', 'limits', 'Maximum images per article', true, NULL),
('limits.allowed_image_types', '{"types": ["image/jpeg", "image/jpg", "image/png", "image/webp"]}', 'object', 'limits', 'Allowed image MIME types', false, NULL),
('limits.max_active_events_per_venue', '{"count": 5}', 'object', 'limits', 'Maximum concurrent active events per venue', false, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: PERFORMANCE - DB & Rate Limits
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('performance.db_pool_min', '{"size": 5}', 'object', 'performance', 'Minimum database connection pool size', false, NULL),
('performance.db_pool_max', '{"size": 20}', 'object', 'performance', 'Maximum database connection pool size', false, NULL),
('performance.db_pool_idle_timeout_ms', '{"ms": 10000}', 'object', 'performance', 'Database connection idle timeout', false, NULL),
('performance.rate_limit_requests_per_minute', '{"requests": 60}', 'object', 'performance', 'API rate limit per user per minute', false, NULL),
('performance.rate_limit_burst', '{"requests": 10}', 'object', 'performance', 'Burst allowance for rate limiting', false, NULL),
('performance.query_timeout_seconds', '{"seconds": 30}', 'object', 'performance', 'Maximum query execution time', false, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: BUSINESS - Pricing & Features
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('business.subscription_daily_price', '{"amount": 5, "currency": "USD"}', 'object', 'business', 'Price for 24-hour subscription', true, NULL),
('business.subscription_monthly_price', '{"amount": 10, "currency": "USD"}', 'object', 'business', 'Price for monthly subscription', true, NULL),
('business.subscription_daily_duration_hours', '{"hours": 24}', 'object', 'business', 'Duration of daily subscription', false, NULL),
('business.subscription_monthly_duration_days', '{"days": 30}', 'object', 'business', 'Duration of monthly subscription', false, NULL),
('business.platform_commission_bets', '{"rate": 0.05}', 'object', 'business', 'Platform commission on bet winnings (5%)', false, NULL),
('business.referral_bonus', '{"amount": 5}', 'object', 'business', 'Bonus amount for successful referral', false, NULL),
('business.free_tier_features', '{"streaming": false, "betting": true, "articles": true}', 'object', 'business', 'Features available to free tier users', true, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- CATEGORY: FEATURES - Feature Flags
-- ============================================
INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
VALUES
('features.betting_enabled', '{"enabled": true}', 'object', 'features', 'Enable/disable betting system', true, NULL),
('features.streaming_enabled', '{"enabled": true}', 'object', 'features', 'Enable/disable streaming', true, NULL),
('features.articles_enabled', '{"enabled": true}', 'object', 'features', 'Enable/disable articles/news', true, NULL),
('features.wallet_deposits_enabled', '{"enabled": true}', 'object', 'features', 'Enable/disable wallet deposits', true, NULL),
('features.wallet_withdrawals_enabled', '{"enabled": true}', 'object', 'features', 'Enable/disable wallet withdrawals', true, NULL),
('features.referral_program_enabled', '{"enabled": false}', 'object', 'features', 'Enable/disable referral program', true, NULL),
('features.rooster_statistics_enabled', '{"enabled": true}', 'object', 'features', 'Show rooster performance statistics', true, NULL)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Count settings by category
SELECT
    category,
    COUNT(*) as setting_count,
    COUNT(*) FILTER (WHERE is_public = true) as public_count
FROM system_settings
GROUP BY category
ORDER BY category;

-- Show all settings
SELECT key, category, type, description, is_public
FROM system_settings
ORDER BY category, key;
