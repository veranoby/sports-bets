'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ⚡ OPTIMIZATION: Payment transactions user status index
    await queryInterface.addIndex('payment_transactions', ['user_id', 'status'], {
      name: 'idx_payment_transactions_user_status',
      concurrently: true,
    });

    // ⚡ OPTIMIZATION: Notifications unread index
    await queryInterface.addIndex('notifications', ['user_id', 'is_read', 'created_at'], {
      name: 'idx_notifications_user_unread',
      where: {
        is_read: false,
      },
      concurrently: true,
    });

    // ⚡ OPTIMIZATION: Fights betting status partial index
    await queryInterface.addIndex('fights', ['event_id', 'status'], {
      name: 'idx_fights_event_betting',
      where: {
        status: 'betting',
      },
      concurrently: true,
    });

    console.log('✅ Performance indexes added successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('payment_transactions', 'idx_payment_transactions_user_status');
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_unread');
    await queryInterface.removeIndex('fights', 'idx_fights_event_betting');
    console.log('✅ Performance indexes removed');
  },
};
