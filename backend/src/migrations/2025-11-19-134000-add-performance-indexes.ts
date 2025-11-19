import Migration from './Migration';
import { MigrationContext } from './Migration';
import { logger } from '../config/logger';

export default class AddPerformanceIndexes extends Migration {
  readonly version = '2025-11-19-134000';
  readonly description = 'Add performance indexes for subscription lookups and membership requests filtering';

  async up(context: MigrationContext): Promise<void> {
    // Index 1: Optimize subscription lookups with ordering (for getLatestSubscription)
    logger.info('🔍 Creating idx_subscriptions_user_created index...');
    await context.queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_created
        ON subscriptions(user_id, created_at DESC)
        WHERE user_id IS NOT NULL
    `);
    logger.info('✅ idx_subscriptions_user_created created');

    // Index 2: Optimize membership request filtering by status
    logger.info('🔍 Creating idx_membership_requests_status_requested index...');
    await context.queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_membership_requests_status_requested
        ON membership_change_requests(status, requested_at DESC)
        WHERE status IS NOT NULL
    `);
    logger.info('✅ idx_membership_requests_status_requested created');

    // Index 3: Support wallet transaction queries (future use - only if table exists)
    logger.info('🔍 Checking if wallet_transactions table exists...');
    try {
      await context.queryInterface.sequelize.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_user_type_status
          ON wallet_transactions(user_id, type, status)
          WHERE user_id IS NOT NULL
      `);
      logger.info('✅ idx_wallet_transactions_user_type_status created');
    } catch (error) {
      logger.warn('⚠️  wallet_transactions table does not exist yet - skipping index creation');
    }

    logger.info('✅ All performance indexes created successfully');
  }

  async down(context: MigrationContext): Promise<void> {
    // Rollback: Drop all indexes created by this migration
    logger.info('🔍 Dropping performance indexes...');

    await context.queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_subscriptions_user_created
    `);

    await context.queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_membership_requests_status_requested
    `);

    try {
      await context.queryInterface.sequelize.query(`
        DROP INDEX CONCURRENTLY IF EXISTS idx_wallet_transactions_user_type_status
      `);
    } catch (error) {
      // Index may not exist if wallet_transactions table didn't exist
      logger.warn('⚠️  Could not drop wallet_transactions index (may not exist)');
    }

    logger.info('✅ All performance indexes dropped');
  }
}
