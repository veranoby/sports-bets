#!/usr/bin/env node

import { MigrationRunner } from '../migrations/MigrationRunner';
import { logger } from '../config/logger';

const command = process.argv[2];
const argument = process.argv[3];

async function main() {
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        logger.info('🚀 Running migrations...');
        await runner.migrate();
        break;

      case 'down':
      case 'rollback':
        logger.info('🔄 Rolling back migrations...');
        await runner.rollback(argument);
        break;

      case 'status':
        await runner.status();
        break;

      case 'init':
        logger.info('🏗️  Initializing migration system...');
        await runner.initialize();
        logger.info('✅ Migration system initialized');
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

    logger.info('🎉 Migration command completed successfully');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Migration command failed:', error);
    process.exit(1);
  }
}

main();