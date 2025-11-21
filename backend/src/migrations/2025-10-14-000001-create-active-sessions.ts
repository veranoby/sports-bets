import Migration, { MigrationContext } from './Migration';

export default class CreateActiveSessionsMigration extends Migration {
  readonly version = '2025-10-14-000001';
  readonly description = 'Create active_sessions table for session tracking and concurrent login prevention';

  async validate(context: MigrationContext): Promise<boolean> {
    // Always return true - we'll handle table existence check in up()
    return true;
  }

  async up(context: MigrationContext): Promise<void> {
    const { queryInterface, Sequelize } = context;

    // Check if table already exists
    try {
      await queryInterface.describeTable('active_sessions');
      console.log('⚠️  active_sessions table already exists - skipping creation');
      return;
    } catch (error) {
      // Table doesn't exist, proceed with creation
      console.log('✅ Creating active_sessions table...');
    }

    await queryInterface.createTable('active_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      session_token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      device_fingerprint: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      last_activity: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex('active_sessions', ['user_id', 'is_active'], {
      name: 'idx_active_sessions_user_active',
    });

    await queryInterface.addIndex('active_sessions', ['session_token'], {
      name: 'idx_active_sessions_token',
      unique: true,
    });

    await queryInterface.addIndex('active_sessions', ['expires_at'], {
      name: 'idx_active_sessions_expires',
    });

    await queryInterface.addIndex('active_sessions', ['device_fingerprint'], {
      name: 'idx_active_sessions_device',
    });

    await queryInterface.addIndex('active_sessions', ['ip_address'], {
      name: 'idx_active_sessions_ip',
    });

    await queryInterface.addIndex('active_sessions', ['last_activity'], {
      name: 'idx_active_sessions_activity',
    });

    console.log('✅ Created active_sessions table with indexes');
  }

  async down(context: MigrationContext): Promise<void> {
    const { queryInterface } = context;

    await queryInterface.dropTable('active_sessions');
    console.log('✅ Dropped active_sessions table');
  }
}
