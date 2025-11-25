import sequelize from '../config/database';

async function checkMigration() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableDescription = await queryInterface.describeTable('articles');
    
    if (tableDescription.admin_rejection_message) {
      console.log('✅ admin_rejection_message column EXISTS');
      console.log('Column details:');
      console.log(JSON.stringify(tableDescription.admin_rejection_message, null, 2));
    } else {
      console.log('❌ admin_rejection_message column NOT FOUND');
      console.log('\nAvailable columns:');
      Object.keys(tableDescription).sort().forEach(col => {
        console.log(`  - ${col}`);
      });
    }
  } catch (error) {
    console.error('Error checking migration:', error);
  } finally {
    await sequelize.close();
  }
}

checkMigration();
