import { QueryInterface, DataTypes } from 'sequelize';
import { logger } from '../config/logger';

export interface MigrationContext {
  queryInterface: QueryInterface;
  Sequelize: typeof DataTypes;
}

export abstract class Migration {
  abstract readonly version: string;
  abstract readonly description: string;

  /**
   * Execute the migration
   */
  abstract up(context: MigrationContext): Promise<void>;

  /**
   * Rollback the migration
   */
  abstract down(context: MigrationContext): Promise<void>;

  /**
   * Validate migration can be applied safely
   */
  async validate(context: MigrationContext): Promise<boolean> {
    // Override in child classes for custom validation
    return true;
  }

  /**
   * Execute migration with transaction safety
   */
  async execute(context: MigrationContext): Promise<void> {
    const transaction = await context.queryInterface.sequelize.transaction();
    
    try {
      logger.info(`🔄 Starting migration ${this.version}: ${this.description}`);
      
      // Validate before execution
      const isValid = await this.validate(context);
      if (!isValid) {
        throw new Error(`Migration ${this.version} validation failed`);
      }

      // Execute migration within transaction
      await this.up(context);
      
      // Record migration
      await this.recordMigration(context, transaction);
      
      await transaction.commit();
      logger.info(`✅ Migration ${this.version} completed successfully`);
      
    } catch (error) {
      await transaction.rollback();
      logger.error(`❌ Migration ${this.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback migration with transaction safety
   */
  async rollback(context: MigrationContext): Promise<void> {
    const transaction = await context.queryInterface.sequelize.transaction();
    
    try {
      logger.info(`🔄 Rolling back migration ${this.version}: ${this.description}`);
      
      await this.down(context);
      
      // Remove migration record
      await this.removeMigrationRecord(context, transaction);
      
      await transaction.commit();
      logger.info(`✅ Migration ${this.version} rolled back successfully`);
      
    } catch (error) {
      await transaction.rollback();
      logger.error(`❌ Migration ${this.version} rollback failed:`, error);
      throw error;
    }
  }

  private async recordMigration(context: MigrationContext, transaction: any): Promise<void> {
    const now = new Date();
    await context.queryInterface.bulkInsert('schema_migrations', [{
      version: this.version,
      description: this.description,
      executed_at: now,
      checksum: this.getChecksum(),
      created_at: now,
      updated_at: now
    }], { transaction });
  }

  private async removeMigrationRecord(context: MigrationContext, transaction: any): Promise<void> {
    await context.queryInterface.bulkDelete('schema_migrations', {
      version: this.version
    }, { transaction });
  }

  private getChecksum(): string {
    // Generate checksum based on migration content
    const crypto = require('crypto');
    const content = `${this.version}-${this.description}-${this.up.toString()}-${this.down.toString()}`;
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
}

export default Migration;