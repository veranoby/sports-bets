import Migration from './Migration';
import { MigrationContext } from './Migration';
import { logger } from '../config/logger';

export default class RestructureSubscriptionsMetadata extends Migration {
  readonly version = '2025-11-19-133000';
  readonly description = 'Restructure subscriptions metadata - move Kushki payment fields and admin data to metadata object';

  async up(context: MigrationContext): Promise<void> {
    // Step 1: Move payment fields to metadata.payment
    logger.info('📦 Moving payment fields to metadata.payment...');
    await context.queryInterface.sequelize.query(`
      UPDATE subscriptions
      SET metadata = jsonb_set(
        COALESCE(metadata::jsonb, '{}'::jsonb),
        '{payment}',
        jsonb_build_object(
          'kushkiSubscriptionId', kushki_subscription_id,
          'nextBillingDate', next_billing_date::text,
          'retryCount', retry_count,
          'maxRetries', max_retries,
          'cancelledAt', cancelled_at::text,
          'cancelReason', cancel_reason,
          'paymentMethod', payment_method::text
        )
      )
    `);
    logger.info('✅ Payment fields moved to metadata.payment');

    // Step 2: Move admin data to metadata.admin
    logger.info('👤 Moving admin fields to metadata.admin...');
    await context.queryInterface.sequelize.query(`
      UPDATE subscriptions
      SET metadata = jsonb_set(
        COALESCE(metadata::jsonb, '{}'::jsonb),
        '{admin}',
        jsonb_build_object(
          'assignedByAdminId', assigned_by_admin_id::text,
          'assignedUsername', assigned_username
        )
      )
      WHERE assigned_by_admin_id IS NOT NULL OR assigned_username IS NOT NULL
    `);
    logger.info('✅ Admin fields moved to metadata.admin');

    // Step 3: Verify migration
    const verification = await context.queryInterface.sequelize.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN metadata -> 'payment' IS NOT NULL THEN 1 ELSE 0 END) as with_payment,
        SUM(CASE WHEN metadata -> 'admin' IS NOT NULL THEN 1 ELSE 0 END) as with_admin
      FROM subscriptions`,
      { raw: true }
    );

    const result = (verification as any)[0];
    logger.info(`
    ✅ Migration Complete!
    ─────────────────────────
    Total subscriptions: ${result.total}
    With payment metadata: ${result.with_payment}
    With admin metadata: ${result.with_admin}

    ⚠️  Note: Original columns preserved for backward compatibility.
    They can be dropped in a future migration.
    `);
  }

  async down(context: MigrationContext): Promise<void> {
    // Rollback: Nothing to do - original columns still exist
    // Data in metadata.payment can be restored to columns if needed
    logger.info('⚠️  Rollback: Metadata structure preserved. No data was lost.');
  }
}
