#!/usr/bin/env node
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
const MigrationRunner_1 = require("../migrations/MigrationRunner");
const logger_1 = require("../config/logger");
const command = process.argv[2];
const argument = process.argv[3];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const runner = new MigrationRunner_1.MigrationRunner();
        try {
            switch (command) {
                case 'up':
                case 'migrate':
                    logger_1.logger.info('🚀 Running migrations...');
                    yield runner.migrate();
                    break;
                case 'down':
                case 'rollback':
                    logger_1.logger.info('🔄 Rolling back migrations...');
                    yield runner.rollback(argument);
                    break;
                case 'status':
                    yield runner.status();
                    break;
                case 'init':
                    logger_1.logger.info('🏗️  Initializing migration system...');
                    yield runner.initialize();
                    logger_1.logger.info('✅ Migration system initialized');
                    break;
                default:
                    console.log(`
🏗️  Sports Bets Migration Tool

Usage: npm run migrate <command> [options]

Commands:
  up, migrate     Run all pending migrations
  down, rollback  Rollback migrations (optionally to specific version)
  status          Show migration status
  init            Initialize migration system

Examples:
  npm run migrate up
  npm run migrate status  
  npm run migrate rollback
  npm run migrate rollback 2024-01-01-000001
  npm run migrate init

⚠️  PRODUCTION SAFETY:
- Always backup your database before running migrations
- Test migrations in staging environment first
- Never use Sequelize sync in production
        `);
                    process.exit(1);
            }
            logger_1.logger.info('🎉 Migration command completed successfully');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('❌ Migration command failed:', error);
            process.exit(1);
        }
    });
}
main();
