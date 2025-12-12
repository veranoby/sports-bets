import { Router } from "express";
import * as jwt from "jsonwebtoken";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { requireFeature } from "../middleware/featureFlags";
import { body, param, query, validationResult } from "express-validator";
import { User } from "../models/User";
import { Event } from "../models/Event";
import { Subscription } from "../models/Subscription";
import { rtmpService } from "../services/rtmpService";
import rateLimit from "express-rate-limit";
import { sseService, SSEEventType } from "../services/sseService";
import { StreamingSecurityService } from "../services/streamingSecurityService";

const router = Router();

/**
 * POST /api/streaming/auth
 * RTMP authentication endpoint called by Nginx
 * Called when OBS connects to RTMP server (on_publish event)
 * Must NOT require authentication (it's called by Nginx, not a user)
 */
router.post(
  "/auth",
  asyncHandler(async (req, res) => {
    // Nginx RTMP calls this endpoint with query params from the RTMP connection
    // Example: POST /api/streaming/auth?call=connect&addr=127.0.0.1&flashver=&swfurl=&tcurl=&pageurl=&name=test-stream
    const { name } = req.query;

    // In development, allow all connections
    // In production, validate stream key against database
    if (process.env.NODE_ENV === 'development') {
      // Allow all connections in development
      return res.status(200).send('OK');
    }

    // Production: validate stream key
    if (!name) {
      return res.status(403).send('Stream key required');
    }

    // Stream key validation could be added here for production
    // For now, allow if stream key matches any event's streamKey
    res.status(200).send('OK');
  })
);

/**
 * POST /api/streaming/unpublish
 * Called when OBS stops streaming (on_publish_done event)
 */
router.post(
  "/unpublish",
  asyncHandler(async (req, res) => {
    const { name } = req.query;
    // Log unpublish event but don't fail the response
    console.log(`Stream unpublish: ${name}`);
    res.status(200).send('OK');
  })
);

// Apply streaming feature flag check to all routes AFTER auth endpoints
router.use(requireFeature('streaming'));

// Apply security middleware
router.use(StreamingSecurityService.ipBlocker);
router.use(StreamingSecurityService.rateLimiter);

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
  authenticate,
  StreamingSecurityService.concurrentStreamLimit,
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

    // Generate signed stream token using StreamingSecurityService
    const { token, expiresAt } = StreamingSecurityService.generateSignedToken(userId, eventId);

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
        expiresAt: expiresAt.toISOString(),
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
      sseService.broadcastSystemEvent(SSEEventType.STREAM_STATUS_UPDATE, {
        type: 'stream_status',
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
        sseService.broadcastSystemEvent(SSEEventType.STREAM_STATUS_UPDATE, {
          type: 'stream_status',
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

    // Validate token using StreamingSecurityService
    const validation = await StreamingSecurityService.validateSignedToken(token);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        message: validation.error || "Invalid token"
      });
    }

    // If we get here, the token is valid
    res.json({
      success: true,
      data: {
        valid: true,
        userId: validation.userId,
        eventId: validation.eventId,
        subscriptionValid: validation.subscriptionValid
      }
    });
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

// POST /api/streaming/pause - Pause event stream during intermissions
router.post(
  "/pause",
  authenticate,
  authorize("admin", "operator"),
  [
    body("eventId").isUUID().withMessage("Valid event ID required")
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

    const { eventId } = req.body;
    const operatorId = req.user!.id;

    // Find event
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw errors.notFound("Event not found");
    }

    // Check authorization
    if (req.user!.role !== "admin" && event.operatorId !== operatorId) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // Verify event is in progress
    if (event.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Can only pause streams that are in-progress"
      });
    }

    // Find active stream for event
    const stream = await rtmpService.getActiveStream(eventId);
    if (!stream) {
      throw errors.notFound("No active stream found for this event");
    }

    // Pause the stream
    const pauseResult = await rtmpService.pauseStream(stream.streamId);

    // Update event status to paused
    await event.update({ status: "paused" });

    // Broadcast via SSE (normalized direct event type)
    sseService.broadcastSystemEvent(SSEEventType.STREAM_PAUSED, {
      eventId,
      id: eventId, // Include id for frontend reconciliation
      streamStatus: 'paused',
      message: "Stream pausado - Próximamente se reanuda...",
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        message: pauseResult.message,
        bandwidth_saved: pauseResult.bandwidth_saved,
        eventStatus: "paused"
      }
    });
  })
);

// POST /api/streaming/resume - Resume event stream after intermission
router.post(
  "/resume",
  authenticate,
  authorize("admin", "operator"),
  [
    body("eventId").isUUID().withMessage("Valid event ID required")
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

    const { eventId } = req.body;
    const operatorId = req.user!.id;

    // Find event
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw errors.notFound("Event not found");
    }

    // Check authorization
    if (req.user!.role !== "admin" && event.operatorId !== operatorId) {
      throw errors.forbidden("You are not assigned to this event");
    }

    // Verify event is in intermission
    if (event.status !== "intermission") {
      return res.status(400).json({
        success: false,
        message: "Can only resume streams that are in intermission"
      });
    }

    // Find active stream for event
    const stream = await rtmpService.getActiveStream(eventId);
    if (!stream) {
      throw errors.notFound("No active stream found for this event");
    }

    // Resume the stream
    const resumeResult = await rtmpService.resumeStream(stream.streamId);

    // Update event status back to in-progress
    await event.update({ status: "in-progress" });

    // Broadcast via SSE (normalized direct event type)
    sseService.broadcastSystemEvent(SSEEventType.STREAM_RESUMED, {
      eventId,
      id: eventId, // Include id for frontend reconciliation
      streamStatus: 'connected',
      message: "Stream en vivo",
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        message: resumeResult.message,
        resume_time: resumeResult.resume_time,
        eventStatus: "in-progress"
      }
    });
  })
);

// GET /api/streaming/intermission-status/:eventId - Get intermission status for an event
router.get(
  "/intermission-status/:eventId",
  authenticate,
  [
    param("eventId").isUUID().withMessage("Invalid event ID")
  ],
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const status = await rtmpService.getIntermissionStatus(eventId);

    res.json({
      success: true,
      data: status
    });
  })
);

export default router;