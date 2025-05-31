// NUEVO: backend/src/create-test-user.ts
// Script para crear usuarios de prueba

import { config } from "dotenv";
import { connectDatabase } from "./config/database";
import { User, Wallet } from "./models";
import { logger } from "./config/logger";
import bcrypt from "bcryptjs";

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
      passwordHash: await bcrypt.hash("Test123456", 10),
      role: "user",
      isActive: true,
      profileInfo: {
        fullName: "Test User",
        verificationLevel: "basic",
      },
    };

    // User 2: Operator
    const operatorData = {
      username: "operator",
      email: "operator@sportsbets.com",
      passwordHash: await bcrypt.hash("Operator123", 10),
      role: "operator",
      isActive: true,
      profileInfo: {
        fullName: "Test Operator",
        verificationLevel: "full",
      },
    };

    // Check and create users
    await createUserIfNotExists(testUserData);
    await createUserIfNotExists(operatorData);

    logger.info("🎉 Test users setup completed!");
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
  const existingUser = await User.findOne({
    where: { email: userData.email },
  });

  if (!existingUser) {
    const user = await User.create(userData);
    await Wallet.create({
      userId: user.id,
      balance: userData.role === "user" ? 500 : 0,
      frozenAmount: 0,
    });
    logger.info(`✅ ${userData.role} user created: ${userData.email}`);
  } else {
    logger.info(`ℹ️ User already exists: ${userData.email}`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createTestUsers();
}

export { createTestUsers };
