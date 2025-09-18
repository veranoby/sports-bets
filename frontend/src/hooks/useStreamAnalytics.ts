import { useState, useEffect, useCallback, useRef } from 'react';
import { streamingAPI } from '../services/api';
import { useWebSocket } from '../contexts/WebSocketContext';

interface StreamAnalytics {
  streamId?: string;
  currentViewers: number;
  peakViewers: number;
  averageViewTime: number;
  totalViews: number;
  viewersByRegion: Record<string, number>;
  qualityDistribution: Record<string, number>;
  duration: number;
  bufferRatio: number;
  errorRate: number;
}

interface ViewerEvent {
  eventId: string;
  event: string;
  data?: any;
  timestamp: string;
}

interface UseStreamAnalyticsOptions {
  streamId?: string;
  eventId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  realtime?: boolean;
}

export const useStreamAnalytics = (options: UseStreamAnalyticsOptions = {}) => {
  const {
    streamId,
    eventId,
    autoRefresh = true,
    refreshInterval = 30000,
    realtime = true
  } = options;

  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const { socket, isConnected: wsConnected } = useWebSocket();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventBuffer = useRef<ViewerEvent[]>([]);
  const componentMountedRef = useRef(true); // Track if component is mounted

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (timeRange?: '1h' | '24h' | '7d' | '30d') => {
    if (!componentMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const response = await streamingAPI.getStreamAnalytics(streamId, {
        timeRange: timeRange || '1h'
      });

      if (componentMountedRef.current) {
        setAnalytics(response.data);
      }
    } catch (err: any) {
      if (componentMountedRef.current) {
        setError(err.message || 'Failed to load analytics');
        console.error('Analytics fetch error:', err);
      }
    } finally {
      if (componentMountedRef.current) {
        setLoading(false);
      }
    }
  }, [streamId]);

  // Track viewer event
  const trackEvent = useCallback(async (eventData: {
    event: string;
    data?: any;
  }) => {
    if (!eventId) {
      console.warn('Event ID required for tracking');
      return;
    }

    const viewerEvent: ViewerEvent = {
      eventId,
      event: eventData.event,
      data: eventData.data,
      timestamp: new Date().toISOString()
    };

    try {
      // Buffer events for batch sending if offline
      if (!wsConnected) {
        eventBuffer.current.push(viewerEvent);
        return;
      }

      await streamingAPI.trackViewerEvent(viewerEvent);
    } catch (err) {
      console.error('Event tracking failed:', err);
      // Buffer failed events
      eventBuffer.current.push(viewerEvent);
    }
  }, [eventId, wsConnected]);

  // Send buffered events
  const flushEventBuffer = useCallback(async () => {
    if (eventBuffer.current.length === 0) return;

    const events = [...eventBuffer.current];
    eventBuffer.current = [];

    for (const event of events) {
      try {
        const res = await streamingAPI.trackViewerEvent(event);
        if (!res.success) {
          console.error('Failed to send buffered event:', res.error);
          // Re-buffer failed events
          eventBuffer.current.push(event);
        }
      } catch (err) {
        console.error('Failed to send buffered event:', err);
        // Re-buffer failed events
        eventBuffer.current.push(event);
      }
    }
  }, []);

  // Real-time WebSocket handlers
  useEffect(() => {
    if (!realtime || !socket || !eventId) return;

    const handleAnalyticsUpdate = (data: Partial<StreamAnalytics>) => {
      if (componentMountedRef.current) {
        setAnalytics(prev => prev ? { ...prev, ...data } : null);
      }
    };

    const handleViewerJoin = (data: { userId: string; viewerCount: number }) => {
      if (componentMountedRef.current) {
        setAnalytics(prev => prev ? {
          ...prev,
          currentViewers: data.viewerCount,
          peakViewers: Math.max(prev.peakViewers, data.viewerCount)
        } : null);
      }
    };

    const handleViewerLeave = (data: { userId: string; viewerCount: number }) => {
      if (componentMountedRef.current) {
        setAnalytics(prev => prev ? {
          ...prev,
          currentViewers: data.viewerCount
        } : null);
      }
    };

    const handleQualityChange = (data: { quality: string; viewerCount: number }) => {
      if (componentMountedRef.current) {
        setAnalytics(prev => prev ? {
          ...prev,
          qualityDistribution: {
            ...prev.qualityDistribution,
            [data.quality]: (prev.qualityDistribution[data.quality] || 0) + 1
          }
        } : null);
      }
    };

    const handleStreamStatus = (data: { status: string; duration?: number }) => {
      if (data.duration !== undefined && componentMountedRef.current) {
        setAnalytics(prev => prev ? { ...prev, duration: data.duration } : null);
      }
    };

    const handleConnection = () => {
      if (componentMountedRef.current) {
        setIsConnected(true);
        // Subscribe to stream-specific events
        socket.emit('join_stream', { eventId, streamId });
        // Flush buffered events
        flushEventBuffer();
      }
    };

    const handleDisconnection = () => {
      if (componentMountedRef.current) {
        setIsConnected(false);
      }
    };

    // WebSocket event listeners
    socket.on('connect', handleConnection);
    socket.on('disconnect', handleDisconnection);
    socket.on(`stream:${eventId}:analytics`, handleAnalyticsUpdate);
    socket.on(`stream:${eventId}:viewer_join`, handleViewerJoin);
    socket.on(`stream:${eventId}:viewer_leave`, handleViewerLeave);
    socket.on(`stream:${eventId}:quality_change`, handleQualityChange);
    socket.on(`stream:${eventId}:status`, handleStreamStatus);

    if (socket.connected) {
      handleConnection();
    }

    return () => {
      socket.off('connect', handleConnection);
      socket.off('disconnect', handleDisconnection);
      socket.off(`stream:${eventId}:analytics`, handleAnalyticsUpdate);
      socket.off(`stream:${eventId}:viewer_join`, handleViewerJoin);
      socket.off(`stream:${eventId}:viewer_leave`, handleViewerLeave);
      socket.off(`stream:${eventId}:quality_change`, handleQualityChange);
      socket.off(`stream:${eventId}:status`, handleStreamStatus);
      
      if (eventId) {
        socket.emit('leave_stream', { eventId, streamId });
      }
    };
  }, [socket, eventId, streamId, realtime, flushEventBuffer]);

  // Auto-refresh analytics
  useEffect(() => {
    if (!autoRefresh) return;

    // Initial fetch
    fetchAnalytics();

    // Set up refresh interval
    refreshIntervalRef.current = setInterval(() => {
      fetchAnalytics();
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAnalytics]);

  // Helper methods for common tracking events
  const trackPlay = useCallback(() => trackEvent({ event: 'play' }), [trackEvent]);
  const trackPause = useCallback(() => trackEvent({ event: 'pause' }), [trackEvent]);
  const trackBuffer = useCallback((duration: number) => 
    trackEvent({ event: 'buffer', data: { duration } }), [trackEvent]);
  const trackError = useCallback((error: string) => 
    trackEvent({ event: 'error', data: { error } }), [trackEvent]);
  const trackQualityChange = useCallback((quality: string) => 
    trackEvent({ event: 'quality_change', data: { quality } }), [trackEvent]);
  const trackViewTime = useCallback((seconds: number) => 
    trackEvent({ event: 'view_time', data: { seconds } }), [trackEvent]);

  return {
    // State
    analytics,
    loading,
    error,
    isConnected,
    hasBufferedEvents: eventBuffer.current.length > 0,

    // Methods
    fetchAnalytics,
    trackEvent,
    flushEventBuffer,

    // Common event helpers
    trackPlay,
    trackPause,
    trackBuffer,
    trackError,
    trackQualityChange,
    trackViewTime,

    // Utility
    refresh: () => fetchAnalytics(),
    clearError: () => setError(null),
  };
};

export default useStreamAnalytics;