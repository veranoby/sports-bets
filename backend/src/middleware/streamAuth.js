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
exports.logStreamAccess = exports.streamAccessRateLimit = exports.validateStreamKey = exports.requireStreamingPermission = exports.validateStreamToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const Event_1 = require("../models/Event");
/**
 * Middleware to validate stream access tokens
 */
const validateStreamToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '')) || req.query.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Stream access token required',
                code: 'TOKEN_REQUIRED'
            });
        }
        // Verify JWT token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid stream token',
                code: 'INVALID_TOKEN'
            });
        }
        // Check if token is expired
        if (decoded.exp < Math.floor(Date.now() / 1000)) {
            return res.status(401).json({
                success: false,
                message: 'Stream token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        // Verify user exists
        const user = yield User_1.User.findByPk(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid user',
                code: 'USER_NOT_FOUND'
            });
        }
        // Verify subscription is still valid
        const subscription = yield Subscription_1.Subscription.findOne({
            where: {
                id: decoded.subscriptionId,
                userId: decoded.userId,
                status: 'active'
            }
        });
        if (!subscription) {
            return res.status(403).json({
                success: false,
                message: 'Subscription not found or inactive',
                code: 'SUBSCRIPTION_INVALID'
            });
        }
        // Check subscription expiry
        if (new Date(subscription.expiresAt) <= new Date()) {
            return res.status(403).json({
                success: false,
                message: 'Subscription has expired',
                code: 'SUBSCRIPTION_EXPIRED'
            });
        }
        // Verify event is still live
        const event = yield Event_1.Event.findByPk(decoded.eventId);
        if (!event || event.status !== 'in-progress') {
            return res.status(403).json({
                success: false,
                message: 'Event is not currently live',
                code: 'EVENT_NOT_LIVE'
            });
        }
        // Add decoded token data to request
        req.streamToken = decoded;
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Stream auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
exports.validateStreamToken = validateStreamToken;
/**
 * Middleware to check if user has streaming permissions
 */
const requireStreamingPermission = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    const userRole = req.user.role;
    const allowedRoles = ['admin', 'operator'];
    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions for streaming operations',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    next();
};
exports.requireStreamingPermission = requireStreamingPermission;
/**
 * Middleware to validate stream key format
 */
const validateStreamKey = (req, res, next) => {
    const streamKey = req.params.streamKey || req.body.streamKey || req.query.streamKey;
    if (!streamKey) {
        return res.status(400).json({
            success: false,
            message: 'Stream key is required',
            code: 'STREAM_KEY_REQUIRED'
        });
    }
    // Validate stream key format: stream_timestamp_randomhex
    const streamKeyRegex = /^stream_\d+_[a-f0-9]+$/;
    if (!streamKeyRegex.test(streamKey)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid stream key format',
            code: 'INVALID_STREAM_KEY'
        });
    }
    req.streamKey = streamKey;
    next();
};
exports.validateStreamKey = validateStreamKey;
/**
 * Rate limiting specifically for stream access
 */
const streamAccessRateLimit = (maxRequests = 3, windowMs = 60000) => {
    const requests = new Map();
    return (req, res, next) => {
        var _a;
        const identifier = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.ip;
        const now = Date.now();
        let userRequests = requests.get(identifier);
        // Reset window if expired
        if (!userRequests || now > userRequests.resetTime) {
            userRequests = {
                count: 0,
                resetTime: now + windowMs
            };
        }
        userRequests.count++;
        requests.set(identifier, userRequests);
        if (userRequests.count > maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many stream access requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
            });
        }
        next();
    };
};
exports.streamAccessRateLimit = streamAccessRateLimit;
/**
 * Middleware to log stream access for analytics
 */
const logStreamAccess = (req, res, next) => {
    var _a, _b;
    const startTime = Date.now();
    // Log request
    console.log(`Stream access: ${req.method} ${req.path}`, {
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        eventId: (_b = req.streamToken) === null || _b === void 0 ? void 0 : _b.eventId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    // Override res.json to log response
    const originalJson = res.json;
    res.json = function (data) {
        var _a, _b;
        const duration = Date.now() - startTime;
        console.log(`Stream response: ${res.statusCode}`, {
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            eventId: (_b = req.streamToken) === null || _b === void 0 ? void 0 : _b.eventId,
            duration,
            success: data.success,
            timestamp: new Date().toISOString()
        });
        return originalJson.call(this, data);
    };
    next();
};
exports.logStreamAccess = logStreamAccess;
