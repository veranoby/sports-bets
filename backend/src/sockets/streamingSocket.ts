import { Server, Socket } from 'socket.io';
import { rtmpService } from '../services/rtmpService';
import jwt from 'jsonwebtoken';
import { EventConnection } from '../models';
import { SafetyLimits } from '../utils/safetyLimits';
import { DatabaseOptimizer } from '../services/databaseOptimizer';

const trackConnection = async (eventId: string, userId: string) => {
  try {
    const connection = await EventConnection.create({
      event_id: parseInt(eventId),
      user_id: parseInt(userId),
      connected_at: new Date()
    });
    return connection.id;
  } catch (error) {
    console.error('Error tracking connection:', error);
    return null;
  }
};

const trackDisconnection = async (connectionId: number) => {
  try {
    const connection = await EventConnection.findByPk(connectionId);
    if (connection) {
      const disconnectedAt = new Date();
      const duration = Math.floor((disconnectedAt.getTime() - new Date(connection.connected_at).getTime()) / 1000);
      
      await connection.update({
        disconnected_at: disconnectedAt,
        duration_seconds: duration
      });
    }
  } catch (error) {
    console.error('Error tracking disconnection:', error);
  }
};

interface StreamSocketData {
  userId?: string;
  eventId?: string;
  streamId?: string;
  role?: string;
}

// Store active viewer connections
const activeViewers = new Map<string, {
  socketId: string;
  userId: string;
  eventId: string;
  streamId?: string;
  joinedAt: Date;
  lastActivity: Date;
  connectionId?: number;
}>();

export const setupStreamingSocket = (io: Server) => {
  // Register shutdown handler for cleanup
  SafetyLimits.registerShutdownHandler(() => {
    console.log('Cleaning up streaming sockets...');
    // Any additional cleanup logic can go here
  });
  // Middleware for stream authentication
  io.of('/stream').use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Attach user data to socket
      socket.data = {
        userId: decoded.userId,
        eventId: decoded.eventId,
        streamId: decoded.streamId,
        role: decoded.role || 'viewer'
      } as StreamSocketData;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Handle streaming namespace connections
  io.of('/stream').on('connection', async (socket) => {
    const { userId, eventId, streamId, role } = socket.data as StreamSocketData;
    
    console.log(`Stream viewer connected: ${userId} for event ${eventId}`);

    // Join viewer to event room
    if (eventId) {
      socket.join(`event:${eventId}`);
      
      if (streamId) {
        socket.join(`stream:${streamId}`);
      }
    }

    // Track viewer join using DatabaseOptimizer
    if (userId && eventId) {
      const connectionId = await trackConnection(eventId, userId);
      activeViewers.set(socket.id, {
        socketId: socket.id,
        userId,
        eventId,
        streamId,
        joinedAt: new Date(),
        lastActivity: new Date(),
        connectionId
      });

      // Queue analytics event for batch processing
      DatabaseOptimizer.queueAnalyticsEvent({
        event_id: parseInt(eventId),
        user_id: parseInt(userId),
        session_id: socket.id,
        connected_at: new Date(),
        ip_address: socket.handshake.address,
        user_agent: socket.handshake.headers['user-agent']
      });
    }

    // Handle analytics events from client
    socket.on('analytics_event', async (data: {
      event: string;
      data?: any;
      timestamp?: string;
    }) => {
      try {
        if (!eventId || !userId) return;

        await rtmpService.trackViewerEvent({
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
      } catch (error) {
        console.error('Failed to track analytics event:', error);
      }
    });

    // Handle join specific stream
    socket.on('join_stream', (data: { eventId: string; streamId?: string }) => {
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
    socket.on('leave_stream', (data: { eventId: string; streamId?: string }) => {
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
    socket.on('quality_change', (data: { quality: string }) => {
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
    socket.on('performance_metric', (data: {
      metric: 'buffer' | 'error' | 'quality';
      value: any;
      timestamp?: string;
    }) => {
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
    socket.on('disconnect', async (reason) => {
      console.log(`Stream viewer disconnected: ${userId} - ${reason}`);

      const viewer = activeViewers.get(socket.id);
      if (viewer) {
        if (viewer.connectionId) {
          await trackDisconnection(viewer.connectionId);
        }
        const watchTime = Date.now() - viewer.joinedAt.getTime();

        // Track viewer leave
        if (eventId) {
          try {
            await rtmpService.trackViewerLeave({
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
          } catch (error) {
            console.warn('Failed to track viewer leave:', error);
          }
        }

        // Remove from active viewers
        activeViewers.delete(socket.id);
      }
    });
  });

  // Admin/Operator namespace for streaming controls
  io.of('/stream-control').use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check if user has operator or admin role
      if (!['admin', 'operator'].includes(decoded.role)) {
        return next(new Error('Insufficient permissions'));
      }

      socket.data = {
        userId: decoded.userId,
        role: decoded.role
      };

      next();
    } catch (error) {
      console.error('Stream control socket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Handle streaming control connections (for operators/admins)
  io.of('/stream-control').on('connection', (socket) => {
    const { userId, role } = socket.data as StreamSocketData;
    
    console.log(`Stream control connected: ${userId} (${role})`);

    // Join control room
    socket.join('stream_control');

    // Handle stream start events
    socket.on('stream_started', (data: {
      streamId: string;
      eventId: string;
      operatorId: string;
    }) => {
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
    socket.on('stream_stopped', (data: {
      streamId: string;
      eventId: string;
      duration: number;
      viewerCount: number;
    }) => {
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
    socket.on('request_analytics', (data: { eventId?: string; streamId?: string }) => {
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
    socket.on('request_system_status', async () => {
      try {
        const status = await rtmpService.getSystemStatus();
        socket.emit('system_status_update', {
          ...status,
          activeConnections: activeViewers.size,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to get system status:', error);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`Stream control disconnected: ${userId} - ${reason}`);
    });
  });

  // Periodic cleanup of inactive viewers using SafetyLimits
  const cleanupInterval = SafetyLimits.createSafeInterval(() => {
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
  }, 60 * 1000, 3, 'inactive_viewer_cleanup'); // Run every minute, max 3 errors

  // Periodic analytics broadcast using SafetyLimits
  const analyticsInterval = SafetyLimits.createSafeInterval(async () => {
    try {
      // Group viewers by event
      const viewersByEvent = new Map<string, any[]>();
      
      for (const viewer of activeViewers.values()) {
        if (!viewersByEvent.has(viewer.eventId)) {
          viewersByEvent.set(viewer.eventId, []);
        }
        viewersByEvent.get(viewer.eventId)!.push(viewer);
      }

      // Broadcast analytics updates for each active event
      for (const [eventId, viewers] of viewersByEvent.entries()) {
        const analytics = {
          eventId,
          currentViewers: viewers.length,
          viewersByRegion: {}, // Would be calculated from IP data
          recentActivity: viewers.filter(v => 
            Date.now() - v.lastActivity.getTime() < 60000 // Active in last minute
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
    } catch (error) {
      console.error('Failed to broadcast periodic analytics:', error);
    }
  }, 10 * 1000, 3, 'periodic_analytics_broadcast'); // Every 10 seconds, max 3 errors
};

export default setupStreamingSocket;