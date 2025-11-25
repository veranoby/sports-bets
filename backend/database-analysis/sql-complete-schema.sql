-- ========================================
-- COMPLETE DATABASE SCHEMA FOR sports_bets
-- Generated from current database state
-- PostgreSQL Production-Ready Schema
-- ========================================

-- ========================================
-- SECTION 1: DROP EXISTING SCHEMA (OPTIONAL)
-- ========================================
-- Uncomment the following lines to drop all objects before recreation
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- ========================================
-- SECTION 2: ENUM TYPES
-- ========================================

CREATE TYPE enum_users_role AS ENUM ('admin', 'operator', 'venue', 'user', 'gallera');
CREATE TYPE enum_events_status AS ENUM ('scheduled', 'in-progress', 'completed', 'cancelled');
CREATE TYPE enum_fights_status AS ENUM ('upcoming', 'betting', 'live', 'completed', 'cancelled');
CREATE TYPE enum_fights_result AS ENUM ('red', 'blue', 'draw', 'cancelled');
CREATE TYPE enum_bets_side AS ENUM ('red', 'blue');
CREATE TYPE enum_bets_bet_type AS ENUM ('flat', 'doy', 'pago');
CREATE TYPE enum_bets_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE enum_bets_result AS ENUM ('win', 'loss', 'draw', 'cancelled');
CREATE TYPE enum_bets_proposal_status AS ENUM ('none', 'pending', 'accepted', 'rejected');
CREATE TYPE enum_transactions_type AS ENUM ('deposit', 'withdrawal', 'bet-win', 'bet-loss', 'bet-refund');
CREATE TYPE enum_transactions_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE enum_notifications_type AS ENUM ('info', 'warning', 'error', 'success', 'bet_proposal');
CREATE TYPE enum_notifications_status AS ENUM ('unread', 'read', 'archived');
CREATE TYPE enum_subscriptions_type AS ENUM ('daily', 'monthly');
CREATE TYPE enum_subscriptions_plan AS ENUM ('daily', 'monthly');
CREATE TYPE enum_subscriptions_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE enum_subscriptions_payment_method AS ENUM ('card', 'cash', 'transfer');
CREATE TYPE enum_payment_transactions_transaction_type AS ENUM ('subscription_payment', 'subscription_refund', 'bet_deposit', 'bet_withdrawal');
CREATE TYPE enum_payment_transactions_payment_method AS ENUM ('card', 'cash', 'transfer', 'wallet');
CREATE TYPE enum_payment_transactions_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE enum_membership_change_requests_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE enum_articles_category AS ENUM ('news', 'analysis', 'tutorial', 'announcement');
CREATE TYPE enum_articles_status AS ENUM ('draft', 'pending', 'published', 'archived');

-- ========================================
-- SECTION 3: TABLES
-- ========================================

-- Migration tracking tables
CREATE TABLE "SequelizeMeta" (
    name VARCHAR(255) NOT NULL PRIMARY KEY
);

CREATE TABLE schema_migrations (
    version VARCHAR(50) NOT NULL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL,
    checksum VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- Core users table
CREATE TABLE users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role enum_users_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    profile_info JSONB DEFAULT '{"businessEntities": {}, "verificationLevel": "none"}',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_expires TIMESTAMP,
    approved BOOLEAN DEFAULT false
);

-- Active sessions table
CREATE TABLE active_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    device_fingerprint VARCHAR(255)
);

-- Wallets table
CREATE TABLE wallets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    balance NUMERIC NOT NULL DEFAULT 0,
    frozen_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- Transactions table
CREATE TABLE transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID NOT NULL,
    type enum_transactions_type NOT NULL,
    amount NUMERIC NOT NULL,
    status enum_transactions_status NOT NULL DEFAULT 'pending',
    description VARCHAR(500) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    reference VARCHAR(255)
);

