import { Response } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';

// SSE Event Types for Galleros.Net Admin System
export enum SSEEventType {
  // System Events
  SYSTEM_STATUS = 'SYSTEM_STATUS',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  DATABASE_PERFORMANCE = 'DATABASE_PERFORMANCE',
  STREAM_STATUS_UPDATE = 'STREAM_STATUS_UPDATE',
  NOTIFICATION = 'NOTIFICATION',
  USER_NOTIFICATION = 'USER_NOTIFICATION',

  // Fight Management Events
  FIGHT_STATUS_UPDATE = 'FIGHT_STATUS_UPDATE',
  FIGHT_CREATED = 'FIGHT_CREATED',
  FIGHT_UPDATED = 'FIGHT_UPDATED',
  FIGHT_DELETED = 'FIGHT_DELETED',
  BETTING_WINDOW_OPENED = 'BETTING_WINDOW_OPENED',
  BETTING_WINDOW_CLOSED = 'BETTING_WINDOW_CLOSED',

  // Betting Events
  NEW_BET = 'NEW_BET',
  BET_MATCHED = 'BET_MATCHED',
  BET_CANCELLED = 'BET_CANCELLED',
  PAGO_PROPOSAL = 'PAGO_PROPOSAL',
  DOY_PROPOSAL = 'DOY_PROPOSAL',
  PROPOSAL_ACCEPTED = 'PROPOSAL_ACCEPTED',
  PROPOSAL_REJECTED = 'PROPOSAL_REJECTED',
  PROPOSAL_TIMEOUT = 'PROPOSAL_TIMEOUT',

  // Financial Events
  WALLET_TRANSACTION = 'WALLET_TRANSACTION',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',

  // User Activity Events
  USER_REGISTERED = 'USER_REGISTERED',
  USER_VERIFIED = 'USER_VERIFIED',
  USER_BANNED = 'USER_BANNED',
  ADMIN_ACTION = 'ADMIN_ACTION',

  // Streaming Events
  STREAM_STARTED = 'STREAM_STARTED',
  STREAM_ENDED = 'STREAM_ENDED',
  STREAM_ERROR = 'STREAM_ERROR',
  VIEWER_COUNT_UPDATE = 'VIEWER_COUNT_UPDATE',

  // Connection Events
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  HEARTBEAT = 'HEARTBEAT',
  ERROR = 'ERROR'
}

// SSE Event Data Interface
interface SSEEvent {
  id: string;
  type: SSEEventType;
  data: any;
  timestamp: Date;
  channel?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    userId?: string;
    eventId?: string;
    fightId?: string;
    betId?: string;
    adminId?: string;
    amount?: number;
    streamId?: string;
  };
}

// Connection Quality Metrics Interface
interface ConnectionQuality {
  latency: number;
  lastEventSent: Date;
  eventsPerMinute: number;
}

// Connection Interface with Enhanced Metadata and Activity Tracking
interface SSEConnection {
  id: string;
  res: Response;
  channel: string;
  userId?: string;
  userRole?: string;
  connectedAt: Date;
  lastHeartbeat: Date;
  lastActivity: Date; // Track last activity for adaptive heartbeat
  missedHeartbeats: number; // Track missed heartbeats for auto-disconnect
  heartbeatInterval: number; // Current heartbeat interval for this connection
  connectionQuality: ConnectionQuality;
  isAlive: boolean;
  metadata: {
    userAgent?: string;
    ip?: string;
    eventFilters?: string[];
    fightFilters?: string[];
  };
}

// Admin Channel Types
export enum AdminChannel {
  SYSTEM_MONITORING = 'admin-system',
  FIGHT_MANAGEMENT = 'admin-fights',
  BET_MONITORING = 'admin-bets',
  USER_MANAGEMENT = 'admin-users',
  FINANCIAL_MONITORING = 'admin-finance',
  STREAMING_MONITORING = 'admin-streaming',
  NOTIFICATIONS = 'admin-notifications',
  GLOBAL = 'admin-global'
}

