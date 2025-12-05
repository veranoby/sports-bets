-- Migration: Add admin_credit and admin_debit to enum_transactions_type
-- Created: 2025-12-02
-- Purpose: Enable admin manual balance adjustments with proper transaction types

-- Add new enum values
ALTER TYPE enum_transactions_type ADD VALUE IF NOT EXISTS 'admin_credit';
ALTER TYPE enum_transactions_type ADD VALUE IF NOT EXISTS 'admin_debit';

-- Verify enum values
-- SELECT enum_range(NULL::enum_transactions_type);
