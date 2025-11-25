-- ============================================
-- ALTER BETS TABLE - ADD 'pago' TO bet_type ENUM
-- Generated: 2025-11-24
-- Purpose: Support PAGO betting type for P2P betting system
-- ============================================

-- Add 'pago' to enum_bets_bet_type
ALTER TYPE enum_bets_bet_type ADD VALUE IF NOT EXISTS 'pago';

-- Verify enum values
SELECT unnest(enum_range(NULL::enum_bets_bet_type)) AS bet_type_values;

-- ============================================
-- VERIFICATION: Check bets table structure
-- ============================================
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bets'
ORDER BY ordinal_position;

COMMENT ON TABLE bets IS 'P2P betting system with flat/doy/pago types. Supports proposal workflows with PAGO (counter-offer) and DOY (advantage offer).';
COMMENT ON COLUMN bets.bet_type IS 'Bet type: flat (symmetric), doy (offer advantage), pago (counter-offer with different amount)';
COMMENT ON COLUMN bets.terms IS 'JSONB: { pagoAmount?, doyAmount?, ratio, isOffer, proposedBy? }';
COMMENT ON COLUMN bets.proposal_status IS 'Proposal status for PAGO workflow: none, pending, accepted, rejected';
COMMENT ON COLUMN bets.matched_with IS 'UUID of matched bet (for completed P2P match)';
COMMENT ON COLUMN bets.parent_bet_id IS 'UUID of parent bet (for PAGO proposals linked to original bet)';
