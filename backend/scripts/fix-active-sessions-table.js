// Script to check and fix active_sessions table structure
const { sequelize } = require('../src/config/database');

async function checkAndFixTable() {
  try {
    console.log('🔍 Checking active_sessions table...');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'active_sessions'
      );
    `);

    const tableExists = tables[0].exists;
    console.log(`Table exists: ${tableExists}`);

    if (tableExists) {
      // Check current columns
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'active_sessions'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Current columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      // Check if is_active column exists
      const hasIsActive = columns.some(col => col.column_name === 'is_active');

      // Check for required columns and fix schema
      const fixes = [];

      if (!hasIsActive) {
        fixes.push('is_active');
        await sequelize.query(`
          ALTER TABLE active_sessions
          ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        `);
        console.log('✅ Added is_active column');
      }

      // Check for device_fingerprint vs device_info
      const hasDeviceInfo = columns.some(col => col.column_name === 'device_info');
      const hasDeviceFingerprint = columns.some(col => col.column_name === 'device_fingerprint');

      if (hasDeviceInfo && !hasDeviceFingerprint) {
        fixes.push('device_fingerprint');
        console.log('\n⚠️  Converting device_info to device_fingerprint...');

        // Drop device_info column (JSONB)
        await sequelize.query(`ALTER TABLE active_sessions DROP COLUMN device_info;`);

        // Add device_fingerprint column (VARCHAR)
        await sequelize.query(`
          ALTER TABLE active_sessions
          ADD COLUMN device_fingerprint VARCHAR(255);
        `);
        console.log('✅ Converted device_info → device_fingerprint');
      }

      // Add/update indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_active_sessions_user_active
        ON active_sessions(user_id, is_active);
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_active_sessions_device
        ON active_sessions(device_fingerprint);
      `);

      console.log('✅ Indexes created/verified');

      if (fixes.length > 0) {
        console.log(`\n🔧 Fixed columns: ${fixes.join(', ')}`);
      } else {
        console.log('\n✅ Table schema already correct');
      }
    } else {
      console.log('\n❌ Table does not exist - creating it...');

      await sequelize.query(`
        CREATE TABLE active_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) NOT NULL UNIQUE,
          device_fingerprint VARCHAR(255),
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true
        );
      `);

      console.log('✅ Created active_sessions table');

      // Create indexes
      await sequelize.query(`
        CREATE INDEX idx_active_sessions_user_active ON active_sessions(user_id, is_active);
        CREATE UNIQUE INDEX idx_active_sessions_token ON active_sessions(session_token);
        CREATE INDEX idx_active_sessions_expires ON active_sessions(expires_at);
        CREATE INDEX idx_active_sessions_device ON active_sessions(device_fingerprint);
        CREATE INDEX idx_active_sessions_ip ON active_sessions(ip_address);
        CREATE INDEX idx_active_sessions_activity ON active_sessions(last_activity);
      `);

      console.log('✅ Created indexes');
    }

    console.log('\n🎉 Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndFixTable();
