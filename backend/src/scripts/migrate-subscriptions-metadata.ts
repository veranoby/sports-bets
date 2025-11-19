import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

const migrate = async () => {
  try {
    console.log('🔄 Starting subscriptions metadata migration...\n');

    // Step 1: Verify we have subscriptions
    const count = await sequelize.query(
      'SELECT COUNT(*) as total FROM subscriptions',
      { type: QueryTypes.SELECT }
    );
    console.log(`✅ Found ${(count[0] as any).total} subscriptions to migrate`);

    // Step 2: Move payment data to metadata
    console.log('\n📦 Moving payment fields to metadata.payment...');
    await sequelize.query(`
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
    console.log('✅ Payment fields moved to metadata.payment');

    // Step 3: Move admin data to metadata
    console.log('\n👤 Moving admin fields to metadata.admin...');
    await sequelize.query(`
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
    console.log('✅ Admin fields moved to metadata.admin');

    // Step 4: Note on indexes
    console.log('\n🔍 Index note: metadata is JSON type, GIN indexes not supported');
    console.log('✅ Data restructuring complete (indexes can be added when converting to JSONB)')

    // Step 5: Verify migration
    console.log('\n✔️  Verifying migration...');
    const verification = await sequelize.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN metadata -> 'payment' IS NOT NULL THEN 1 ELSE 0 END) as with_payment,
        SUM(CASE WHEN metadata -> 'admin' IS NOT NULL THEN 1 ELSE 0 END) as with_admin
      FROM subscriptions`,
      { type: QueryTypes.SELECT }
    );

    const result = verification[0] as any;
    console.log(`
    ✅ Migration Complete!
    ─────────────────────────
    Total subscriptions: ${result.total}
    With payment metadata: ${result.with_payment}
    With admin metadata: ${result.with_admin}

    ⚠️  Note: Original columns preserved for backward compatibility.
    They can be dropped in a future migration.
    `);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

migrate();
