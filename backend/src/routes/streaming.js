"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var featureFlags_1 = require("../middleware/featureFlags");
var express_validator_1 = require("express-validator");
var Event_1 = require("../models/Event");
var Subscription_1 = require("../models/Subscription");
var rtmpService_1 = require("../services/rtmpService");
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var sseService_1 = require("../services/sseService");
var streamingSecurityService_1 = require("../services/streamingSecurityService");
var router = (0, express_1.Router)();
// Apply streaming feature flag check to all routes
router.use((0, featureFlags_1.requireFeature)('streaming'));
// Apply security middleware
router.use(streamingSecurityService_1.StreamingSecurityService.ipBlocker);
router.use(streamingSecurityService_1.StreamingSecurityService.rateLimiter);
// Rate limiting for stream control (start/stop)
var streamControlLimit = (0, express_rate_limit_1.default)({
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
router.get("/events/:eventId/stream-access", auth_1.authenticate, streamingSecurityService_1.StreamingSecurityService.concurrentStreamLimit, [
    (0, express_validator_1.param)("eventId").isUUID().withMessage("Invalid event ID")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, eventId, userId, event, subscription, _a, token, expiresAt, analyticsError_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Validation failed",
                            errors: errors.array()
                        })];
                }
                eventId = req.params.eventId;
                userId = req.user.id;
                return [4 /*yield*/, Event_1.Event.findByPk(eventId)];
            case 1:
                event = _b.sent();
                if (!event) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: "Event not found"
                        })];
                }
                if (event.status !== 'in-progress') {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: "Event is not currently live"
                        })];
                }
                return [4 /*yield*/, Subscription_1.Subscription.findOne({
                        where: {
                            userId: userId,
                            status: 'active'
                        }
                    })];
            case 2:
                subscription = _b.sent();
                if (!subscription) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: "Valid subscription required for stream access",
                            code: "SUBSCRIPTION_REQUIRED"
                        })];
                }
                // Check subscription expiry
                if (new Date(subscription.expiresAt) <= new Date()) {
                    return [2 /*return*/, res.status(403).json({
                            success: false,
                            message: "Subscription has expired",
                            code: "SUBSCRIPTION_EXPIRED"
                        })];
                }
                _a = streamingSecurityService_1.StreamingSecurityService.generateSignedToken(userId, eventId), token = _a.token, expiresAt = _a.expiresAt;
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, rtmpService_1.rtmpService.trackViewerJoin({
                        eventId: eventId,
                        userId: userId,
                        subscriptionType: subscription.type,
                        userAgent: req.headers['user-agent'],
                        ip: req.ip,
                        timestamp: new Date()
                    })];
            case 4:
                _b.sent();
                return [3 /*break*/, 6];
            case 5:
                analyticsError_1 = _b.sent();
                console.warn('Analytics tracking failed:', analyticsError_1);
                return [3 /*break*/, 6];
            case 6:
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
                return [2 /*return*/];
        }
    });
}); }));
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
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, eventId, title, description, quality, bitrate, fps, operatorId, event, existingStream, streamKey, rtmpUrl, streamResult, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Validation failed",
                            errors: validationErrors.array()
                        })];
                }
                _a = req.body, eventId = _a.eventId, title = _a.title, description = _a.description, quality = _a.quality, bitrate = _a.bitrate, fps = _a.fps;
                operatorId = req.user.id;
                return [4 /*yield*/, Event_1.Event.findByPk(eventId)];
            case 1:
                event = _b.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                return [4 /*yield*/, rtmpService_1.rtmpService.getActiveStream(eventId)];
            case 2:
                existingStream = _b.sent();
                if (existingStream) {
                    return [2 /*return*/, res.status(409).json({
                            success: false,
                            message: "Stream already active for this event"
                        })];
                }
                streamKey = rtmpService_1.rtmpService.generateStreamKey(eventId, operatorId);
                rtmpUrl = "".concat(process.env.RTMP_SERVER_URL, "/").concat(streamKey);
                _b.label = 3;
            case 3:
                _b.trys.push([3, 6, , 7]);
                return [4 /*yield*/, rtmpService_1.rtmpService.startStream({
                        eventId: eventId,
                        operatorId: operatorId,
                        streamKey: streamKey,
                        title: title,
                        description: description,
                        quality: quality,
                        bitrate: bitrate,
                        fps: fps,
                        rtmpUrl: rtmpUrl
                    })];
            case 4:
                streamResult = _b.sent();
                // Update event status
                return [4 /*yield*/, event.update({
                        status: 'in-progress',
                        streamUrl: streamResult.hlsUrl,
                        streamKey: streamKey
                        // streamStartedAt: new Date(), // Field not in Event model
                        // streamOperatorId: operatorId  // Field not in Event model
                    })];
            case 5:
                // Update event status
                _b.sent();
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
                sseService_1.sseService.broadcastSystemEvent(sseService_1.SSEEventType.STREAM_STATUS_UPDATE, {
                    type: 'stream_status',
                    status: 'live',
                    streamId: streamResult.streamId,
                    eventId: eventId,
                    timestamp: new Date()
                });
                // Track stream start analytics
                rtmpService_1.rtmpService.trackStreamStart({
                    streamId: streamResult.streamId,
                    eventId: eventId,
                    operatorId: operatorId,
                    quality: quality,
                    bitrate: bitrate,
                    fps: fps,
                    timestamp: new Date()
                }).catch(function (err) { return console.warn('Analytics tracking failed:', err); });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _b.sent();
                console.error('Stream start error:', error_1);
                throw errorHandler_1.errors.internal("Failed to start stream: ".concat(error_1.message));
            case 7: return [2 /*return*/];
        }
    });
}); }));
/**
 * POST /api/streaming/stop
 * Stop active RTMP stream
 */
