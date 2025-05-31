// backend/src/check-existing-users.ts
// Script para revisar usuarios existentes y crear únicos

import { config } from "dotenv";
import { connectDatabase } from "./config/database";
import { User, Wallet } from "./models";
import { logger } from "./config/logger";

config();

async function checkExistingUsers() {
  try {
    logger.info("👥 Checking existing users...");
    await connectDatabase();

    // Obtener todos los usuarios existentes
    const existingUsers = await User.findAll({
      attributes: ["id", "username", "email", "role", "isActive"],
      order: [["createdAt", "ASC"]],
    });

    logger.info("📊 Current users in database:");
    existingUsers.forEach((user, index) => {
      logger.info(
        `${index + 1}. ${user.username} (${user.email}) - Role: ${
          user.role
        } - Active: ${user.isActive}`
      );
    });

    logger.info(`\n📈 Total users: ${existingUsers.length}`);

    // Crear usuarios de prueba únicos
    await createUniqueTestUsers(existingUsers);
  } catch (error) {
    logger.error("❌ Error checking users:", error);
    process.exit(1);
  }
}

async function createUniqueTestUsers(existingUsers: any[]) {
  try {
    logger.info("\n🧪 Creating unique test users...");

    // Función para generar username único
    const generateUniqueUsername = (baseUsername: string): string => {
      const existingUsernames = existingUsers.map((u) => u.username);

      if (!existingUsernames.includes(baseUsername)) {
        return baseUsername;
      }

      let counter = 1;
      let newUsername = `${baseUsername}${counter}`;
      while (existingUsernames.includes(newUsername)) {
        counter++;
        newUsername = `${baseUsername}${counter}`;
      }
      return newUsername;
    };

    // Función para generar email único
    const generateUniqueEmail = (baseEmail: string): string => {
      const existingEmails = existingUsers.map((u) => u.email);

      if (!existingEmails.includes(baseEmail)) {
        return baseEmail;
      }

      const [name, domain] = baseEmail.split("@");
      let counter = 1;
      let newEmail = `${name}${counter}@${domain}`;
      while (existingEmails.includes(newEmail)) {
        counter++;
        newEmail = `${name}${counter}@${domain}`;
      }
      return newEmail;
    };

    // Usuario de prueba 1: USER
    const testUsername = generateUniqueUsername("testuser");
    const testEmail = generateUniqueEmail("testuser@sportsbets.com");

    const [testUser, testUserCreated] = await User.findOrCreate({
      where: { email: testEmail },
      defaults: {
        username: testUsername,
        email: testEmail,
        passwordHash: "Test123456", // Hook hashea automáticamente
        role: "user",
        isActive: true,
        profileInfo: {
          fullName: "Test User",
          verificationLevel: "basic",
        },
      },
    });

    if (testUserCreated) {
      await Wallet.create({
        userId: testUser.id,
        balance: 500,
        frozenAmount: 0,
      });
      logger.info(
        `✅ Test user created: ${testUsername} (${testEmail}) / Test123456`
      );
    } else {
      logger.info(`ℹ️ Test user already exists: ${testUsername}`);
    }

    // Usuario de prueba 2: OPERATOR
    const operatorUsername = generateUniqueUsername("operator");
    const operatorEmail = generateUniqueEmail("operator@sportsbets.com");

    const [operatorUser, operatorCreated] = await User.findOrCreate({
      where: { email: operatorEmail },
      defaults: {
        username: operatorUsername,
        email: operatorEmail,
        passwordHash: "Operator123", // Hook hashea automáticamente
        role: "operator",
        isActive: true,
        profileInfo: {
          fullName: "Test Operator",
          verificationLevel: "full",
        },
      },
    });

    if (operatorCreated) {
      await Wallet.create({
        userId: operatorUser.id,
        balance: 0,
        frozenAmount: 0,
      });
      logger.info(
        `✅ Operator user created: ${operatorUsername} (${operatorEmail}) / Operator123`
      );
    } else {
      logger.info(`ℹ️ Operator user already exists: ${operatorUsername}`);
    }

    // Verificar que admin existe
    const adminUser = await User.findOne({
      where: { role: "admin" },
    });

    if (adminUser) {
      logger.info(
        `✅ Admin user exists: ${adminUser.username} (${adminUser.email})`
      );
    } else {
      logger.warn("⚠️ No admin user found!");
    }

    logger.info("\n🎉 User creation completed!");
    logger.info("\n📧 CREDENTIALS FOR TESTING:");
    logger.info(`👤 Test User: ${testUsername} / Test123456`);
    logger.info(`🎮 Operator: ${operatorUsername} / Operator123`);
    if (adminUser) {
      logger.info(`👑 Admin: ${adminUser.username} / admin123`);
    }

    process.exit(0);
  } catch (error) {
    logger.error("❌ Error creating unique users:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  checkExistingUsers();
}

export { checkExistingUsers };
