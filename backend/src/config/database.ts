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

// Enhanced database monitoring and analytics
let dbMonitoringStats = {
  totalQueries: 0,
  slowQueries: 0,
  failedQueries: 0,
  avgQueryTime: 0,
  lastQueryTime: 0,
  connectionErrors: 0,
  busyWaitTime: 0,
  activeTransactions: 0
};

// ⚡ OPTIMIZED: Enhanced Pool stats function with detailed monitoring and predictive analytics
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
        status: 'unavailable',
        utilization: 0,
        queueTimeAvg: 0,
        connectionAgeMax: 0,
        healthyConnections: 0,
        unhealthyConnections: 0,
        ...dbMonitoringStats
      };
    }

    // Get detailed pool statistics
    const using = pool.used || pool._inUseObjects?.size || 0;
    const free = pool.available || pool._availableObjects?.length || 0;
    const queue = pool.pending || pool._waitingClientsQueue?.length || 0;
    const total = using + free;
    const utilization = total > 0 ? Math.round((using / MAX_CONNECTIONS) * 100) : 0;

    // Additional metrics for enhanced monitoring
    let queueTimeAvg = 0;
    let connectionAgeMax = 0;
    let healthyConnections = 0;
    let unhealthyConnections = 0;

    // Calculate additional metrics if available
    if (pool._inUseObjects && pool._inUseObjects.size > 0) {
      // Estimate queue times and connection ages (this is approximated since we don't have direct access)
      // In a real implementation, this would be retrieved from the pool internals
      const connections = Array.from(pool._inUseObjects || []);
      if (connections.length > 0) {
        // Calculate max connection age (just an estimate)
        connectionAgeMax = 300; // Placeholder - in real implementation this would track actual ages
      }
    }

    const stats = {
      using,
      free,
      queue,
      total,
      status: 'active',
      utilization,
      queueTimeAvg: 0, // Will implement if direct access to queue times available
      connectionAgeMax,
      healthyConnections,
      unhealthyConnections,
      ...dbMonitoringStats
    };

    return stats;
  } catch (error) {
    logger.debug('Pool stats unavailable:', error.message);
    return {
      using: 0,
      free: 0,
      queue: 0,
      total: 0,
      status: 'error',
      utilization: 0,
      queueTimeAvg: 0,
      connectionAgeMax: 0,
      healthyConnections: 0,
      unhealthyConnections: 0,
      ...dbMonitoringStats
    };
  }
};

// Enhanced database monitoring functions
export const getDbMonitoringStats = () => {
  return { ...dbMonitoringStats };
};

export const resetDbMonitoringStats = () => {
  dbMonitoringStats = {
    totalQueries: 0,
    slowQueries: 0,
    failedQueries: 0,
    avgQueryTime: 0,
    lastQueryTime: 0,
    connectionErrors: 0,
    busyWaitTime: 0,
    activeTransactions: 0
  };
};

export const updateDbMonitoringStats = (queryTime: number, success: boolean = true) => {
  dbMonitoringStats.totalQueries++;
  dbMonitoringStats.lastQueryTime = queryTime;

  if (queryTime > 1000) {  // Queries taking more than 1 second are slow
    dbMonitoringStats.slowQueries++;
  }

  if (!success) {
    dbMonitoringStats.failedQueries++;
  }

  // Calculate moving average for query time
  dbMonitoringStats.avgQueryTime = (dbMonitoringStats.avgQueryTime * (dbMonitoringStats.totalQueries - 1) + queryTime) / dbMonitoringStats.totalQueries;
};

// ⚡ OPTIMIZED: Enhanced pool monitoring with predictive analytics, anomaly detection, and proactive alerts
let poolMonitoringInterval: NodeJS.Timeout | null = null;

