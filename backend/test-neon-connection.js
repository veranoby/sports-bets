const { Client } = require('pg');

const testNeonConnection = async () => {
  const connectionString = 'postgresql://neondb_owner:npg_zQPS2f8WAsBl@ep-icy-cake-a53iof4n-pooler.us-east-2.aws.neon.tech/sports_bets?sslmode=require&channel_binding=require';
  
  console.log('🔍 Testing Neon.tech connection with new network...');
  console.log('📡 Connection string:', connectionString.replace(/:[^:]+@/, ':***@'));
  
  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 10000, // 10 seconds timeout
  });

  try {
    console.log('⏳ Connecting to Neon.tech...');
    await client.connect();
    console.log('✅ SUCCESS: Connected to Neon.tech database!');
    
    console.log('⏳ Testing query execution...');
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Query executed successfully:');
    console.log('   📅 Current time:', result.rows[0].current_time);
    console.log('   🗃️ PostgreSQL version:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
    
    console.log('⏳ Testing table access...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);
    console.log('✅ Database tables accessible:', tableCheck.rows.length, 'tables found');
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED:');
    console.error('   🔴 Error code:', error.code);
    console.error('   📝 Error message:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('   🌐 Network timeout - check firewall/proxy settings');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   🔍 DNS resolution failed - check internet connection');
    } else if (error.code === '28P01') {
      console.error('   🔑 Authentication failed - check credentials');
    }
    
  } finally {
    try {
      await client.end();
      console.log('🔌 Connection closed');
    } catch (e) {
      console.log('⚠️ Error closing connection:', e.message);
    }
  }
};

testNeonConnection();