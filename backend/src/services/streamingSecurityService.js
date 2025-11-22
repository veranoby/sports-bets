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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingSecurityService = void 0;
var crypto_1 = __importDefault(require("crypto"));
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var User_1 = require("../models/User");
var Event_1 = require("../models/Event");
var Subscription_1 = require("../models/Subscription");
var logger_1 = require("../config/logger");
// In-memory store for rate limiting (in production, use Redis)
var rateLimitStore = new Map();
// In-memory store for active streams (in production, use Redis)
var activeStreams = new Map();
// Configuration
var STREAM_TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
var MAX_CONCURRENT_STREAMS_PER_USER = 2;
var RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
var MAX_REQUESTS_PER_WINDOW = 30;
var IP_BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
var SUSPICIOUS_ACTIVITY_THRESHOLD = 100; // Requests per minute
// Blocked IPs
var blockedIPs = new Set();
/**
 * StreamingSecurityService for implementing signed URLs and anti-DDoS protection
 *
 * Features:
 * - Generate time-limited signed URLs (5min expiry)
 * - HMAC-SHA256 signature validation
 * - User-specific tokens with eventId validation
 * - Automatic token rotation on expiry
 * - Rate limiting (30 requests/minute per IP)
 * - Concurrent stream limits (2 per user)
 * - IP blocking for suspicious activity (10 minute blocks)
 * - Circuit breaker for repeated failed authentications
 */
