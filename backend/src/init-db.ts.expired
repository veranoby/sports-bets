#!/usr/bin/env node

/**
 * Script de inicialización de la base de datos
 * Ejecutar con: npm run db:init
 */

import { config } from "dotenv";
import { connectDatabase } from "./config/database";
import { checkAssociations, User, Wallet } from "./models";
import { MigrationRunner } from "./migrations/MigrationRunner";
import { logger } from "./config/logger";

// Cargar variables de entorno ANTES de cualquier importación de modelos
config();

async function initializeDatabase() {
  try {
    logger.info("🚀 Starting database initialization...");

    // Conectar a la base de datos
    await connectDatabase();

    // Verificar asociaciones
    checkAssociations();

    // Run migrations instead of sync
    const force = process.argv.includes("--force");
    if (force) {
      logger.warn("⚠️  Force mode is no longer supported - use migrations: npm run migrate down");
      logger.warn("⚠️  Continuing with migration-based initialization...");
    }

    const migrationRunner = new MigrationRunner();
    await migrationRunner.migrate();

    // Crear usuario administrador por defecto si no existe
    await createDefaultAdmin();

    logger.info("✅ Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

async function createDefaultAdmin() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({
      where: { role: "admin" },
    });

    if (existingAdmin) {
      logger.info("Admin user already exists, skipping creation");
      return;
    }

    // Crear usuario administrador por defecto
    const adminUser = await User.create({
      username: "admin",
      email: "admin@sportsbets.com",
      passwordHash: "admin123", // Se hashea automáticamente
      role: "admin",
      profileInfo: {
        fullName: "System Administrator",
        verificationLevel: "full",
      },
    });

    // Crear wallet para el admin
    await Wallet.create({
      userId: adminUser.id,
      balance: 0,
      frozenAmount: 0,
    });

    logger.info(`✅ Default admin user created successfully!`);
    logger.info(`📧 Email: admin@sportsbets.com`);
    logger.info(`🔐 Password: admin123`);
    logger.warn(`⚠️  Please change the default password after first login!`);
  } catch (error) {
    logger.error("Error creating default admin:", error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase, createDefaultAdmin };
