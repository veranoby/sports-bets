-- ==========================================
-- GALLOBETS DATABASE MIGRATION SCRIPT
-- Para ejecutar en Neon.tech después de implementar Fases 1, 2 y 3
-- ==========================================

-- FASE 1: Agregar role "gallera" al enum de usuarios
-- ==========================================
BEGIN;

-- 1. Agregar "gallera" al enum de roles de usuario
ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'gallera';

COMMIT;

-- FASE 3: Recrear tablas de suscripciones y pagos (CRÍTICO)
-- ==========================================
BEGIN;

-- 1. Hacer backup de datos existentes de subscriptions (opcional)
CREATE TABLE IF NOT EXISTS subscriptions_backup AS 
SELECT * FROM subscriptions;

-- 2. Eliminar tabla subscriptions existente (cuidado: perderás datos)
DROP TABLE IF EXISTS subscriptions CASCADE;

-- 3. Crear nueva tabla subscriptions con esquema de Phase 3
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) CHECK (type IN ('daily', 'monthly')) DEFAULT 'daily',
    status VARCHAR(20) CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) NOT NULL DEFAULT 'pending',
    "kushkiSubscriptionId" VARCHAR(255) UNIQUE,
    "paymentMethod" VARCHAR(20) CHECK ("paymentMethod" IN ('card', 'cash', 'transfer')) NOT NULL DEFAULT 'card',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    amount INTEGER NOT NULL CHECK (amount >= 0), -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "nextBillingDate" TIMESTAMP WITH TIME ZONE,
    "cancelledAt" TIMESTAMP WITH TIME ZONE,
    "cancelReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0 CHECK ("retryCount" >= 0),
    "maxRetries" INTEGER NOT NULL DEFAULT 3 CHECK ("maxRetries" >= 0),
    features JSONB NOT NULL DEFAULT '["Live streaming", "HD quality", "Chat access"]'::jsonb,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Crear nueva tabla payment_transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    "kushkiPaymentId" VARCHAR(255) UNIQUE,
    "kushkiTransactionId" VARCHAR(255),
    type VARCHAR(30) CHECK (type IN ('subscription_payment', 'one_time_payment', 'refund', 'chargeback')) NOT NULL DEFAULT 'subscription_payment',
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')) NOT NULL DEFAULT 'pending',
    amount INTEGER NOT NULL CHECK (amount >= 0), -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    "paymentMethod" VARCHAR(20) CHECK ("paymentMethod" IN ('card', 'cash', 'transfer')) NOT NULL DEFAULT 'card',
    "cardLast4" VARCHAR(4),
    "cardBrand" VARCHAR(50),
    "errorCode" VARCHAR(100),
    "errorMessage" TEXT,
    "kushkiResponse" JSONB,
    "retryAttempt" INTEGER NOT NULL DEFAULT 0 CHECK ("retryAttempt" >= 0 AND "retryAttempt" <= 3),
    "processedAt" TIMESTAMP WITH TIME ZONE,
    "failedAt" TIMESTAMP WITH TIME ZONE,
    "refundedAt" TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Crear índices para optimización
CREATE INDEX idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_type ON subscriptions(type);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions("expiresAt");
CREATE INDEX idx_subscriptions_kushki_id ON subscriptions("kushkiSubscriptionId") WHERE "kushkiSubscriptionId" IS NOT NULL;
CREATE INDEX idx_subscriptions_status_expires ON subscriptions(status, "expiresAt");
CREATE INDEX idx_subscriptions_retry_count ON subscriptions("retryCount", "maxRetries");

CREATE INDEX idx_payment_transactions_subscription_id ON payment_transactions("subscriptionId");
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX idx_payment_transactions_kushki_payment_id ON payment_transactions("kushkiPaymentId") WHERE "kushkiPaymentId" IS NOT NULL;
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions("createdAt");
CREATE INDEX idx_payment_transactions_processed_at ON payment_transactions("processedAt");
CREATE INDEX idx_payment_transactions_failed_at ON payment_transactions("failedAt");
CREATE INDEX idx_payment_transactions_status_retry ON payment_transactions(status, "retryAttempt");

-- 6. Crear función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Crear triggers para updatedAt
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON payment_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ==========================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ==========================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('subscriptions', 'payment_transactions') 
ORDER BY table_name, ordinal_position;

-- Verificar índices
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename IN ('subscriptions', 'payment_transactions')
ORDER BY tablename, indexname;

-- Verificar que el role 'gallera' fue agregado
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'enum_users_role'
ORDER BY e.enumsortorder;

-- ==========================================
-- COMANDOS OPCIONALES DE ROLLBACK (EMERGENCIA)
-- ==========================================

/*
-- SOLO EJECUTAR EN CASO DE EMERGENCIA PARA REVERTIR CAMBIOS

BEGIN;

-- Restaurar tabla subscriptions desde backup (si existe)
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;

-- Renombrar backup a subscriptions (si tienes backup)
-- ALTER TABLE subscriptions_backup RENAME TO subscriptions;

-- Remover role gallera (CUIDADO: puede fallar si hay usuarios con este role)
-- No hay comando directo para remover valores de enum en PostgreSQL
-- Necesitarías recrear el enum sin 'gallera'

COMMIT;
*/