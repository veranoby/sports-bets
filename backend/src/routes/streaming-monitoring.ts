import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getPoolStats } from '../config/database';
import { SafetyLimits } from '../utils/safetyLimits';
import { EventConnection } from '../models/EventConnection';
import { Bet } from '../models/Bet';
import { Op } from 'sequelize';
import { logger } from '../config/logger';

const router = Router();

// Note: This route will be mounted at /api/sse/streaming

/**
 * GET /api/sse/streaming?token=<jwt>
 * SSE endpoint for unified streaming monitoring
 * Provides connectionCount and activeBets data every 2 seconds
 */
router.get('/sse/streaming', authenticate, authorize('admin', 'operator'), (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });

  // Send initial connection established message
  res.write(`event: connection_established\ndata: ${JSON.stringify({ 
    message: 'SSE streaming monitoring connection established',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Function to send data
  const sendStreamingData = async () => {
    try {
      const poolStats = getPoolStats();
      const safetyMetrics = SafetyLimits.getHealthMetrics();

      // Get connection count (active connections in the last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const connectionCount = await EventConnection.count({
        where: {
          disconnected_at: null, // Still connected
          connected_at: {
            [Op.gte]: fiveMinutesAgo
          }
        }
      });

      // Get active bets count
      const activeBets = await Bet.count({
        where: {
          status: 'active'
        }
      });

      const data = {
        connectionCount: connectionCount,
        activeBets: activeBets,
        streamStatus: {
          isLive: true, // This could be dynamic based on actual stream status
          timestamp: new Date().toISOString(),
          memory: {
            currentMB: safetyMetrics.memory.currentMB,
            limitMB: safetyMetrics.memory.limitMB,
            percentUsed: Math.round((safetyMetrics.memory.currentMB / safetyMetrics.memory.limitMB) * 100)
          },
          database: {
            activeConnections: poolStats.using,
            availableConnections: poolStats.free,
            queuedRequests: poolStats.queue,
            totalConnections: poolStats.total,
            status: poolStats.status
          }
        }
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
      logger.debug('SSE: Sent streaming monitoring data');
    } catch (error) {
      logger.error('SSE: Error sending streaming monitoring data:', error);
      const errorData = {
        error: 'Failed to fetch streaming metrics',
        timestamp: new Date().toISOString()
      };
      res.write(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`);
    }
  };

  // Send initial data immediately
  sendStreamingData();

  // Set up interval to send data every 2 seconds
  const interval = setInterval(sendStreamingData, 2000);

  // Handle connection close
  req.on('close', () => {
    clearInterval(interval);
    logger.info('SSE: Streaming monitoring connection closed');
  });

  req.on('error', (error) => {
    logger.error('SSE: Streaming monitoring connection error:', error);
    clearInterval(interval);
  });
});

export default router;