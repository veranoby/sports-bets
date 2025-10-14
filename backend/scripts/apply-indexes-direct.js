#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const indexes = [
  {
    name: 'idx_bets_user_status',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_user_status ON bets(user_id, status);'
  },
  {
    name: 'idx_bets_fight_status_pending',
    sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_fight_status_pending ON bets(fight_id, status) WHERE status = 'pending';"
  },
  {
    name: 'idx_fights_event_status_number',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fights_event_status_number ON fights(event_id, status, number);'
  },
  {
    name: 'idx_events_status_scheduled_date',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status_scheduled_date ON events(status, scheduled_date);'
  },
  {
    name: 'idx_transactions_wallet_type_status',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_wallet_type_status ON transactions(wallet_id, type, status);'
  },
  {
    name: 'idx_bets_parent_bet_proposal',
    sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bets_parent_bet_proposal ON bets(parent_bet_id, proposal_status) WHERE parent_bet_id IS NOT NULL;"
  },
  {
    name: 'idx_event_connections_event_disconnected',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_connections_event_disconnected ON event_connections(event_id, disconnected_at);'
  }
];

async function applyIndexes() {
  const client = await pool.connect();

  try {
    console.log('🚀 Connected to database');

    for (const index of indexes) {
      console.log(`\n📊 Creating index: ${index.name}...`);
      try {
        await client.query(index.sql);
        console.log(`✅ ${index.name} created successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${index.name} already exists, skipping`);
        } else {
          console.error(`❌ Error creating ${index.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ All indexes processed successfully!');

    // List all indexes
    console.log('\n📋 Current indexes:');
    const result = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY indexname;
    `);

    result.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

applyIndexes();
