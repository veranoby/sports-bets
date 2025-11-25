-- ============================================
-- SQL SCHEMA FOR WALLET OPERATIONS
-- Generated: 2025-11-24
-- Purpose: Deposit/withdrawal requests with admin approval
-- ============================================

-- ============================================
-- WALLET_OPERATIONS: Deposit/Withdrawal requests
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User and wallet reference
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,

    -- Operation details
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('deposit', 'withdrawal')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Request status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),

    -- Payment proof
    payment_proof_url VARCHAR(500), -- Screenshot/receipt upload
    payment_method VARCHAR(50), -- 'bank_transfer', 'cash', 'mobile_payment'
    bank_reference VARCHAR(255),

    -- User notes
    user_notes TEXT, -- User explanation/details

    -- Admin processing
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    admin_notes TEXT,
    rejection_reason TEXT,
    admin_proof_url VARCHAR(500), -- Admin uploads transfer receipt (withdrawals)

    -- Timestamps
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for wallet_operations
CREATE INDEX idx_wallet_operations_user ON wallet_operations(user_id);
CREATE INDEX idx_wallet_operations_wallet ON wallet_operations(wallet_id);
CREATE INDEX idx_wallet_operations_status ON wallet_operations(status);
CREATE INDEX idx_wallet_operations_type ON wallet_operations(operation_type);
CREATE INDEX idx_wallet_operations_requested ON wallet_operations(requested_at DESC);
CREATE INDEX idx_wallet_operations_pending ON wallet_operations(status, requested_at) WHERE status = 'pending';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_wallet_operations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_operations_updated_at
    BEFORE UPDATE ON wallet_operations
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_operations_timestamp();

COMMENT ON TABLE wallet_operations IS 'Manual wallet deposit and withdrawal requests requiring admin approval';
COMMENT ON COLUMN wallet_operations.payment_proof_url IS 'User uploads bank transfer screenshot or payment receipt';
COMMENT ON COLUMN wallet_operations.admin_proof_url IS 'Admin uploads transfer completion receipt (for withdrawals)';


-- ============================================
-- VERIFICATION: Verify system_settings table exists
-- ============================================
-- Table already exists, just adding comment
COMMENT ON TABLE system_settings IS 'Universal configuration table for all application settings (business rules, limits, features). Infrastructure settings (DB, Redis, RTMP) remain in .env';
COMMENT ON COLUMN system_settings.key IS 'Unique configuration key (e.g., wallet.deposit_max_daily, betting.max_amount)';
COMMENT ON COLUMN system_settings.value IS 'JSONB value allowing complex configuration objects';
COMMENT ON COLUMN system_settings.type IS 'Data type hint: number, string, boolean, array, object';
COMMENT ON COLUMN system_settings.category IS 'Configuration category: wallets, betting, streaming, cache, security, notifications, system, limits, performance, business';
COMMENT ON COLUMN system_settings.is_public IS 'Whether this setting can be read by non-admin users';
