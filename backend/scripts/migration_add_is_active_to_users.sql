-- Añadir la columna is_active a la tabla users
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Opcional: Actualizar registros existentes para que no sean nulos si es necesario
-- UPDATE users SET is_active = true WHERE is_active IS NULL;
