
import { Op } from 'sequelize';
import { SystemSetting } from '../models/SystemSetting';
import { getCache, setCache, delCache } from '../config/redis';

const SETTINGS_CACHE_KEY = 'system_settings';
const SETTINGS_CACHE_TTL = 300; // 5 minutes

interface SettingsCache {
  [key: string]: {
    value: any;
    type: string;
    expires: number;
  };
}

class SettingsService {
  private cache: SettingsCache = {};
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Get single setting with enhanced caching
  async getSetting(key: string): Promise<any | null> {
    try {
      // Check Redis cache first
      const cached = await getCache(`${SETTINGS_CACHE_KEY}:${key}`);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        console.log(`📦 Settings cache hit for key: ${key}`);
        return this.parseValue(parsedCache.value, parsedCache.type);
      }

      // Fallback to memory cache
      if (this.cache[key] && Date.now() < this.cache[key].expires) {
        console.log(`🧠 Memory cache hit for key: ${key}`);
        return this.parseValue(this.cache[key].value, this.cache[key].type);
      }

      // Fetch from database
      const setting = await SystemSetting.findOne({ where: { key } });
      if (!setting) {
        return null;
      }

      const parsedValue = this.parseValue(setting.value, setting.type);

      // Cache in Redis
      await setCache(
        `${SETTINGS_CACHE_KEY}:${key}`,
        JSON.stringify({ value: setting.value, type: setting.type }),
        SETTINGS_CACHE_TTL
      );

      // Cache in memory as fallback
      this.cache[key] = {
        value: setting.value,
        type: setting.type,
        expires: Date.now() + this.cacheTimeout
      };

      console.log(`🔍 Database fetch for key: ${key}`);
      return parsedValue;
    } catch (error) {
      console.error(`❌ Error getting setting '${key}':`, error);
      return null;
    }
  }

  // Get multiple settings by category
  async getByCategory(category: string): Promise<Record<string, any>> {
    try {
      const cacheKey = `${SETTINGS_CACHE_KEY}:category:${category}`;
      
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log(`📦 Category cache hit for: ${category}`);
        return JSON.parse(cached);
      }

      const settings = await SystemSetting.findAll({
        where: { category }
      });

      const result: Record<string, any> = {};
      settings.forEach(setting => {
        result[setting.key] = this.parseValue(setting.value, setting.type);
      });

      await setCache(cacheKey, JSON.stringify(result), SETTINGS_CACHE_TTL);

      console.log(`🔍 Database fetch for category: ${category}`);
      return result;
    } catch (error) {
      console.error(`❌ Error getting settings for category '${category}':`, error);
      return {};
    }
  }

  // Get all public settings (for non-admin users)
  async getPublicSettings(): Promise<Record<string, any>> {
    try {
      const cacheKey = `${SETTINGS_CACHE_KEY}:public`;
      
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log(`📦 Public settings cache hit`);
        return JSON.parse(cached);
      }

      const settings = await SystemSetting.findAll({
        where: { is_public: true }
      });

      const result: Record<string, any> = {};
      settings.forEach(setting => {
        result[setting.key] = this.parseValue(setting.value, setting.type);
      });

      await setCache(cacheKey, JSON.stringify(result), SETTINGS_CACHE_TTL);
      return result;
    } catch (error) {
      console.error(`❌ Error getting public settings:`, error);
      return {};
    }
  }

  async getAllSettings(): Promise<Record<string, any>> {
    try {
      const cachedSettings = await getCache(SETTINGS_CACHE_KEY);
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }

      const dbSettings = await SystemSetting.findAll();
      
      // If no settings found, return empty object instead of null
      if (!dbSettings || dbSettings.length === 0) {
        console.log('⚠️ No settings found in database, returning defaults...');
        // Return basic defaults without database creation for now
        return {
          maintenance_mode: false,
          enable_streaming: true,
          enable_wallets: true,
          enable_betting: true,
          enable_push_notifications: true
        };
      }

      const settingsMap = dbSettings.reduce((acc, setting) => {
        acc[setting.key] = this.parseValue(setting.value, setting.type);
        return acc;
      }, {} as Record<string, any>);

      await setCache(SETTINGS_CACHE_KEY, JSON.stringify(settingsMap), SETTINGS_CACHE_TTL);
      return settingsMap;
    } catch (error) {
      console.error('❌ Error getting all settings:', error);
      return {}; // Return empty object on error
    }
  }

  async updateSetting(key: string, value: any, updatedBy?: string): Promise<[number]> {
    try {
      const setting = await SystemSetting.findOne({ where: { key } });
      if (!setting) {
        throw new Error(`Setting '${key}' not found`);
      }

      // Validate value type
      this.validateValue(value, setting.type);

      const result = await SystemSetting.update({
        value: this.serializeValue(value, setting.type),
        updated_by: updatedBy
      }, { where: { key } });

      // Invalidate caches
      await this.invalidateCache(key, setting.category);

      console.log(`✅ Updated setting '${key}' to:`, value);
      return result;
    } catch (error) {
      console.error(`❌ Error updating setting '${key}':`, error);
      throw error;
    }
  }

  async createSetting(data: {
    key: string;
    value: any;
    type: 'boolean' | 'string' | 'number' | 'json';
    category: string;
    description?: string;
    is_public?: boolean;
    updated_by?: string;
  }): Promise<SystemSetting> {
    const newSetting = await SystemSetting.create(data);
    await delCache(SETTINGS_CACHE_KEY);
    return newSetting;
  }

  async deleteSetting(key: string): Promise<number> {
    const result = await SystemSetting.destroy({ where: { key } });
    await delCache(SETTINGS_CACHE_KEY);
    return result;
  }

  // Feature toggle helpers
  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    try {
      const value = await this.getSetting(featureKey);
      return Boolean(value);
    } catch (error) {
      console.warn(`⚠️ Feature check failed for '${featureKey}', defaulting to false`);
      return false;
    }
  }

  // Quick feature checks
  async areWalletsEnabled(): Promise<boolean> {
    return this.isFeatureEnabled('enable_wallets');
  }

  async isBettingEnabled(): Promise<boolean> {
    return this.isFeatureEnabled('enable_betting');
  }

  async isStreamingEnabled(): Promise<boolean> {
    return this.isFeatureEnabled('enable_streaming');
  }

  async isMaintenanceMode(): Promise<boolean> {
    return this.isFeatureEnabled('maintenance_mode');
  }

  // Private helper methods
  private parseValue(value: any, type: string): any {
    switch (type) {
      case 'boolean':
        return value === 'true' || value === true;
      case 'number':
        return typeof value === 'string' ? parseFloat(value) : value;
      case 'string':
        return value.toString();
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value;
      default:
        return value;
    }
  }

  private serializeValue(value: any, type: string): any {
    switch (type) {
      case 'boolean':
        return Boolean(value);
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'json':
        return typeof value === 'object' ? value : JSON.parse(value);
      default:
        return value;
    }
  }

  private validateValue(value: any, type: string): void {
    switch (type) {
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          throw new Error(`Value must be boolean for type '${type}'`);
        }
        break;
      case 'number':
        if (isNaN(Number(value))) {
          throw new Error(`Value must be a valid number for type '${type}'`);
        }
        break;
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Value must be string for type '${type}'`);
        }
        break;
      case 'json':
        try {
          if (typeof value === 'string') {
            JSON.parse(value);
          }
        } catch {
          throw new Error(`Value must be valid JSON for type '${type}'`);
        }
        break;
    }
  }

  private async invalidateCache(key: string, category: string): Promise<void> {
    // Clear memory cache
    delete this.cache[key];

    // Clear Redis cache
    await Promise.all([
      delCache(`${SETTINGS_CACHE_KEY}:${key}`),
      delCache(`${SETTINGS_CACHE_KEY}:category:${category}`),
      delCache(`${SETTINGS_CACHE_KEY}:public`),
      delCache(SETTINGS_CACHE_KEY)
    ]);

    console.log(`🗑️ Cache invalidated for key: ${key}`);
  }

  // Initialize default settings if none exist - TEMPORARILY DISABLED
  private async initializeDefaultSettings(): Promise<void> {
    console.log('🚀 Default settings initialization temporarily disabled due to TypeScript issues');
    // TODO: Fix TypeScript compilation error and re-enable
  }
}

export const settingsService = new SettingsService();
export default settingsService;
