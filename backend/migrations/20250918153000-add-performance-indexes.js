'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add indexes for frequently queried combinations
    
    // For bets queries filtering by user_id and created_at (for pagination)
    await queryInterface.addIndex('bets', ['user_id', 'created_at'], {
      name: 'idx_bets_user_created_at'
    });
    
    // For bets queries filtering by fight_id, status, and created_at (for fight-specific bet listings)
    await queryInterface.addIndex('bets', ['fight_id', 'status', 'created_at'], {
      name: 'idx_bets_fight_status_created_at'
    });
    
    // For user queries filtering by role, is_active, and last_login (for admin user management)
    await queryInterface.addIndex('users', ['role', 'is_active', 'last_login'], {
      name: 'idx_users_role_active_last_login'
    });
    
    // For wallet transaction queries filtering by wallet_id, status, and created_at (for transaction history)
    await queryInterface.addIndex('transactions', ['wallet_id', 'status', 'created_at'], {
      name: 'idx_transactions_wallet_status_created_at'
    });
    
    console.log('✅ Performance indexes added successfully');
  },

  async down (queryInterface, Sequelize) {
    // Remove the indexes
    await queryInterface.removeIndex('bets', 'idx_bets_user_created_at');
    await queryInterface.removeIndex('bets', 'idx_bets_fight_status_created_at');
    await queryInterface.removeIndex('users', 'idx_users_role_active_last_login');
    await queryInterface.removeIndex('transactions', 'idx_transactions_wallet_status_created_at');
    
    console.log('↩️ Performance indexes removed successfully');
  }
};