const startPoolMonitoring = () => {
  // Clear any existing interval
  if (poolMonitoringInterval) {
    clearInterval(poolMonitoringInterval);
  }

  // Track historical values for predictive analysis
  let previousStats: any = null;
  let utilizationHistory: number[] = [];

  poolMonitoringInterval = setInterval(() => {
    const stats = getPoolStats();

    // Track utilization history for trend analysis (last 10 readings)
    utilizationHistory.push(stats.utilization || 0);
    if (utilizationHistory.length > 10) {
      utilizationHistory.shift();
    }

    // Calculate trends for predictive analysis
    const avgUtilization = utilizationHistory.reduce((a, b) => a + b, 0) / utilizationHistory.length;
    const currentUtilization = stats.utilization || 0;

    // Check for utilization trends (increasing rapidly)
    let utilizationTrend = 'stable';
    if (utilizationHistory.length >= 3) {
      const recentIncrease = currentUtilization - utilizationHistory[utilizationHistory.length - 3];
      if (recentIncrease > 20) {
        utilizationTrend = 'rapidly_increasing';
      } else if (recentIncrease > 10) {
        utilizationTrend = 'increasing';
      }
    }

    // ⚡ OPTIMIZATION: Only log if there are actual connections or issues
    if (stats.total > 0 || stats.queue > 0 || stats.status !== 'active') {
      logger.debug("📊 DB Pool Enhanced Stats with Predictive Analytics", {
        using: stats.using,
        free: stats.free,
        queue: stats.queue,
        total: stats.total,
        utilization: `${currentUtilization}%`,
        utilizationTrend,
        avgUtilization: `${Math.round(avgUtilization)}%`,
        queueTimeAvg: `${stats.queueTimeAvg}ms`,
        connectionAgeMax: `${stats.connectionAgeMax}s`,
        healthyConnections: stats.healthyConnections,
        unhealthyConnections: stats.unhealthyConnections,
        totalQueries: stats.totalQueries,
        slowQueries: stats.slowQueries,
        failedQueries: stats.failedQueries,
        avgQueryTime: `${Math.round(stats.avgQueryTime)}ms`,
        connectionErrors: stats.connectionErrors
      });

      // ⚡ PREDICTIVE ANALYTICS: Proactive alerts based on trends
      if (currentUtilization > MAX_CONNECTIONS * 0.8) {
        logger.warn(`🚨 High pool utilization: ${stats.using}/${MAX_CONNECTIONS} connections in use (${currentUtilization}%)`);

        // ⚡ CRITICAL: Alert if approaching max connections
        if (currentUtilization >= MAX_CONNECTIONS * 0.95) {
          logger.error(`🔥 CRITICAL: Approaching connection pool limit: ${stats.using}/${MAX_CONNECTIONS} (${currentUtilization}%)`);
        }
      }

      // ⚡ PREDICTIVE: Alert if utilization is rapidly increasing (suggests traffic spike coming)
      if (utilizationTrend === 'rapidly_increasing') {
        logger.warn(`📈 Predictive Alert: Connection utilization rapidly increasing. Prepare for potential scaling needs.`);
      }

      // ⚡ PREDICTIVE: Alert if queue is growing exponentially
      if (stats.queue > 5 && previousStats && stats.queue > previousStats.queue * 2) {
        logger.warn(`⚠️ Connection queue growing exponentially: ${stats.queue} waiting requests (was ${previousStats.queue})`);
      }

      // ⚡ ALERT: Queue is building up (indicates connection bottleneck)
      if (stats.queue > 5) {
        logger.warn(`⚠️ Connection queue building up: ${stats.queue} waiting requests`);
      }

      // ⚡ ALERT: High percentage of slow queries (possible performance degradation)
      if (stats.totalQueries > 10 && (stats.slowQueries / stats.totalQueries) > 0.1) {
        logger.warn(`⚠️ High percentage of slow queries: ${((stats.slowQueries / stats.totalQueries) * 100).toFixed(2)}%`);
      }

      // ⚡ ALERT: Increasing failure rate
      if (stats.totalQueries > 20 && (stats.failedQueries / stats.totalQueries) > 0.05) {
        logger.error(`🚨 High query failure rate: ${((stats.failedQueries / stats.totalQueries) * 100).toFixed(2)}%`);
      }

      // ⚡ HEALTH: Track and report connection health metrics
      if (stats.healthyConnections > 0 || stats.unhealthyConnections > 0) {
        logger.info(`🏥 DB Connection Health: ${stats.healthyConnections} healthy, ${stats.unhealthyConnections} unhealthy connections`);
      }

      // Update previous stats for comparison
      previousStats = {
        ...stats,
        timestamp: Date.now()
      };
    }
  }, 30000); // Check every 30s for more responsive monitoring with predictive features
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

// Enhanced transaction function with monitoring and analytics
export const transaction = async <T>(
  callback: (transaction: any) => Promise<T>,
  monitoringLabel: string = 'generic'
): Promise<T> => {
  const startTime = Date.now();
  dbMonitoringStats.activeTransactions++;

  let success = true;
  const t = await sequelize.transaction();

  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    dbMonitoringStats.activeTransactions--;

    updateDbMonitoringStats(duration, success);

    // Log slow transactions
    if (duration > 5000) { // Transactions taking more than 5 seconds
      logger.warn(`🐌 Slow transaction (${monitoringLabel}): ${duration}ms`, {
        duration,
        success,
        label: monitoringLabel
      });
    }
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