class GallerosNetSSEService {
  private connections: Map<string, SSEConnection> = new Map();
  private eventHistory: Map<string, SSEEvent[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null;
  private cleanupInterval: NodeJS.Timeout | null;

  // Connection tracking for limits
  private connectionsByIp = new Map<string, Set<string>>(); // IP -> Set of connection IDs
  private connectionsByUser = new Map<string, Set<string>>(); // UserId -> Set of connection IDs

  // Constants for connection limits (same as WebSocket)
  private readonly MAX_CONNECTIONS_PER_IP = 5;
  private readonly MAX_CONNECTIONS_PER_USER = 5;

  // Batching buffers and timers
  private eventBatchBuffers: Map<string, {events: SSEEvent[], timer: NodeJS.Timeout | null}> = new Map();

  // Batching Configuration
  private readonly BATCHING_ENABLED = true;
  private readonly HIGH_LOAD_CONNECTION_THRESHOLD = 100;
  private readonly MAX_BATCH_SIZE = 10;
  private readonly BATCHING_WINDOW_MS = 50;

  private performanceMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    eventsSent: 0,
    errorsEncountered: 0,
    avgResponseTime: 0,
    batchedEvents: 0 // Track how many events were batched
  };

  // Configuration
  // Adaptive heartbeat intervals based on connection activity
  private readonly ACTIVE_CONNECTION_HEARTBEAT = 15000; // 15 seconds for active connections
  private readonly IDLE_CONNECTION_HEARTBEAT = 60000;   // 60 seconds for idle connections
  private readonly STALE_CONNECTION_HEARTBEAT = 120000; // 120 seconds for stale connections
  private readonly MAX_MISSED_HEARTBEATS = 3;           // Auto-close after 3 missed heartbeats
  private readonly CONNECTION_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_EVENT_HISTORY = 100; // Max 100 events per channel
  private readonly EVENT_HISTORY_MAX_AGE = 5 * 60 * 1000; // Max age: 5 minutes (300,000 ms)
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes

  // Constants for connection limits (same as WebSocket)
  private readonly MAX_CONNECTIONS_PER_CHANNEL = 2000; // Max connections per channel (supports 2000 concurrent viewers)

  constructor() {
    this.heartbeatInterval = null;
    this.cleanupInterval = null;
    this.startHeartbeat();
    this.startCleanup();
    logger.info('🔄 GallerosNetSSEService initialized');
  }

