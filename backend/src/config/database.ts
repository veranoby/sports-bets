import { config } from "dotenv";
config(); // ← CRÍTICO: DEBE IR AQUÍ

import { Sequelize } from "sequelize";
import { logger } from "./logger";
import Redis from "redis";

// Configuration for database optimization - PRODUCTION READY
// Optimized settings for Neon.tech with proper connection pool sizing
const MAX_CONNECTIONS = 15; // Increased for production load handling
const CONNECTION_TIMEOUT_MS = 30000; // Reduced to 30 seconds for faster failure detection
const IDLE_CONNECTION_CLEANUP_MS = 5000; // 5 seconds for faster cleanup
const EVICT_INTERVAL_MS = 15000; // Run eviction every 15 seconds for better connection management

// Configuración optimizada para Neon.tech con timeouts ajustados
const poolSettings = {
  max: MAX_CONNECTIONS,         // Reduced maximum connections to prevent timeout issues
  min: 2,                       // Maintain minimum connections for faster response
  acquire: CONNECTION_TIMEOUT_MS, // Increased time to wait for connection
  idle: IDLE_CONNECTION_CLEANUP_MS,    // Reduced idle time for faster cleanup
  evict: EVICT_INTERVAL_MS,     // More frequent eviction to manage connections better
  handleDisconnects: true,      // Handle disconnections gracefully
  validate: (client: any) => {  // Validate connections before use
    return client.query('SELECT 1').then(() => true).catch(() => false);
  }
};

// Redis caching configuration for query results
const CACHE_TTL = 300; // 5 minutes cache for frequently accessed data
let redisClient: Redis.RedisClientType | null = null;

// Initialize Redis client if REDIS_URL is provided
if (process.env.REDIS_URL) {
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis client error:', err);
      redisClient = null; // Disable caching if Redis fails
    });

    redisClient.connect().catch(err => {
      logger.warn('Failed to connect to Redis:', err);
      redisClient = null;
    });

    logger.info('✅ Redis caching initialized');
  } catch (error) {
    logger.warn('Failed to initialize Redis client:', error);
    redisClient = null;
  }
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        // Neon-specific optimizations - extended timeouts for dev
        connectionTimeoutMillis: 30000,  // 30 seconds
        idle_in_transaction_session_timeout: 30000,  // 30 seconds
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      timezone: "America/Guayaquil",
      pool: poolSettings, // Configuración optimizada aquí
      benchmark: true, // Para monitoreo de performance
    })
  : new Sequelize({
      dialect: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PASSWORD || "5432"),
      database: process.env.DB_NAME || "sports_bets",
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      pool: poolSettings, // Misma configuración para desarrollo
      dialectOptions: {
        ...(process.env.NODE_ENV === "production" && {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
          // Neon optimizations
          connectionTimeoutMillis: 5000,
        }),
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      timezone: "America/Guayaquil",
    });

// ⚡ OPTIMIZED: Pool stats function with proper Sequelize access
export const getPoolStats = () => {
  try {
    const connectionManager = (sequelize as any).connectionManager;
    const pool = connectionManager?.pool;

    if (!pool) {
      return {
        using: 0,
        free: 0,
        queue: 0,
        total: 0,
        status: 'unavailable'
      };
    }

    // Access pool statistics properly
    const stats = {
      using: pool.used || pool._inUseObjects?.size || 0,
      free: pool.available || pool._availableObjects?.length || 0,
      queue: pool.pending || pool._waitingClientsQueue?.length || 0,
      total: (pool.used || 0) + (pool.available || 0),
      status: 'active'
    };

    return stats;
  } catch (error) {
    logger.debug('Pool stats unavailable:', error.message);
    return {
      using: 0,
      free: 0,
      queue: 0,
      total: 0,
      status: 'error'
    };
  }
};

// ⚡ OPTIMIZED: Pool monitoring with reduced frequency and intelligent logging
let poolMonitoringInterval: NodeJS.Timeout | null = null;

const startPoolMonitoring = () => {
  // Clear any existing interval
  if (poolMonitoringInterval) {
    clearInterval(poolMonitoringInterval);
  }

  // ⚡ PERFORMANCE FIX: Reduced from 30s to 2 minutes to reduce log spam
  poolMonitoringInterval = setInterval(() => {
    const stats = getPoolStats();

    // ⚡ OPTIMIZATION: Only log if there are actual connections or issues
    if (stats.total > 0 || stats.queue > 0 || stats.status !== 'active') {
      logger.debug("📊 DB Pool", {
        using: stats.using,
        free: stats.free,
        queue: stats.queue,
        total: stats.total,
        utilization: stats.total > 0 ? Math.round((stats.using / MAX_CONNECTIONS) * 100) + '%' : '0%'
      });

      // ⚡ ALERT: Warn if pool utilization is high
      if (stats.using > MAX_CONNECTIONS * 0.8) {
        logger.warn(`🚨 High pool utilization: ${stats.using}/${MAX_CONNECTIONS} connections in use`);
      }
    }
  }, 120000); // 2 minutes instead of 30 seconds
};

