// Check raw article data from database
const { sequelize } = require('../src/config/database');

async function checkImages() {
  try {
    const [articles] = await sequelize.query(`
      SELECT
        id,
        title,
        featured_image,
        status
      FROM articles
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    console.log('\n📋 Articles in Database:\n');
    articles.forEach(article => {
      console.log(`ID: ${article.id}`);
      console.log(`Title: ${article.title}`);
      console.log(`Featured Image: ${article.featured_image || '❌ NULL'}`);
      console.log(`Status: ${article.status}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkImages();
