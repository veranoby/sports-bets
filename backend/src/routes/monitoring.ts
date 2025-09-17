import { Router } from 'express';
import { SafetyLimits } from '../utils/safetyLimits';

const router = Router();

/**
 * GET /api/health
 * Get overall system health status with memory metrics
 */
router.get('/health', (req, res) => {
  const safetyMetrics = SafetyLimits.getHealthMetrics();
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    safety: safetyMetrics
  });
});

/**
 * GET /api/monitoring/memory
 * Get detailed memory usage for Railway alerts
 */
router.get('/monitoring/memory', (req, res) => {
  const memoryMetrics = SafetyLimits.getHealthMetrics().memory;
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    memory: memoryMetrics
  });
});

/**
 * GET /api/monitoring/connections
 * Get active connection counts
 */
router.get('/monitoring/connections', (req, res) => {
  // This would integrate with your database connection pool
  // For now, we'll return a placeholder
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    connections: {
      active: 0,
      max: 15,
      available: 15
    }
  });
});

/**
 * GET /api/monitoring/intervals
 * Get active setInterval tracking
 */
router.get('/monitoring/intervals', (req, res) => {
  const intervalMetrics = SafetyLimits.getHealthMetrics().intervals;
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    intervals: intervalMetrics
  });
});

/**
 * POST /api/monitoring/webhook/railway
 * Railway webhook endpoint for alerts
 */
router.post('/monitoring/webhook/railway', (req, res) => {
  const { alert, metrics } = req.body;
  
  // Log the alert
  console.log('Railway alert received:', { alert, metrics });
  
  // Check if we need to activate circuit breaker
  const memoryMetrics = SafetyLimits.getHealthMetrics().memory;
  if (memoryMetrics.currentMB > 380) { // 95% of 400MB limit
    console.log('Memory critical threshold exceeded, activating circuit breaker');
    // In a real implementation, you might want to take more drastic action
    // For now, we'll just log it
  }
  
  res.status(200).json({
    status: 'OK',
    message: 'Alert received and processed',
    timestamp: new Date().toISOString()
  });
});

export default router;