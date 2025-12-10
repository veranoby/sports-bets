import express from 'express';
import { sseService, AdminChannel, SSEEventType } from '../services/sseService';
import { authenticate, authorize } from '../middleware/auth';
import { logger } from '../config/logger';

const router = express.Router();

logger.info('🔄 SSE routes loading with admin authentication...');

/**
 * SSE Authentication Middleware
 * Handles authentication for SSE connections with proper error handling
 */
const sseAuthenticate = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    await authenticate(req, res, next);
  } catch (error) {
    logger.error('SSE Authentication failed:', error);
    res.status(401).json({ error: 'Authentication required for SSE connection' });
  }
};

/**
 * ADMIN SSE ENDPOINTS - Authenticated and Role-Based
 */

// Admin System Monitoring Channel
router.get('/admin/system',
  sseAuthenticate,
  authorize('admin', 'operator'),
  (req, res) => {
    const connectionId = sseService.addConnection(
      res,
      AdminChannel.SYSTEM_MONITORING,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    logger.info(`👤 Admin system monitoring connected: ${req.user!.username} (${connectionId})`);

    // Handle connection cleanup on disconnect
    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`👤 Admin system monitoring disconnected: ${req.user!.username} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

// Admin Fight Management Channel
router.get('/admin/fights',
  sseAuthenticate,
  authorize('admin', 'operator'),
  (req, res) => {
    const connectionId = sseService.addConnection(
      res,
      AdminChannel.FIGHT_MANAGEMENT,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    logger.info(`⚔️ Admin fight management connected: ${req.user!.username} (${connectionId})`);

    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`⚔️ Admin fight management disconnected: ${req.user!.username} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

// Admin Bet Monitoring Channel
router.get('/admin/bets',
  sseAuthenticate,
  authorize('admin', 'operator'),
  (req, res) => {
    const connectionId = sseService.addConnection(
      res,
      AdminChannel.BET_MONITORING,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        fightFilters: req.query.fightIds ? String(req.query.fightIds).split(',') : undefined
      }
    );

    logger.info(`💰 Admin bet monitoring connected: ${req.user!.username} (${connectionId})`);

    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`💰 Admin bet monitoring disconnected: ${req.user!.username} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

// Admin User Management Channel
router.get('/admin/users',
  sseAuthenticate,
  authorize('admin'),
  (req, res) => {
    const connectionId = sseService.addConnection(
      res,
      AdminChannel.USER_MANAGEMENT,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    logger.info(`👥 Admin user management connected: ${req.user!.username} (${connectionId})`);

    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`👥 Admin user management disconnected: ${req.user!.username} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

// Admin Financial Monitoring Channel
router.get('/admin/finance',
  sseAuthenticate,
  authorize('admin'),
  (req, res) => {
    const connectionId = sseService.addConnection(
      res,
      AdminChannel.FINANCIAL_MONITORING,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    logger.info(`💵 Admin financial monitoring connected: ${req.user!.username} (${connectionId})`);

    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`💵 Admin financial monitoring disconnected: ${req.user!.username} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

// Admin Streaming Monitoring Channel
router.get('/admin/streaming',
  sseAuthenticate,
  authorize('admin', 'operator'),
  (req, res) => {
    const connectionId = sseService.addConnection(
      res,
      AdminChannel.STREAMING_MONITORING,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    logger.info(`📹 Admin streaming monitoring connected: ${req.user!.username} (${connectionId})`);

    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`📹 Admin streaming monitoring disconnected: ${req.user!.username} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

// Admin Notifications Channel
router.get('/admin/notifications',
  sseAuthenticate,
  authorize('admin', 'operator'),
  (req, res) => {
    const connectionId = sseService.addConnection(
      res,
      AdminChannel.NOTIFICATIONS,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    logger.info(`🔔 Admin notifications connected: ${req.user!.username} (${connectionId})`);

    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`🔔 Admin notifications disconnected: ${req.user!.username} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

// Admin Global Channel (all events)
router.get('/admin/global',
  sseAuthenticate,
  authorize('admin'),
  (req, res) => {
    const connectionId = sseService.addConnection(
      res,
      AdminChannel.GLOBAL,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    logger.info(`🌐 Admin global monitoring connected: ${req.user!.username} (${connectionId})`);

    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`🌐 Admin global monitoring disconnected: ${req.user!.username} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

/**
 * PUBLIC SSE ENDPOINTS - Authenticated Users (No Role Restriction)
 */

// Public Event Updates - Any authenticated user can subscribe
router.get('/public/events/:eventId',
  sseAuthenticate,
  (req, res) => {
    const { eventId } = req.params;
    const connectionId = sseService.addEventConnection(
      res,
      eventId,
      req.user!.id,
      req.user!.role,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    logger.info(`📺 Public event SSE connected: ${req.user!.username} to event ${eventId} (${connectionId})`);

    // Handle connection cleanup on disconnect
    req.on('close', () => {
      sseService.removeConnection(connectionId);
      logger.info(`📺 Public event SSE disconnected: ${req.user!.username} from event ${eventId} (${connectionId})`);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error for ${connectionId}:`, error);
      sseService.removeConnection(connectionId);
    });
  }
);

/**
 * SSE CONNECTION MANAGEMENT ENDPOINTS
 */

// Get SSE connection statistics
router.get('/admin/stats',
  sseAuthenticate,
  authorize('admin'),
  (req, res) => {
    try {
      const stats = sseService.getConnectionStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting SSE stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve SSE statistics'
      });
    }
  }
);

// Test SSE event broadcast (for testing purposes)
router.post('/admin/test-broadcast',
  sseAuthenticate,
  authorize('admin'),
  (req, res) => {
    try {
      const { channel, eventType, data } = req.body;

      if (!channel || !eventType) {
        return res.status(400).json({
          success: false,
          error: 'Channel and eventType are required'
        });
      }

      const event = {
        id: Date.now().toString(),
        type: eventType as SSEEventType,
        data: data || { message: 'Test broadcast from admin', timestamp: new Date() },
        timestamp: new Date(),
        priority: 'medium' as const,
        metadata: {
          adminId: req.user!.id
        }
      };

      const sentCount = sseService.broadcastToChannel(channel, event);

      res.json({
        success: true,
        data: {
          eventId: event.id,
          channel,
          eventType,
          sentToConnections: sentCount
        }
      });

      logger.info(`📡 Test broadcast sent by ${req.user!.username}: ${eventType} to ${channel} (${sentCount} connections)`);
    } catch (error) {
      logger.error('Error sending test broadcast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send test broadcast'
      });
    }
  }
);

/**
 * LEGACY ENDPOINTS (for backwards compatibility)
 * These will be deprecated in future versions
 */

// Legacy system status endpoint
router.get('/admin/system-status',
  sseAuthenticate,
  authorize('admin', 'operator'),
  (req, res) => {
    logger.warn('⚠️ Using deprecated SSE endpoint /admin/system-status - use /admin/system instead');

    const connectionId = sseService.addConnection(
      res,
      AdminChannel.SYSTEM_MONITORING,
      req.user!.id,
      req.user!.role
    );

    req.on('close', () => {
      sseService.removeConnection(connectionId);
    });
  }
);

// Legacy event updates endpoint
router.get('/admin/events/:eventId',
  sseAuthenticate,
  authorize('admin', 'operator'),
  (req, res) => {
    logger.warn('⚠️ Using deprecated SSE endpoint /admin/events/:eventId - use /admin/fights instead');

    const connectionId = sseService.addConnection(
      res,
      AdminChannel.FIGHT_MANAGEMENT,
      req.user!.id,
      req.user!.role,
      {
        eventFilters: [req.params.eventId]
      }
    );

    req.on('close', () => {
      sseService.removeConnection(connectionId);
    });
  }
);

export default router;