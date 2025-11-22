"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration = void 0;
var logger_1 = require("../config/logger");
var Migration = /** @class */ (function () {
    function Migration() {
    }
    /**
     * Validate migration can be applied safely
     */
    Migration.prototype.validate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Override in child classes for custom validation
                return [2 /*return*/, true];
            });
        });
    };
    /**
     * Execute migration with transaction safety
     */
    Migration.prototype.execute = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, isValid, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.queryInterface.sequelize.transaction()];
                    case 1:
                        transaction = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 9]);
                        logger_1.logger.info("\uD83D\uDD04 Starting migration ".concat(this.version, ": ").concat(this.description));
                        return [4 /*yield*/, this.validate(context)];
                    case 3:
                        isValid = _a.sent();
                        if (!isValid) {
                            throw new Error("Migration ".concat(this.version, " validation failed"));
                        }
                        // Execute migration within transaction
                        return [4 /*yield*/, this.up(context)];
                    case 4:
                        // Execute migration within transaction
                        _a.sent();
                        // Record migration
                        return [4 /*yield*/, this.recordMigration(context, transaction)];
                    case 5:
                        // Record migration
                        _a.sent();
                        return [4 /*yield*/, transaction.commit()];
                    case 6:
                        _a.sent();
                        logger_1.logger.info("\u2705 Migration ".concat(this.version, " completed successfully"));
                        return [3 /*break*/, 9];
                    case 7:
                        error_1 = _a.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 8:
                        _a.sent();
                        logger_1.logger.error("\u274C Migration ".concat(this.version, " failed:"), error_1);
                        throw error_1;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rollback migration with transaction safety
     */
    Migration.prototype.rollback = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.queryInterface.sequelize.transaction()];
                    case 1:
                        transaction = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        logger_1.logger.info("\uD83D\uDD04 Rolling back migration ".concat(this.version, ": ").concat(this.description));
                        return [4 /*yield*/, this.down(context)];
                    case 3:
                        _a.sent();
                        // Remove migration record
                        return [4 /*yield*/, this.removeMigrationRecord(context, transaction)];
                    case 4:
                        // Remove migration record
                        _a.sent();
                        return [4 /*yield*/, transaction.commit()];
                    case 5:
                        _a.sent();
                        logger_1.logger.info("\u2705 Migration ".concat(this.version, " rolled back successfully"));
                        return [3 /*break*/, 8];
                    case 6:
                        error_2 = _a.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 7:
                        _a.sent();
                        logger_1.logger.error("\u274C Migration ".concat(this.version, " rollback failed:"), error_2);
                        throw error_2;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    Migration.prototype.recordMigration = function (context, transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        return [4 /*yield*/, context.queryInterface.bulkInsert('schema_migrations', [{
                                    version: this.version,
                                    description: this.description,
                                    executed_at: now,
                                    checksum: this.getChecksum(),
                                    created_at: now,
                                    updated_at: now
                                }], { transaction: transaction })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Migration.prototype.removeMigrationRecord = function (context, transaction) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, context.queryInterface.bulkDelete('schema_migrations', {
                            version: this.version
                        }, { transaction: transaction })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Migration.prototype.getChecksum = function () {
        // Generate checksum based on migration content
        var crypto = require('crypto');
        var content = "".concat(this.version, "-").concat(this.description, "-").concat(this.up.toString(), "-").concat(this.down.toString());
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    };
    return Migration;
}());
exports.Migration = Migration;
exports.default = Migration;
