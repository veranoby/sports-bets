import Migration, { MigrationContext } from './Migration';

export default class AddAdminRejectionMessageMigration extends Migration {
  readonly version = '2025-11-22-000001';
  readonly description = 'Add admin_rejection_message column to articles table for admin feedback on rejected articles';

  async validate(context: MigrationContext): Promise<boolean> {
    return true;
  }

  async up(context: MigrationContext): Promise<void> {
    const { queryInterface, Sequelize } = context;

    // Check if column already exists
    try {
      const tableDescription = await queryInterface.describeTable('articles');
      if (tableDescription.admin_rejection_message) {
        console.log('⚠️  admin_rejection_message column already exists - skipping addition');
        return;
      }
    } catch (error) {
      console.log('⚠️  Error checking table - will attempt to add column');
    }

    console.log('✅ Adding admin_rejection_message column to articles table...');
    await queryInterface.addColumn('articles', 'admin_rejection_message', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    console.log('✅ admin_rejection_message column added successfully');
  }

  async down(context: MigrationContext): Promise<void> {
    const { queryInterface } = context;
    console.log('⏪ Removing admin_rejection_message column from articles table...');
    await queryInterface.removeColumn('articles', 'admin_rejection_message');
    console.log('✅ admin_rejection_message column removed successfully');
  }
}