-- Wallet operations table
CREATE TABLE wallet_operations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('deposit', 'withdrawal')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    payment_proof_url VARCHAR(500),
    payment_method VARCHAR(50),
    bank_reference VARCHAR(255),
    user_notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    admin_notes TEXT,
    rejection_reason TEXT,
    admin_proof_url VARCHAR(500),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    venue_id UUID NOT NULL,
    operator_id UUID,
    created_by UUID NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    status enum_events_status NOT NULL DEFAULT 'scheduled',
    stream_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    stream_url VARCHAR(500),
    total_fights INTEGER NOT NULL DEFAULT 0,
    completed_fights INTEGER NOT NULL DEFAULT 0,
    total_bets INTEGER NOT NULL DEFAULT 0,
    total_prize_pool NUMERIC NOT NULL DEFAULT 0
);

-- Event connections table
CREATE TABLE event_connections (
    id SERIAL PRIMARY KEY,
    event_id INTEGER,
    user_id INTEGER,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fights table
CREATE TABLE fights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL,
    status enum_fights_status NOT NULL DEFAULT 'upcoming',
    result enum_fights_result,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    number INTEGER NOT NULL,
    red_corner VARCHAR(255) NOT NULL,
    blue_corner VARCHAR(255) NOT NULL,
    weight NUMERIC NOT NULL,
    notes TEXT,
    initial_odds JSONB DEFAULT '{"red": 1, "blue": 1}',
    betting_start_time TIMESTAMPTZ,
    betting_end_time TIMESTAMPTZ,
    total_bets INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    UNIQUE (event_id, number)
);

-- Bets table
CREATE TABLE bets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    fight_id UUID NOT NULL,
    side enum_bets_side NOT NULL,
    amount NUMERIC NOT NULL,
    bet_type enum_bets_bet_type NOT NULL DEFAULT 'flat',
    status enum_bets_status NOT NULL DEFAULT 'pending',
    result enum_bets_result,
    proposal_status enum_bets_proposal_status NOT NULL DEFAULT 'none',
    matched_with UUID,
    parent_bet_id UUID,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    potential_win NUMERIC NOT NULL,
    terms JSONB DEFAULT '{"ratio": 2, "isOffer": true}',
    UNIQUE (fight_id, user_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    type enum_notifications_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(10) DEFAULT 'unread'
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    type enum_subscriptions_type NOT NULL,
    status enum_subscriptions_status NOT NULL DEFAULT 'pending',
    kushki_subscription_id VARCHAR(255) UNIQUE,
    payment_method enum_subscriptions_payment_method NOT NULL DEFAULT 'card',
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    expires_at TIMESTAMPTZ NOT NULL,
    next_billing_date TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    features JSON NOT NULL,
    metadata JSON,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    manual_expires_at TIMESTAMP,
    payment_proof_url VARCHAR(500),
    assigned_by_admin_id UUID,
    assigned_username VARCHAR(255)
);