  /**
   * Add new SSE connection with authentication and channel subscription
   */
  addConnection(
    res: Response,
    channel: string,
    userId?: string,
    userRole?: string,
    metadata?: any
  ): string {
    const connectionId = randomUUID();
    const now = new Date();

    // Extract IP from request if available
    const ip = metadata?.ip || '';

    // Check connection limits before adding new connection
    if (ip) {
      const ipConnections = this.connectionsByIp.get(ip) || new Set();
      if (ipConnections.size >= this.MAX_CONNECTIONS_PER_IP) {
        logger.warn(`IP ${ip} has reached maximum SSE connections limit (${this.MAX_CONNECTIONS_PER_IP})`);
        res.status(429).send(`SSE: Too Many Connections - Maximum ${this.MAX_CONNECTIONS_PER_IP} connections allowed per IP address`);
        throw new Error(`Maximum connections limit reached for IP: ${ip}`);
      }
    }

    if (userId) {
      const userConnections = this.connectionsByUser.get(userId) || new Set();
      if (userConnections.size >= this.MAX_CONNECTIONS_PER_USER) {
        logger.warn(`User ${userId} has reached maximum SSE connections limit (${this.MAX_CONNECTIONS_PER_USER})`);
        res.status(429).send(`SSE: Too Many Connections - Maximum ${this.MAX_CONNECTIONS_PER_USER} connections allowed per user`);
        throw new Error(`Maximum connections limit reached for user: ${userId}`);
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

    const connection: SSEConnection = {
      id: connectionId,
      res,
      channel,
      userId,
      userRole,
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
      const ipConnections = this.connectionsByIp.get(ip) || new Set();
      ipConnections.add(connectionId);
      this.connectionsByIp.set(ip, ipConnections);
    }

    if (userId) {
      const userConnections = this.connectionsByUser.get(userId) || new Set();
      userConnections.add(connectionId);
      this.connectionsByUser.set(userId, userConnections);
    }

    // Send connection established event
    this.sendConnectionEstablished(connectionId);

    // Send recent events for this channel
    this.sendRecentEvents(connectionId, channel);

    logger.info(`📡 SSE connection established: ${connectionId} on channel ${channel} for user ${userId || 'anonymous'}`);

    return connectionId;
  }

  /**
   * Remove SSE connection and cleanup resources
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isAlive = false;

      try {
        if (!connection.res.destroyed) {
          connection.res.end();
        }
      } catch (error) {
        logger.warn(`⚠️ Error closing SSE connection ${connectionId}:`, error);
      }

      // Clean up connection tracking maps
      if (connection.metadata?.ip) {
        const ipConnections = this.connectionsByIp.get(connection.metadata.ip);
        if (ipConnections) {
          ipConnections.delete(connectionId);
          if (ipConnections.size === 0) {
            this.connectionsByIp.delete(connection.metadata.ip);
          } else {
            this.connectionsByIp.set(connection.metadata.ip, ipConnections);
          }
        }
      }

      if (connection.userId) {
        const userConnections = this.connectionsByUser.get(connection.userId);
        if (userConnections) {
          userConnections.delete(connectionId);
          if (userConnections.size === 0) {
            this.connectionsByUser.delete(connection.userId);
          } else {
            this.connectionsByUser.set(connection.userId, userConnections);
          }
        }
      }

      this.connections.delete(connectionId);
      this.performanceMetrics.activeConnections = Math.max(0, this.performanceMetrics.activeConnections - 1);

      // Clean up batching resources for this connection
      this.cleanupBatchResources(connectionId);

      logger.info(`📡 SSE connection removed: ${connectionId} from channel ${connection.channel}`);
    }
  }

  /**
   * Send event to specific client
   */
  // Enhanced sendToClient that also handles connection quality metrics
  sendToClient(connectionId: string, event: SSEEvent): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isAlive || connection.res.destroyed) {
      this.removeConnection(connectionId);
      return false;
    }

    // Check if we should use batching based on load
    if (this.BATCHING_ENABLED && this.shouldUseBatching()) {
      return this.enqueueEventForBatching(connectionId, event);
    }

    try {
      const startTime = Date.now();
      const sseMessage = this.formatSSEMessage(event);

      connection.res.write(sseMessage);
      connection.lastHeartbeat = new Date();
      connection.lastActivity = new Date(); // Also update last activity

      // Update connection quality metrics
      connection.connectionQuality.lastEventSent = new Date();
      connection.connectionQuality.latency = Date.now() - startTime;

      this.performanceMetrics.eventsSent++;
      this.updatePerformanceMetrics(Date.now() - startTime);

      return true;
    } catch (error) {
      logger.error(`❌ Failed to send SSE event to client ${connectionId}:`, error);
      this.performanceMetrics.errorsEncountered++;
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Check if the system is under high load and should use batching
   */
  private shouldUseBatching(): boolean {
    return this.performanceMetrics.activeConnections >= this.HIGH_LOAD_CONNECTION_THRESHOLD;
  }

  /**
   * Add event to batch buffer for specific connection
   */
  private enqueueEventForBatching(connectionId: string, event: SSEEvent): boolean {
    if (!this.eventBatchBuffers.has(connectionId)) {
      this.eventBatchBuffers.set(connectionId, {
        events: [],
        timer: null
      });
    }

    const buffer = this.eventBatchBuffers.get(connectionId)!;
    buffer.events.push(event);

    // If we've reached max batch size, flush immediately
    if (buffer.events.length >= this.MAX_BATCH_SIZE) {
      this.flushBatch(connectionId);
      return true;
    }

    // Set timer to flush batch after window if not already set
    if (!buffer.timer) {
      buffer.timer = setTimeout(() => {
        this.flushBatch(connectionId);
      }, this.BATCHING_WINDOW_MS);
    }

    return true;
  }

  /**
   * Flush all events in the batch for a connection
   */
  private flushBatch(connectionId: string): void {
    const buffer = this.eventBatchBuffers.get(connectionId);
    if (!buffer) return;

    if (buffer.timer) {
      clearTimeout(buffer.timer);
      buffer.timer = null;
    }

    if (buffer.events.length > 0) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.isAlive && !connection.res.destroyed) {
        try {
          const startTime = Date.now();

          // Combine events into a batch message
          const batchEvent: SSEEvent = {
            id: randomUUID(),
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

          const sseMessage = this.formatSSEMessage(batchEvent);
          connection.res.write(sseMessage);

          connection.lastHeartbeat = new Date();
          connection.lastActivity = new Date();

          // Update metrics
          this.performanceMetrics.eventsSent += buffer.events.length;
          this.performanceMetrics.batchedEvents += buffer.events.length;

          // Update connection quality metrics
          connection.connectionQuality.lastEventSent = new Date();
          connection.connectionQuality.latency = Date.now() - startTime;
        } catch (error) {
          logger.error(`❌ Failed to send batched SSE events to client ${connectionId}:`, error);
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
  }

  /**
   * Clean up batching resources when connection is removed
   */
  private cleanupBatchResources(connectionId: string): void {
    const buffer = this.eventBatchBuffers.get(connectionId);
    if (buffer && buffer.timer) {
      clearTimeout(buffer.timer);
    }
    this.eventBatchBuffers.delete(connectionId);
  }

  /**
   * Broadcast event to all connections in a channel
   */
  broadcastToChannel(channel: string, event: SSEEvent): number {
    let successCount = 0;
    const targetConnections = Array.from(this.connections.values())
      .filter(conn => conn.channel === channel && conn.isAlive);

    for (const connection of targetConnections) {
      if (this.sendToClient(connection.id, event)) {
        successCount++;
      }
    }

    // Store event in history for late joiners
    this.addToEventHistory(channel, event);

    logger.debug(`📡 Broadcasted ${event.type} to ${successCount}/${targetConnections.length} connections in channel ${channel}`);
    return successCount;
  }

  /**
   * Broadcast to all admin channels
   */
  broadcastToAllAdmin(event: SSEEvent): number {
    const adminChannels = Object.values(AdminChannel);
    let totalSent = 0;

    for (const channel of adminChannels) {
      totalSent += this.broadcastToChannel(channel, event);
    }

    return totalSent;
  }

  /**
   * Send event to specific admin channel with role-based filtering
   */
  sendToAdminChannel(channel: AdminChannel, event: SSEEvent, requiredRole?: string): number {
    let successCount = 0;
    const targetConnections = Array.from(this.connections.values())
      .filter(conn =>
        conn.channel === channel &&
        conn.isAlive &&
        (!requiredRole || conn.userRole === requiredRole)
      );

    for (const connection of targetConnections) {
      if (this.sendToClient(connection.id, event)) {
        successCount++;
      }
    }

    this.addToEventHistory(channel, event);
    return successCount;
  }

  /**
   * Create and broadcast fight status update
   */
  broadcastFightUpdate(fightId: string, status: string, data: any): void {
    const event: SSEEvent = {
      id: randomUUID(),
      type: SSEEventType.FIGHT_STATUS_UPDATE,
      data: {
        fightId,
        status,
        ...data
      },
      timestamp: new Date(),
      priority: 'high',
      metadata: { fightId }
    };

    this.sendToAdminChannel(AdminChannel.FIGHT_MANAGEMENT, event);
    this.sendToAdminChannel(AdminChannel.GLOBAL, event);
  }

  /**
   * Create and broadcast betting event
   */
  broadcastBettingEvent(type: SSEEventType, betData: any): void {
    const event: SSEEvent = {
      id: randomUUID(),
      type,
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
  }

  /**
   * Create and broadcast PAGO/DOY proposal events
   */
  broadcastProposalEvent(
    type: 'PAGO' | 'DOY',
    action: 'CREATED' | 'ACCEPTED' | 'REJECTED' | 'TIMEOUT',
    proposalData: any
  ): void {
    const eventType = type === 'PAGO' ? SSEEventType.PAGO_PROPOSAL : SSEEventType.DOY_PROPOSAL;

    const event: SSEEvent = {
      id: randomUUID(),
      type: eventType,
      data: {
        action,
        ...proposalData,
        expiresAt: new Date(Date.now() + 180000) // 3 minutes timeout
      },
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
  }

  /**
   * Broadcast system monitoring events
   */
  broadcastSystemEvent(type: SSEEventType, data: any, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const event: SSEEvent = {
      id: randomUUID(),
      type,
      data,
      timestamp: new Date(),
      priority
    };

    this.sendToAdminChannel(AdminChannel.SYSTEM_MONITORING, event);
    if (priority === 'critical') {
      this.sendToAdminChannel(AdminChannel.GLOBAL, event);
    }
  }

  /**
   * Get connection statistics for monitoring
   */
  getConnectionStats(): any {
    const connectionsByChannel: Record<string, number> = {};
    const connectionsByRole: Record<string, number> = {};

    for (const conn of this.connections.values()) {
      if (conn.isAlive) {
        connectionsByChannel[conn.channel] = (connectionsByChannel[conn.channel] || 0) + 1;
        connectionsByRole[conn.userRole || 'anonymous'] = (connectionsByRole[conn.userRole || 'anonymous'] || 0) + 1;
      }
    }

    return {
      ...this.performanceMetrics,
      connectionsByChannel,
      connectionsByRole,
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  /**
   * Send connection established event
   */
  private sendConnectionEstablished(connectionId: string): void {
    const event: SSEEvent = {
      id: randomUUID(),
      type: SSEEventType.CONNECTION_ESTABLISHED,
      data: {
        connectionId,
        message: 'SSE connection established successfully',
        serverTime: new Date(),
        heartbeatInterval: this.ACTIVE_CONNECTION_HEARTBEAT
      },
      timestamp: new Date(),
      priority: 'low'
    };

    this.sendToClient(connectionId, event);
  }

  /**
   * Send recent events to newly connected client
   */
  private sendRecentEvents(connectionId: string, channel: string): void {
    const recentEvents = this.eventHistory.get(channel);
    if (recentEvents && recentEvents.length > 0) {
      // Send last 10 events
      const eventsToSend = recentEvents.slice(-10);
      for (const event of eventsToSend) {
        this.sendToClient(connectionId, event);
      }
    }
  }

  /**
   * Format SSE message according to specification
   */
  private formatSSEMessage(event: SSEEvent): string {
    let message = '';

    if (event.id) {
      message += `id: ${event.id}\n`;
    }

    message += `event: ${event.type}\n`;
    message += `data: ${JSON.stringify({
      ...event.data,
      timestamp: event.timestamp,
      priority: event.priority,
      metadata: event.metadata
    })}\n\n`;

    return message;
  }

  /**
   * Add event to history for late joiners
   */
  private addToEventHistory(channel: string, event: SSEEvent): void {
    if (!this.eventHistory.has(channel)) {
      this.eventHistory.set(channel, []);
    }

    const channelHistory = this.eventHistory.get(channel)!;
    channelHistory.push(event);

    // Clean up expired events (time-based limit)
    const now = Date.now();
    const cutoffTime = now - this.EVENT_HISTORY_MAX_AGE;
    const validEvents = channelHistory.filter(item => item.timestamp.getTime() > cutoffTime);

    // Apply count-based limit
    if (validEvents.length > this.MAX_EVENT_HISTORY) {
      // Keep only the most recent events up to the limit
      validEvents.splice(0, validEvents.length - this.MAX_EVENT_HISTORY);
    }

    // Update the history with cleaned events
    this.eventHistory.set(channel, validEvents);
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    // For adaptive heartbeat, we'll update each connection individually
    // Instead of using a single interval, we'll manage heartbeats per connection
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();

      for (const [connectionId, connection] of this.connections.entries()) {
        // Check if it's time to send heartbeat for this specific connection
        const timeSinceLastHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();

        // If it's time to send heartbeat based on this connection's interval
        if (timeSinceLastHeartbeat >= connection.heartbeatInterval) {
          const heartbeatEvent: SSEEvent = {
            id: randomUUID(),
            type: SSEEventType.HEARTBEAT,
            data: {
              serverTime: now,
              connectionId,
              heartbeatInterval: connection.heartbeatInterval,
              missedHeartbeats: connection.missedHeartbeats
            },
            timestamp: now,
            priority: 'low'
          };

          if (connection.isAlive) {
            // Update heartbeat stats before sending
            connection.lastHeartbeat = now;

            if (!this.sendToClient(connectionId, heartbeatEvent)) {
              // If sending failed, increment missed heartbeat counter
              connection.missedHeartbeats++;

              // Check if we've missed too many heartbeats
              if (connection.missedHeartbeats >= this.MAX_MISSED_HEARTBEATS) {
                logger.warn(`⚠️ Connection ${connectionId} missed ${connection.missedHeartbeats} heartbeats, removing`);
                this.removeConnection(connectionId);
              }
            } else {
              // Reset missed heartbeat counter if heartbeat sent successfully
              connection.missedHeartbeats = 0;
            }
          }
        }

        // Check connection timeout regardless of heartbeat interval
        const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime();
        if (timeSinceLastActivity > this.CONNECTION_TIMEOUT) {
          logger.warn(`⚠️ Connection ${connectionId} timed out (inactive for ${timeSinceLastActivity}ms), removing`);
          this.removeConnection(connectionId);
        }
      }
    }, 15000); // Check all connections every 15 seconds, but send individual heartbeats based on their intervals

    logger.info(`❤️ Adaptive SSE Heartbeat started with 15s check interval)`);
  }

  /**
   * Start cleanup process for old events and metrics
   */
  /**
   * Determine heartbeat interval based on user activity patterns
   */
  private getActiveConnectionHeartbeat(userId?: string): number {
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
  }

  /**
   * Get user role for heartbeat determination
   * In a real implementation, this would check the cache or database
   */
  private getUserRole(userId: string): string {
    const cachedUser = this.getCachedUser(userId);
    return cachedUser?.user?.role || 'user';
  }

  /**
   * Get cached user for role determination
   * This would connect to the auth cache system
   */
  private getCachedUser(userId: string): any {
    // Placeholder - in real implementation, this would connect to userCache
    // from middleware/auth.ts
    return null;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // Clean up old event history - apply both time-based and count-based limits
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - this.EVENT_HISTORY_MAX_AGE); // 5 minutes

      for (const [channel, events] of this.eventHistory.entries()) {
        // Apply time-based filtering
        let filteredEvents = events.filter(event => event.timestamp > cutoffTime);

        // Apply count-based filtering if needed
        if (filteredEvents.length > this.MAX_EVENT_HISTORY) {
          // Keep only the most recent events
          filteredEvents = filteredEvents.slice(-this.MAX_EVENT_HISTORY);
        }

        this.eventHistory.set(channel, filteredEvents);
      }

      // Reset performance metrics if they get too large
      if (this.performanceMetrics.eventsSent > 1000000) {
        this.performanceMetrics.eventsSent = 0;
        this.performanceMetrics.errorsEncountered = 0;
      }

      logger.debug('🧹 SSE Service cleanup completed');
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(responseTime: number): void {
    this.performanceMetrics.avgResponseTime =
      (this.performanceMetrics.avgResponseTime * 0.9) + (responseTime * 0.1);
  }

  /**
   * Shutdown service gracefully
   */
  /**
   * Broadcast event to a specific event channel
   */
  broadcastToEvent(eventId: string, event: SSEEvent): number {
    const channel = `event-${eventId}`;
    return this.broadcastToChannel(channel, event);
  }

  /**
   * Add connection to a specific event channel
   */
  addEventConnection(
    res: Response,
    eventId: string,
    userId?: string,
    userRole?: string,
    metadata?: any
  ): string {
    const channel = `event-${eventId}`;
    return this.addConnection(res, channel, userId, userRole, metadata);
  }

  /**
   * Broadcast event to system monitoring channels
   */
  broadcastToSystem(eventType: string, data: any): void {
    const systemEvent: SSEEvent = {
      id: randomUUID(),
      type: SSEEventType[eventType as keyof typeof SSEEventType] || SSEEventType.NOTIFICATION,
      data,
      timestamp: new Date(),
      priority: 'medium',
      metadata: data.metadata || {}
    };

    this.sendToAdminChannel(AdminChannel.SYSTEM_MONITORING, systemEvent);
  }

  shutdown(): void {
    logger.info('🔄 Shutting down SSE Service...');

    clearInterval(this.heartbeatInterval);
    clearInterval(this.cleanupInterval);

    // Close all connections
    for (const connectionId of this.connections.keys()) {
      this.removeConnection(connectionId);
    }

    this.connections.clear();
    this.eventHistory.clear();

    logger.info('✅ SSE Service shutdown completed');
  }
}

// Export singleton instance
export const sseService = new GallerosNetSSEService();

// Export types for use in other modules
export type { SSEConnection, SSEEvent };