// Función de conexión con monitoreo mejorado y retry logic
export const connectDatabase = async (): Promise<void> => {
  const maxRetries = 3;
  const retryDelay = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info("✅ Database connection established", {
        poolStats: getPoolStats(),
        config: {
          dialect: sequelize.getDialect(),
          database: sequelize.getDatabaseName(),
        },
        attempt
      });

      // 🚫 SYNC DISABLED - MIGRATION-ONLY ARCHITECTURE
      // Never use sync in production or any environment - causes constraint bloat
      // All schema changes MUST go through controlled migrations
      if (process.env.ENABLE_DANGEROUS_SYNC === "true") {
        logger.warn("⚠️  DANGEROUS: Sequelize sync enabled via ENABLE_DANGEROUS_SYNC");
        logger.warn("🚫 This should NEVER be used in production");
        await sequelize.sync({ alter: true });
        logger.info("⚠️  Database models synchronized (DANGEROUS MODE)");
      } else {
        logger.info("✅ Database sync DISABLED - using migration-only architecture");
      }

      // ⚡ OPTIMIZATION: Start optimized pool monitoring
      startPoolMonitoring();

      return; // Success, exit the retry loop
    } catch (error) {
      logger.warn(`⚠️ Database connection attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        logger.error("❌ Database connection failed after all retries");
        logger.error("Error details:", error.message);
        logger.error("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
        console.error("Full error:", error);
        throw error;
      }

      // Wait before retrying
      logger.info(`⏳ Retrying database connection in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Función para cerrar la conexión
export const closeDatabase = async (): Promise<void> => {
  try {
    // Stop pool monitoring
    if (poolMonitoringInterval) {
      clearInterval(poolMonitoringInterval);
      poolMonitoringInterval = null;
    }

    await sequelize.close();
    logger.info("✅ Database connection closed");
  } catch (error) {
    logger.error("❌ Error closing database connection:", error);
    throw error;
  }
};

// Función para ejecutar transacciones
export const transaction = async <T>(
  callback: (transaction: any) => Promise<T>
): Promise<T> => {
  const t = await sequelize.transaction();
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// Utility function to retry database operations with exponential backoff
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors that are unlikely to succeed on retry
      if (error.name === 'SequelizeUniqueConstraintError' ||
          error.name === 'SequelizeValidationError') {
        throw error;
      }

      // Log retry attempt
      logger.warn(`⚠️ Database operation attempt ${attempt} failed:`, error.message);

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        logger.error(`❌ Database operation failed after ${maxRetries} attempts`);
        throw error;
      }

      // Calculate delay with exponential backoff (baseDelay * 2^(attempt-1))
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.info(`⏳ Retrying operation in ${delay/1000} seconds...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// ⚡ PERFORMANCE OPTIMIZED: Enhanced caching with query deduplication
const ongoingQueries = new Map<string, Promise<any>>();

export const cache = {
  // Get data from cache or execute query and cache result with deduplication
  getOrSet: async <T>(key: string, fetchFn: () => Promise<T>, ttl: number = CACHE_TTL): Promise<T> => {
    if (!redisClient) {
      // If Redis is not available, use query deduplication
      if (ongoingQueries.has(key)) {
        logger.debug(`⚡ Query deduplication: ${key}`);
        return await ongoingQueries.get(key);
      }

      const queryPromise = fetchFn();
      ongoingQueries.set(key, queryPromise);

      try {
        const result = await queryPromise;
        return result;
      } finally {
        ongoingQueries.delete(key);
      }
    }

    try {
      const cached = await redisClient.get(key);
      if (cached && typeof cached === 'string') {
        logger.debug(`⚡ Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      // Use query deduplication for cache misses
      if (ongoingQueries.has(key)) {
        logger.debug(`⚡ Query deduplication (cache miss): ${key}`);
        return await ongoingQueries.get(key);
      }

      const queryPromise = fetchFn();
      ongoingQueries.set(key, queryPromise);

      try {
        logger.debug(`🔍 Cache miss, fetching: ${key}`);
        const result = await queryPromise;
        await redisClient.setEx(key, ttl, JSON.stringify(result));
        return result;
      } finally {
        ongoingQueries.delete(key);
      }
    } catch (error) {
      logger.warn('Cache operation failed, falling back to direct query:', error);
      ongoingQueries.delete(key);
      return await fetchFn();
    }
  },

  // Invalidate cache for a specific key
  invalidate: async (key: string): Promise<void> => {
    if (!redisClient) return;

    try {
      await redisClient.del(key);
      ongoingQueries.delete(key); // Also clear ongoing queries
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
    }
  },

  // Invalidate multiple cache keys by pattern
  invalidatePattern: async (pattern: string): Promise<void> => {
    if (!redisClient) return;

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      // Clear related ongoing queries
      for (const key of ongoingQueries.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          ongoingQueries.delete(key);
        }
      }
    } catch (error) {
      logger.warn('Pattern cache invalidation failed:', error);
    }
  }
};

export { sequelize };
export default sequelize;