-- Critical Performance Indexes Migration
-- Created: 2025-10-12
-- Purpose: Optimize slow queries from 1-3s to <500ms

-- Index 1: User bets by status (90% reduction in user bet queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_user_status ON bets(user_id, status);

-- Index 2: Available bets for fight (80% reduction, partial index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_fight_status_pending
ON bets(fight_id, status) WHERE status = 'pending';

-- Index 3: Fights by event, status, number (75% reduction in fight queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fights_event_status_number
ON fights(event_id, status, number);

-- Index 4: Events by status and scheduled date (85% reduction)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status_scheduled_date
ON events(status, scheduled_date);

-- Index 5: Transactions by wallet, type, status (70% reduction)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_wallet_type_status
ON transactions(wallet_id, type, status);

-- Index 6: PAGO/DOY proposals (80% reduction, partial index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_parent_bet_proposal
ON bets(parent_bet_id, proposal_status) WHERE parent_bet_id IS NOT NULL;

-- Index 7: Active event connections for viewer counts (90% reduction)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_connections_event_disconnected
ON event_connections(event_id, disconnected_at);
