import { EventConnection } from '../models';
import { logger } from '../config/logger';

// Configuration
const BATCH_FLUSH_INTERVAL_MS = 5000; // 5 seconds
const BATCH_MAX_SIZE = 50;
const QUERY_TIMEOUT_MS = 10000; // 10 seconds
const MAX_CONNECTIONS = 15;
const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds
const IDLE_CONNECTION_CLEANUP_MS = 10000; // 10 seconds

// Batch queue for analytics events
let analyticsBatch: Array<{
  event_id: number;
  user_id: number;
  session_id: string;
  connected_at: Date;
  ip_address?: string;
  user_agent?: string;
}> = [];

// Active connections counter
let activeConnections = 0;

// Circuit breaker for database errors
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;
let circuitBreakerTripped = false;
let circuitBreakerResetTimer: NodeJS.Timeout | null = null;

/**
 * DatabaseOptimizer for implementing batch operations and connection limits
 * 
 * Features:
 * - Queue analytics events for batch processing
 * - Flush batches every 5 seconds or 50 records
 * - Single bulkCreate instead of individual inserts
 * - Retry logic for failed batches
 * - Connection pooling with max 15 connections
 * - Query timeouts to prevent long-running operations
 * - Circuit breaker for consecutive failures
 */
export class DatabaseOptimizer {
  /**
   * Queue an analytics event for batch processing
   * 
   * @param eventData Event connection data
   */
  static queueAnalyticsEvent(eventData: {
    event_id: number;
    user_id: number;
    session_id: string;
    connected_at: Date;
    ip_address?: string;
    user_agent?: string;
  }): void {
    // Check circuit breaker
    if (circuitBreakerTripped) {
      logger.warn('Circuit breaker tripped, dropping analytics event');
      return;
    }

    // Add to batch
    analyticsBatch.push(eventData);

    // Flush if batch is full
    if (analyticsBatch.length >= BATCH_MAX_SIZE) {
      this.flushAnalyticsBatch().catch(err => {
        logger.error('Failed to flush analytics batch:', { error: err });
      });
    }
  }

  /**
   * Flush the analytics batch to the database
   */
  static async flushAnalyticsBatch(): Promise<void> {
    // Clear any existing flush timeout
    if (this.batchFlushTimeout) {
      clearTimeout(this.batchFlushTimeout);
      this.batchFlushTimeout = null;
    }

    // If batch is empty, nothing to do
    if (analyticsBatch.length === 0) {
      return;
    }

    // Take a snapshot of the current batch
    const batchToProcess = [...analyticsBatch];
    analyticsBatch = [];

    try {
      // Reset consecutive errors on successful operation
      consecutiveErrors = 0;
      
      // Perform bulk insert with timeout
      await Promise.race([
        EventConnection.bulkCreate(batchToProcess),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Bulk create timeout')), QUERY_TIMEOUT_MS)
        )
      ]);

      logger.info(`Flushed analytics batch of ${batchToProcess.length} records`);
    } catch (error) {
      // Increment consecutive errors
      consecutiveErrors++;
      
      // Trip circuit breaker if too many errors
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        circuitBreakerTripped = true;
        logger.error('Circuit breaker tripped due to consecutive database errors');
        
        // Reset circuit breaker after a delay
        if (circuitBreakerResetTimer) {
          clearTimeout(circuitBreakerResetTimer);
        }
        circuitBreakerResetTimer = setTimeout(() => {
          circuitBreakerTripped = false;
          consecutiveErrors = 0;
          logger.info('Circuit breaker reset');
        }, 60000); // 1 minute
      }
      
      // Re-queue failed batch
      analyticsBatch.unshift(...batchToProcess);
      
      logger.error('Failed to flush analytics batch:', { error });
      throw error;
    }
  }

  /**
   * Get current batch size
   * 
   * @returns Current batch size
   */
  static getCurrentBatchSize(): number {
    return analyticsBatch.length;
  }

  /**
   * Get connection pool status
   * 
   * @returns Connection pool status
   */
  static getConnectionPoolStatus(): {
    active: number;
    max: number;
    available: number;
  } {
    return {
      active: activeConnections,
      max: MAX_CONNECTIONS,
      available: MAX_CONNECTIONS - activeConnections
    };
  }

  /**
   * Acquire a database connection
   * 
   * @returns Connection token
   */
  static async acquireConnection(): Promise<string> {
    // Check if we're at the connection limit
    if (activeConnections >= MAX_CONNECTIONS) {
      throw new Error('Maximum database connections reached');
    }

    // Increment active connections
    activeConnections++;
    
    // Generate a connection token
    const token = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up automatic connection cleanup
    setTimeout(() => {
      this.releaseConnection(token);
    }, CONNECTION_TIMEOUT_MS);
    
    return token;
  }

  /**
   * Release a database connection
   * 
   * @param token Connection token
   */
  static releaseConnection(token: string): void {
    if (activeConnections > 0) {
      activeConnections--;
    }
  }

  /**
   * Get database health metrics
   * 
   * @returns Health metrics
   */
  static getHealthMetrics(): {
    batching: {
      currentBatchSize: number;
      maxBatchSize: number;
      flushIntervalMs: number;
    };
    connections: {
      active: number;
      max: number;
      available: number;
    };
    circuitBreaker: {
      tripped: boolean;
      consecutiveErrors: number;
      maxConsecutiveErrors: number;
    };
  } {
    return {
      batching: {
        currentBatchSize: this.getCurrentBatchSize(),
        maxBatchSize: BATCH_MAX_SIZE,
        flushIntervalMs: BATCH_FLUSH_INTERVAL_MS
      },
      connections: this.getConnectionPoolStatus(),
      circuitBreaker: {
        tripped: circuitBreakerTripped,
        consecutiveErrors,
        maxConsecutiveErrors: MAX_CONSECUTIVE_ERRORS
      }
    };
  }

  // Batch flush timeout reference
  private static batchFlushTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialize the database optimizer
   */
  static initialize(): void {
    // Set up periodic batch flushing
    this.batchFlushTimeout = setInterval(() => {
      if (analyticsBatch.length > 0) {
        this.flushAnalyticsBatch().catch(err => {
          logger.error('Failed to flush analytics batch in periodic flush:', { error: err });
        });
      }
    }, BATCH_FLUSH_INTERVAL_MS);

    logger.info('DatabaseOptimizer initialized');
  }
}

// Initialize the optimizer
DatabaseOptimizer.initialize();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Flushing remaining analytics batch on shutdown...');
  try {
    await DatabaseOptimizer.flushAnalyticsBatch();
  } catch (error) {
    logger.error('Failed to flush analytics batch on shutdown:', { error });
  }
});

process.on('SIGINT', async () => {
  logger.info('Flushing remaining analytics batch on shutdown...');
  try {
    await DatabaseOptimizer.flushAnalyticsBatch();
  } catch (error) {
    logger.error('Failed to flush analytics batch on shutdown:', { error });
  }
});

export default DatabaseOptimizer;