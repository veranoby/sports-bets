'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🔧 Adding performance indexes for articles table...');

    const checkAndAddIndex = async (table, columns, options) => {
      try {
        await queryInterface.addIndex(table, columns, options);
        console.log(`✅ Created index: ${options.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Index ${options.name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    };

    // Critical index for the slow query: author_id + status + published_at
    await checkAndAddIndex('articles', ['author_id', 'status', 'published_at'], {
      name: 'idx_articles_author_status_published',
      where: {
        status: ['published', 'pending']
      }
    });

    // Index for general status + published_at ordering (public queries)
    await checkAndAddIndex('articles', ['status', 'published_at'], {
      name: 'idx_articles_status_published'
    });

    // Index for venue-based queries
    await checkAndAddIndex('articles', ['venue_id', 'status', 'published_at'], {
      name: 'idx_articles_venue_status_published'
    });

    // Index for featured articles queries (with non-null featured_image)
    await checkAndAddIndex('articles', ['status', 'featured_image', 'published_at'], {
      name: 'idx_articles_featured',
      where: {
        status: 'published',
        featured_image: { [Sequelize.Op.ne]: null }
      }
    });

    console.log('✅ Articles performance indexes migration completed');
    console.log('🎯 Target: Reduce query time from 1763ms to <500ms');
  },

  async down (queryInterface, Sequelize) {
    console.log('↩️ Removing articles performance indexes...');

    await queryInterface.removeIndex('articles', 'idx_articles_author_status_published');
    await queryInterface.removeIndex('articles', 'idx_articles_status_published');
    await queryInterface.removeIndex('articles', 'idx_articles_venue_status_published');
    await queryInterface.removeIndex('articles', 'idx_articles_featured');

    console.log('✅ Articles performance indexes removed successfully');
  }
};