import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Track slow queries and performance metrics
const queryMetrics = new Map<string, {count: number, totalTime: number, slowQueries: number}>();

export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const originalUrl = req.originalUrl;
  
  // Variable to track if headers have been sent
  let headersSent = false;
  
  // Hook into response finish to calculate total time
  res.on('finish', () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Track metrics by route
    const metrics = queryMetrics.get(originalUrl) || {count: 0, totalTime: 0, slowQueries: 0};
    metrics.count++;
    metrics.totalTime += duration;
    
    // Flag slow queries (>200ms)
    if (duration > 200) {
      metrics.slowQueries++;
      console.warn(`⚠️ Slow query detected: ${originalUrl} took ${duration.toFixed(2)}ms`);
    }
    
    // Alert on very slow queries (>500ms)
    if (duration > 500) {
      console.error(`🚨 CRITICAL: Very slow query: ${originalUrl} took ${duration.toFixed(2)}ms`);
    }
    
    queryMetrics.set(originalUrl, metrics);
    
    // Add performance headers for monitoring only if headers haven't been sent
    if (!headersSent && !res.headersSent) {
      res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
      headersSent = true;
    }
  });
  
  // Also check on close event
  res.on('close', () => {
    headersSent = true;
  });
  
  next();
};

// Export metrics for admin monitoring
export const getPerformanceMetrics = () => {
  const metrics: any[] = [];
  queryMetrics.forEach((data, route) => {
    metrics.push({
      route,
      avgTime: data.totalTime / data.count,
      totalRequests: data.count,
      slowQueries: data.slowQueries,
      slowQueryPercentage: ((data.slowQueries / data.count) * 100).toFixed(2)
    });
  });
  return metrics.sort((a, b) => b.avgTime - a.avgTime);
};