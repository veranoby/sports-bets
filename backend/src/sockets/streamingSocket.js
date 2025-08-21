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
exports.setupStreamingSocket = void 0;
const rtmpService_1 = require("../services/rtmpService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Store active viewer connections
const activeViewers = new Map();
const setupStreamingSocket = (io) => {
    // Middleware for stream authentication
    io.of('/stream').use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
    }));
    // Handle streaming namespace connections
    io.of('/stream').on('connection', (socket) => {
        const { userId, eventId, streamId, role } = socket.data;
        console.log(`Stream viewer connected: ${userId} for event ${eventId}`);
        // Join viewer to event room
        if (eventId) {
            socket.join(`event:${eventId}`);
            if (streamId) {
                socket.join(`stream:${streamId}`);
            }
        }
        // Track viewer join
        if (userId && eventId) {
            activeViewers.set(socket.id, {
                socketId: socket.id,
                userId,
                eventId,
                streamId,
                joinedAt: new Date(),
                lastActivity: new Date()
            });
            // Update RTMP service with viewer count
            rtmpService_1.rtmpService.trackViewerJoin({
                eventId,
                userId,
                subscriptionType: 'premium', // This would come from user data
                userAgent: socket.handshake.headers['user-agent'],
                ip: socket.handshake.address,
                timestamp: new Date()
            }).catch(err => console.warn('Failed to track viewer join:', err));
            // Broadcast viewer join to event room (for operators/admins)
            socket.to(`event:${eventId}`).emit('viewer_join', {
                userId,
                eventId,
                viewerCount: Array.from(activeViewers.values()).filter(v => v.eventId === eventId).length,
                timestamp: new Date()
            });
        }
        // Handle analytics events from client
        socket.on('analytics_event', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!eventId || !userId)
                    return;
                yield rtmpService_1.rtmpService.trackViewerEvent({
                    eventId,
                    userId,
                    event: data.event,
                    data: data.data,
                    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                    userAgent: socket.handshake.headers['user-agent'],
                    ip: socket.handshake.address
                });
                // Update last activity
                const viewer = activeViewers.get(socket.id);
                if (viewer) {
                    viewer.lastActivity = new Date();
                }
            }
            catch (error) {
                console.error('Failed to track analytics event:', error);
            }
        }));
        // Handle join specific stream
        socket.on('join_stream', (data) => {
            if (data.streamId) {
                socket.join(`stream:${data.streamId}`);
                // Update viewer data
                const viewer = activeViewers.get(socket.id);
                if (viewer) {
                    viewer.streamId = data.streamId;
                }
            }
        });
        // Handle leave specific stream
        socket.on('leave_stream', (data) => {
            if (data.streamId) {
                socket.leave(`stream:${data.streamId}`);
            }
        });
        // Handle viewer heartbeat/activity
        socket.on('heartbeat', () => {
            const viewer = activeViewers.get(socket.id);
            if (viewer) {
                viewer.lastActivity = new Date();
            }
        });
        // Handle quality change events
        socket.on('quality_change', (data) => {
            if (eventId) {
                // Broadcast to analytics systems
                socket.to(`event:${eventId}`).emit('quality_distribution_update', {
                    eventId,
                    quality: data.quality,
                    userId,
                    timestamp: new Date()
                });
            }
        });
        // Handle buffer/performance events
        socket.on('performance_metric', (data) => {
            if (eventId) {
                // Broadcast performance data for real-time monitoring
                socket.to(`event:${eventId}`).emit('performance_update', {
                    eventId,
                    metric: data.metric,
                    value: data.value,
                    userId,
                    timestamp: data.timestamp || new Date()
                });
            }
        });
        // Handle disconnection
        socket.on('disconnect', (reason) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`Stream viewer disconnected: ${userId} - ${reason}`);
            const viewer = activeViewers.get(socket.id);
            if (viewer) {
                const watchTime = Date.now() - viewer.joinedAt.getTime();
                // Track viewer leave
                if (eventId) {
                    try {
                        yield rtmpService_1.rtmpService.trackViewerLeave({
                            eventId,
                            userId,
                            watchTime: Math.floor(watchTime / 1000),
                            timestamp: new Date()
                        });
                        // Broadcast viewer leave
                        socket.to(`event:${eventId}`).emit('viewer_leave', {
                            userId,
                            eventId,
                            watchTime: Math.floor(watchTime / 1000),
                            viewerCount: Array.from(activeViewers.values())
                                .filter(v => v.eventId === eventId && v.socketId !== socket.id).length,
                            timestamp: new Date()
                        });
                    }
                    catch (error) {
                        console.warn('Failed to track viewer leave:', error);
                    }
                }
                // Remove from active viewers
                activeViewers.delete(socket.id);
            }
        }));
    });
    // Admin/Operator namespace for streaming controls
    io.of('/stream-control').use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // Check if user has operator or admin role
            if (!['admin', 'operator'].includes(decoded.role)) {
                return next(new Error('Insufficient permissions'));
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
    }));
    // Handle streaming control connections (for operators/admins)
    io.of('/stream-control').on('connection', (socket) => {
        const { userId, role } = socket.data;
        console.log(`Stream control connected: ${userId} (${role})`);
        // Join control room
        socket.join('stream_control');
        // Handle stream start events
        socket.on('stream_started', (data) => {
            // Broadcast to all viewers of this event
            io.of('/stream').to(`event:${data.eventId}`).emit('stream_status', {
                status: 'live',
                streamId: data.streamId,
                eventId: data.eventId,
                timestamp: new Date()
            });
            // Notify other operators/admins
            socket.to('stream_control').emit('stream_started', data);
        });
        // Handle stream stop events
        socket.on('stream_stopped', (data) => {
            // Broadcast to all viewers
            io.of('/stream').to(`event:${data.eventId}`).emit('stream_status', {
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
        socket.on('request_analytics', (data) => {
            // Send real-time analytics to requesting operator
            if (data.eventId) {
                const eventViewers = Array.from(activeViewers.values())
                    .filter(v => v.eventId === data.eventId);
                socket.emit('analytics_update', {
                    eventId: data.eventId,
                    currentViewers: eventViewers.length,
                    viewerList: eventViewers.map(v => ({
                        userId: v.userId,
                        joinedAt: v.joinedAt,
                        lastActivity: v.lastActivity
                    })),
                    timestamp: new Date()
                });
            }
        });
        // Handle system status requests
        socket.on('request_system_status', () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const status = yield rtmpService_1.rtmpService.getSystemStatus();
                socket.emit('system_status_update', Object.assign(Object.assign({}, status), { activeConnections: activeViewers.size, timestamp: new Date() }));
            }
            catch (error) {
                console.error('Failed to get system status:', error);
            }
        }));
        socket.on('disconnect', (reason) => {
            console.log(`Stream control disconnected: ${userId} - ${reason}`);
        });
    });
    // Periodic cleanup of inactive viewers
    setInterval(() => {
        const now = Date.now();
        const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
        for (const [socketId, viewer] of activeViewers.entries()) {
            if (now - viewer.lastActivity.getTime() > inactiveThreshold) {
                console.log(`Removing inactive viewer: ${viewer.userId}`);
                activeViewers.delete(socketId);
                // Disconnect the socket if still connected
                const socket = io.of('/stream').sockets.get(socketId);
                if (socket) {
                    socket.disconnect(true);
                }
            }
        }
    }, 60 * 1000); // Run every minute
    // Periodic analytics broadcast
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Group viewers by event
            const viewersByEvent = new Map();
            for (const viewer of activeViewers.values()) {
                if (!viewersByEvent.has(viewer.eventId)) {
                    viewersByEvent.set(viewer.eventId, []);
                }
                viewersByEvent.get(viewer.eventId).push(viewer);
            }
            // Broadcast analytics updates for each active event
            for (const [eventId, viewers] of viewersByEvent.entries()) {
                const analytics = {
                    eventId,
                    currentViewers: viewers.length,
                    viewersByRegion: {}, // Would be calculated from IP data
                    recentActivity: viewers.filter(v => Date.now() - v.lastActivity.getTime() < 60000 // Active in last minute
                    ).length,
                    timestamp: new Date()
                };
                // Send to stream control operators
                io.of('/stream-control').to('stream_control').emit('analytics_broadcast', analytics);
                // Send to viewers for real-time viewer count
                io.of('/stream').to(`event:${eventId}`).emit('viewer_count_update', {
                    eventId,
                    viewerCount: viewers.length,
                    timestamp: new Date()
                });
            }
        }
        catch (error) {
            console.error('Failed to broadcast periodic analytics:', error);
        }
    }), 10 * 1000); // Every 10 seconds
};
exports.setupStreamingSocket = setupStreamingSocket;
exports.default = exports.setupStreamingSocket;
