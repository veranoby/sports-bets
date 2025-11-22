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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseService = exports.AdminChannel = exports.SSEEventType = void 0;
var crypto_1 = require("crypto");
var logger_1 = require("../config/logger");
// SSE Event Types for GalloBets Admin System
var SSEEventType;
(function (SSEEventType) {
    // System Events
    SSEEventType["SYSTEM_STATUS"] = "SYSTEM_STATUS";
    SSEEventType["SYSTEM_MAINTENANCE"] = "SYSTEM_MAINTENANCE";
    SSEEventType["DATABASE_PERFORMANCE"] = "DATABASE_PERFORMANCE";
    SSEEventType["STREAM_STATUS_UPDATE"] = "STREAM_STATUS_UPDATE";
    SSEEventType["NOTIFICATION"] = "NOTIFICATION";
    SSEEventType["USER_NOTIFICATION"] = "USER_NOTIFICATION";
    // Fight Management Events
    SSEEventType["FIGHT_STATUS_UPDATE"] = "FIGHT_STATUS_UPDATE";
    SSEEventType["FIGHT_CREATED"] = "FIGHT_CREATED";
    SSEEventType["FIGHT_UPDATED"] = "FIGHT_UPDATED";
    SSEEventType["FIGHT_DELETED"] = "FIGHT_DELETED";
    SSEEventType["BETTING_WINDOW_OPENED"] = "BETTING_WINDOW_OPENED";
    SSEEventType["BETTING_WINDOW_CLOSED"] = "BETTING_WINDOW_CLOSED";
    // Betting Events
    SSEEventType["NEW_BET"] = "NEW_BET";
    SSEEventType["BET_MATCHED"] = "BET_MATCHED";
    SSEEventType["BET_CANCELLED"] = "BET_CANCELLED";
    SSEEventType["PAGO_PROPOSAL"] = "PAGO_PROPOSAL";
    SSEEventType["DOY_PROPOSAL"] = "DOY_PROPOSAL";
    SSEEventType["PROPOSAL_ACCEPTED"] = "PROPOSAL_ACCEPTED";
    SSEEventType["PROPOSAL_REJECTED"] = "PROPOSAL_REJECTED";
    SSEEventType["PROPOSAL_TIMEOUT"] = "PROPOSAL_TIMEOUT";
    // Financial Events
    SSEEventType["WALLET_TRANSACTION"] = "WALLET_TRANSACTION";
    SSEEventType["PAYMENT_PROCESSED"] = "PAYMENT_PROCESSED";
    SSEEventType["PAYOUT_PROCESSED"] = "PAYOUT_PROCESSED";
    SSEEventType["SUBSCRIPTION_UPDATED"] = "SUBSCRIPTION_UPDATED";
    // User Activity Events
    SSEEventType["USER_REGISTERED"] = "USER_REGISTERED";
    SSEEventType["USER_VERIFIED"] = "USER_VERIFIED";
    SSEEventType["USER_BANNED"] = "USER_BANNED";
    SSEEventType["ADMIN_ACTION"] = "ADMIN_ACTION";
    // Streaming Events
    SSEEventType["STREAM_STARTED"] = "STREAM_STARTED";
    SSEEventType["STREAM_ENDED"] = "STREAM_ENDED";
    SSEEventType["STREAM_ERROR"] = "STREAM_ERROR";
    SSEEventType["VIEWER_COUNT_UPDATE"] = "VIEWER_COUNT_UPDATE";
    // Connection Events
    SSEEventType["CONNECTION_ESTABLISHED"] = "CONNECTION_ESTABLISHED";
    SSEEventType["HEARTBEAT"] = "HEARTBEAT";
    SSEEventType["ERROR"] = "ERROR";
})(SSEEventType || (exports.SSEEventType = SSEEventType = {}));
// Admin Channel Types
var AdminChannel;
(function (AdminChannel) {
    AdminChannel["SYSTEM_MONITORING"] = "admin-system";
    AdminChannel["FIGHT_MANAGEMENT"] = "admin-fights";
    AdminChannel["BET_MONITORING"] = "admin-bets";
    AdminChannel["USER_MANAGEMENT"] = "admin-users";
    AdminChannel["FINANCIAL_MONITORING"] = "admin-finance";
    AdminChannel["STREAMING_MONITORING"] = "admin-streaming";
    AdminChannel["NOTIFICATIONS"] = "admin-notifications";
    AdminChannel["GLOBAL"] = "admin-global";
})(AdminChannel || (exports.AdminChannel = AdminChannel = {}));
var GalloBetsSSEService = /** @class */ (function () {
    function GalloBetsSSEService() {
        this.connections = new Map();
        this.eventHistory = new Map();
        // Connection tracking for limits
        this.connectionsByIp = new Map(); // IP -> Set of connection IDs
        this.connectionsByUser = new Map(); // UserId -> Set of connection IDs
        // Constants for connection limits (same as WebSocket)
        this.MAX_CONNECTIONS_PER_IP = 3;
        this.MAX_CONNECTIONS_PER_USER = 2;
        // Batching buffers and timers
        this.eventBatchBuffers = new Map();
        // Batching Configuration
        this.BATCHING_ENABLED = true;
        this.HIGH_LOAD_CONNECTION_THRESHOLD = 100;
        this.MAX_BATCH_SIZE = 10;
        this.BATCHING_WINDOW_MS = 50;
        this.performanceMetrics = {
            totalConnections: 0,
            activeConnections: 0,
            eventsSent: 0,
            errorsEncountered: 0,
            avgResponseTime: 0,
            batchedEvents: 0 // Track how many events were batched
        };
        // Configuration
        // Adaptive heartbeat intervals based on connection activity
        this.ACTIVE_CONNECTION_HEARTBEAT = 15000; // 15 seconds for active connections
        this.IDLE_CONNECTION_HEARTBEAT = 60000; // 60 seconds for idle connections
        this.STALE_CONNECTION_HEARTBEAT = 120000; // 120 seconds for stale connections
        this.MAX_MISSED_HEARTBEATS = 3; // Auto-close after 3 missed heartbeats
        this.CONNECTION_TIMEOUT = 60000; // 60 seconds
        this.MAX_EVENT_HISTORY = 100; // Max 100 events per channel
        this.EVENT_HISTORY_MAX_AGE = 5 * 60 * 1000; // Max age: 5 minutes (300,000 ms)
        this.CLEANUP_INTERVAL = 300000; // 5 minutes
        // Constants for connection limits (same as WebSocket)
        this.MAX_CONNECTIONS_PER_CHANNEL = 500; // Max connections per channel
        this.heartbeatInterval = null;
        this.cleanupInterval = null;
        this.startHeartbeat();
        this.startCleanup();
        logger_1.logger.info('🔄 GalloBetsSSEService initialized');
    }
    /**
     * Add new SSE connection with authentication and channel subscription
     */
    GalloBetsSSEService.prototype.addConnection = function (res, channel, userId, userRole, metadata) {
        var connectionId = (0, crypto_1.randomUUID)();
        var now = new Date();
        // Extract IP from request if available
        var ip = (metadata === null || metadata === void 0 ? void 0 : metadata.ip) || '';
        // Check connection limits before adding new connection
        if (ip) {
            var ipConnections = this.connectionsByIp.get(ip) || new Set();
            if (ipConnections.size >= this.MAX_CONNECTIONS_PER_IP) {
                logger_1.logger.warn("IP ".concat(ip, " has reached maximum SSE connections limit (").concat(this.MAX_CONNECTIONS_PER_IP, ")"));
                res.status(429).send("SSE: Too Many Connections - Maximum ".concat(this.MAX_CONNECTIONS_PER_IP, " connections allowed per IP address"));
                throw new Error("Maximum connections limit reached for IP: ".concat(ip));
            }
        }
        if (userId) {
            var userConnections = this.connectionsByUser.get(userId) || new Set();
            if (userConnections.size >= this.MAX_CONNECTIONS_PER_USER) {
                logger_1.logger.warn("User ".concat(userId, " has reached maximum SSE connections limit (").concat(this.MAX_CONNECTIONS_PER_USER, ")"));
                res.status(429).send("SSE: Too Many Connections - Maximum ".concat(this.MAX_CONNECTIONS_PER_USER, " connections allowed per user"));
                throw new Error("Maximum connections limit reached for user: ".concat(userId));
            }
        }
        // Set SSE headers with proper configuration
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Accel-Buffering': 'no' // Disable nginx buffering for real-time
        });
        var connection = {
            id: connectionId,
            res: res,
            channel: channel,
            userId: userId,
            userRole: userRole,
            connectedAt: now,
            lastHeartbeat: now,
            lastActivity: now,
            missedHeartbeats: 0,
            heartbeatInterval: this.getActiveConnectionHeartbeat(userId), // Determine based on user activity
            connectionQuality: {
                latency: 0,
                lastEventSent: now,
                eventsPerMinute: 0
            },
            isAlive: true,
            metadata: metadata || {}
        };
        this.connections.set(connectionId, connection);
        this.performanceMetrics.totalConnections++;
        this.performanceMetrics.activeConnections++;
        // Add to connection tracking maps
        if (ip) {
            var ipConnections = this.connectionsByIp.get(ip) || new Set();
            ipConnections.add(connectionId);
            this.connectionsByIp.set(ip, ipConnections);
        }
        if (userId) {
            var userConnections = this.connectionsByUser.get(userId) || new Set();
            userConnections.add(connectionId);
            this.connectionsByUser.set(userId, userConnections);
        }
        // Send connection established event
        this.sendConnectionEstablished(connectionId);
        // Send recent events for this channel
        this.sendRecentEvents(connectionId, channel);
        logger_1.logger.info("\uD83D\uDCE1 SSE connection established: ".concat(connectionId, " on channel ").concat(channel, " for user ").concat(userId || 'anonymous'));
        return connectionId;
    };
    /**
     * Remove SSE connection and cleanup resources
     */
    GalloBetsSSEService.prototype.removeConnection = function (connectionId) {
        var _a;
        var connection = this.connections.get(connectionId);
        if (connection) {
            connection.isAlive = false;
            try {
                if (!connection.res.destroyed) {
                    connection.res.end();
                }
            }
            catch (error) {
                logger_1.logger.warn("\u26A0\uFE0F Error closing SSE connection ".concat(connectionId, ":"), error);
            }
            // Clean up connection tracking maps
            if ((_a = connection.metadata) === null || _a === void 0 ? void 0 : _a.ip) {
                var ipConnections = this.connectionsByIp.get(connection.metadata.ip);
                if (ipConnections) {
                    ipConnections.delete(connectionId);
                    if (ipConnections.size === 0) {
                        this.connectionsByIp.delete(connection.metadata.ip);
                    }
                    else {
                        this.connectionsByIp.set(connection.metadata.ip, ipConnections);
                    }
                }
            }
            if (connection.userId) {
                var userConnections = this.connectionsByUser.get(connection.userId);
                if (userConnections) {
                    userConnections.delete(connectionId);
                    if (userConnections.size === 0) {
                        this.connectionsByUser.delete(connection.userId);
                    }
                    else {
                        this.connectionsByUser.set(connection.userId, userConnections);
                    }
                }
            }
            this.connections.delete(connectionId);
            this.performanceMetrics.activeConnections = Math.max(0, this.performanceMetrics.activeConnections - 1);
            // Clean up batching resources for this connection
            this.cleanupBatchResources(connectionId);
            logger_1.logger.info("\uD83D\uDCE1 SSE connection removed: ".concat(connectionId, " from channel ").concat(connection.channel));
        }
    };
    /**
     * Send event to specific client
     */
    // Enhanced sendToClient that also handles connection quality metrics
    GalloBetsSSEService.prototype.sendToClient = function (connectionId, event) {
        var connection = this.connections.get(connectionId);
        if (!connection || !connection.isAlive || connection.res.destroyed) {
            this.removeConnection(connectionId);
            return false;
        }
        // Check if we should use batching based on load
        if (this.BATCHING_ENABLED && this.shouldUseBatching()) {
            return this.enqueueEventForBatching(connectionId, event);
        }
        try {
            var startTime = Date.now();
            var sseMessage = this.formatSSEMessage(event);
            connection.res.write(sseMessage);
            connection.lastHeartbeat = new Date();
            connection.lastActivity = new Date(); // Also update last activity
            // Update connection quality metrics
            connection.connectionQuality.lastEventSent = new Date();
            connection.connectionQuality.latency = Date.now() - startTime;
            this.performanceMetrics.eventsSent++;
            this.updatePerformanceMetrics(Date.now() - startTime);
            return true;
        }
        catch (error) {
            logger_1.logger.error("\u274C Failed to send SSE event to client ".concat(connectionId, ":"), error);
            this.performanceMetrics.errorsEncountered++;
            this.removeConnection(connectionId);
            return false;
        }
    };
    /**
     * Check if the system is under high load and should use batching
     */
    GalloBetsSSEService.prototype.shouldUseBatching = function () {
        return this.performanceMetrics.activeConnections >= this.HIGH_LOAD_CONNECTION_THRESHOLD;
    };
    /**
     * Add event to batch buffer for specific connection
     */
    GalloBetsSSEService.prototype.enqueueEventForBatching = function (connectionId, event) {
        var _this = this;
        if (!this.eventBatchBuffers.has(connectionId)) {
            this.eventBatchBuffers.set(connectionId, {
                events: [],
                timer: null
            });
        }
        var buffer = this.eventBatchBuffers.get(connectionId);
        buffer.events.push(event);
        // If we've reached max batch size, flush immediately
        if (buffer.events.length >= this.MAX_BATCH_SIZE) {
            this.flushBatch(connectionId);
            return true;
        }
        // Set timer to flush batch after window if not already set
        if (!buffer.timer) {
            buffer.timer = setTimeout(function () {
                _this.flushBatch(connectionId);
            }, this.BATCHING_WINDOW_MS);
        }
        return true;
    };
    /**
     * Flush all events in the batch for a connection
     */
    GalloBetsSSEService.prototype.flushBatch = function (connectionId) {
        var buffer = this.eventBatchBuffers.get(connectionId);
        if (!buffer)
            return;
        if (buffer.timer) {
            clearTimeout(buffer.timer);
            buffer.timer = null;
        }
        if (buffer.events.length > 0) {
            var connection = this.connections.get(connectionId);
            if (connection && connection.isAlive && !connection.res.destroyed) {
                try {
                    var startTime = Date.now();
                    // Combine events into a batch message
                    var batchEvent = {
                        id: (0, crypto_1.randomUUID)(),
                        type: SSEEventType.HEARTBEAT, // Using HEARTBEAT type to indicate batch
                        data: {
                            batchedEvents: buffer.events,
                            batchSize: buffer.events.length,
                            timestamp: new Date()
                        },
                        timestamp: new Date(),
                        priority: 'medium',
                        channel: connection.channel
                    };
                    var sseMessage = this.formatSSEMessage(batchEvent);
                    connection.res.write(sseMessage);
                    connection.lastHeartbeat = new Date();
                    connection.lastActivity = new Date();
                    // Update metrics
                    this.performanceMetrics.eventsSent += buffer.events.length;
                    this.performanceMetrics.batchedEvents += buffer.events.length;
                    // Update connection quality metrics
                    connection.connectionQuality.lastEventSent = new Date();
                    connection.connectionQuality.latency = Date.now() - startTime;
                }
                catch (error) {
                    logger_1.logger.error("\u274C Failed to send batched SSE events to client ".concat(connectionId, ":"), error);
                    this.performanceMetrics.errorsEncountered++;
                    this.removeConnection(connectionId);
                }
            }
            // Clear the buffered events
            buffer.events = [];
        }
        // Clean up if no more events for this connection
        if (buffer.events.length === 0) {
            this.eventBatchBuffers.delete(connectionId);
        }
    };
    /**
     * Clean up batching resources when connection is removed
     */
    GalloBetsSSEService.prototype.cleanupBatchResources = function (connectionId) {
        var buffer = this.eventBatchBuffers.get(connectionId);
        if (buffer && buffer.timer) {
            clearTimeout(buffer.timer);
        }
        this.eventBatchBuffers.delete(connectionId);
    };
    /**
     * Broadcast event to all connections in a channel
     */
    GalloBetsSSEService.prototype.broadcastToChannel = function (channel, event) {
        var successCount = 0;
        var targetConnections = Array.from(this.connections.values())
            .filter(function (conn) { return conn.channel === channel && conn.isAlive; });
        for (var _i = 0, targetConnections_1 = targetConnections; _i < targetConnections_1.length; _i++) {
            var connection = targetConnections_1[_i];
            if (this.sendToClient(connection.id, event)) {
                successCount++;
            }
        }
        // Store event in history for late joiners
        this.addToEventHistory(channel, event);
        logger_1.logger.debug("\uD83D\uDCE1 Broadcasted ".concat(event.type, " to ").concat(successCount, "/").concat(targetConnections.length, " connections in channel ").concat(channel));
        return successCount;
    };
    /**
     * Broadcast to all admin channels
     */
    GalloBetsSSEService.prototype.broadcastToAllAdmin = function (event) {
        var adminChannels = Object.values(AdminChannel);
        var totalSent = 0;
        for (var _i = 0, adminChannels_1 = adminChannels; _i < adminChannels_1.length; _i++) {
            var channel = adminChannels_1[_i];
            totalSent += this.broadcastToChannel(channel, event);
        }
        return totalSent;
    };
    /**
     * Send event to specific admin channel with role-based filtering
     */
    GalloBetsSSEService.prototype.sendToAdminChannel = function (channel, event, requiredRole) {
        var successCount = 0;
        var targetConnections = Array.from(this.connections.values())
            .filter(function (conn) {
            return conn.channel === channel &&
                conn.isAlive &&
                (!requiredRole || conn.userRole === requiredRole);
        });
        for (var _i = 0, targetConnections_2 = targetConnections; _i < targetConnections_2.length; _i++) {
            var connection = targetConnections_2[_i];
            if (this.sendToClient(connection.id, event)) {
                successCount++;
            }
        }
        this.addToEventHistory(channel, event);
        return successCount;
    };
    /**
     * Create and broadcast fight status update
     */
    GalloBetsSSEService.prototype.broadcastFightUpdate = function (fightId, status, data) {
        var event = {
            id: (0, crypto_1.randomUUID)(),
            type: SSEEventType.FIGHT_STATUS_UPDATE,
            data: __assign({ fightId: fightId, status: status }, data),
            timestamp: new Date(),
            priority: 'high',
            metadata: { fightId: fightId }
        };
        this.sendToAdminChannel(AdminChannel.FIGHT_MANAGEMENT, event);
        this.sendToAdminChannel(AdminChannel.GLOBAL, event);
    };
    /**
     * Create and broadcast betting event
     */
    GalloBetsSSEService.prototype.broadcastBettingEvent = function (type, betData) {
        var event = {
            id: (0, crypto_1.randomUUID)(),
            type: type,
            data: betData,
            timestamp: new Date(),
            priority: type.includes('PROPOSAL') ? 'high' : 'medium',
            metadata: {
                fightId: betData.fightId,
                betId: betData.id,
                userId: betData.userId
            }
        };
        this.sendToAdminChannel(AdminChannel.BET_MONITORING, event);
        this.sendToAdminChannel(AdminChannel.GLOBAL, event);
    };
    /**
     * Create and broadcast PAGO/DOY proposal events
     */
    GalloBetsSSEService.prototype.broadcastProposalEvent = function (type, action, proposalData) {
        var eventType = type === 'PAGO' ? SSEEventType.PAGO_PROPOSAL : SSEEventType.DOY_PROPOSAL;
        var event = {
            id: (0, crypto_1.randomUUID)(),
            type: eventType,
            data: __assign(__assign({ action: action }, proposalData), { expiresAt: new Date(Date.now() + 180000) // 3 minutes timeout
             }),
            timestamp: new Date(),
            priority: 'critical',
            metadata: {
                fightId: proposalData.fightId,
                betId: proposalData.betId,
                userId: proposalData.userId
            }
        };
        this.sendToAdminChannel(AdminChannel.BET_MONITORING, event);
        this.sendToAdminChannel(AdminChannel.NOTIFICATIONS, event);
    };
    /**
     * Broadcast system monitoring events
     */
    GalloBetsSSEService.prototype.broadcastSystemEvent = function (type, data, priority) {
        if (priority === void 0) { priority = 'medium'; }
        var event = {
            id: (0, crypto_1.randomUUID)(),
            type: type,
            data: data,
            timestamp: new Date(),
            priority: priority
        };
        this.sendToAdminChannel(AdminChannel.SYSTEM_MONITORING, event);
        if (priority === 'critical') {
            this.sendToAdminChannel(AdminChannel.GLOBAL, event);
        }
    };
    /**
     * Get connection statistics for monitoring
     */
    GalloBetsSSEService.prototype.getConnectionStats = function () {
        var connectionsByChannel = {};
        var connectionsByRole = {};
        for (var _i = 0, _a = this.connections.values(); _i < _a.length; _i++) {
            var conn = _a[_i];
            if (conn.isAlive) {
                connectionsByChannel[conn.channel] = (connectionsByChannel[conn.channel] || 0) + 1;
                connectionsByRole[conn.userRole || 'anonymous'] = (connectionsByRole[conn.userRole || 'anonymous'] || 0) + 1;
            }
        }
        return __assign(__assign({}, this.performanceMetrics), { connectionsByChannel: connectionsByChannel, connectionsByRole: connectionsByRole, uptime: process.uptime(), timestamp: new Date() });
    };
    /**
     * Send connection established event
     */
    GalloBetsSSEService.prototype.sendConnectionEstablished = function (connectionId) {
        var event = {
            id: (0, crypto_1.randomUUID)(),
            type: SSEEventType.CONNECTION_ESTABLISHED,
            data: {
                connectionId: connectionId,
                message: 'SSE connection established successfully',
                serverTime: new Date(),
                heartbeatInterval: this.ACTIVE_CONNECTION_HEARTBEAT
            },
            timestamp: new Date(),
            priority: 'low'
        };
        this.sendToClient(connectionId, event);
    };
    /**
     * Send recent events to newly connected client
     */
    GalloBetsSSEService.prototype.sendRecentEvents = function (connectionId, channel) {
        var recentEvents = this.eventHistory.get(channel);
        if (recentEvents && recentEvents.length > 0) {
            // Send last 10 events
            var eventsToSend = recentEvents.slice(-10);
            for (var _i = 0, eventsToSend_1 = eventsToSend; _i < eventsToSend_1.length; _i++) {
                var event_1 = eventsToSend_1[_i];
                this.sendToClient(connectionId, event_1);
            }
        }
    };
    /**
     * Format SSE message according to specification
     */
    GalloBetsSSEService.prototype.formatSSEMessage = function (event) {
        var message = '';
        if (event.id) {
            message += "id: ".concat(event.id, "\n");
        }
        message += "event: ".concat(event.type, "\n");
        message += "data: ".concat(JSON.stringify(__assign(__assign({}, event.data), { timestamp: event.timestamp, priority: event.priority, metadata: event.metadata })), "\n\n");
        return message;
    };
    /**
     * Add event to history for late joiners
     */
    GalloBetsSSEService.prototype.addToEventHistory = function (channel, event) {
        if (!this.eventHistory.has(channel)) {
            this.eventHistory.set(channel, []);
        }
        var channelHistory = this.eventHistory.get(channel);
        channelHistory.push(event);
        // Clean up expired events (time-based limit)
        var now = Date.now();
        var cutoffTime = now - this.EVENT_HISTORY_MAX_AGE;
        var validEvents = channelHistory.filter(function (item) { return item.timestamp.getTime() > cutoffTime; });
        // Apply count-based limit
        if (validEvents.length > this.MAX_EVENT_HISTORY) {
            // Keep only the most recent events up to the limit
            validEvents.splice(0, validEvents.length - this.MAX_EVENT_HISTORY);
        }
        // Update the history with cleaned events
        this.eventHistory.set(channel, validEvents);
    };
    /**
     * Start heartbeat to detect dead connections
     */
    GalloBetsSSEService.prototype.startHeartbeat = function () {
        var _this = this;
        // For adaptive heartbeat, we'll update each connection individually
        // Instead of using a single interval, we'll manage heartbeats per connection
        this.heartbeatInterval = setInterval(function () {
            var now = new Date();
            for (var _i = 0, _a = _this.connections.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], connectionId = _b[0], connection = _b[1];
                // Check if it's time to send heartbeat for this specific connection
                var timeSinceLastHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();
                // If it's time to send heartbeat based on this connection's interval
                if (timeSinceLastHeartbeat >= connection.heartbeatInterval) {
                    var heartbeatEvent = {
                        id: (0, crypto_1.randomUUID)(),
                        type: SSEEventType.HEARTBEAT,
                        data: {
                            serverTime: now,
                            connectionId: connectionId,
                            heartbeatInterval: connection.heartbeatInterval,
                            missedHeartbeats: connection.missedHeartbeats
                        },
                        timestamp: now,
                        priority: 'low'
                    };
                    if (connection.isAlive) {
                        // Update heartbeat stats before sending
                        connection.lastHeartbeat = now;
                        if (!_this.sendToClient(connectionId, heartbeatEvent)) {
                            // If sending failed, increment missed heartbeat counter
                            connection.missedHeartbeats++;
                            // Check if we've missed too many heartbeats
                            if (connection.missedHeartbeats >= _this.MAX_MISSED_HEARTBEATS) {
                                logger_1.logger.warn("\u26A0\uFE0F Connection ".concat(connectionId, " missed ").concat(connection.missedHeartbeats, " heartbeats, removing"));
                                _this.removeConnection(connectionId);
                            }
                        }
                        else {
                            // Reset missed heartbeat counter if heartbeat sent successfully
                            connection.missedHeartbeats = 0;
                        }
                    }
                }
                // Check connection timeout regardless of heartbeat interval
                var timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime();
                if (timeSinceLastActivity > _this.CONNECTION_TIMEOUT) {
                    logger_1.logger.warn("\u26A0\uFE0F Connection ".concat(connectionId, " timed out (inactive for ").concat(timeSinceLastActivity, "ms), removing"));
                    _this.removeConnection(connectionId);
                }
            }
        }, 15000); // Check all connections every 15 seconds, but send individual heartbeats based on their intervals
        logger_1.logger.info("\u2764\uFE0F Adaptive SSE Heartbeat started with 15s check interval)");
    };
    /**
     * Start cleanup process for old events and metrics
     */
    /**
     * Determine heartbeat interval based on user activity patterns
     */
    GalloBetsSSEService.prototype.getActiveConnectionHeartbeat = function (userId) {
        // For now, we'll use role-based heartbeat intervals
        // In a real implementation, this would check recent activity patterns
        // Active connections (frequent events) get faster heartbeats
        if (userId) {
            // Could implement logic to check user's recent event subscription activity
            // for now, we'll return based on typical admin/operator activity
            if (['admin', 'operator'].includes(this.getUserRole(userId))) {
                return this.ACTIVE_CONNECTION_HEARTBEAT; // Faster for active users
            }
        }
        // Default for regular users
        return this.IDLE_CONNECTION_HEARTBEAT;
    };
    /**
     * Get user role for heartbeat determination
     * In a real implementation, this would check the cache or database
     */
    GalloBetsSSEService.prototype.getUserRole = function (userId) {
        var _a;
        var cachedUser = this.getCachedUser(userId);
        return ((_a = cachedUser === null || cachedUser === void 0 ? void 0 : cachedUser.user) === null || _a === void 0 ? void 0 : _a.role) || 'user';
    };
    /**
     * Get cached user for role determination
     * This would connect to the auth cache system
     */
    GalloBetsSSEService.prototype.getCachedUser = function (userId) {
        // Placeholder - in real implementation, this would connect to userCache
        // from middleware/auth.ts
        return null;
    };
    GalloBetsSSEService.prototype.startCleanup = function () {
        var _this = this;
        this.cleanupInterval = setInterval(function () {
            // Clean up old event history - apply both time-based and count-based limits
            var now = new Date();
            var cutoffTime = new Date(now.getTime() - _this.EVENT_HISTORY_MAX_AGE); // 5 minutes
            for (var _i = 0, _a = _this.eventHistory.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], channel = _b[0], events = _b[1];
                // Apply time-based filtering
                var filteredEvents = events.filter(function (event) { return event.timestamp > cutoffTime; });
                // Apply count-based filtering if needed
                if (filteredEvents.length > _this.MAX_EVENT_HISTORY) {
                    // Keep only the most recent events
                    filteredEvents = filteredEvents.slice(-_this.MAX_EVENT_HISTORY);
                }
                _this.eventHistory.set(channel, filteredEvents);
            }
            // Reset performance metrics if they get too large
            if (_this.performanceMetrics.eventsSent > 1000000) {
                _this.performanceMetrics.eventsSent = 0;
                _this.performanceMetrics.errorsEncountered = 0;
            }
            logger_1.logger.debug('🧹 SSE Service cleanup completed');
        }, this.CLEANUP_INTERVAL);
    };
    /**
     * Update performance metrics
     */
    GalloBetsSSEService.prototype.updatePerformanceMetrics = function (responseTime) {
        this.performanceMetrics.avgResponseTime =
            (this.performanceMetrics.avgResponseTime * 0.9) + (responseTime * 0.1);
    };
    /**
     * Shutdown service gracefully
     */
    GalloBetsSSEService.prototype.shutdown = function () {
        logger_1.logger.info('🔄 Shutting down SSE Service...');
        clearInterval(this.heartbeatInterval);
        clearInterval(this.cleanupInterval);
        // Close all connections
        for (var _i = 0, _a = this.connections.keys(); _i < _a.length; _i++) {
            var connectionId = _a[_i];
            this.removeConnection(connectionId);
        }
        this.connections.clear();
        this.eventHistory.clear();
        logger_1.logger.info('✅ SSE Service shutdown completed');
    };
    return GalloBetsSSEService;
}());
// Export singleton instance
exports.sseService = new GalloBetsSSEService();
