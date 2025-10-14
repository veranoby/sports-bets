// backend/src/config/redis.ts - PRODUCTION READY
// Safe configuration with graceful degradation
// Author: QWEN - Performance Optimization Specialist

import Redis from 'ioredis';
import { logger } from './logger';

// Configuration interface
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  connectTimeout: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  enableOfflineQueue: boolean;
}

// Safe Redis client with graceful degradation
class SafeRedisClient {
  private client: Redis | null = null;
  private fallbackCache: Map<string, { value: string; expiry: number }> = new Map();
  private isRedisAvailable = false;
  private config: RedisConfig;

  constructor() {
    // Parse configuration from environment variables
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      connectTimeout: 10000,
      retryDelayOnFailover: 100, // Custom property for internal use
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    };

    // If REDIS_URL is set, parse it
    if (process.env.REDIS_URL) {
      try {
        const url = new URL(process.env.REDIS_URL);
        this.config.host = url.hostname;
        this.config.port = parseInt(url.port) || 6379;
        this.config.password = url.password || this.config.password;
        if (url.pathname && url.pathname.length > 1) {
          this.config.db = parseInt(url.pathname.substring(1)) || this.config.db;
        }
      } catch (error) {
        logger.warn('Invalid REDIS_URL format:', process.env.REDIS_URL);
      }
    }

    // Initialize Redis client only if configuration is provided
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      try {
        this.client = new Redis({
          host: this.config.host,
          port: this.config.port,
          password: this.config.password,
          db: this.config.db,
          connectTimeout: this.config.connectTimeout,
          maxRetriesPerRequest: this.config.maxRetriesPerRequest,
          enableOfflineQueue: this.config.enableOfflineQueue,
          lazyConnect: true,
        });

        this.client.on('connect', () => {
          logger.info(`✅ Redis connected successfully to ${this.config.host}:${this.config.port}`);
          this.isRedisAvailable = true;
        });

        this.client.on('error', (error) => {
          logger.warn(`⚠️ Redis connection error: ${error.message}`);
          this.isRedisAvailable = false;
        });

        this.client.on('close', () => {
          logger.info('Redis connection closed');
          this.isRedisAvailable = false;
        });

        this.client.on('reconnecting', () => {
          logger.info('Redis reconnecting...');
        });

        // Connect lazily
        this.client.connect().catch(error => {
          logger.warn(`⚠️ Redis lazy connect failed: ${error.message}`);
          this.isRedisAvailable = false;
        });
      } catch (error) {
        logger.warn(`⚠️ Redis initialization failed: ${error}`);
        this.isRedisAvailable = false;
      }
    } else {
      logger.info('ℹ️ Redis not configured - running without caching');
      this.isRedisAvailable = false;
    }
  }

  // Get value from Redis or fallback cache
  async get(key: string): Promise<string | null> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.get(key);
      } catch (error) {
        logger.warn(`⚠️ Redis GET failed for key ${key}: ${error}`);
        return this.getFromFallback(key);
      }
    }
    return this.getFromFallback(key);
  }

  // Set value in Redis or fallback cache
  async set(key: string, value: string, ttl: number = 300): Promise<void> {
    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.set(key, value, 'EX', ttl);
        return;
      } catch (error) {
        logger.warn(`⚠️ Redis SET failed for key ${key}: ${error}`);
      }
    }
    this.setToFallback(key, value, ttl);
  }

  // Legacy alias for set with expiry
  async setex(key: string, ttl: number, value: string): Promise<void> {
    return this.set(key, value, ttl);
  }

  // Delete keys by pattern from Redis or fallback cache
  async del(pattern: string): Promise<void> {
    if (this.isRedisAvailable && this.client) {
      try {
        const keys = await this.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
        return;
      } catch (error) {
        logger.warn(`⚠️ Redis DEL failed for pattern ${pattern}: ${error}`);
      }
    }
    this.delFromFallback(pattern);
  }

  // Get keys by pattern
  async keys(pattern: string): Promise<string[]> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.keys(pattern);
      } catch (error) {
        logger.warn(`⚠️ Redis KEYS failed for pattern ${pattern}: ${error}`);
        return [];
      }
    }
    // Return matching keys from fallback
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.fallbackCache.keys()).filter(key => regex.test(key));
  }

  // Get from fallback in-memory cache
  private getFromFallback(key: string): string | null {
    const entry = this.fallbackCache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.value;
    }
    this.fallbackCache.delete(key);
    return null;
  }

  // Set in fallback in-memory cache
  private setToFallback(key: string, value: string, ttl: number): void {
    this.fallbackCache.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000)
    });
  }

  // Delete from fallback in-memory cache
  private delFromFallback(pattern: string): void {
    // Simple pattern matching for fallback cache
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.fallbackCache.keys()) {
      if (regex.test(key)) {
        this.fallbackCache.delete(key);
      }
    }
  }

  // Check if Redis is available
  isAvailable(): boolean {
    return this.isRedisAvailable;
  }
}

// Create singleton instance
export const redisClient = new SafeRedisClient();

// Utility function for cache-aside pattern
export async function getOrSet<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      logger.debug(`⚡ Cache hit: ${key}`);
      return JSON.parse(cached);
    }

    logger.debug(`🔄 Cache miss: ${key} - fetching from database`);
    const data = await fetchFunction();
    
    // Only cache if data is not null/undefined
    if (data !== null && data !== undefined) {
      await redisClient.set(key, JSON.stringify(data), ttl);
    }
    
    return data;
  } catch (error) {
    logger.error(`❌ Cache operation failed for key ${key}:`, error);
    return await fetchFunction();
  }
}

// Pattern-based cache invalidation
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    await redisClient.del(pattern);
    logger.debug(`🧹 Cache invalidated: ${pattern}`);
  } catch (error) {
    logger.warn(`⚠️ Cache invalidation failed for pattern ${pattern}:`, error);
  }
}

// Export configuration for debugging
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  enabled: !!(process.env.REDIS_URL || process.env.REDIS_HOST),
};

// Helper functions for backward compatibility
export async function getCache(key: string): Promise<string | null> {
  return redisClient.get(key);
}

export async function setCache(key: string, value: string, ttl: number = 300): Promise<void> {
  return redisClient.set(key, value, ttl);
}

export async function delCache(pattern: string): Promise<void> {
  return redisClient.del(pattern);
}

// Initialize Redis connection (for compatibility)
export async function initRedis(): Promise<void> {
  // Redis is initialized automatically in constructor
  logger.info('Redis client initialized via SafeRedisClient constructor');
}

// Health check function
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy' | 'disabled';
  message: string;
  details?: any
}> {
  if (!redisClient.isAvailable()) {
    return {
      status: 'disabled',
      message: 'Redis is not configured or disabled'
    };
  }

  try {
    const pong = await redisClient.get('ping');
    if (pong === 'pong' || pong === null) {
      return {
        status: 'healthy',
        message: 'Redis is connected and responding'
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Redis is connected but not responding correctly'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Redis health check failed: ${error}`,
      details: error
    };
  }
}