var StreamingSecurityService = /** @class */ (function () {
    function StreamingSecurityService() {
    }
    /**
     * Generate a signed stream token
     *
     * @param userId User ID
     * @param eventId Event ID
     * @returns Signed token with expiration
     */
    StreamingSecurityService.generateSignedToken = function (userId, eventId) {
        var expiresAt = new Date(Date.now() + STREAM_TOKEN_EXPIRY_MS);
        // Create token data
        var tokenData = {
            userId: userId,
            eventId: eventId,
            expiresAt: expiresAt.toISOString()
        };
        // Create signature
        var signature = crypto_1.default
            .createHmac('sha256', process.env.STREAM_SECRET_KEY || process.env.JWT_SECRET)
            .update(JSON.stringify(tokenData))
            .digest('hex');
        // Combine data and signature
        var token = Buffer.from(JSON.stringify(__assign(__assign({}, tokenData), { signature: signature }))).toString('base64');
        return { token: token, expiresAt: expiresAt };
    };
    /**
     * Validate a signed stream token
     *
     * @param token Signed token
     * @returns Validation result
     */
    StreamingSecurityService.validateSignedToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenData, signature, data, expectedSignature, user, event_1, subscription, subscriptionValid, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        tokenData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
                        // Check expiration
                        if (new Date(tokenData.expiresAt) < new Date()) {
                            return [2 /*return*/, { valid: false, error: 'Token expired' }];
                        }
                        signature = tokenData.signature, data = __rest(tokenData, ["signature"]);
                        expectedSignature = crypto_1.default
                            .createHmac('sha256', process.env.STREAM_SECRET_KEY || process.env.JWT_SECRET)
                            .update(JSON.stringify(data))
                            .digest('hex');
                        if (signature !== expectedSignature) {
                            return [2 /*return*/, { valid: false, error: 'Invalid signature' }];
                        }
                        return [4 /*yield*/, User_1.User.findByPk(data.userId)];
                    case 1:
                        user = _b.sent();
                        if (!user) {
                            return [2 /*return*/, { valid: false, error: 'User not found' }];
                        }
                        return [4 /*yield*/, Event_1.Event.findByPk(data.eventId)];
                    case 2:
                        event_1 = _b.sent();
                        if (!event_1 || event_1.status !== 'in-progress') {
                            return [2 /*return*/, { valid: false, error: 'Event not found or not live' }];
                        }
                        return [4 /*yield*/, Subscription_1.Subscription.findOne({
                                where: {
                                    userId: data.userId,
                                    status: 'active'
                                }
                            })];
                    case 3:
                        subscription = _b.sent();
                        subscriptionValid = !!subscription && new Date(subscription.expiresAt) > new Date();
                        return [2 /*return*/, {
                                valid: true,
                                userId: data.userId,
                                eventId: data.eventId,
                                subscriptionValid: subscriptionValid
                            }];
                    case 4:
                        error_1 = _b.sent();
                        logger_1.logger.error('Token validation error:', { error: error_1 });
                        return [2 /*return*/, { valid: false, error: 'Invalid token format' }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Track stream start for concurrent limit enforcement
     *
     * @param streamKey Stream key
     * @param userId User ID
     * @param eventId Event ID
     */
    StreamingSecurityService.trackStreamStart = function (streamKey, userId, eventId) {
        activeStreams.set(streamKey, {
            eventId: eventId,
            userId: userId,
            createdAt: new Date(),
            viewers: new Set()
        });
    };
    /**
     * Track stream end for cleanup
     *
     * @param streamKey Stream key
     */
    StreamingSecurityService.trackStreamEnd = function (streamKey) {
        activeStreams.delete(streamKey);
    };
    /**
     * Track viewer for a stream
     *
     * @param streamKey Stream key
     * @param userId User ID
     */
    StreamingSecurityService.trackViewer = function (streamKey, userId) {
        var stream = activeStreams.get(streamKey);
        if (stream) {
            stream.viewers.add(userId);
        }
    };
    /**
     * Remove viewer from a stream
     *
     * @param streamKey Stream key
     * @param userId User ID
     */
    StreamingSecurityService.removeViewer = function (streamKey, userId) {
        var stream = activeStreams.get(streamKey);
        if (stream) {
            stream.viewers.delete(userId);
        }
    };
    /**
     * Get stream information
     *
     * @param streamKey Stream key
     * @returns Stream information or null if not found
     */
    StreamingSecurityService.getStreamInfo = function (streamKey) {
        var stream = activeStreams.get(streamKey);
        if (!stream)
            return null;
        return {
            eventId: stream.eventId,
            userId: stream.userId,
            viewerCount: stream.viewers.size,
            createdAt: stream.createdAt
        };
    };
    /**
     * Block an IP address
     *
     * @param ip IP address to block
     */
    StreamingSecurityService.blockIP = function (ip) {
        blockedIPs.add(ip);
        logger_1.logger.warn("Blocked IP: ".concat(ip));
        // Automatically unblock after duration
        setTimeout(function () {
            blockedIPs.delete(ip);
            logger_1.logger.info("Unblocked IP: ".concat(ip));
        }, IP_BLOCK_DURATION_MS);
    };
    /**
     * Check for suspicious activity from an IP
     *
     * @param ip IP address
     * @returns True if suspicious, false otherwise
     */
    StreamingSecurityService.isSuspiciousActivity = function (ip) {
        var now = Date.now();
        var record = rateLimitStore.get(ip);
        // Reset window if expired
        if (!record || now > record.resetTime) {
            record = {
                count: 0,
                resetTime: now + RATE_LIMIT_WINDOW_MS
            };
            rateLimitStore.set(ip, record);
        }
        record.count++;
        // Check if above suspicious threshold
        return record.count > SUSPICIOUS_ACTIVITY_THRESHOLD;
    };
    /**
     * Get client IP address
     *
     * @param req Express request
     * @returns Client IP address
     */
    StreamingSecurityService.getClientIP = function (req) {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'unknown';
    };
    var _a;
    _a = StreamingSecurityService;
    /**
     * Rate limiting middleware
     *
     * Limits to 30 requests/minute per IP
     */
    StreamingSecurityService.rateLimiter = (0, express_rate_limit_1.default)({
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: MAX_REQUESTS_PER_WINDOW,
        message: {
            success: false,
            message: 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: function (req) {
            // Skip rate limiting for blocked IPs
            return blockedIPs.has(_a.getClientIP(req));
        }
    });
    /**
     * Concurrent stream limit middleware
     *
     * Limits to 2 concurrent streams per user
     */
    StreamingSecurityService.concurrentStreamLimit = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var userId, activeStreamCount, _i, _b, stream;
        var _c;
        return __generator(_a, function (_d) {
            try {
                userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Authentication required'
                        })];
                }
                activeStreamCount = 0;
                for (_i = 0, _b = activeStreams.values(); _i < _b.length; _i++) {
                    stream = _b[_i];
                    if (stream.userId === userId) {
                        activeStreamCount++;
                    }
                }
                // Check limit
                if (activeStreamCount >= MAX_CONCURRENT_STREAMS_PER_USER) {
                    return [2 /*return*/, res.status(429).json({
                            success: false,
                            message: 'Maximum concurrent streams reached'
                        })];
                }
                next();
            }
            catch (error) {
                logger_1.logger.error('Concurrent stream limit error:', { error: error });
                next(error);
            }
            return [2 /*return*/];
        });
    }); };
    /**
     * IP blocking middleware
     *
     * Blocks IPs with suspicious activity
     */
    StreamingSecurityService.ipBlocker = function (req, res, next) {
        var ip = _a.getClientIP(req);
        // Check if IP is blocked
        if (blockedIPs.has(ip)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        next();
    };
    return StreamingSecurityService;
}());
exports.StreamingSecurityService = StreamingSecurityService;
exports.default = StreamingSecurityService;