router.post("/stop", streamControlLimit, auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("streamId").optional().isString(),
    (0, express_validator_1.body)("eventId").optional().isUUID()
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, streamId, eventId, operatorId, targetStream, stopResult, event_1, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, streamId = _a.streamId, eventId = _a.eventId;
                operatorId = req.user.id;
                if (!streamId) return [3 /*break*/, 2];
                return [4 /*yield*/, rtmpService_1.rtmpService.getStreamById(streamId)];
            case 1:
                targetStream = _b.sent();
                return [3 /*break*/, 5];
            case 2:
                if (!eventId) return [3 /*break*/, 4];
                return [4 /*yield*/, rtmpService_1.rtmpService.getActiveStream(eventId)];
            case 3:
                targetStream = _b.sent();
                return [3 /*break*/, 5];
            case 4: return [2 /*return*/, res.status(400).json({
                    success: false,
                    message: "Either streamId or eventId is required"
                })];
            case 5:
                if (!targetStream) {
                    throw errorHandler_1.errors.notFound("Active stream not found");
                }
                // Check permissions (operator can only stop their own streams, admin can stop any)
                if (req.user.role !== 'admin' && targetStream.operatorId !== operatorId) {
                    throw errorHandler_1.errors.forbidden("You can only stop streams you started");
                }
                _b.label = 6;
            case 6:
                _b.trys.push([6, 11, , 12]);
                return [4 /*yield*/, rtmpService_1.rtmpService.stopStream(targetStream.streamId)];
            case 7:
                stopResult = _b.sent();
                if (!targetStream.eventId) return [3 /*break*/, 10];
                return [4 /*yield*/, Event_1.Event.findByPk(targetStream.eventId)];
            case 8:
                event_1 = _b.sent();
                if (!event_1) return [3 /*break*/, 10];
                return [4 /*yield*/, event_1.update({
                        status: 'completed',
                        streamUrl: null,
                        streamKey: null
                        // streamEndedAt: new Date() // Field not in Event model
                    })];
            case 9:
                _b.sent();
                _b.label = 10;
            case 10:
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
                    sseService_1.sseService.broadcastSystemEvent(sseService_1.SSEEventType.STREAM_STATUS_UPDATE, {
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
                    operatorId: operatorId,
                    timestamp: new Date()
                }).catch(function (err) { return console.warn('Analytics tracking failed:', err); });
                return [3 /*break*/, 12];
            case 11:
                error_2 = _b.sent();
                console.error('Stream stop error:', error_2);
                throw errorHandler_1.errors.internal("Failed to stop stream: ".concat(error_2.message));
            case 12: return [2 /*return*/];
        }
    });
}); }));
/**
 * GET /api/streaming/status
 * Get overall streaming system health status
 */
