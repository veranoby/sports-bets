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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunner = void 0;
var sequelize_1 = require("sequelize");
var database_1 = require("../config/database");
var logger_1 = require("../config/logger");
var Migration_1 = __importDefault(require("./Migration"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var MigrationRunner = /** @class */ (function () {
    function MigrationRunner() {
        this.context = {
            queryInterface: database_1.sequelize.getQueryInterface(),
            Sequelize: sequelize_1.DataTypes
        };
    }
    /**
     * Initialize migration system - create schema_migrations table
     */
    MigrationRunner.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.context.queryInterface.createTable('schema_migrations', {
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
                            })];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('✅ Migration system initialized');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        if (error_1.name === 'SequelizeDatabaseError' && error_1.message.includes('already exists')) {
                            logger_1.logger.info('✅ Migration system already initialized');
                        }
                        else {
                            throw error_1;
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Load all migration files from migrations directory
     */
    MigrationRunner.prototype.loadMigrations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var migrationsDir, files, migrations, _i, files_1, file, migrationPath, MigrationClass, migration;
            return __generator(this, function (_a) {
                migrationsDir = path.join(__dirname, '.');
                files = fs.readdirSync(migrationsDir)
                    .filter(function (file) { return file.match(/^\d{4}-\d{2}-\d{2}-\d{6}-.+\.ts$/) && !file.includes('.d.ts'); })
                    .sort();
                migrations = [];
                for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                    file = files_1[_i];
                    try {
                        migrationPath = path.join(migrationsDir, file);
                        MigrationClass = require(migrationPath).default;
                        if (MigrationClass && typeof MigrationClass === 'function') {
                            migration = new MigrationClass();
                            if (migration instanceof Migration_1.default) {
                                migrations.push(migration);
                            }
                            else {
                                logger_1.logger.warn("\u26A0\uFE0F  Skipping ".concat(file, ": not a valid Migration class"));
                            }
                        }
                    }
                    catch (error) {
                        logger_1.logger.error("\u274C Failed to load migration ".concat(file, ":"), error);
                        throw error;
                    }
                }
                logger_1.logger.info("\uD83D\uDCCB Loaded ".concat(migrations.length, " migrations"));
                return [2 /*return*/, migrations];
            });
        });
    };
    /**
     * Get executed migrations from database
     */
    MigrationRunner.prototype.getExecutedMigrations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.context.queryInterface.sequelize.query('SELECT version, description, executed_at, checksum FROM schema_migrations ORDER BY version')];
                    case 1:
                        results = (_a.sent())[0];
                        return [2 /*return*/, results];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('❌ Failed to retrieve executed migrations:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get pending migrations
     */
    MigrationRunner.prototype.getPendingMigrations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allMigrations, executedMigrations, executedVersions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadMigrations()];
                    case 1:
                        allMigrations = _a.sent();
                        return [4 /*yield*/, this.getExecutedMigrations()];
                    case 2:
                        executedMigrations = _a.sent();
                        executedVersions = new Set(executedMigrations.map(function (m) { return m.version; }));
                        return [2 /*return*/, allMigrations.filter(function (migration) { return !executedVersions.has(migration.version); })];
                }
            });
        });
    };
    /**
     * Run all pending migrations
     */
    MigrationRunner.prototype.migrate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pendingMigrations, _i, pendingMigrations_1, migration, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getPendingMigrations()];
                    case 2:
                        pendingMigrations = _a.sent();
                        if (pendingMigrations.length === 0) {
                            logger_1.logger.info('✅ No pending migrations');
                            return [2 /*return*/];
                        }
                        logger_1.logger.info("\uD83D\uDE80 Running ".concat(pendingMigrations.length, " pending migrations"));
                        _i = 0, pendingMigrations_1 = pendingMigrations;
                        _a.label = 3;
                    case 3:
                        if (!(_i < pendingMigrations_1.length)) return [3 /*break*/, 6];
                        migration = pendingMigrations_1[_i];
                        return [4 /*yield*/, migration.execute(this.context)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        logger_1.logger.info('🎉 All migrations completed successfully');
                        return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        logger_1.logger.error('❌ Migration process failed:', error_3);
                        throw error_3;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rollback migrations to a specific version
     */
    MigrationRunner.prototype.rollback = function (targetVersion) {
        return __awaiter(this, void 0, void 0, function () {
            var executedMigrations, allMigrations, lastMigration, migrationsToRollback, _loop_1, this_1, _i, migrationsToRollback_1, executedMigration, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.getExecutedMigrations()];
                    case 1:
                        executedMigrations = _a.sent();
                        return [4 /*yield*/, this.loadMigrations()];
                    case 2:
                        allMigrations = _a.sent();
                        if (executedMigrations.length === 0) {
                            logger_1.logger.info('✅ No migrations to rollback');
                            return [2 /*return*/];
                        }
                        // If no target specified, rollback last migration
                        if (!targetVersion) {
                            lastMigration = executedMigrations[executedMigrations.length - 1];
                            targetVersion = lastMigration.version;
                        }
                        migrationsToRollback = executedMigrations
                            .filter(function (executed) { return executed.version >= targetVersion; })
                            .reverse();
                        logger_1.logger.info("\uD83D\uDD04 Rolling back ".concat(migrationsToRollback.length, " migrations"));
                        _loop_1 = function (executedMigration) {
                            var migration;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        migration = allMigrations.find(function (m) { return m.version === executedMigration.version; });
                                        if (!migration) return [3 /*break*/, 2];
                                        return [4 /*yield*/, migration.rollback(this_1.context)];
                                    case 1:
                                        _b.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        logger_1.logger.warn("\u26A0\uFE0F  Migration ".concat(executedMigration.version, " not found for rollback"));
                                        _b.label = 3;
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, migrationsToRollback_1 = migrationsToRollback;
                        _a.label = 3;
                    case 3:
                        if (!(_i < migrationsToRollback_1.length)) return [3 /*break*/, 6];
                        executedMigration = migrationsToRollback_1[_i];
                        return [5 /*yield**/, _loop_1(executedMigration)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        logger_1.logger.info('🎉 Rollback completed successfully');
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _a.sent();
                        logger_1.logger.error('❌ Rollback process failed:', error_4);
                        throw error_4;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get migration status
     */
    MigrationRunner.prototype.status = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allMigrations, executedMigrations, executedVersions, _loop_2, _i, allMigrations_1, migration, pendingCount, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.loadMigrations()];
                    case 2:
                        allMigrations = _a.sent();
                        return [4 /*yield*/, this.getExecutedMigrations()];
                    case 3:
                        executedMigrations = _a.sent();
                        executedVersions = new Set(executedMigrations.map(function (m) { return m.version; }));
                        logger_1.logger.info('\n📋 MIGRATION STATUS');
                        logger_1.logger.info('===================');
                        if (allMigrations.length === 0) {
                            logger_1.logger.info('No migrations found');
                            return [2 /*return*/];
                        }
                        _loop_2 = function (migration) {
                            var status_1 = executedVersions.has(migration.version) ? '✅' : '⏳';
                            var executedMigration = executedMigrations.find(function (m) { return m.version === migration.version; });
                            logger_1.logger.info("".concat(status_1, " ").concat(migration.version, ": ").concat(migration.description).concat(executedMigration ? " (executed: ".concat(executedMigration.executed_at.toISOString(), ")") : ''));
                        };
                        for (_i = 0, allMigrations_1 = allMigrations; _i < allMigrations_1.length; _i++) {
                            migration = allMigrations_1[_i];
                            _loop_2(migration);
                        }
                        pendingCount = allMigrations.length - executedMigrations.length;
                        logger_1.logger.info("\n\uD83D\uDCCA Summary: ".concat(executedMigrations.length, " executed, ").concat(pendingCount, " pending"));
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        logger_1.logger.error('❌ Failed to get migration status:', error_5);
                        throw error_5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return MigrationRunner;
}());
exports.MigrationRunner = MigrationRunner;
exports.default = MigrationRunner;
