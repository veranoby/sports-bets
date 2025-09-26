import { Response } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';

// SSE Event Types for GalloBets Admin System
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

// Connection Interface with Enhanced Metadata
interface SSEConnection {
  id: string;
  res: Response;
  channel: string;
  userId?: string;
  userRole?: string;
  connectedAt: Date;
  lastHeartbeat: Date;
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

class GalloBetsSSEService {
  private connections: Map<string, SSEConnection> = new Map();
  private eventHistory: Map<string, SSEEvent[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout;
  private cleanupInterval: NodeJS.Timeout;
  private performanceMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    eventsSent: 0,
    errorsEncountered: 0,
    avgResponseTime: 0
  };

  // Configuration
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_EVENT_HISTORY = 100;
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes

  constructor() {
    this.startHeartbeat();
    this.startCleanup();
    logger.info('🔄 GalloBetsSSEService initialized');
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
      isAlive: true,
      metadata: metadata || {}
    };

    this.connections.set(connectionId, connection);
    this.performanceMetrics.totalConnections++;
    this.performanceMetrics.activeConnections++;

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

      this.connections.delete(connectionId);
      this.performanceMetrics.activeConnections = Math.max(0, this.performanceMetrics.activeConnections - 1);

      logger.info(`📡 SSE connection removed: ${connectionId} from channel ${connection.channel}`);
    }
  }

  /**
   * Send event to specific client
   */
  sendToClient(connectionId: string, event: SSEEvent): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isAlive || connection.res.destroyed) {
      this.removeConnection(connectionId);
      return false;
    }

    try {
      const startTime = Date.now();
      const sseMessage = this.formatSSEMessage(event);

      connection.res.write(sseMessage);
      connection.lastHeartbeat = new Date();

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
        heartbeatInterval: this.HEARTBEAT_INTERVAL
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

    // Keep only recent events
    if (channelHistory.length > this.MAX_EVENT_HISTORY) {
      channelHistory.splice(0, channelHistory.length - this.MAX_EVENT_HISTORY);
    }
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const heartbeatEvent: SSEEvent = {
        id: randomUUID(),
        type: SSEEventType.HEARTBEAT,
        data: { serverTime: now },
        timestamp: now,
        priority: 'low'
      };

      for (const [connectionId, connection] of this.connections.entries()) {
        const timeSinceLastHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();

        if (timeSinceLastHeartbeat > this.CONNECTION_TIMEOUT) {
          logger.warn(`⚠️ Connection ${connectionId} timed out, removing`);
          this.removeConnection(connectionId);
        } else if (connection.isAlive) {
          this.sendToClient(connectionId, heartbeatEvent);
        }
      }
    }, this.HEARTBEAT_INTERVAL);

    logger.info(`❤️ SSE Heartbeat started (${this.HEARTBEAT_INTERVAL}ms interval)`);
  }

  /**
   * Start cleanup process for old events and metrics
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // Clean up old event history
      const cutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours

      for (const [channel, events] of this.eventHistory.entries()) {
        const filteredEvents = events.filter(event => event.timestamp > cutoff);
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
export const sseService = new GalloBetsSSEService();

// Export types for use in other modules
export type { SSEConnection, SSEEvent };