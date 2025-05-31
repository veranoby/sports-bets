// CORREGIDO: backend/src/create-test-user.ts
// Script para crear usuarios de prueba - SIN doble hasheo

import { config } from "dotenv";
import { connectDatabase } from "./config/database";
import { User, Wallet } from "./models";
import { logger } from "./config/logger";

// Cargar variables de entorno
config();

async function createTestUsers() {
  try {
    logger.info("🧪 Creating test users...");
    await connectDatabase();

    // User 1: Test User
    const testUserData = {
      username: "testuser",
      email: "testuser@sportsbets.com",
      passwordHash: "Test123456", // ✅ Texto plano (el hook hashea)
      role: "user" as const,
      isActive: true,
      profileInfo: {
        fullName: "Test User",
        verificationLevel: "basic" as const,
      },
    };

    // User 2: Operator
    const operatorData = {
      username: "operator",
      email: "operator@sportsbets.com",
      passwordHash: "Operator123", // ✅ Texto plano (el hook hashea)
      role: "operator" as const,
      isActive: true,
      profileInfo: {
        fullName: "Test Operator",
        verificationLevel: "full" as const,
      },
    };

    // Check and create users
    await createUserIfNotExists(testUserData);
    await createUserIfNotExists(operatorData);

    logger.info("🎉 Test users setup completed!");
    logger.info("📧 Test User: testuser@sportsbets.com / Test123456");
    logger.info("📧 Operator: operator@sportsbets.com / Operator123");
    logger.info("📧 Admin: admin@sportsbets.com / admin123");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error creating test users:");
    if (error.name === "SequelizeValidationError") {
      error.errors.forEach((err: any) => logger.error(`- ${err.message}`));
    } else {
      logger.error(error);
    }
    process.exit(1);
  }
}

async function createUserIfNotExists(userData: any) {
  try {
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });

    if (!existingUser) {
      const user = await User.create(userData);
      await Wallet.create({
        userId: user.id,
        balance: userData.role === "user" ? 500 : 0, // Usuario normal empieza con $500
        frozenAmount: 0,
      });
      logger.info(`✅ ${userData.role} user created: ${userData.email}`);
    } else {
      logger.info(`ℹ️ User already exists: ${userData.email}`);
    }
  } catch (error) {
    logger.error(`Error creating user ${userData.email}:`, error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createTestUsers();
}

export { createTestUsers };
