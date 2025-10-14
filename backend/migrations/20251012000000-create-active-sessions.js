'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('active_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      session_token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      device_fingerprint: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      last_activity: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    // Add performance indexes
    await queryInterface.addIndex('active_sessions', ['user_id', 'is_active'], {
      name: 'idx_active_sessions_user_active'
    });

    await queryInterface.addIndex('active_sessions', ['session_token'], {
      name: 'idx_active_sessions_token',
      unique: true
    });

    await queryInterface.addIndex('active_sessions', ['expires_at'], {
      name: 'idx_active_sessions_expires'
    });

    await queryInterface.addIndex('active_sessions', ['device_fingerprint'], {
      name: 'idx_active_sessions_fingerprint'
    });

    await queryInterface.addIndex('active_sessions', ['ip_address'], {
      name: 'idx_active_sessions_ip'
    });

    await queryInterface.addIndex('active_sessions', ['last_activity'], {
      name: 'idx_active_sessions_activity'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('active_sessions');
  }
};
