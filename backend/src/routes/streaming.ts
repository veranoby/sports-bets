import { Router } from "express";
import jwt from "jsonwebtoken";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { requireFeature } from "../middleware/featureFlags";
import { body, param, query, validationResult } from "express-validator";
import { User } from "../models/User";
import { Event } from "../models/Event";
import { Subscription } from "../models/Subscription";
import { rtmpService } from "../services/rtmpService";
import rateLimit from "express-rate-limit";
import sseService from "../services/sseService";

const router = Router();

// Apply streaming feature flag check to all routes
router.use(requireFeature('streaming'));

// Rate limiting for stream access
const streamAccessLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: "Too many stream access requests, please try again later"
  }
});

// Rate limiting for stream control (start/stop)
const streamControlLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each operator to 5 control actions per windowMs
  message: {
    success: false,
    message: "Too many stream control requests, please try again later"
  }
});

/**
 * GET /api/events/:id/stream-access
 * Get signed stream URL for authenticated users with valid subscriptions
 */
router.get(
  "/events/:eventId/stream-access",
  streamAccessLimit,
  authenticate,
  [
    param("eventId").isUUID().withMessage("Invalid event ID")
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { eventId } = req.params;
    const userId = req.user!.id;

    // Check if event exists and is live
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (event.status !== 'in-progress') {
      return res.status(403).json({
        success: false,
        message: "Event is not currently live"
      });
    }

    // Check user subscription
    const subscription = await Subscription.findOne({
      where: {
        userId: userId,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Valid subscription required for stream access",
        code: "SUBSCRIPTION_REQUIRED"
      });
    }

    // Check subscription expiry
    if (new Date(subscription.expiresAt) <= new Date()) {
      return res.status(403).json({
        success: false,
        message: "Subscription has expired",
        code: "SUBSCRIPTION_EXPIRED"
      });
    }

    // Generate signed stream token
    const tokenData = {
      userId: userId,
      eventId: eventId,
      streamUrl: event.streamUrl,
      subscriptionId: subscription.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    };

    const token = jwt.sign(tokenData, process.env.JWT_SECRET!);

    // Track analytics
    try {
      await rtmpService.trackViewerJoin({
        eventId,
        userId,
        subscriptionType: subscription.type,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date()
      });
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError);
    }

    res.json({
      success: true,
      data: {
        streamUrl: event.streamUrl,
        token: token,
        expiresAt: new Date(tokenData.exp * 1000).toISOString(),
        quality: '720p',
        availableQualities: ['720p', '480p', '360p']
      }
    });
  })
);

/**
 * POST /api/streaming/start
 * Start RTMP stream (operators/admins only)
 */
router.post(
  "/start",
  streamControlLimit,
  authenticate,
  authorize("admin", "operator"),
  [
    body("eventId").isUUID().withMessage("Valid event ID required"),
    body("title").isString().isLength({ min: 3, max: 255 }).withMessage("Title must be 3-255 characters"),
    body("description").optional().isString().isLength({ max: 1000 }),
    body("quality").isIn(["360p", "480p", "720p"]).withMessage("Invalid quality setting"),
    body("bitrate").isInt({ min: 500, max: 3000 }).withMessage("Bitrate must be between 500-3000 kbps"),
    body("fps").isInt({ min: 15, max: 30 }).withMessage("FPS must be between 15-30")
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors.array()
      });
    }

    const { eventId, title, description, quality, bitrate, fps } = req.body;
    const operatorId = req.user!.id;

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw errors.notFound("Event not found");
    }

    // Check if stream is already active for this event
    const existingStream = await rtmpService.getActiveStream(eventId);
    if (existingStream) {
      return res.status(409).json({
        success: false,
        message: "Stream already active for this event"
      });
    }

    // Generate unique stream key
    const streamKey = rtmpService.generateStreamKey(eventId, operatorId);
    const rtmpUrl = `${process.env.RTMP_SERVER_URL}/${streamKey}`;

    try {
      // Start RTMP ingestion
      const streamResult = await rtmpService.startStream({
        eventId,
        operatorId,
        streamKey,
        title,
        description,
        quality,
        bitrate,
        fps,
        rtmpUrl
      });

      // Update event status
      await event.update({
        status: 'in-progress',
        streamUrl: streamResult.hlsUrl,
        streamKey: streamKey
        // streamStartedAt: new Date(), // Field not in Event model
        // streamOperatorId: operatorId  // Field not in Event model
      });

      res.status(201).json({
        success: true,
        data: {
          streamId: streamResult.streamId,
          rtmpUrl: rtmpUrl,
          streamKey: streamKey,
          hlsUrl: streamResult.hlsUrl,
          status: 'starting',
          previewUrl: streamResult.previewUrl
        }
      });

      // Broadcast stream status via SSE
      sseService.broadcastToEvent(eventId, 'stream_status', {
        status: 'live',
        streamId: streamResult.streamId,
        eventId: eventId,
        timestamp: new Date()
      });

      // Track stream start analytics
      rtmpService.trackStreamStart({
        streamId: streamResult.streamId,
        eventId,
        operatorId,
        quality,
        bitrate,
        fps,
        timestamp: new Date()
      }).catch(err => console.warn('Analytics tracking failed:', err));

    } catch (error: any) {
      console.error('Stream start error:', error);
      throw errors.internal(`Failed to start stream: ${error.message}`);
    }
  })
);