router.get("/status", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, rtmpService_1.rtmpService.getSystemStatus()];
            case 1:
                status_1 = _a.sent();
                res.json({
                    success: true,
                    data: status_1
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Stream status error:', error_3);
                throw errorHandler_1.errors.internal("Failed to get stream status: ".concat(error_3.message));
            case 3: return [2 /*return*/];
        }
    });
}); }));
/**
 * GET /api/streaming/analytics
 * Get real-time streaming analytics
 */
router.get("/analytics/:streamId?", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.param)("streamId").optional().isString(),
    (0, express_validator_1.query)("timeRange").optional().isIn(["1h", "24h", "7d", "30d"]),
    (0, express_validator_1.query)("metrics").optional().isString()
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var streamId, _a, _b, timeRange, metrics, operatorId, analytics, stream, error_4;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                streamId = req.params.streamId;
                _a = req.query, _b = _a.timeRange, timeRange = _b === void 0 ? "1h" : _b, metrics = _a.metrics;
                operatorId = req.user.id;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 7, , 8]);
                analytics = void 0;
                if (!streamId) return [3 /*break*/, 4];
                return [4 /*yield*/, rtmpService_1.rtmpService.getStreamById(streamId)];
            case 2:
                stream = _c.sent();
                if (!stream) {
                    throw errorHandler_1.errors.notFound("Stream not found");
                }
                // Check permissions
                if (req.user.role !== 'admin' && stream.operatorId !== operatorId) {
                    throw errorHandler_1.errors.forbidden("You can only view analytics for your own streams");
                }
                return [4 /*yield*/, rtmpService_1.rtmpService.getStreamAnalytics(streamId, {
                        timeRange: timeRange,
                        metrics: metrics ? metrics.split(',') : undefined
                    })];
            case 3:
                analytics = _c.sent();
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, rtmpService_1.rtmpService.getSystemAnalytics({
                    timeRange: timeRange,
                    operatorId: req.user.role === 'admin' ? undefined : operatorId
                })];
            case 5:
                // Get system-wide analytics
                analytics = _c.sent();
                _c.label = 6;
            case 6:
                res.json({
                    success: true,
                    data: analytics
                });
                return [3 /*break*/, 8];
            case 7:
                error_4 = _c.sent();
                console.error('Stream analytics error:', error_4);
                throw errorHandler_1.errors.internal("Failed to get stream analytics: ".concat(error_4.message));
            case 8: return [2 /*return*/];
        }
    });
}); }));
/**
 * POST /api/streaming/validate-token
 * Validate stream access token (internal use)
 */
router.post("/validate-token", [
    (0, express_validator_1.body)("token").isString().withMessage("Token is required")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, validation;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = req.body.token;
                return [4 /*yield*/, streamingSecurityService_1.StreamingSecurityService.validateSignedToken(token)];
            case 1:
                validation = _a.sent();
                if (!validation.valid) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: validation.error || "Invalid token"
                        })];
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
                return [2 /*return*/];
        }
    });
}); }));
/**
 * POST /api/streaming/analytics/event
 * Track viewer events for analytics
 */
