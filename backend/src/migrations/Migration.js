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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration = void 0;
const logger_1 = require("../config/logger");
class Migration {
    /**
     * Validate migration can be applied safely
     */
    validate(context) {
        return __awaiter(this, void 0, void 0, function* () {
            // Override in child classes for custom validation
            return true;
        });
    }
    /**
     * Execute migration with transaction safety
     */
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield context.queryInterface.sequelize.transaction();
            try {
                logger_1.logger.info(`🔄 Starting migration ${this.version}: ${this.description}`);
                // Validate before execution
                const isValid = yield this.validate(context);
                if (!isValid) {
                    throw new Error(`Migration ${this.version} validation failed`);
                }
                // Execute migration within transaction
                yield this.up(context);
                // Record migration
                yield this.recordMigration(context, transaction);
                yield transaction.commit();
                logger_1.logger.info(`✅ Migration ${this.version} completed successfully`);
            }
            catch (error) {
                yield transaction.rollback();
                logger_1.logger.error(`❌ Migration ${this.version} failed:`, error);
                throw error;
            }
        });
    }
    /**
     * Rollback migration with transaction safety
     */
    rollback(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield context.queryInterface.sequelize.transaction();
            try {
                logger_1.logger.info(`🔄 Rolling back migration ${this.version}: ${this.description}`);
                yield this.down(context);
                // Remove migration record
                yield this.removeMigrationRecord(context, transaction);
                yield transaction.commit();
                logger_1.logger.info(`✅ Migration ${this.version} rolled back successfully`);
            }
            catch (error) {
                yield transaction.rollback();
                logger_1.logger.error(`❌ Migration ${this.version} rollback failed:`, error);
                throw error;
            }
        });
    }
    recordMigration(context, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            yield context.queryInterface.bulkInsert('schema_migrations', [{
                    version: this.version,
                    description: this.description,
                    executed_at: now,
                    checksum: this.getChecksum(),
                    created_at: now,
                    updated_at: now
                }], { transaction });
        });
    }
    removeMigrationRecord(context, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.queryInterface.bulkDelete('schema_migrations', {
                version: this.version
            }, { transaction });
        });
    }
    getChecksum() {
        // Generate checksum based on migration content
        const crypto = require('crypto');
        const content = `${this.version}-${this.description}-${this.up.toString()}-${this.down.toString()}`;
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
}
exports.Migration = Migration;
exports.default = Migration;
