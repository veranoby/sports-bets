import { logger } from "../config/logger";
import * as os from "os";

// Track active intervals for cleanup
const activeIntervals = new Map<NodeJS.Timeout, {
  id: string;
  fn: Function;
  interval: number;
  errorCount: number;
  maxErrors: number;
  lastError?: Error;
}>();

// Track memory usage
let peakMemoryUsage = 0;
// Use actual container/system memory limit, not arbitrary 400MB
// Falls back to 400MB if system reports less (e.g., in development)
const MEMORY_LIMIT_MB = Math.max(
  Math.ceil(os.totalmem() / 1024 / 1024),
  400
);

// Graceful shutdown handler
let shutdownHandlers: Array<() => Promise<void> | void> = [];
let isShuttingDown = false;

/**
 * SafetyLimits utility class for preventing memory leaks and infinite loops
 *
 * Features:
 * - Circuit breaker for setInterval operations
 * - Memory usage monitoring (actual container/system memory limit)
 * - Error count tracking with automatic stopping
 * - Graceful cleanup of all intervals on SIGTERM
 * - Health metrics endpoint for Railway monitoring
 */
export class SafetyLimits {
  /**
   * Create a safe interval with error limits and automatic cleanup
   * 
   * @param fn Function to execute
   * @param intervalMs Interval in milliseconds
   * @param maxErrors Maximum consecutive errors before stopping (default: 3)
   * @param id Optional identifier for debugging
   * @returns Cleanup function to clear the interval
   */
  static createSafeInterval(
    fn: () => void,
    intervalMs: number,
    maxErrors: number = 3,
    id?: string
  ): () => void {
    // Validate parameters
    if (typeof fn !== 'function') {
      throw new TypeError('fn must be a function');
    }
    if (intervalMs <= 0) {
      throw new Error('intervalMs must be positive');
    }
    if (maxErrors <= 0) {
      throw new Error('maxErrors must be positive');
    }

    // Generate ID if not provided
    if (!id) {
      id = `interval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Check memory before creating interval
    if (this.getCurrentMemoryUsageMB() > MEMORY_LIMIT_MB) {
      logger.warn(`Memory limit exceeded (${MEMORY_LIMIT_MB}MB). Skipping interval creation.`, { id });
      throw new Error(`Memory limit exceeded (${MEMORY_LIMIT_MB}MB)`);
    }

    let errorCount = 0;
    const wrappedFn = () => {
      try {
        fn();
        errorCount = 0; // Reset on success
      } catch (error) {
        errorCount++;
        logger.error(`SafeInterval error (${id}):`, { error, errorCount, maxErrors });
        
        // Store error info
        const intervalInfo = activeIntervals.get(intervalId);
        if (intervalInfo) {
          intervalInfo.errorCount = errorCount;
          intervalInfo.lastError = error as Error;
        }
        
        // Stop if too many errors
        if (errorCount >= maxErrors) {
          logger.error(`SafeInterval stopping due to too many errors (${id})`);
          this.clearInterval(intervalId);
        }
      }
    };

    const intervalId = setInterval(wrappedFn, intervalMs) as unknown as NodeJS.Timeout;
    
    // Store interval info
    activeIntervals.set(intervalId, {
      id,
      fn: wrappedFn,
      interval: intervalMs,
      errorCount: 0,
      maxErrors
    });

    // Return cleanup function
    return () => this.clearInterval(intervalId);
  }

  /**
   * Clear a safe interval and remove it from tracking
   * @param intervalId Interval ID returned by createSafeInterval
   */
  static clearInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    activeIntervals.delete(intervalId);
  }

  /**
   * Get current memory usage in MB
   * @returns Memory usage in MB
   */
  static getCurrentMemoryUsageMB(): number {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    peakMemoryUsage = Math.max(peakMemoryUsage, used);
    return Math.round(used * 100) / 100;
  }

  /**
   * Get peak memory usage in MB
   * @returns Peak memory usage in MB
   */
  static getPeakMemoryUsageMB(): number {
    return Math.round(peakMemoryUsage * 100) / 100;
  }

  /**
   * Check if memory usage is within safe limits
   * @returns True if within limits, false otherwise
   */
  static isMemoryUsageSafe(): boolean {
    return this.getCurrentMemoryUsageMB() <= MEMORY_LIMIT_MB;
  }

  /**
   * Get health metrics for Railway monitoring
   * @returns Health metrics object
   */
  static getHealthMetrics(): {
    memory: {
      currentMB: number;
      peakMB: number;
      limitMB: number;
      safe: boolean;
    };
    intervals: {
      activeCount: number;
      details: Array<{
        id: string;
        intervalMs: number;
        errorCount: number;
        maxErrors: number;
      }>;
    };
  } {
    return {
      memory: {
        currentMB: this.getCurrentMemoryUsageMB(),
        peakMB: this.getPeakMemoryUsageMB(),
        limitMB: MEMORY_LIMIT_MB,
        safe: this.isMemoryUsageSafe()
      },
      intervals: {
        activeCount: activeIntervals.size,
        details: Array.from(activeIntervals.values()).map(info => ({
          id: info.id,
          intervalMs: info.interval,
          errorCount: info.errorCount,
          maxErrors: info.maxErrors
        }))
      }
    };
  }

  /**
   * Register a shutdown handler for graceful cleanup
   * @param handler Cleanup function
   */
  static registerShutdownHandler(handler: () => Promise<void> | void): void {
    shutdownHandlers.push(handler);
  }

  /**
   * Execute all shutdown handlers
   */
  static async executeShutdownHandlers(): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info('Executing shutdown handlers...', { handlerCount: shutdownHandlers.length });
    
    // Clear all intervals
    for (const intervalId of activeIntervals.keys()) {
      this.clearInterval(intervalId);
    }
    
    // Execute custom handlers
    for (const handler of shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Shutdown handler error:', { error });
      }
    }
    
    shutdownHandlers = [];
    logger.info('Shutdown handlers completed');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal');
  await SafetyLimits.executeShutdownHandlers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal');
  await SafetyLimits.executeShutdownHandlers();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught exception:', { error });
  await SafetyLimits.executeShutdownHandlers();
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled rejection:', { reason, promise });
  await SafetyLimits.executeShutdownHandlers();
  process.exit(1);
});

export default SafetyLimits;