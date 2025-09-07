"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const featureFlags_1 = require("../middleware/featureFlags");
const express_validator_1 = require("express-validator");
const Event_1 = require("../models/Event");
const Subscription_1 = require("../models/Subscription");
const rtmpService_1 = require("../services/rtmpService");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const sseService_1 = require("../services/sseService");
const router = (0, express_1.Router)();
// Apply streaming feature flag check to all routes
router.use((0, featureFlags_1.requireFeature)('streaming'));
// Rate limiting for stream access
const streamAccessLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: "Too many stream access requests, please try again later"
    }
});
// Rate limiting for stream control (start/stop)
const streamControlLimit = (0, express_rate_limit_1.default)({
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
router.get("/events/:eventId/stream-access", streamAccessLimit, auth_1.authenticate, [
    (0, express_validator_1.param)("eventId").isUUID().withMessage("Invalid event ID")
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }
    const { eventId } = req.params;
    const userId = req.user.id;
    // Check if event exists and is live
    const event = yield Event_1.Event.findByPk(eventId);
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
    const subscription = yield Subscription_1.Subscription.findOne({
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
    const token = jsonwebtoken_1.default.sign(tokenData, process.env.JWT_SECRET);
    // Track analytics
    try {
        yield rtmpService_1.rtmpService.trackViewerJoin({
            eventId,
            userId,
            subscriptionType: subscription.type,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            timestamp: new Date()
        });
    }
    catch (analyticsError) {
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
})));
/**
 * POST /api/streaming/start
 * Start RTMP stream (operators/admins only)
 */
router.post("/start", streamControlLimit, auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("eventId").isUUID().withMessage("Valid event ID required"),
    (0, express_validator_1.body)("title").isString().isLength({ min: 3, max: 255 }).withMessage("Title must be 3-255 characters"),
    (0, express_validator_1.body)("description").optional().isString().isLength({ max: 1000 }),
    (0, express_validator_1.body)("quality").isIn(["360p", "480p", "720p"]).withMessage("Invalid quality setting"),
    (0, express_validator_1.body)("bitrate").isInt({ min: 500, max: 3000 }).withMessage("Bitrate must be between 500-3000 kbps"),
    (0, express_validator_1.body)("fps").isInt({ min: 15, max: 30 }).withMessage("FPS must be between 15-30")
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validationErrors.array()
        });
    }
    const { eventId, title, description, quality, bitrate, fps } = req.body;
    const operatorId = req.user.id;
    // Check if event exists
    const event = yield Event_1.Event.findByPk(eventId);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    // Check if stream is already active for this event
    const existingStream = yield rtmpService_1.rtmpService.getActiveStream(eventId);
    if (existingStream) {
        return res.status(409).json({
            success: false,
            message: "Stream already active for this event"
        });
    }
    // Generate unique stream key
    const streamKey = rtmpService_1.rtmpService.generateStreamKey(eventId, operatorId);
    const rtmpUrl = `${process.env.RTMP_SERVER_URL}/${streamKey}`;
    try {
        // Start RTMP ingestion
        const streamResult = yield rtmpService_1.rtmpService.startStream({
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
        yield event.update({
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
        sseService_1.sseService.broadcastToEvent(eventId, {
            type: 'stream_status',
            status: 'live',
            streamId: streamResult.streamId,
            eventId: eventId,
            timestamp: new Date()
        });
        // Track stream start analytics
        rtmpService_1.rtmpService.trackStreamStart({
            streamId: streamResult.streamId,
            eventId,
            operatorId,
            quality,
            bitrate,
            fps,
            timestamp: new Date()
        }).catch(err => console.warn('Analytics tracking failed:', err));
    }
    catch (error) {
        console.error('Stream start error:', error);
        throw errorHandler_1.errors.internal(`Failed to start stream: ${error.message}`);
    }
})));
/**
 * POST /api/streaming/stop
 * Stop active RTMP stream
 */