-- Payment transactions table
CREATE TABLE payment_transactions (
    id UUID NOT NULL PRIMARY KEY,
    subscription_id UUID,
    user_id UUID NOT NULL,
    kushki_transaction_id VARCHAR(255) UNIQUE,
    kushki_ticket_number VARCHAR(255),
    transaction_type enum_payment_transactions_transaction_type NOT NULL,
    payment_method enum_payment_transactions_payment_method NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status enum_payment_transactions_status NOT NULL DEFAULT 'pending',
    gateway_status VARCHAR(50),
    gateway_response JSON,
    failure_reason TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    processed_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    metadata JSON,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- Membership change requests table
CREATE TABLE membership_change_requests (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    current_membership_type VARCHAR(50),
    requested_membership_type VARCHAR(50) NOT NULL,
    status enum_membership_change_requests_status NOT NULL DEFAULT 'pending',
    request_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    payment_proof_url VARCHAR(500)
);

-- Articles table
CREATE TABLE articles (
    id UUID NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID NOT NULL,
    category enum_articles_category NOT NULL DEFAULT 'news',
    status enum_articles_status NOT NULL DEFAULT 'draft',
    featured_image VARCHAR(500),
    tags JSON,
    view_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    admin_rejection_message TEXT
);

-- System settings table
CREATE TABLE system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- SECTION 4: FOREIGN KEYS
-- ========================================

ALTER TABLE active_sessions ADD CONSTRAINT active_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE articles ADD CONSTRAINT articles_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE bets ADD CONSTRAINT bets_fight_id_fkey
    FOREIGN KEY (fight_id) REFERENCES fights(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE bets ADD CONSTRAINT bets_matched_with_fkey
    FOREIGN KEY (matched_with) REFERENCES bets(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE bets ADD CONSTRAINT bets_parent_bet_id_fkey
    FOREIGN KEY (parent_bet_id) REFERENCES bets(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE bets ADD CONSTRAINT bets_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE events ADD CONSTRAINT events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE events ADD CONSTRAINT events_operator_id_fkey
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE events ADD CONSTRAINT events_venue_id_fkey
    FOREIGN KEY (venue_id) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE fights ADD CONSTRAINT fights_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE membership_change_requests ADD CONSTRAINT membership_change_requests_processed_by_fkey
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE membership_change_requests ADD CONSTRAINT membership_change_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_subscription_id_fkey
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE subscriptions ADD CONSTRAINT fk_subscriptions_admin
    FOREIGN KEY (assigned_by_admin_id) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE system_settings ADD CONSTRAINT system_settings_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE transactions ADD CONSTRAINT transactions_wallet_id_fkey
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE wallet_operations ADD CONSTRAINT wallet_operations_processed_by_fkey
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE wallet_operations ADD CONSTRAINT wallet_operations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE wallet_operations ADD CONSTRAINT wallet_operations_wallet_id_fkey
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- SECTION 5: INDEXES
-- ========================================

-- Users indexes
CREATE INDEX users_role ON users USING btree (role);
CREATE INDEX users_is_active ON users USING btree (is_active);
CREATE INDEX idx_users_role_active ON users USING btree (role, is_active);
CREATE INDEX idx_users_role_active_last_login ON users USING btree (role, is_active, last_login);
CREATE INDEX idx_users_role_active_optimized ON users USING btree (role, is_active, created_at);
CREATE INDEX idx_users_role_approved ON users USING btree (role, approved);
CREATE INDEX idx_users_approved ON users USING btree (approved);
CREATE INDEX idx_users_email_active ON users USING btree (email, is_active);
CREATE INDEX idx_users_email_login_optimized ON users USING btree (email, is_active, last_login);
CREATE INDEX idx_users_verification_token ON users USING btree (verification_token);
CREATE INDEX idx_users_id_active ON users USING btree (id, is_active) WHERE (is_active = true);
CREATE INDEX idx_users_profile_info_gin ON users USING gin (profile_info);
CREATE INDEX idx_users_business_entities ON users USING gin ((profile_info -> 'businessEntities'));
CREATE INDEX idx_users_venue_status ON users USING btree ((((profile_info -> 'businessEntities') -> 'venue') ->> 'status')) WHERE (role = 'venue');
CREATE INDEX idx_users_gallera_status ON users USING btree ((((profile_info -> 'businessEntities') -> 'gallera') ->> 'status')) WHERE (role = 'gallera');

-- Active sessions indexes
CREATE INDEX idx_active_sessions_user_id ON active_sessions USING btree (user_id);
CREATE INDEX idx_active_sessions_token ON active_sessions USING btree (session_token);
CREATE INDEX idx_active_sessions_expires ON active_sessions USING btree (expires_at);
CREATE INDEX idx_active_sessions_user_active ON active_sessions USING btree (user_id, expires_at);
CREATE INDEX idx_active_sessions_last_activity ON active_sessions USING btree (last_activity);
CREATE INDEX idx_active_sessions_ip ON active_sessions USING btree (ip_address);
CREATE INDEX idx_active_sessions_device ON active_sessions USING btree (device_fingerprint);

-- Wallets indexes
CREATE INDEX idx_wallets_user_id ON wallets USING btree (user_id);

-- Transactions indexes
CREATE INDEX transactions_wallet_id ON transactions USING btree (wallet_id);
CREATE INDEX transactions_type ON transactions USING btree (type);
CREATE INDEX transactions_status ON transactions USING btree (status);
CREATE INDEX transactions_created_at ON transactions USING btree (created_at);
CREATE INDEX transactions_reference ON transactions USING btree (reference);
CREATE INDEX transactions_wallet_id_created_at ON transactions USING btree (wallet_id, created_at);
CREATE INDEX idx_transactions_wallet_date ON transactions USING btree (wallet_id, created_at DESC);
CREATE INDEX idx_transactions_wallet_type ON transactions USING btree (wallet_id, type, status);
CREATE INDEX idx_transactions_wallet_type_status ON transactions USING btree (wallet_id, type, status);
CREATE INDEX idx_transactions_wallet_status_created_at ON transactions USING btree (wallet_id, status, created_at);

-- Wallet operations indexes
CREATE INDEX idx_wallet_operations_user ON wallet_operations USING btree (user_id);
CREATE INDEX idx_wallet_operations_wallet ON wallet_operations USING btree (wallet_id);
CREATE INDEX idx_wallet_operations_status ON wallet_operations USING btree (status);
CREATE INDEX idx_wallet_operations_type ON wallet_operations USING btree (operation_type);
CREATE INDEX idx_wallet_operations_requested ON wallet_operations USING btree (requested_at DESC);
CREATE INDEX idx_wallet_operations_pending ON wallet_operations USING btree (status, requested_at) WHERE (status = 'pending');

-- Events indexes
CREATE INDEX events_venue_id ON events USING btree (venue_id);
CREATE INDEX events_operator_id ON events USING btree (operator_id);
CREATE INDEX events_status ON events USING btree (status);
CREATE INDEX events_scheduled_date ON events USING btree (scheduled_date);
CREATE INDEX events_venue_id_scheduled_date ON events USING btree (venue_id, scheduled_date);
CREATE INDEX idx_events_scheduled_date ON events USING btree (scheduled_date);
CREATE INDEX idx_events_status_scheduled_date ON events USING btree (status, scheduled_date);
CREATE INDEX idx_events_venue_status ON events USING btree (venue_id, status);
CREATE INDEX idx_events_status_date_optimized ON events USING btree (status, scheduled_date, venue_id);

-- Event connections indexes
CREATE INDEX idx_event_connections_event_id ON event_connections USING btree (event_id);
CREATE INDEX idx_event_connections_user_id ON event_connections USING btree (user_id);
CREATE INDEX idx_event_connections_connected_at ON event_connections USING btree (connected_at);
CREATE INDEX idx_event_connections_event_disconnected ON event_connections USING btree (event_id, disconnected_at);

-- Fights indexes
CREATE INDEX fights_event_id ON fights USING btree (event_id);
CREATE INDEX fights_status ON fights USING btree (status);
CREATE INDEX fights_event_id_status ON fights USING btree (event_id, status);
CREATE INDEX idx_fights_event_status ON fights USING btree (event_id, status);
CREATE INDEX idx_fights_event_status_number ON fights USING btree (event_id, status, number);
CREATE INDEX idx_fights_event_betting ON fights USING btree (event_id, status) WHERE (status = 'betting');

-- Bets indexes
CREATE INDEX bets_status ON bets USING btree (status);
CREATE INDEX bets_proposal_status ON bets USING btree (proposal_status);
CREATE INDEX bets_bet_type ON bets USING btree (bet_type);
CREATE INDEX bets_created_at ON bets USING btree (created_at);
CREATE INDEX bets_fight_id_status ON bets USING btree (fight_id, status);
CREATE INDEX bets_matched_with ON bets USING btree (matched_with);
CREATE INDEX bets_parent_bet_id ON bets USING btree (parent_bet_id);
CREATE INDEX idx_bets_user_status ON bets USING btree (user_id, status);
CREATE INDEX idx_bets_user_created_at ON bets USING btree (user_id, created_at);
CREATE INDEX idx_bets_fight_side ON bets USING btree (fight_id, side, status);
CREATE INDEX idx_bets_fight_status_created_at ON bets USING btree (fight_id, status, created_at);
CREATE INDEX idx_bets_fight_status_pending ON bets USING btree (fight_id, status) WHERE (status = 'pending');
CREATE INDEX idx_bets_parent_bet_proposal ON bets USING btree (parent_bet_id, proposal_status) WHERE (parent_bet_id IS NOT NULL);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications USING btree (user_id);
CREATE INDEX idx_notifications_type ON notifications USING btree (type);
CREATE INDEX idx_notifications_expires_at ON notifications USING btree (expires_at);
CREATE INDEX idx_notifications_user_read ON notifications USING btree (user_id, is_read, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications USING btree (user_id, is_read, created_at) WHERE (is_read = false);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions USING btree (user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions USING btree (status);
CREATE INDEX idx_subscriptions_type ON subscriptions USING btree (type);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions USING btree (expires_at);
CREATE INDEX idx_subscriptions_user_status ON subscriptions USING btree (user_id, status);
CREATE INDEX idx_subscriptions_user_active ON subscriptions USING btree (user_id, status, expires_at);
CREATE INDEX idx_subscriptions_status_expires ON subscriptions USING btree (status, expires_at);
CREATE INDEX idx_subscriptions_retry ON subscriptions USING btree (retry_count, max_retries);
CREATE INDEX idx_subscriptions_user_created ON subscriptions USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL);

-- Payment transactions indexes
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions USING btree (user_id);
CREATE INDEX idx_payment_transactions_subscription_id ON payment_transactions USING btree (subscription_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions USING btree (status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions USING btree (created_at);
CREATE INDEX idx_payment_transactions_user_status ON payment_transactions USING btree (user_id, status);
CREATE INDEX idx_payment_transactions_type_status ON payment_transactions USING btree (transaction_type, status);
CREATE UNIQUE INDEX payment_transactions_kushki_transaction_id_unique ON payment_transactions USING btree (kushki_transaction_id) WHERE (kushki_transaction_id IS NOT NULL);
CREATE UNIQUE INDEX payment_transactions_idempotency_key_unique ON payment_transactions USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);

-- Membership change requests indexes
CREATE INDEX idx_membership_requests_user_status ON membership_change_requests USING btree (user_id, status);
CREATE INDEX idx_membership_requests_processor ON membership_change_requests USING btree (processed_by);
CREATE INDEX idx_membership_requests_pending ON membership_change_requests USING btree (status, requested_at) WHERE (status = 'pending');
CREATE INDEX idx_membership_requests_status_requested ON membership_change_requests USING btree (status, requested_at DESC) WHERE (status IS NOT NULL);
CREATE INDEX idx_membership_requests_pending_optimized ON membership_change_requests USING btree (status, requested_at DESC, user_id) WHERE (status = 'pending');

-- Articles indexes
CREATE INDEX idx_articles_author_id ON articles USING btree (author_id);
CREATE INDEX idx_articles_category_status ON articles USING btree (category, status);
CREATE INDEX idx_articles_status_published_at ON articles USING btree (status, published_at);
CREATE INDEX idx_articles_status_published ON articles USING btree (status, published_at DESC) WHERE (status = 'published');
CREATE INDEX idx_articles_featured ON articles USING btree (status, featured_image, published_at) WHERE (status = 'published' AND featured_image IS NOT NULL);
CREATE INDEX idx_articles_author_status_published ON articles USING btree (author_id, status, published_at) WHERE (status = ANY (ARRAY['published', 'pending']));
CREATE UNIQUE INDEX articles_slug_unique ON articles USING btree (slug);

-- System settings indexes
CREATE INDEX idx_system_settings_key ON system_settings USING btree (key);
CREATE INDEX idx_system_settings_category ON system_settings USING btree (category);
CREATE INDEX idx_system_settings_public ON system_settings USING btree (is_public);

-- ========================================
-- SECTION 6: COMMENTS (OPTIONAL)
-- ========================================

COMMENT ON TABLE users IS 'Core users table with role-based access control';
COMMENT ON TABLE wallets IS 'User wallet balances and frozen amounts';
COMMENT ON TABLE transactions IS 'All financial transactions (deposits, withdrawals, bets)';
COMMENT ON TABLE wallet_operations IS 'Manual wallet operations requiring admin approval';
COMMENT ON TABLE events IS 'Cockfighting events with venue and scheduling';
COMMENT ON TABLE fights IS 'Individual fights within events';
COMMENT ON TABLE bets IS 'User bets on fights with P2P matching support';
COMMENT ON TABLE notifications IS 'User notification system';
COMMENT ON TABLE subscriptions IS 'User subscription management';
COMMENT ON TABLE payment_transactions IS 'Payment gateway transactions';
COMMENT ON TABLE articles IS 'Content management system for articles';
COMMENT ON TABLE system_settings IS 'System-wide configuration settings';

-- ========================================
-- END OF SCHEMA
-- ========================================