/**
 * POST /api/streaming/stop
 * Stop active RTMP stream
 */
router.post(
  "/stop",
  streamControlLimit,
  authenticate,
  authorize("admin", "operator"),
  [
    body("streamId").optional().isString(),
    body("eventId").optional().isUUID()
  ],
  asyncHandler(async (req, res) => {
    const { streamId, eventId } = req.body;
    const operatorId = req.user!.id;

    let targetStream;

    if (streamId) {
      targetStream = await rtmpService.getStreamById(streamId);
    } else if (eventId) {
      targetStream = await rtmpService.getActiveStream(eventId);
    } else {
      return res.status(400).json({
        success: false,
        message: "Either streamId or eventId is required"
      });
    }

    if (!targetStream) {
      throw errors.notFound("Active stream not found");
    }

    // Check permissions (operator can only stop their own streams, admin can stop any)
    if (req.user!.role !== 'admin' && targetStream.operatorId !== operatorId) {
      throw errors.forbidden("You can only stop streams you started");
    }

    try {
      // Stop RTMP stream
      const stopResult = await rtmpService.stopStream(targetStream.streamId);

      // Update event status
      if (targetStream.eventId) {
        const event = await Event.findByPk(targetStream.eventId);
        if (event) {
          await event.update({
            status: 'completed',
            streamUrl: null,
            streamKey: null
            // streamEndedAt: new Date() // Field not in Event model
          });
        }
      }

      res.json({
        success: true,
        data: {
          streamId: targetStream.streamId,
          duration: stopResult.duration,
          totalViewers: stopResult.totalViewers,
          peakViewers: stopResult.peakViewers,
          endReason: 'operator_stop'
        }
      });

      // Broadcast stream status via SSE
      if (targetStream.eventId) {
        sseService.broadcastToEvent(targetStream.eventId, 'stream_status', {
          status: 'ended',
          streamId: targetStream.streamId,
          eventId: targetStream.eventId,
          duration: stopResult.duration,
          timestamp: new Date()
        });
      }

      // Track stream end analytics
      rtmpService.trackStreamEnd({
        streamId: targetStream.streamId,
        duration: stopResult.duration,
        totalViewers: stopResult.totalViewers,
        peakViewers: stopResult.peakViewers,
        endReason: 'operator_stop',
        operatorId,
        timestamp: new Date()
      }).catch(err => console.warn('Analytics tracking failed:', err));

    } catch (error: any) {
      console.error('Stream stop error:', error);
      throw errors.internal(`Failed to stop stream: ${error.message}`);
    }
  })
);

/**
 * GET /api/streaming/status
 * Get overall streaming system health status
 */
router.get(
  "/status",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    try {
      const status = await rtmpService.getSystemStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error('Stream status error:', error);
      throw errors.internal(`Failed to get stream status: ${error.message}`);
    }
  })
);

/**
 * GET /api/streaming/analytics
 * Get real-time streaming analytics
 */
router.get(
  "/analytics/:streamId?",
  authenticate,
  authorize("admin", "operator"),
  [
    param("streamId").optional().isString(),
    query("timeRange").optional().isIn(["1h", "24h", "7d", "30d"]),
    query("metrics").optional().isString()
  ],
  asyncHandler(async (req, res) => {
    const { streamId } = req.params;
    const { timeRange = "1h", metrics } = req.query;
    const operatorId = req.user!.id;

    try {
      let analytics;

      if (streamId) {
        // Get specific stream analytics
        const stream = await rtmpService.getStreamById(streamId);
        if (!stream) {
          throw errors.notFound("Stream not found");
        }

        // Check permissions
        if (req.user!.role !== 'admin' && stream.operatorId !== operatorId) {
          throw errors.forbidden("You can only view analytics for your own streams");
        }

        analytics = await rtmpService.getStreamAnalytics(streamId, {
          timeRange: timeRange as string,
          metrics: metrics ? (metrics as string).split(',') : undefined
        });
      } else {
        // Get system-wide analytics
        analytics = await rtmpService.getSystemAnalytics({
          timeRange: timeRange as string,
          operatorId: req.user!.role === 'admin' ? undefined : operatorId
        });
      }

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      console.error('Stream analytics error:', error);
      throw errors.internal(`Failed to get stream analytics: ${error.message}`);
    }
  })
);

/**
 * POST /api/streaming/validate-token
 * Validate stream access token (internal use)
 */
