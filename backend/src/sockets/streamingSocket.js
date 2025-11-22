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
exports.setupStreamingSocket = void 0;
var rtmpService_1 = require("../services/rtmpService");
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var models_1 = require("../models");
var safetyLimits_1 = require("../utils/safetyLimits");
var databaseOptimizer_1 = require("../services/databaseOptimizer");
var trackConnection = function (eventId, userId) { return __awaiter(void 0, void 0, void 0, function () {
    var connection, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.EventConnection.create({
                        event_id: parseInt(eventId),
                        user_id: parseInt(userId),
                        connected_at: new Date()
                    })];
            case 1:
                connection = _a.sent();
                return [2 /*return*/, connection.id];
            case 2:
                error_1 = _a.sent();
                console.error('Error tracking connection:', error_1);
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); };
var trackDisconnection = function (connectionId) { return __awaiter(void 0, void 0, void 0, function () {
    var connection, disconnectedAt, duration, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, models_1.EventConnection.findByPk(connectionId)];
            case 1:
                connection = _a.sent();
                if (!connection) return [3 /*break*/, 3];
                disconnectedAt = new Date();
                duration = Math.floor((disconnectedAt.getTime() - new Date(connection.connected_at).getTime()) / 1000);
                return [4 /*yield*/, connection.update({
                        disconnected_at: disconnectedAt,
                        duration_seconds: duration
                    })];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                console.error('Error tracking disconnection:', error_2);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
// Store active viewer connections
var activeViewers = new Map();
// Add connection tracking by IP and user for limits
var connectionsByIp = new Map(); // IP -> Set of socket IDs
var connectionsByUser = new Map(); // UserId -> Set of socket IDs
// Constants for connection limits
var MAX_CONNECTIONS_PER_IP = 3;
var MAX_CONNECTIONS_PER_USER = 2;
var setupStreamingSocket = function (io) {
    // Register shutdown handler for cleanup
    safetyLimits_1.SafetyLimits.registerShutdownHandler(function () {
        console.log('Cleaning up streaming sockets...');
        // Any additional cleanup logic can go here
    });
    // Middleware for stream authentication
    io.of('/stream').use(function (socket, next) { return __awaiter(void 0, void 0, void 0, function () {
        var token, decoded;
        return __generator(this, function (_a) {
            try {
                token = socket.handshake.auth.token || socket.handshake.query.token;
                if (!token) {
                    return [2 /*return*/, next(new Error('Authentication token required'))];
                }
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                // Attach user data to socket
                socket.data = {
                    userId: decoded.userId,
                    eventId: decoded.eventId,
                    streamId: decoded.streamId,
                    role: decoded.role || 'viewer'
                };
                next();
            }
            catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Invalid authentication token'));
            }
            return [2 /*return*/];
        });
    }); });
    // Handle streaming namespace connections
    io.of('/stream').on('connection', function (socket) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, userId, eventId, streamId, role, ip, currentIpConnections, currentUserConnections, _b, _c, _d;
        var _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = socket.data, userId = _a.userId, eventId = _a.eventId, streamId = _a.streamId, role = _a.role;
                    console.log("Stream viewer connected: ".concat(userId, " for event ").concat(eventId));
                    // Join viewer to event room
                    if (eventId) {
                        socket.join("event:".concat(eventId));
                        if (streamId) {
                            socket.join("stream:".concat(streamId));
                        }
                    }
                    if (!(userId && eventId)) return [3 /*break*/, 2];
                    ip = socket.handshake.address;
                    currentIpConnections = connectionsByIp.get(ip) || new Set();
                    currentUserConnections = connectionsByUser.get(userId) || new Set();
                    // Check IP-based connection limit
                    if (currentIpConnections.size >= MAX_CONNECTIONS_PER_IP) {
                        console.warn("IP ".concat(ip, " has reached maximum connections limit (").concat(MAX_CONNECTIONS_PER_IP, ")"));
                        socket.emit('connection_error', {
                            error: 'TOO_MANY_CONNECTIONS',
                            message: "Maximum ".concat(MAX_CONNECTIONS_PER_IP, " connections allowed per IP address")
                        });
                        socket.disconnect();
                        return [2 /*return*/];
                    }
                    // Check user-based connection limit
                    if (currentUserConnections.size >= MAX_CONNECTIONS_PER_USER) {
                        console.warn("User ".concat(userId, " has reached maximum connections limit (").concat(MAX_CONNECTIONS_PER_USER, ")"));
                        socket.emit('connection_error', {
                            error: 'TOO_MANY_CONNECTIONS',
                            message: "Maximum ".concat(MAX_CONNECTIONS_PER_USER, " connections allowed per user")
                        });
                        socket.disconnect();
                        return [2 /*return*/];
                    }
                    // Add to connection tracking maps
                    currentIpConnections.add(socket.id);
                    connectionsByIp.set(ip, currentIpConnections);
                    currentUserConnections.add(socket.id);
                    connectionsByUser.set(userId, currentUserConnections);
                    // Track viewer in active viewers
                    _c = (_b = activeViewers).set;
                    _d = [socket.id];
                    _e = {
                        socketId: socket.id,
                        userId: userId,
                        eventId: eventId,
                        streamId: streamId,
                        joinedAt: new Date(),
                        lastActivity: new Date()
                    };
                    return [4 /*yield*/, trackConnection(eventId, userId)];
                case 1:
                    // Track viewer in active viewers
                    _c.apply(_b, _d.concat([(_e.connectionId = _f.sent(),
                            _e)]));
                    // Queue analytics event for batch processing
                    databaseOptimizer_1.DatabaseOptimizer.queueAnalyticsEvent({
                        event_id: parseInt(eventId),
                        user_id: parseInt(userId),
                        session_id: socket.id,
                        connected_at: new Date(),
                        ip_address: socket.handshake.address,
                        user_agent: socket.handshake.headers['user-agent']
                    });
                    _f.label = 2;
                case 2:
                    // Handle analytics events from client
                    socket.on('analytics_event', function (data) { return __awaiter(void 0, void 0, void 0, function () {
                        var viewer, error_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    if (!eventId || !userId)
                                        return [2 /*return*/];
                                    return [4 /*yield*/, rtmpService_1.rtmpService.trackViewerEvent({
                                            eventId: eventId,
                                            userId: userId,
                                            event: data.event,
                                            data: data.data,
                                            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                                            userAgent: socket.handshake.headers['user-agent'],
                                            ip: socket.handshake.address
                                        })];
                                case 1:
                                    _a.sent();
                                    viewer = activeViewers.get(socket.id);
                                    if (viewer) {
                                        viewer.lastActivity = new Date();
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_3 = _a.sent();
                                    console.error('Failed to track analytics event:', error_3);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Handle join specific stream
                    socket.on('join_stream', function (data) {
                        if (data.streamId) {
                            socket.join("stream:".concat(data.streamId));
                            // Update viewer data
                            var viewer = activeViewers.get(socket.id);
                            if (viewer) {
                                viewer.streamId = data.streamId;
                            }
                        }
                    });
                    // Handle leave specific stream
                    socket.on('leave_stream', function (data) {
                        if (data.streamId) {
                            socket.leave("stream:".concat(data.streamId));
                        }
                    });
                    // Handle viewer heartbeat/activity
                    socket.on('heartbeat', function () {
                        var viewer = activeViewers.get(socket.id);
                        if (viewer) {
                            viewer.lastActivity = new Date();
                        }
                    });
                    // Handle quality change events
                    socket.on('quality_change', function (data) {
                        if (eventId) {
                            // Broadcast to analytics systems
                            socket.to("event:".concat(eventId)).emit('quality_distribution_update', {
                                eventId: eventId,
                                quality: data.quality,
                                userId: userId,
                                timestamp: new Date()
                            });
                        }
                    });
                    // Handle buffer/performance events
                    socket.on('performance_metric', function (data) {
                        if (eventId) {
                            // Broadcast performance data for real-time monitoring
                            socket.to("event:".concat(eventId)).emit('performance_update', {
                                eventId: eventId,
                                metric: data.metric,
                                value: data.value,
                                userId: userId,
                                timestamp: data.timestamp || new Date()
                            });
                        }
                    });
                    // Handle disconnection
                    socket.on('disconnect', function (reason) { return __awaiter(void 0, void 0, void 0, function () {
                        var viewer, watchTime, error_4, ip, ipConnections, userConnections;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("Stream viewer disconnected: ".concat(userId, " - ").concat(reason));
                                    viewer = activeViewers.get(socket.id);
                                    if (!viewer) return [3 /*break*/, 7];
                                    if (!viewer.connectionId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, trackDisconnection(viewer.connectionId)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2:
                                    watchTime = Date.now() - viewer.joinedAt.getTime();
                                    if (!eventId) return [3 /*break*/, 6];
                                    _a.label = 3;
                                case 3:
                                    _a.trys.push([3, 5, , 6]);
                                    return [4 /*yield*/, rtmpService_1.rtmpService.trackViewerLeave({
                                            eventId: eventId,
                                            userId: userId,
                                            watchTime: Math.floor(watchTime / 1000),
                                            timestamp: new Date()
                                        })];
                                case 4:
                                    _a.sent();
                                    // Broadcast viewer leave
                                    socket.to("event:".concat(eventId)).emit('viewer_leave', {
                                        userId: userId,
                                        eventId: eventId,
                                        watchTime: Math.floor(watchTime / 1000),
                                        viewerCount: Array.from(activeViewers.values())
                                            .filter(function (v) { return v.eventId === eventId && v.socketId !== socket.id; }).length,
                                        timestamp: new Date()
                                    });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_4 = _a.sent();
                                    console.warn('Failed to track viewer leave:', error_4);
                                    return [3 /*break*/, 6];
                                case 6:
                                    ip = socket.handshake.address;
                                    ipConnections = connectionsByIp.get(ip);
                                    if (ipConnections) {
                                        ipConnections.delete(socket.id);
                                        if (ipConnections.size === 0) {
                                            connectionsByIp.delete(ip);
                                        }
                                        else {
                                            connectionsByIp.set(ip, ipConnections);
                                        }
                                    }
                                    userConnections = connectionsByUser.get(userId);
                                    if (userConnections) {
                                        userConnections.delete(socket.id);
                                        if (userConnections.size === 0) {
                                            connectionsByUser.delete(userId);
                                        }
                                        else {
                                            connectionsByUser.set(userId, userConnections);
                                        }
                                    }
                                    // Remove from active viewers
                                    activeViewers.delete(socket.id);
                                    _a.label = 7;
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    }); });
    // Admin/Operator namespace for streaming controls
    io.of('/stream-control').use(function (socket, next) { return __awaiter(void 0, void 0, void 0, function () {
        var token, decoded;
        return __generator(this, function (_a) {
            try {
                token = socket.handshake.auth.token;
                if (!token) {
                    return [2 /*return*/, next(new Error('Authentication token required'))];
                }
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                // Check if user has operator or admin role
                if (!['admin', 'operator'].includes(decoded.role)) {
                    return [2 /*return*/, next(new Error('Insufficient permissions'))];
                }
                socket.data = {
                    userId: decoded.userId,
                    role: decoded.role
                };
                next();
            }
            catch (error) {
                console.error('Stream control socket authentication error:', error);
                next(new Error('Invalid authentication token'));
            }
            return [2 /*return*/];
        });
    }); });
    // Handle streaming control connections (for operators/admins)
    io.of('/stream-control').on('connection', function (socket) {
        var _a = socket.data, userId = _a.userId, role = _a.role;
        console.log("Stream control connected: ".concat(userId, " (").concat(role, ")"));
        // Join control room
        socket.join('stream_control');
        // Handle stream start events
        socket.on('stream_started', function (data) {
            // Broadcast to all viewers of this event
            io.of('/stream').to("event:".concat(data.eventId)).emit('stream_status', {
                status: 'live',
                streamId: data.streamId,
                eventId: data.eventId,
                timestamp: new Date()
            });
            // Notify other operators/admins
            socket.to('stream_control').emit('stream_started', data);
        });
        // Handle stream stop events
        socket.on('stream_stopped', function (data) {
            // Broadcast to all viewers
            io.of('/stream').to("event:".concat(data.eventId)).emit('stream_status', {
                status: 'ended',
                streamId: data.streamId,
                eventId: data.eventId,
                duration: data.duration,
                timestamp: new Date()
            });
            // Notify other operators/admins
            socket.to('stream_control').emit('stream_stopped', data);
        });
        // Handle analytics broadcast requests
        socket.on('request_analytics', function (data) {
            // Send real-time analytics to requesting operator
            if (data.eventId) {
                var eventViewers = Array.from(activeViewers.values())
                    .filter(function (v) { return v.eventId === data.eventId; });
                socket.emit('analytics_update', {
                    eventId: data.eventId,
                    currentViewers: eventViewers.length,
                    viewerList: eventViewers.map(function (v) { return ({
                        userId: v.userId,
                        joinedAt: v.joinedAt,
                        lastActivity: v.lastActivity
                    }); }),
                    timestamp: new Date()
                });
            }
        });
        // Handle system status requests
        socket.on('request_system_status', function () { return __awaiter(void 0, void 0, void 0, function () {
            var status_1, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, rtmpService_1.rtmpService.getSystemStatus()];
                    case 1:
                        status_1 = _a.sent();
                        socket.emit('system_status_update', __assign(__assign({}, status_1), { activeConnections: activeViewers.size, timestamp: new Date() }));
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Failed to get system status:', error_5);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        socket.on('disconnect', function (reason) {
            console.log("Stream control disconnected: ".concat(userId, " - ").concat(reason));
        });
    });
    // Periodic cleanup of inactive viewers using SafetyLimits
    var cleanupInterval = safetyLimits_1.SafetyLimits.createSafeInterval(function () {
        var now = Date.now();
        var inactiveThreshold = 5 * 60 * 1000; // 5 minutes
        for (var _i = 0, _a = activeViewers.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], socketId = _b[0], viewer = _b[1];
            if (now - viewer.lastActivity.getTime() > inactiveThreshold) {
                console.log("Removing inactive viewer: ".concat(viewer.userId));
                activeViewers.delete(socketId);
                // Disconnect the socket if still connected
                var socket = io.of('/stream').sockets.get(socketId);
                if (socket) {
                    socket.disconnect(true);
                }
            }
        }
    }, 60 * 1000, 3, 'inactive_viewer_cleanup'); // Run every minute, max 3 errors
    // Periodic analytics broadcast using SafetyLimits
    var analyticsInterval = safetyLimits_1.SafetyLimits.createSafeInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
        var viewersByEvent, _i, _a, viewer, _b, _c, _d, eventId, viewers, analytics;
        return __generator(this, function (_e) {
            try {
                viewersByEvent = new Map();
                for (_i = 0, _a = activeViewers.values(); _i < _a.length; _i++) {
                    viewer = _a[_i];
                    if (!viewersByEvent.has(viewer.eventId)) {
                        viewersByEvent.set(viewer.eventId, []);
                    }
                    viewersByEvent.get(viewer.eventId).push(viewer);
                }
                // Broadcast analytics updates for each active event
                for (_b = 0, _c = viewersByEvent.entries(); _b < _c.length; _b++) {
                    _d = _c[_b], eventId = _d[0], viewers = _d[1];
                    analytics = {
                        eventId: eventId,
                        currentViewers: viewers.length,
                        viewersByRegion: {}, // Would be calculated from IP data
                        recentActivity: viewers.filter(function (v) {
                            return Date.now() - v.lastActivity.getTime() < 60000;
                        } // Active in last minute
                        ).length,
                        timestamp: new Date()
                    };
                    // Send to stream control operators
                    io.of('/stream-control').to('stream_control').emit('analytics_broadcast', analytics);
                    // Send to viewers for real-time viewer count
                    io.of('/stream').to("event:".concat(eventId)).emit('viewer_count_update', {
                        eventId: eventId,
                        viewerCount: viewers.length,
                        timestamp: new Date()
                    });
                }
            }
            catch (error) {
                console.error('Failed to broadcast periodic analytics:', error);
            }
            return [2 /*return*/];
        });
    }); }, 10 * 1000, 3, 'periodic_analytics_broadcast'); // Every 10 seconds, max 3 errors
};
exports.setupStreamingSocket = setupStreamingSocket;
exports.default = exports.setupStreamingSocket;