router.post("/analytics/event", auth_1.authenticate, [
    (0, express_validator_1.body)("eventId").isUUID().withMessage("Valid event ID required"),
    (0, express_validator_1.body)("event").isString().withMessage("Event type is required"),
    (0, express_validator_1.body)("data").optional().isObject(),
    (0, express_validator_1.body)("timestamp").isISO8601().withMessage("Valid timestamp required")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, eventId, event, data, timestamp, userId, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, eventId = _a.eventId, event = _a.event, data = _a.data, timestamp = _a.timestamp;
                userId = req.user.id;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, rtmpService_1.rtmpService.trackViewerEvent({
                        eventId: eventId,
                        userId: userId,
                        event: event,
                        data: data,
                        timestamp: new Date(timestamp),
                        userAgent: req.headers['user-agent'],
                        ip: req.ip
                    })];
            case 2:
                _b.sent();
                res.json({
                    success: true,
                    message: "Event tracked successfully"
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _b.sent();
                // Don't fail the request if analytics fails
                console.warn('Analytics tracking failed:', error_5);
                res.json({
                    success: true,
                    message: "Event received"
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); }));
/**
 * GET /api/streaming/health
 * Check RTMP server health and capacity
 */
router.get("/health", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var healthStatus, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, rtmpService_1.rtmpService.getSystemStatus()];
            case 1:
                healthStatus = _a.sent();
                res.json({
                    success: true,
                    data: __assign(__assign({}, healthStatus), { rtmpServer: {
                            url: process.env.RTMP_SERVER_URL,
                            status: 'connected', // Would be dynamic in production
                            capacity: {
                                maxStreams: 100,
                                currentStreams: healthStatus.activeStreams
                            }
                        } })
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Health check error:', error_6);
                throw errorHandler_1.errors.internal("Health check failed: ".concat(error_6.message));
            case 3: return [2 /*return*/];
        }
    });
}); }));
/**
 * POST /api/streaming/keys/generate
 * Generate new stream key for event
 */
router.post("/keys/generate", streamControlLimit, auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("eventId").isUUID().withMessage("Valid event ID required")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var eventId, operatorId, event, streamKey;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                eventId = req.body.eventId;
                operatorId = req.user.id;
                return [4 /*yield*/, Event_1.Event.findByPk(eventId)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                streamKey = rtmpService_1.rtmpService.generateStreamKey(eventId, operatorId);
                res.json({
                    success: true,
                    data: {
                        streamKey: streamKey,
                        rtmpUrl: "".concat(process.env.RTMP_SERVER_URL, "/").concat(streamKey),
                        eventId: eventId,
                        generatedAt: new Date().toISOString(),
                        validFor: "1 hour" // Keys expire after 1 hour if not used
                    }
                });
                return [2 /*return*/];
        }
    });
}); }));
/**
 * DELETE /api/streaming/keys/:streamKey
 * Revoke/invalidate a stream key
 */
router.delete("/keys/:streamKey", streamControlLimit, auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.param)("streamKey").matches(/^stream_\d+_[a-f0-9]+$/).withMessage("Invalid stream key format")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var streamKey, operatorId, result, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                streamKey = req.params.streamKey;
                operatorId = req.user.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, rtmpService_1.rtmpService.revokeStreamKey(streamKey, operatorId)];
            case 2:
                result = _a.sent();
                res.json({
                    success: true,
                    message: "Stream key revoked successfully",
                    data: result
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                console.error('Stream key revocation error:', error_7);
                throw errorHandler_1.errors.internal("Failed to revoke stream key: ".concat(error_7.message));
            case 4: return [2 /*return*/];
        }
    });
}); }));
/**
 * GET /api/streaming/obs-config/:streamKey
 * Get OBS Studio configuration for stream key
 */
