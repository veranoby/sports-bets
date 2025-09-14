// Script para inicializar configuraciones por defecto en la base de datos
// Ejecutar: npx ts-node scripts/seedSettings.ts

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos usando DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 120000,
    idle: 10000
  }
});

const defaultSettings = [
  {
    key: 'enable_betting',
    value: JSON.stringify(true),
    type: 'boolean',
    category: 'features',
    description: 'Habilita/deshabilita el sistema de apuestas',
    is_public: false
  },
  {
    key: 'enable_wallets',
    value: JSON.stringify(true),
    type: 'boolean',
    category: 'features',
    description: 'Habilita/deshabilita el sistema de billeteras',
    is_public: false
  },
  {
    key: 'enable_streaming',
    value: JSON.stringify(true),
    type: 'boolean',
    category: 'features',
    description: 'Habilita/deshabilita las funciones de streaming',
    is_public: false
  },
  {
    key: 'maintenance_mode',
    value: JSON.stringify(false),
    type: 'boolean',
    category: 'system',
    description: 'Habilita el modo de mantenimiento',
    is_public: true
  },
  {
    key: 'enable_push_notifications',
    value: JSON.stringify(true),
    type: 'boolean',
    category: 'features',
    description: 'Habilita/deshabilita las notificaciones push',
    is_public: false
  },
  {
    key: 'commission_percentage',
    value: JSON.stringify(5.0),
    type: 'number',
    category: 'business',
    description: 'Porcentaje de comisión de la plataforma',
    is_public: false
  },
  {
    key: 'min_bet_amount',
    value: JSON.stringify(10),
    type: 'number',
    category: 'business',
    description: 'Monto mínimo permitido para una apuesta',
    is_public: true
  },
  {
    key: 'max_bet_amount',
    value: JSON.stringify(10000),
    type: 'number',
    category: 'business',
    description: 'Monto máximo permitido para una apuesta',
    is_public: true
  }
];

async function seedSettings() {
  try {
    console.log('🔗 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida exitosamente');

    console.log('🌱 Insertando configuraciones por defecto...');
    
    for (const setting of defaultSettings) {
      try {
        const query = `
          INSERT INTO system_settings (key, value, type, category, description, is_public, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (key) DO NOTHING
        `;
        
        await sequelize.query(query, {
          bind: [
            setting.key,
            setting.value,
            setting.type,
            setting.category,
            setting.description,
            setting.is_public
          ]
        });
        
        console.log(`✅ Setting creado/actualizado: ${setting.key} = ${setting.value}`);
      } catch (error) {
        console.error(`❌ Error insertando ${setting.key}:`, error);
      }
    }

    console.log('🎉 Settings inicializados exitosamente');

    // Verificar que se insertaron
    console.log('\n📊 Verificando settings en base de datos:');
    const [results] = await sequelize.query('SELECT key, value, type FROM system_settings ORDER BY key');
    
    results.forEach((row: any) => {
      console.log(`  ${row.key}: ${row.value} (${row.type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar el script
seedSettings();