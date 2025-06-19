"use strict";
// backend/src/create-test-user.ts
// Script para revisar usuarios existentes y crear únicos + USUARIO VENUE
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExistingUsers = checkExistingUsers;
const dotenv_1 = require("dotenv");
const database_1 = require("./config/database");
const models_1 = require("./models");
const logger_1 = require("./config/logger");
(0, dotenv_1.config)();
function checkExistingUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info("👥 Checking existing users...");
            yield (0, database_1.connectDatabase)();
            // Obtener todos los usuarios existentes
            const existingUsers = yield models_1.User.findAll({
                attributes: ["id", "username", "email", "role", "isActive"],
                order: [["createdAt", "ASC"]],
            });
            logger_1.logger.info("📊 Current users in database:");
            existingUsers.forEach((user, index) => {
                logger_1.logger.info(`${index + 1}. ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
            });
            logger_1.logger.info(`\n📈 Total users: ${existingUsers.length}`);
            // Crear usuarios de prueba únicos
            yield createUniqueTestUsers(existingUsers);
        }
        catch (error) {
            logger_1.logger.error("❌ Error checking users:", error);
            process.exit(1);
        }
    });
}
function createUniqueTestUsers(existingUsers) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info("\n🧪 Creating unique test users...");
            // Función para generar username único
            const generateUniqueUsername = (baseUsername) => {
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
            const generateUniqueEmail = (baseEmail) => {
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
            const [testUser, testUserCreated] = yield models_1.User.findOrCreate({
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
                yield models_1.Wallet.create({
                    userId: testUser.id,
                    balance: 500,
                    frozenAmount: 0,
                });
                logger_1.logger.info(`✅ Test user created: ${testUsername} (${testEmail}) / Test123456`);
            }
            else {
                logger_1.logger.info(`ℹ️ Test user already exists: ${testUsername}`);
            }
            // Usuario de prueba 2: OPERATOR
            const operatorUsername = generateUniqueUsername("operator");
            const operatorEmail = generateUniqueEmail("operator@sportsbets.com");
            const [operatorUser, operatorCreated] = yield models_1.User.findOrCreate({
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
                yield models_1.Wallet.create({
                    userId: operatorUser.id,
                    balance: 0,
                    frozenAmount: 0,
                });
                logger_1.logger.info(`✅ Operator user created: ${operatorUsername} (${operatorEmail}) / Operator123`);
            }
            else {
                logger_1.logger.info(`ℹ️ Operator user already exists: ${operatorUsername}`);
            }
            // Usuario de prueba 3: VENUE OWNER
            const venueUsername = generateUniqueUsername("venueowner");
            const venueEmail = generateUniqueEmail("venueowner@sportsbets.com");
            const [venueUser, venueUserCreated] = yield models_1.User.findOrCreate({
                where: { email: venueEmail },
                defaults: {
                    username: venueUsername,
                    email: venueEmail,
                    passwordHash: "Venue123", // Hook hashea automáticamente
                    role: "venue",
                    isActive: true,
                    profileInfo: {
                        fullName: "Venue Owner",
                        verificationLevel: "full",
                    },
                },
            });
            if (venueUserCreated) {
                yield models_1.Wallet.create({
                    userId: venueUser.id,
                    balance: 0,
                    frozenAmount: 0,
                });
                // Crear gallera de ejemplo para el venue owner
                yield models_1.Venue.create({
                    name: "Gallera El Ejemplo",
                    location: "Ciudad de Prueba, País Demo",
                    description: "Gallera de ejemplo para testing de la plataforma SportsBets",
                    contactInfo: {
                        email: venueEmail,
                        phone: "+1-555-0123",
                    },
                    ownerId: venueUser.id,
                    status: "active", // Admin pre-aprueba para testing
                    isVerified: true,
                    images: [],
                });
                logger_1.logger.info(`✅ Venue owner created: ${venueUsername} (${venueEmail}) / Venue123`);
                logger_1.logger.info(`✅ Sample venue "Gallera El Ejemplo" created for venue owner`);
            }
            else {
                logger_1.logger.info(`ℹ️ Venue owner already exists: ${venueUsername}`);
            }
            // Verificar que admin existe
            const adminUser = yield models_1.User.findOne({
                where: { role: "admin" },
            });
            if (adminUser) {
                logger_1.logger.info(`✅ Admin user exists: ${adminUser.username} (${adminUser.email})`);
            }
            else {
                logger_1.logger.warn("⚠️ No admin user found!");
            }
            logger_1.logger.info("\n🎉 User creation completed!");
            logger_1.logger.info("\n📧 CREDENTIALS FOR TESTING:");
            logger_1.logger.info(`👤 Test User: ${testUsername} / Test123456`);
            logger_1.logger.info(`🎮 Operator: ${operatorUsername} / Operator123`);
            logger_1.logger.info(`🏛️ Venue Owner: ${venueUsername} / Venue123`);
            if (adminUser) {
                logger_1.logger.info(`👑 Admin: ${adminUser.username} / admin123`);
            }
            logger_1.logger.info("\n🏛️ VENUE TESTING:");
            logger_1.logger.info(`- Venue owner has access to "Gallera El Ejemplo"`);
            logger_1.logger.info(`- Can create more venues through API`);
            logger_1.logger.info(`- Frontend venue panel currently shows "En desarrollo..."`);
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error("❌ Error creating unique users:", error);
            process.exit(1);
        }
    });
}
if (require.main === module) {
    checkExistingUsers();
}
