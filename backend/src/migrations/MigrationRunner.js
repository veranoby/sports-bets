"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunner = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const Migration_1 = __importDefault(require("./Migration"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class MigrationRunner {
    constructor() {
        this.context = {
            queryInterface: database_1.sequelize.getQueryInterface(),
            Sequelize: sequelize_1.DataTypes
        };
    }
    /**
     * Initialize migration system - create schema_migrations table
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.context.queryInterface.createTable('schema_migrations', {
                    version: {
                        type: sequelize_1.DataTypes.STRING(50),
                        primaryKey: true,
                        allowNull: false
                    },
                    description: {
                        type: sequelize_1.DataTypes.STRING(255),
                        allowNull: false
                    },
                    executed_at: {
                        type: sequelize_1.DataTypes.DATE,
                        allowNull: false,
                        defaultValue: sequelize_1.DataTypes.NOW
                    },
                    checksum: {
                        type: sequelize_1.DataTypes.STRING(32),
                        allowNull: false
                    },
                    created_at: {
                        type: sequelize_1.DataTypes.DATE,
                        allowNull: false,
                        defaultValue: sequelize_1.DataTypes.NOW
                    },
                    updated_at: {
                        type: sequelize_1.DataTypes.DATE,
                        allowNull: false,
                        defaultValue: sequelize_1.DataTypes.NOW
                    }
                });
                logger_1.logger.info('✅ Migration system initialized');
            }
            catch (error) {
                if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
                    logger_1.logger.info('✅ Migration system already initialized');
                }
                else {
                    throw error;
                }
            }
        });
    }
    /**
     * Load all migration files from migrations directory
     */
    loadMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            const migrationsDir = path.join(__dirname, '.');
            const files = fs.readdirSync(migrationsDir)
                .filter(file => file.match(/^\d{4}-\d{2}-\d{2}-\d{6}-.+\.ts$/) && !file.includes('.d.ts'))
                .sort();
            const migrations = [];
            for (const file of files) {
                try {
                    const migrationPath = path.join(migrationsDir, file);
                    const MigrationClass = require(migrationPath).default;
                    if (MigrationClass && typeof MigrationClass === 'function') {
                        const migration = new MigrationClass();
                        if (migration instanceof Migration_1.default) {
                            migrations.push(migration);
                        }
                        else {
                            logger_1.logger.warn(`⚠️  Skipping ${file}: not a valid Migration class`);
                        }
                    }
                }
                catch (error) {
                    logger_1.logger.error(`❌ Failed to load migration ${file}:`, error);
                    throw error;
                }
            }
            logger_1.logger.info(`📋 Loaded ${migrations.length} migrations`);
            return migrations;
        });
    }
    /**
     * Get executed migrations from database
     */
    getExecutedMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [results] = yield this.context.queryInterface.sequelize.query('SELECT version, description, executed_at, checksum FROM schema_migrations ORDER BY version');
                return results;
            }
            catch (error) {
                logger_1.logger.error('❌ Failed to retrieve executed migrations:', error);
                throw error;
            }
        });
    }
    /**
     * Get pending migrations
     */
    getPendingMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            const allMigrations = yield this.loadMigrations();
            const executedMigrations = yield this.getExecutedMigrations();
            const executedVersions = new Set(executedMigrations.map(m => m.version));
            return allMigrations.filter(migration => !executedVersions.has(migration.version));
        });
    }
    /**
     * Run all pending migrations
     */
    migrate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                const pendingMigrations = yield this.getPendingMigrations();
                if (pendingMigrations.length === 0) {
                    logger_1.logger.info('✅ No pending migrations');
                    return;
                }
                logger_1.logger.info(`🚀 Running ${pendingMigrations.length} pending migrations`);
                for (const migration of pendingMigrations) {
                    yield migration.execute(this.context);
                }
                logger_1.logger.info('🎉 All migrations completed successfully');
            }
            catch (error) {
                logger_1.logger.error('❌ Migration process failed:', error);
                throw error;
            }
        });
    }
    /**
     * Rollback migrations to a specific version
     */
    rollback(targetVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const executedMigrations = yield this.getExecutedMigrations();
                const allMigrations = yield this.loadMigrations();
                if (executedMigrations.length === 0) {
                    logger_1.logger.info('✅ No migrations to rollback');
                    return;
                }
                // If no target specified, rollback last migration
                if (!targetVersion) {
                    const lastMigration = executedMigrations[executedMigrations.length - 1];
                    targetVersion = lastMigration.version;
                }
                // Find migrations to rollback (in reverse order)
                const migrationsToRollback = executedMigrations
                    .filter(executed => executed.version >= targetVersion)
                    .reverse();
                logger_1.logger.info(`🔄 Rolling back ${migrationsToRollback.length} migrations`);
                for (const executedMigration of migrationsToRollback) {
                    const migration = allMigrations.find(m => m.version === executedMigration.version);
                    if (migration) {
                        yield migration.rollback(this.context);
                    }
                    else {
                        logger_1.logger.warn(`⚠️  Migration ${executedMigration.version} not found for rollback`);
                    }
                }
                logger_1.logger.info('🎉 Rollback completed successfully');
            }
            catch (error) {
                logger_1.logger.error('❌ Rollback process failed:', error);
                throw error;
            }
        });
    }
    /**
     * Get migration status
     */
    status() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                const allMigrations = yield this.loadMigrations();
                const executedMigrations = yield this.getExecutedMigrations();
                const executedVersions = new Set(executedMigrations.map(m => m.version));
                logger_1.logger.info('\n📋 MIGRATION STATUS');
                logger_1.logger.info('===================');
                if (allMigrations.length === 0) {
                    logger_1.logger.info('No migrations found');
                    return;
                }
                for (const migration of allMigrations) {
                    const status = executedVersions.has(migration.version) ? '✅' : '⏳';
                    const executedMigration = executedMigrations.find(m => m.version === migration.version);
                    logger_1.logger.info(`${status} ${migration.version}: ${migration.description}${executedMigration ? ` (executed: ${executedMigration.executed_at.toISOString()})` : ''}`);
                }
                const pendingCount = allMigrations.length - executedMigrations.length;
                logger_1.logger.info(`\n📊 Summary: ${executedMigrations.length} executed, ${pendingCount} pending`);
            }
            catch (error) {
                logger_1.logger.error('❌ Failed to get migration status:', error);
                throw error;
            }
        });
    }
}
exports.MigrationRunner = MigrationRunner;
exports.default = MigrationRunner;