router.get("/obs-config/:streamKey", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.param)("streamKey").matches(/^stream_\d+_[a-f0-9]+$/).withMessage("Invalid stream key format")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var streamKey, config;
    return __generator(this, function (_a) {
        streamKey = req.params.streamKey;
        try {
            config = rtmpService_1.rtmpService.getOBSConfiguration(streamKey);
            res.json({
                success: true,
                data: __assign(__assign({}, config), { instructions: [
                        "1. Open OBS Studio",
                        "2. Go to Settings > Stream",
                        "3. Select 'Custom' as Service",
                        "4. Server: ".concat(config.server),
                        "5. Stream Key: ".concat(config.streamKey),
                        "6. Apply settings and start streaming"
                    ] })
            });
        }
        catch (error) {
            console.error('OBS config error:', error);
            throw errorHandler_1.errors.internal("Failed to get OBS configuration: ".concat(error.message));
        }
        return [2 /*return*/];
    });
}); }));
// POST /api/streaming/pause - Pause event stream during intermissions
router.post("/pause", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("eventId").isUUID().withMessage("Valid event ID required")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, eventId, operatorId, event, stream, pauseResult;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Validation failed",
                            errors: validationErrors.array()
                        })];
                }
                eventId = req.body.eventId;
                operatorId = req.user.id;
                return [4 /*yield*/, Event_1.Event.findByPk(eventId)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                // Check authorization
                if (req.user.role !== "admin" && event.operatorId !== operatorId) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                // Verify event is in progress
                if (event.status !== "in-progress") {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Can only pause streams that are in-progress"
                        })];
                }
                return [4 /*yield*/, rtmpService_1.rtmpService.getActiveStream(eventId)];
            case 2:
                stream = _a.sent();
                if (!stream) {
                    throw errorHandler_1.errors.notFound("No active stream found for this event");
                }
                return [4 /*yield*/, rtmpService_1.rtmpService.pauseStream(stream.streamId)];
            case 3:
                pauseResult = _a.sent();
                // Update event status to paused
                return [4 /*yield*/, event.update({ status: "paused" })];
            case 4:
                // Update event status to paused
                _a.sent();
                // Broadcast via SSE
                sseService_1.sseService.broadcastSystemEvent(sseService_1.SSEEventType.STREAM_STATUS_UPDATE, {
                    type: "STREAM_PAUSED",
                    eventId: eventId,
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
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/streaming/resume - Resume event stream after intermission
router.post("/resume", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("eventId").isUUID().withMessage("Valid event ID required")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, eventId, operatorId, event, stream, resumeResult;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Validation failed",
                            errors: validationErrors.array()
                        })];
                }
                eventId = req.body.eventId;
                operatorId = req.user.id;
                return [4 /*yield*/, Event_1.Event.findByPk(eventId)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                // Check authorization
                if (req.user.role !== "admin" && event.operatorId !== operatorId) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                // Verify event is in intermission
                if (event.status !== "intermission") {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Can only resume streams that are in intermission"
                        })];
                }
                return [4 /*yield*/, rtmpService_1.rtmpService.getActiveStream(eventId)];
            case 2:
                stream = _a.sent();
                if (!stream) {
                    throw errorHandler_1.errors.notFound("No active stream found for this event");
                }
                return [4 /*yield*/, rtmpService_1.rtmpService.resumeStream(stream.streamId)];
            case 3:
                resumeResult = _a.sent();
                // Update event status back to in-progress
                return [4 /*yield*/, event.update({ status: "in-progress" })];
            case 4:
                // Update event status back to in-progress
                _a.sent();
                // Broadcast via SSE
                sseService_1.sseService.broadcastSystemEvent(sseService_1.SSEEventType.STREAM_STATUS_UPDATE, {
                    type: "STREAM_RESUMED",
                    eventId: eventId,
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
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/streaming/intermission-status/:eventId - Get intermission status for an event
router.get("/intermission-status/:eventId", auth_1.authenticate, [
    (0, express_validator_1.param)("eventId").isUUID().withMessage("Invalid event ID")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var eventId, status;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                eventId = req.params.eventId;
                return [4 /*yield*/, rtmpService_1.rtmpService.getIntermissionStatus(eventId)];
            case 1:
                status = _a.sent();
                res.json({
                    success: true,
                    data: status
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