router.post(
  "/validate-token",
  [
    body("token").isString().withMessage("Token is required")
  ],
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check if token is not expired
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          success: false,
          message: "Token has expired"
        });
      }

      // Verify user still has valid subscription
      const subscription = await Subscription.findOne({
        where: {
          id: decoded.subscriptionId,
          status: 'active'
        }
      });

      if (!subscription || new Date(subscription.expiresAt) <= new Date()) {
        return res.status(401).json({
          success: false,
          message: "Subscription is no longer valid"
        });
      }

      res.json({
        success: true,
        data: {
          valid: true,
          userId: decoded.userId,
          eventId: decoded.eventId,
          subscriptionId: decoded.subscriptionId
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
  })
);

/**
 * POST /api/streaming/analytics/event
 * Track viewer events for analytics
 */
router.post(
  "/analytics/event",
  authenticate,
  [
    body("eventId").isUUID().withMessage("Valid event ID required"),
    body("event").isString().withMessage("Event type is required"),
    body("data").optional().isObject(),
    body("timestamp").isISO8601().withMessage("Valid timestamp required")
  ],
  asyncHandler(async (req, res) => {
    const { eventId, event, data, timestamp } = req.body;
    const userId = req.user!.id;

    try {
      await rtmpService.trackViewerEvent({
        eventId,
        userId,
        event,
        data,
        timestamp: new Date(timestamp),
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });

      res.json({
        success: true,
        message: "Event tracked successfully"
      });
    } catch (error) {
      // Don't fail the request if analytics fails
      console.warn('Analytics tracking failed:', error);
      res.json({
        success: true,
        message: "Event received"
      });
    }
  })
);

/**
 * GET /api/streaming/health
 * Check RTMP server health and capacity
 */
router.get(
  "/health",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    try {
      const healthStatus = await rtmpService.getSystemStatus();
      
      res.json({
        success: true,
        data: {
          ...healthStatus,
          rtmpServer: {
            url: process.env.RTMP_SERVER_URL,
            status: 'connected', // Would be dynamic in production
            capacity: {
              maxStreams: 100,
              currentStreams: healthStatus.activeStreams
            }
          }
        }
      });
    } catch (error: any) {
      console.error('Health check error:', error);
      throw errors.internal(`Health check failed: ${error.message}`);
    }
  })
);

/**
 * POST /api/streaming/keys/generate
 * Generate new stream key for event
 */
router.post(
  "/keys/generate",
  streamControlLimit,
  authenticate,
  authorize("admin", "operator"),
  [
    body("eventId").isUUID().withMessage("Valid event ID required")
  ],
  asyncHandler(async (req, res) => {
    const { eventId } = req.body;
    const operatorId = req.user!.id;

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw errors.notFound("Event not found");
    }

    // Generate new stream key
    const streamKey = rtmpService.generateStreamKey(eventId, operatorId);
    
    res.json({
      success: true,
      data: {
        streamKey,
        rtmpUrl: `${process.env.RTMP_SERVER_URL}/${streamKey}`,
        eventId,
        generatedAt: new Date().toISOString(),
        validFor: "1 hour" // Keys expire after 1 hour if not used
      }
    });
  })
);

/**
 * DELETE /api/streaming/keys/:streamKey
 * Revoke/invalidate a stream key
 */
router.delete(
  "/keys/:streamKey",
  streamControlLimit,
  authenticate,
  authorize("admin", "operator"),
  [
    param("streamKey").matches(/^stream_\d+_[a-f0-9]+$/).withMessage("Invalid stream key format")
  ],
  asyncHandler(async (req, res) => {
    const { streamKey } = req.params;
    const operatorId = req.user!.id;

    try {
      const result = await rtmpService.revokeStreamKey(streamKey, operatorId);
      
      res.json({
        success: true,
        message: "Stream key revoked successfully",
        data: result
      });
    } catch (error: any) {
      console.error('Stream key revocation error:', error);
      throw errors.internal(`Failed to revoke stream key: ${error.message}`);
    }
  })
);

/**
 * GET /api/streaming/obs-config/:streamKey
 * Get OBS Studio configuration for stream key
 */
router.get(
  "/obs-config/:streamKey",
  authenticate,
  authorize("admin", "operator"),
  [
    param("streamKey").matches(/^stream_\d+_[a-f0-9]+$/).withMessage("Invalid stream key format")
  ],
  asyncHandler(async (req, res) => {
    const { streamKey } = req.params;
    
    try {
      const config = rtmpService.getOBSConfiguration(streamKey);
      
      res.json({
        success: true,
        data: {
          ...config,
          instructions: [
            "1. Open OBS Studio",
            "2. Go to Settings > Stream",
            "3. Select 'Custom' as Service",
            `4. Server: ${config.server}`,
            `5. Stream Key: ${config.streamKey}`,
            "6. Apply settings and start streaming"
          ]
        }
      });
    } catch (error: any) {
      console.error('OBS config error:', error);
      throw errors.internal(`Failed to get OBS configuration: ${error.message}`);
    }
  })
);

export default router;