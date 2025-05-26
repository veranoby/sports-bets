// test-connection.js - Verificar conexión a Neon.tech
require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 Probando conexión a Neon.tech...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📡 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conexión exitosa!');
    
    console.log('🔍 Ejecutando consulta de prueba...');
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('⏰ Hora del servidor:', result.rows[0].current_time);
    console.log('🐘 Versión PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    console.log('\n✨ ¡Todo listo para inicializar las tablas!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n🔧 Verifica tu DATABASE_URL en el archivo .env');
  } finally {
    await client.end();
  }
}

testConnection();