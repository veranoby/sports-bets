import { QueryInterface, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { logger } from '../config/logger';
import Migration, { MigrationContext } from './Migration';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationRecord {
  version: string;
  description: string;
  executed_at: Date;
  checksum: string;
}

export class MigrationRunner {
  private context: MigrationContext;

  constructor() {
    this.context = {
      queryInterface: sequelize.getQueryInterface(),
      Sequelize: DataTypes
    };
  }

  /**
   * Initialize migration system - create schema_migrations table
   */
  async initialize(): Promise<void> {
    try {
      await this.context.queryInterface.createTable('schema_migrations', {
        version: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          allowNull: false
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        executed_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        checksum: {
          type: DataTypes.STRING(32),
          allowNull: false
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      });
      
      logger.info('✅ Migration system initialized');
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
        logger.info('✅ Migration system already initialized');
      } else {
        throw error;
      }
    }
  }

  /**
   * Load all migration files from migrations directory
   */
  async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = path.join(__dirname, '.');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.match(/^\d{4}-\d{2}-\d{2}-\d{6}-.+\.ts$/) && !file.includes('.d.ts'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      try {
        const migrationPath = path.join(migrationsDir, file);
        const MigrationClass = require(migrationPath).default;
        
        if (MigrationClass && typeof MigrationClass === 'function') {
          const migration = new MigrationClass();
          if (migration instanceof Migration) {
            migrations.push(migration);
          } else {
            logger.warn(`⚠️  Skipping ${file}: not a valid Migration class`);
          }
        }
      } catch (error) {
        logger.error(`❌ Failed to load migration ${file}:`, error);
        throw error;
      }
    }

    logger.info(`📋 Loaded ${migrations.length} migrations`);
    return migrations;
  }

  /**
   * Get executed migrations from database
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    try {
      const [results] = await this.context.queryInterface.sequelize.query(
        'SELECT version, description, executed_at, checksum FROM schema_migrations ORDER BY version'
      );
      return results as MigrationRecord[];
    } catch (error) {
      logger.error('❌ Failed to retrieve executed migrations:', error);
      throw error;
    }
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const allMigrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    const executedVersions = new Set(executedMigrations.map(m => m.version));

    return allMigrations.filter(migration => !executedVersions.has(migration.version));
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    try {
      await this.initialize();
      
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        logger.info('✅ No pending migrations');
        return;
      }

      logger.info(`🚀 Running ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await migration.execute(this.context);
      }

      logger.info('🎉 All migrations completed successfully');
    } catch (error) {
      logger.error('❌ Migration process failed:', error);
      throw error;
    }
  }

  /**
   * Rollback migrations to a specific version
   */
  async rollback(targetVersion?: string): Promise<void> {
    try {
      const executedMigrations = await this.getExecutedMigrations();
      const allMigrations = await this.loadMigrations();
      
      if (executedMigrations.length === 0) {
        logger.info('✅ No migrations to rollback');
        return;
      }

      // If no target specified, rollback last migration
      if (!targetVersion) {
        const lastMigration = executedMigrations[executedMigrations.length - 1];
        targetVersion = lastMigration.version;
      }

      // Find migrations to rollback (in reverse order)
      const migrationsToRollback = executedMigrations
        .filter(executed => executed.version >= targetVersion!)
        .reverse();

      logger.info(`🔄 Rolling back ${migrationsToRollback.length} migrations`);

      for (const executedMigration of migrationsToRollback) {
        const migration = allMigrations.find(m => m.version === executedMigration.version);
        if (migration) {
          await migration.rollback(this.context);
        } else {
          logger.warn(`⚠️  Migration ${executedMigration.version} not found for rollback`);
        }
      }

      logger.info('🎉 Rollback completed successfully');
    } catch (error) {
      logger.error('❌ Rollback process failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async status(): Promise<void> {
    try {
      await this.initialize();
      
      const allMigrations = await this.loadMigrations();
      const executedMigrations = await this.getExecutedMigrations();
      const executedVersions = new Set(executedMigrations.map(m => m.version));

      logger.info('\n📋 MIGRATION STATUS');
      logger.info('===================');

      if (allMigrations.length === 0) {
        logger.info('No migrations found');
        return;
      }

      for (const migration of allMigrations) {
        const status = executedVersions.has(migration.version) ? '✅' : '⏳';
        const executedMigration = executedMigrations.find(m => m.version === migration.version);
        
        logger.info(`${status} ${migration.version}: ${migration.description}${
          executedMigration ? ` (executed: ${executedMigration.executed_at.toISOString()})` : ''
        }`);
      }

      const pendingCount = allMigrations.length - executedMigrations.length;
      logger.info(`\n📊 Summary: ${executedMigrations.length} executed, ${pendingCount} pending`);
      
    } catch (error) {
      logger.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }
}

export default MigrationRunner;