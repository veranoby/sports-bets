// backend/src/services/systemSettingsService.ts
// Service for managing system settings with Redis caching
// Implements Redis cache with TTL=300s for system settings

import { SystemSetting as Setting } from '../models';
import { redisClient } from '../config/redis';
import { logger } from '../config/logger';

const SETTINGS_CACHE_TTL = 300; // 5 minutes cache TTL

export interface SystemSettingValue {
  key: string;
  value: any;
  category: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export class SystemSettingsService {
  /**
   * Get a specific setting value with Redis caching
   */
  static async getSettingValue(key: string): Promise<any> {
    // Try to get from cache first
    const cacheKey = `system_setting:${key}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for setting: ${key}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn(`Cache get failed for setting ${key}:`, error);
    }

    // If not in cache, fetch from database
    const setting = await Setting.findOne({ where: { key } });
    if (!setting) {
      return null;
    }

    const value = setting.value;
    
    // Cache the result
    try {
      await redisClient.set(cacheKey, JSON.stringify(value), SETTINGS_CACHE_TTL);
    } catch (error) {
      logger.warn(`Cache set failed for setting ${key}:`, error);
    }

    return value;
  }

  /**
   * Get all settings in a specific category with Redis caching
   */
  static async getSettingsByCategory(category: string): Promise<Record<string, any>> {
    // Try to get from cache first
    const cacheKey = `system_settings:category:${category}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for category: ${category}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn(`Cache get failed for category ${category}:`, error);
    }

    // If not in cache, fetch from database
    const settings = await Setting.findAll({ where: { category } });
    const settingsRecord: Record<string, any> = {};
    
    settings.forEach(setting => {
      settingsRecord[setting.key] = setting.value;
    });

    // Cache the result
    try {
      await redisClient.set(cacheKey, JSON.stringify(settingsRecord), SETTINGS_CACHE_TTL);
    } catch (error) {
      logger.warn(`Cache set failed for category ${category}:`, error);
    }

    return settingsRecord;
  }

  /**
   * Update a setting value and invalidate its cache
   */
  static async updateSettingValue(key: string, value: any, updatedBy?: string): Promise<void> {
    // Find existing setting or create new one
    let setting = await Setting.findOne({ where: { key } });
    
    if (setting) {
      // Update existing setting
      setting.value = value;
      setting.updated_by = updatedBy;
      await setting.save();
    } else {
      // Create new setting
      await Setting.create({
        key,
        value,
        category: 'general', // default category
        updated_by: updatedBy
      });
    }

    // Invalidate cache for this specific setting
    const cacheKey = `system_setting:${key}`;
    try {
      await redisClient.del(cacheKey);
    } catch (error) {
      logger.warn(`Cache invalidation failed for setting ${key}:`, error);
    }

    // Also invalidate any category cache that might contain this setting
    try {
      await redisClient.del(`system_settings:category:*`);
    } catch (error) {
      logger.warn(`Category cache invalidation failed for setting ${key}:`, error);
    }
  }

  /**
   * Get all settings grouped by category without caching for admin use
   */
  static async getAllSettings(): Promise<{[category: string]: SystemSettingValue[]}> {
    const settings = await Setting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    const settingsByCategory: {[category: string]: SystemSettingValue[]} = {};

    settings.forEach(setting => {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = [];
      }
      settingsByCategory[setting.category].push({
        key: setting.key,
        value: setting.value,
        category: setting.category,
        description: setting.description,
        createdAt: setting.created_at,
        updatedAt: setting.updated_at,
        updatedBy: setting.updated_by
      });
    });

    return settingsByCategory;
  }

  /**
   * Get all settings as a flat key-value object for frontend compatibility
   */
  static async getAllSettingsFlat(): Promise<Record<string, any>> {
    const settings = await Setting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    const settingsFlat: Record<string, any> = {};

    settings.forEach(setting => {
      settingsFlat[setting.key] = setting.value;
    });

    return settingsFlat;
  }

  /**
   * Get specific settings by keys with caching
   */
  static async getSpecificSettings(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const key of keys) {
      result[key] = await this.getSettingValue(key);
    }
    
    return result;
  }

  /**
   * Bulk update settings and invalidate their caches
   */
  static async bulkUpdateSettings(settings: {key: string, value: any, updatedBy?: string}[]): Promise<void> {
    const keysToInvalidate: string[] = [];
    
    for (const setting of settings) {
      let dbSetting = await Setting.findOne({ where: { key: setting.key } });
      
      if (dbSetting) {
        dbSetting.value = setting.value;
        dbSetting.updated_by = setting.updatedBy;
        await dbSetting.save();
      } else {
        await Setting.create({
          key: setting.key,
          value: setting.value,
          category: 'general',
          updated_by: setting.updatedBy
        });
      }
      
      keysToInvalidate.push(setting.key);
    }

    // Invalidate caches for all updated settings
    for (const key of keysToInvalidate) {
      const cacheKey = `system_setting:${key}`;
      try {
        await redisClient.del(cacheKey);
      } catch (error) {
        logger.warn(`Cache invalidation failed for setting ${key}:`, error);
      }
    }

    // Also invalidate any category caches
    try {
      await redisClient.del(`system_settings:category:*`);
    } catch (error) {
      logger.warn(`Category cache invalidation failed:`, error);
    }
  }
}

export default SystemSettingsService;