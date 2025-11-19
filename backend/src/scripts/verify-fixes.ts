import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function verify() {
  try {
    console.log('\n🔍 VERIFICATION REPORT - Performance Fixes\n');
    console.log('=' .repeat(60));

    // Check user_test2 and subscriptions
    const userResult = await sequelize.query(
      `SELECT u.id, u.username, u.role, s.id as sub_id, s.type, s.status, s.expires_at, s.created_at
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE u.username = 'user_test2'
       ORDER BY s.created_at DESC`,
      { type: QueryTypes.SELECT }
    );

    console.log('\n📊 USER_TEST2 & SUBSCRIPTIONS:');
    console.log(JSON.stringify(userResult, null, 2));

    // Check subscriptions total
    const subCount = await sequelize.query(
      `SELECT COUNT(*) as total FROM subscriptions`,
      { type: QueryTypes.SELECT }
    );
    console.log('\n📊 TOTAL SUBSCRIPTIONS:', (subCount[0] as any).total);

    // Check system settings
    const settings = await sequelize.query(
      `SELECT key, value FROM system_settings WHERE key LIKE 'enable_%'`,
      { type: QueryTypes.SELECT }
    );
    console.log('\n⚙️ SYSTEM SETTINGS (enable_*):');
    console.log(JSON.stringify(settings, null, 2));

    // Check indexes created
    const indexes = await sequelize.query(
      `SELECT indexname FROM pg_indexes
       WHERE tablename IN ('subscriptions', 'membership_change_requests')
       AND indexname LIKE 'idx_%'
       ORDER BY indexname`,
      { type: QueryTypes.SELECT }
    );
    console.log('\n🔍 PERFORMANCE INDEXES CREATED:');
    console.log(JSON.stringify(indexes, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE\n');

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verify();
