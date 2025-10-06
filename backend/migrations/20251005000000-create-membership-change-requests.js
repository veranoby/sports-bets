'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 📋 CREATE: membership_change_requests table
    await queryInterface.createTable('membership_change_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      current_membership_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Current membership type before change request',
      },
      requested_membership_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Requested new membership type',
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      request_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional notes from user explaining the request',
      },
      requested_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      processed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Admin user who processed the request',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for rejection if status is rejected',
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Internal notes from admin',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // 🔍 INDEX: User requests lookup
    await queryInterface.addIndex('membership_change_requests', ['user_id', 'status'], {
      name: 'idx_membership_requests_user_status',
    });

    // 🔍 INDEX: Pending requests for admin
    await queryInterface.addIndex('membership_change_requests', ['status', 'requested_at'], {
      name: 'idx_membership_requests_pending',
      where: {
        status: 'pending',
      },
    });

    // 🔍 INDEX: Processed by admin tracking
    await queryInterface.addIndex('membership_change_requests', ['processed_by'], {
      name: 'idx_membership_requests_processor',
    });

    console.log('✅ Table membership_change_requests created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('membership_change_requests', 'idx_membership_requests_user_status');
    await queryInterface.removeIndex('membership_change_requests', 'idx_membership_requests_pending');
    await queryInterface.removeIndex('membership_change_requests', 'idx_membership_requests_processor');

    // Drop table
    await queryInterface.dropTable('membership_change_requests');

    console.log('✅ Table membership_change_requests dropped');
  },
};
