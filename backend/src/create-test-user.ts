// NUEVO: backend/src/create-test-user.ts
// Script para crear usuarios de prueba

import { config } from "dotenv";
import { connectDatabase } from "./config/database";
import { User, Wallet } from "./models";
import { logger } from "./config/logger";

// Cargar variables de entorno
config();

async function createTestUsers() {
  try {
    logger.info("🧪 Creating test users...");

    // Conectar a la base de datos
    await connectDatabase();

    // Crear usuario de prueba normal
    const existingTestUser = await User.findOne({
      where: { email: "testuser@sportsbets.com" },
    });

    if (!existingTestUser) {
      const testUser = await User.create({
        username: "testuser",
        email: "testuser@sportsbets.com",
        passwordHash: "Test123456", // Se hashea automáticamente
        role: "user",
        profileInfo: {
          fullName: "Usuario de Prueba",
          verificationLevel: "basic",
        },
      });

      // Crear wallet para el usuario de prueba
      await Wallet.create({
        userId: testUser.id,
        balance: 500.00, // Darle saldo inicial para pruebas
        frozenAmount: 0,
      });

      logger.info(`✅ Test user created successfully!`);
      logger.info(`📧 Email: testuser@sportsbets.com`);
      logger.info(`🔐 Password: Test123456`);
    } else {
      logger.info("Test user already exists, skipping creation");
    }

    // Crear usuario operador de prueba
    const existingOperator = await User.findOne({
      where: { email: "operator@sportsbets.com" },
    });

    if (!existingOperator) {
      const operatorUser = await User.create({
        username: "operator",
        email: "operator@sportsbets.com",
        passwordHash: "Operator123", // Se hashea automáticamente
        role: "operator",
        profileInfo: {
          fullName: "Operador de Prueba",
          verificationLevel: "full",
        },
      });

      // Crear wallet para el operador
      await Wallet.create({
        userId: operatorUser.id,
        balance: 0,
        frozenAmount: 0,
      });

      logger.info(`✅ Operator user created successfully!`);
      logger.info(`📧 Email: operator@sportsbets.com`);
      logger.info(`🔐 Password: Operator123`);
    } else {
      logger.info("Operator user already exists, skipping creation");
    }

    logger.info("🎉 Test users setup completed!");
    
    // Mostrar resumen
    logger.info("\n📋 CREDENCIALES DE PRUEBA:");
    logger.info("👑 Admin: admin@sportsbets.com / admin123");
    logger.info("👤 Usuario: testuser@sportsbets.com / Test123456");
    logger.info("🎮 Operador: operator@sportsbets.com / Operator123");

    process.exit(0);
  } catch (error) {
    logger.error("❌ Error creating test users:", error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createTestUsers();
}

export { createTestUsers };