import { sequelize } from '../config/database';

// ⚡ CRITICAL PERFORMANCE INDEXES Script
// This script creates essential database indexes to eliminate N+1 queries

const indexes = [
  // System settings optimizations (most frequent queries)
  {
    name: 'idx_system_settings_key',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_key ON system_settings(key);'
  },
  {
    name: 'idx_system_settings_public',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;'
  },

  // User authentication optimizations
  {
    name: 'idx_users_id_active',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_active ON users(id, is_active) WHERE is_active = true;'
  },

  // Core business logic optimizations
  {
    name: 'idx_bets_user_status',
    sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_user_status ON bets(user_id, status) WHERE status IN ('pending', 'active', 'won', 'lost');"
  },
  {
    name: 'idx_fights_event_status',
    sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fights_event_status ON fights(event_id, status) WHERE status IN ('upcoming', 'betting', 'live', 'completed');"
  },
  {
    name: 'idx_transactions_wallet_date',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_wallet_date ON transactions(wallet_id, created_at DESC);'
  },
  {
    name: 'idx_events_scheduled_status',
    sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_scheduled_status ON events(scheduled_date, status) WHERE status IN ('scheduled', 'live', 'completed');"
  },

  // Content and notifications optimizations
  {
    name: 'idx_articles_status_published',
    sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_status_published ON articles(status, published_at DESC) WHERE status = 'published';"
  },
  {
    name: 'idx_subscriptions_user_active',
    sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_active ON subscriptions(user_id, status, expires_at) WHERE status = 'active' AND expires_at > NOW();"
  },
  {
    name: 'idx_notifications_user_read',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);'
  },
  {
    name: 'idx_wallets_user_id',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);'
  }
];

async function createPerformanceIndexes() {
  console.log('🏗️ Creating critical performance indexes...');

  let successCount = 0;
  let errorCount = 0;

  for (const index of indexes) {
    try {
      console.log(`⚡ Creating index: ${index.name}`);
      await sequelize.query(index.sql);
      console.log(`✅ Successfully created: ${index.name}`);
      successCount++;
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`ℹ️ Index already exists: ${index.name}`);
        successCount++;
      } else {
        console.error(`❌ Failed to create ${index.name}:`, error.message);
        errorCount++;
      }
    }
  }

  console.log(`\n📊 Index Creation Summary:`);
  console.log(`✅ Successful: ${successCount}/${indexes.length}`);
  console.log(`❌ Failed: ${errorCount}/${indexes.length}`);

  if (errorCount === 0) {
    console.log(`\n🚀 All critical performance indexes created successfully!`);
    console.log(`🔥 Database queries should now be significantly faster!`);
  } else {
    console.log(`\n⚠️ Some indexes failed to create. Check the errors above.`);
  }
}

// Self-executing script
if (require.main === module) {
  createPerformanceIndexes()
    .then(() => {
      console.log('✅ Performance index creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error creating indexes:', error);
      process.exit(1);
    });
}

export { createPerformanceIndexes };