'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 📝 ADD COLUMN: payment_proof_url for optional payment receipt upload
    await queryInterface.addColumn('membership_change_requests', 'payment_proof_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'URL of uploaded payment proof/receipt image (optional)',
    });

    // 📝 UPDATE ENUM: Add 'completed' status to existing enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_membership_change_requests_status ADD VALUE IF NOT EXISTS 'completed';
    `);

    console.log('✅ Column payment_proof_url added to membership_change_requests');
    console.log('✅ Status enum updated with "completed" value');
  },

  async down(queryInterface, Sequelize) {
    // Remove column
    await queryInterface.removeColumn('membership_change_requests', 'payment_proof_url');

    // Note: Cannot remove enum value in PostgreSQL - would require recreating enum
    console.log('⚠️  Note: ENUM value "completed" cannot be removed from PostgreSQL');
    console.log('✅ Column payment_proof_url removed from membership_change_requests');
  },
};