router.post("/stop", streamControlLimit, auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("streamId").optional().isString(),
    (0, express_validator_1.body)("eventId").optional().isUUID()
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { streamId, eventId } = req.body;
    const operatorId = req.user.id;
    let targetStream;
    if (streamId) {
        targetStream = yield rtmpService_1.rtmpService.getStreamById(streamId);
    }
    else if (eventId) {
        targetStream = yield rtmpService_1.rtmpService.getActiveStream(eventId);
    }
    else {
        return res.status(400).json({
            success: false,
            message: "Either streamId or eventId is required"
        });
    }
    if (!targetStream) {
        throw errorHandler_1.errors.notFound("Active stream not found");
    }
    // Check permissions (operator can only stop their own streams, admin can stop any)
    if (req.user.role !== 'admin' && targetStream.operatorId !== operatorId) {
        throw errorHandler_1.errors.forbidden("You can only stop streams you started");
    }
    try {
        // Stop RTMP stream
        const stopResult = yield rtmpService_1.rtmpService.stopStream(targetStream.streamId);
        // Update event status
        if (targetStream.eventId) {
            const event = yield Event_1.Event.findByPk(targetStream.eventId);
            if (event) {
                yield event.update({
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
            sseService_1.sseService.broadcastToEvent(targetStream.eventId, {
                type: 'stream_status',
                status: 'ended',
                streamId: targetStream.streamId,
                eventId: targetStream.eventId,
                duration: stopResult.duration,
                timestamp: new Date()
            });
        }
        // Track stream end analytics
        rtmpService_1.rtmpService.trackStreamEnd({
            streamId: targetStream.streamId,
            duration: stopResult.duration,
            totalViewers: stopResult.totalViewers,
            peakViewers: stopResult.peakViewers,
            endReason: 'operator_stop',
            operatorId,
            timestamp: new Date()
        }).catch(err => console.warn('Analytics tracking failed:', err));
    }
    catch (error) {
        console.error('Stream stop error:', error);
        throw errorHandler_1.errors.internal(`Failed to stop stream: ${error.message}`);
    }
})));
/**
 * GET /api/streaming/status
 * Get overall streaming system health status
 */
router.get("/status", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = yield rtmpService_1.rtmpService.getSystemStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        console.error('Stream status error:', error);
        throw errorHandler_1.errors.internal(`Failed to get stream status: ${error.message}`);
    }
})));
/**
 * GET /api/streaming/analytics
 * Get real-time streaming analytics
 */
router.get("/analytics/:streamId?", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.param)("streamId").optional().isString(),
    (0, express_validator_1.query)("timeRange").optional().isIn(["1h", "24h", "7d", "30d"]),
    (0, express_validator_1.query)("metrics").optional().isString()
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { streamId } = req.params;
    const { timeRange = "1h", metrics } = req.query;
    const operatorId = req.user.id;
    try {
        let analytics;
        if (streamId) {
            // Get specific stream analytics
            const stream = yield rtmpService_1.rtmpService.getStreamById(streamId);
            if (!stream) {
                throw errorHandler_1.errors.notFound("Stream not found");
            }
            // Check permissions
            if (req.user.role !== 'admin' && stream.operatorId !== operatorId) {
                throw errorHandler_1.errors.forbidden("You can only view analytics for your own streams");
            }
            analytics = yield rtmpService_1.rtmpService.getStreamAnalytics(streamId, {
                timeRange: timeRange,
                metrics: metrics ? metrics.split(',') : undefined
            });
        }
        else {
            // Get system-wide analytics
            analytics = yield rtmpService_1.rtmpService.getSystemAnalytics({
                timeRange: timeRange,
                operatorId: req.user.role === 'admin' ? undefined : operatorId
            });
        }
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        console.error('Stream analytics error:', error);
        throw errorHandler_1.errors.internal(`Failed to get stream analytics: ${error.message}`);
    }
})));
/**
 * POST /api/streaming/validate-token
 * Validate stream access token (internal use)
 */
