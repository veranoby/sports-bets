import { Op } from 'sequelize';
import { SystemSetting } from '../models/SystemSetting';
import { getCache, setCache, delCache } from '../config/redis';

const SETTINGS_CACHE_KEY = 'system_settings';
const SETTINGS_CACHE_TTL = 600; // ⚡ INCREASED to 10 minutes for better performance

interface SettingsCache {
  [key: string]: {
    value: any;
    type: string;
    expires: number;
  };
}

class SettingsService {
  private cache: SettingsCache = {};
  private cacheTimeout = 10 * 60 * 1000; // ⚡ INCREASED to 10 minutes for performance

  // ⚡ OPTIMIZED: Aggressive caching for single settings
  async getSetting(key: string): Promise<any | null> {
    try {
      // Check Redis cache first
      const cached = await getCache(`${SETTINGS_CACHE_KEY}:${key}`);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // ⚡ REDUCED LOGGING: Only debug logs to reduce noise
        return this.parseValue(parsedCache.value, parsedCache.type);
      }

      // Fallback to memory cache
      if (this.cache[key] && Date.now() < this.cache[key].expires) {
        return this.parseValue(this.cache[key].value, this.cache[key].type);
      }

      // Fetch from database
      const setting = await SystemSetting.findOne({ where: { key } });
      if (!setting) {
        return null;
      }

      const parsedValue = this.parseValue(setting.value, setting.type);

      // ⚡ OPTIMIZATION: Longer cache TTL for settings
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

      return parsedValue;
    } catch (error) {
      console.error(`❌ Error getting setting '${key}':`, error);
      return null;
    }
  }

  // ⚡ OPTIMIZED: Batch settings loading with longer cache
  async getByCategory(category: string): Promise<Record<string, any>> {
    try {
      const cacheKey = `${SETTINGS_CACHE_KEY}:category:${category}`;

      const cached = await getCache(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const settings = await SystemSetting.findAll({
        where: { category }
      });

      const result: Record<string, any> = {};
      settings.forEach(setting => {
        result[setting.key] = this.parseValue(setting.value, setting.type);
      });

      // ⚡ OPTIMIZATION: Longer cache for categories
      await setCache(cacheKey, JSON.stringify(result), SETTINGS_CACHE_TTL);

      return result;
    } catch (error) {
      console.error(`❌ Error getting settings for category '${category}':`, error);
      return {};
    }
  }

  // ⚡ ULTRA OPTIMIZED: Public settings with extended caching
  async getPublicSettings(): Promise<Record<string, any>> {
    try {
      const cacheKey = `${SETTINGS_CACHE_KEY}:public`;

      const cached = await getCache(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const settings = await SystemSetting.findAll({
        where: { is_public: true }
      });

      const result: Record<string, any> = {};
      settings.forEach(setting => {
        result[setting.key] = this.parseValue(setting.value, setting.type);
      });

      // ⚡ CRITICAL OPTIMIZATION: 15 minute cache for public settings (requested frequently)
      await setCache(cacheKey, JSON.stringify(result), 900); // 15 minutes

      return result;
    } catch (error) {
      console.error(`❌ Error getting public settings:`, error);
      return {};
    }
  }

  // ⚡ MEGA OPTIMIZED: All settings with ultra-aggressive caching
  async getAllSettings(): Promise<Record<string, any>> {
    try {
      const cachedSettings = await getCache(SETTINGS_CACHE_KEY);
      if (cachedSettings) {
        return JSON.parse(cachedSettings);
      }

      const dbSettings = await SystemSetting.findAll();

      // ⚡ PERFORMANCE: Enhanced defaults to avoid empty database hits
      if (!dbSettings || dbSettings.length === 0) {
        const defaults = {
          maintenance_mode: false,
          enable_streaming: true,
          enable_wallets: true,
          enable_betting: true,
          enable_push_notifications: true,
          commission_percentage: 5,
          max_bet_amount: 10000,
          min_bet_amount: 1,
          auto_approval_threshold: 100
        };

        // ⚡ OPTIMIZATION: Cache defaults for 5 minutes to avoid repeated DB hits
        await setCache(SETTINGS_CACHE_KEY, JSON.stringify(defaults), 300);
        return defaults;
      }

      const settingsMap = dbSettings.reduce((acc, setting) => {
        acc[setting.key] = this.parseValue(setting.value, setting.type);
        return acc;
      }, {} as Record<string, any>);

      // ⚡ OPTIMIZATION: Longer cache for all settings (loaded frequently)
      await setCache(SETTINGS_CACHE_KEY, JSON.stringify(settingsMap), SETTINGS_CACHE_TTL);
      return settingsMap;
    } catch (error) {
      console.error('❌ Error getting all settings:', error);

      // ⚡ FALLBACK: Return cached defaults on error
      return {
        maintenance_mode: false,
        enable_streaming: true,
        enable_wallets: true,
        enable_betting: true,
        enable_push_notifications: true
      };
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

      // ⚡ OPTIMIZATION: Smart cache invalidation
      await this.invalidateCache(key, setting.category);

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

  // ⚡ MEGA OPTIMIZED: Feature toggles with local memory cache
  private featureCache = new Map<string, { value: boolean; expires: number }>();
  private featureCacheTimeout = 2 * 60 * 1000; // 2 minutes for feature flags

  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    try {
      // ⚡ ULTRA FAST: Check memory cache first for feature flags
      const cached = this.featureCache.get(featureKey);
      if (cached && Date.now() < cached.expires) {
        return cached.value;
      }

      const value = await this.getSetting(featureKey);
      // ⚡ FIX: Default to true if setting doesn't exist (feature enabled by default)
      const enabled = value === null || value === undefined ? true : Boolean(value);

      // ⚡ OPTIMIZATION: Cache feature flags in memory for ultra-fast access
      this.featureCache.set(featureKey, {
        value: enabled,
        expires: Date.now() + this.featureCacheTimeout
      });

      return enabled;
    } catch (error) {
      console.warn(`⚠️ Feature check failed for '${featureKey}', defaulting to true`);
      return true;
    }
  }

  // ⚡ OPTIMIZED: Batch feature checks to reduce database calls
  async checkMultipleFeatures(features: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Check cache first
    const uncachedFeatures: string[] = [];
    for (const feature of features) {
      const cached = this.featureCache.get(feature);
      if (cached && Date.now() < cached.expires) {
        results[feature] = cached.value;
      } else {
        uncachedFeatures.push(feature);
      }
    }

    // Fetch uncached features in batch
    if (uncachedFeatures.length > 0) {
      try {
        const settings = await SystemSetting.findAll({
          where: { key: { [Op.in]: uncachedFeatures } }
        });

        for (const feature of uncachedFeatures) {
          const setting = settings.find(s => s.key === feature);
          const enabled = setting ? Boolean(this.parseValue(setting.value, setting.type)) : false;

          results[feature] = enabled;
          this.featureCache.set(feature, {
            value: enabled,
            expires: Date.now() + this.featureCacheTimeout
          });
        }
      } catch (error) {
        console.warn('⚠️ Batch feature check failed:', error);
        // Set defaults for uncached features
        for (const feature of uncachedFeatures) {
          results[feature] = false;
        }
      }
    }

    return results;
  }

  // Quick feature checks with enhanced caching
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

  // ⚡ OPTIMIZED: Smart cache invalidation with reduced impact
  private async invalidateCache(key: string, category: string): Promise<void> {
    // Clear memory caches
    delete this.cache[key];
    this.featureCache.delete(key);

    // Clear Redis cache strategically
    await Promise.all([
      delCache(`${SETTINGS_CACHE_KEY}:${key}`),
      delCache(`${SETTINGS_CACHE_KEY}:category:${category}`),
      delCache(`${SETTINGS_CACHE_KEY}:public`),
      delCache(SETTINGS_CACHE_KEY)
    ]);
  }

  // ⚡ PERFORMANCE: Clear memory caches periodically to prevent memory leaks
  public clearExpiredCaches(): void {
    const now = Date.now();

    // Clear expired memory cache
    for (const [key, cached] of Object.entries(this.cache)) {
      if (now >= cached.expires) {
        delete this.cache[key];
      }
    }

    // Clear expired feature cache
    for (const [key, cached] of this.featureCache.entries()) {
      if (now >= cached.expires) {
        this.featureCache.delete(key);
      }
    }
  }

  // Initialize cache cleanup interval
  private initCacheCleanup(): void {
    // ⚡ OPTIMIZATION: Clean up expired caches every 5 minutes
    setInterval(() => {
      this.clearExpiredCaches();
    }, 5 * 60 * 1000);
  }

  constructor() {
    this.initCacheCleanup();
  }
}

export const settingsService = new SettingsService();
export default settingsService;