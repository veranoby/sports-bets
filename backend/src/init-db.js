#!/usr/bin/env node
"use strict";
/**
 * Script de inicialización de la base de datos
 * Ejecutar con: npm run db:init
 */
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
exports.initializeDatabase = initializeDatabase;
exports.createDefaultAdmin = createDefaultAdmin;
const dotenv_1 = require("dotenv");
const database_1 = require("./config/database");
const models_1 = require("./models");
const MigrationRunner_1 = require("./migrations/MigrationRunner");
const logger_1 = require("./config/logger");
// Cargar variables de entorno ANTES de cualquier importación de modelos
(0, dotenv_1.config)();
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info("🚀 Starting database initialization...");
            // Conectar a la base de datos
            yield (0, database_1.connectDatabase)();
            // Verificar asociaciones
            (0, models_1.checkAssociations)();
            // Run migrations instead of sync
            const force = process.argv.includes("--force");
            if (force) {
                logger_1.logger.warn("⚠️  Force mode is no longer supported - use migrations: npm run migrate down");
                logger_1.logger.warn("⚠️  Continuing with migration-based initialization...");
            }
            const migrationRunner = new MigrationRunner_1.MigrationRunner();
            yield migrationRunner.migrate();
            // Crear usuario administrador por defecto si no existe
            yield createDefaultAdmin();
            logger_1.logger.info("✅ Database initialization completed successfully!");
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error("❌ Database initialization failed:", error);
            process.exit(1);
        }
    });
}
function createDefaultAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Verificar si ya existe un admin
            const existingAdmin = yield models_1.User.findOne({
                where: { role: "admin" },
            });
            if (existingAdmin) {
                logger_1.logger.info("Admin user already exists, skipping creation");
                return;
            }
            // Crear usuario administrador por defecto
            const adminUser = yield models_1.User.create({
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
            yield models_1.Wallet.create({
                userId: adminUser.id,
                balance: 0,
                frozenAmount: 0,
            });
            logger_1.logger.info(`✅ Default admin user created successfully!`);
            logger_1.logger.info(`📧 Email: admin@sportsbets.com`);
            logger_1.logger.info(`🔐 Password: admin123`);
            logger_1.logger.warn(`⚠️  Please change the default password after first login!`);
        }
        catch (error) {
            logger_1.logger.error("Error creating default admin:", error);
            throw error;
        }
    });
}
// Ejecutar si es llamado directamente
if (require.main === module) {
    initializeDatabase();
}