router.post("/validate-token", [
    (0, express_validator_1.body)("token").isString().withMessage("Token is required")
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if token is not expired
        if (decoded.exp < Math.floor(Date.now() / 1000)) {
            return res.status(401).json({
                success: false,
                message: "Token has expired"
            });
        }
        // Verify user still has valid subscription
        const subscription = yield Subscription_1.Subscription.findOne({
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
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
})));
/**
 * POST /api/streaming/analytics/event
 * Track viewer events for analytics
 */
router.post("/analytics/event", auth_1.authenticate, [
    (0, express_validator_1.body)("eventId").isUUID().withMessage("Valid event ID required"),
    (0, express_validator_1.body)("event").isString().withMessage("Event type is required"),
    (0, express_validator_1.body)("data").optional().isObject(),
    (0, express_validator_1.body)("timestamp").isISO8601().withMessage("Valid timestamp required")
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId, event, data, timestamp } = req.body;
    const userId = req.user.id;
    try {
        yield rtmpService_1.rtmpService.trackViewerEvent({
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
    }
    catch (error) {
        // Don't fail the request if analytics fails
        console.warn('Analytics tracking failed:', error);
        res.json({
            success: true,
            message: "Event received"
        });
    }
})));
/**
 * GET /api/streaming/health
 * Check RTMP server health and capacity
 */
router.get("/health", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const healthStatus = yield rtmpService_1.rtmpService.getSystemStatus();
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, healthStatus), { rtmpServer: {
                    url: process.env.RTMP_SERVER_URL,
                    status: 'connected', // Would be dynamic in production
                    capacity: {
                        maxStreams: 100,
                        currentStreams: healthStatus.activeStreams
                    }
                } })
        });
    }
    catch (error) {
        console.error('Health check error:', error);
        throw errorHandler_1.errors.internal(`Health check failed: ${error.message}`);
    }
})));
/**
 * POST /api/streaming/keys/generate
 * Generate new stream key for event
 */
router.post("/keys/generate", streamControlLimit, auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("eventId").isUUID().withMessage("Valid event ID required")
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.body;
    const operatorId = req.user.id;
    // Check if event exists
    const event = yield Event_1.Event.findByPk(eventId);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    // Generate new stream key
    const streamKey = rtmpService_1.rtmpService.generateStreamKey(eventId, operatorId);
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
})));
/**
 * DELETE /api/streaming/keys/:streamKey
 * Revoke/invalidate a stream key
 */
router.delete("/keys/:streamKey", streamControlLimit, auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.param)("streamKey").matches(/^stream_\d+_[a-f0-9]+$/).withMessage("Invalid stream key format")
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { streamKey } = req.params;
    const operatorId = req.user.id;
    try {
        const result = yield rtmpService_1.rtmpService.revokeStreamKey(streamKey, operatorId);
        res.json({
            success: true,
            message: "Stream key revoked successfully",
            data: result
        });
    }
    catch (error) {
        console.error('Stream key revocation error:', error);
        throw errorHandler_1.errors.internal(`Failed to revoke stream key: ${error.message}`);
    }
})));
/**
 * GET /api/streaming/obs-config/:streamKey
 * Get OBS Studio configuration for stream key
 */
router.get("/obs-config/:streamKey", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.param)("streamKey").matches(/^stream_\d+_[a-f0-9]+$/).withMessage("Invalid stream key format")
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { streamKey } = req.params;
    try {
        const config = rtmpService_1.rtmpService.getOBSConfiguration(streamKey);
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, config), { instructions: [
                    "1. Open OBS Studio",
                    "2. Go to Settings > Stream",
                    "3. Select 'Custom' as Service",
                    `4. Server: ${config.server}`,
                    `5. Stream Key: ${config.streamKey}`,
                    "6. Apply settings and start streaming"
                ] })
        });
    }
    catch (error) {
        console.error('OBS config error:', error);
        throw errorHandler_1.errors.internal(`Failed to get OBS configuration: ${error.message}`);
    }
})));
exports.default = router;
