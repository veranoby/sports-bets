import { useState, useEffect, useCallback, useRef } from "react";
import { streamingAPI } from "../services/api";
import type { StreamAnalytics, ViewerEvent } from "../types/streaming";

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
    realtime = true,
  } = options;

  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIntervalRef = useRef<number | null>(null);
  const eventBuffer = useRef<ViewerEvent[]>([]);
  const componentMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchAnalytics = useCallback(
    async (timeRange?: "1h" | "24h" | "7d" | "30d") => {
      if (!componentMountedRef.current) return;

      try {
        setLoading(true);
        setError(null);

        const response = await streamingAPI.getStreamAnalytics(streamId, {
          timeRange: timeRange || "1h",
        });

        if (componentMountedRef.current && response.success) {
          setAnalytics(response.data as StreamAnalytics);
        } else if (componentMountedRef.current) {
          setError(response.error || "Failed to load analytics");
        }
      } catch (err: unknown) {
        if (componentMountedRef.current) {
          if (err instanceof Error) {
            setError(err.message || "Failed to load analytics");
          } else {
            setError("Failed to load analytics");
          }
          console.error("Analytics fetch error:", err);
        }
      } finally {
        if (componentMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [streamId],
  );

  const trackEvent = useCallback(
    async (eventData: { event: string; data?: Record<string, unknown> }) => {
      if (!eventId) {
        console.warn("Event ID required for tracking");
        return;
      }

      const viewerEvent: ViewerEvent = {
        eventId,
        event: eventData.event,
        data: eventData.data,
        timestamp: new Date().toISOString(),
      };

      try {
        if (!isConnected) {
          eventBuffer.current.push(viewerEvent);
          return;
        }

        await streamingAPI.trackViewerEvent(viewerEvent);
      } catch (err) {
        console.error("Event tracking failed:", err);
        eventBuffer.current.push(viewerEvent);
      }
    },
    [eventId, isConnected],
  );

  const flushEventBuffer = useCallback(async () => {
    if (eventBuffer.current.length === 0) return;

    const events = [...eventBuffer.current];
    eventBuffer.current = [];

    for (const event of events) {
      try {
        const res = await streamingAPI.trackViewerEvent(event);
        if (!res.success) {
          console.error("Failed to send buffered event:", res.error);
          eventBuffer.current.push(event);
        }
      } catch (err) {
        console.error("Failed to send buffered event:", err);
        eventBuffer.current.push(event);
      }
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    fetchAnalytics();

    const intervalId = setInterval(() => {
      fetchAnalytics();
    }, refreshInterval);

    refreshIntervalRef.current = intervalId as unknown as number;

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAnalytics]);

  const trackPlay = useCallback(
    () => trackEvent({ event: "play" }),
    [trackEvent],
  );
  const trackPause = useCallback(
    () => trackEvent({ event: "pause" }),
    [trackEvent],
  );
  const trackBuffer = useCallback(
    (duration: number) => trackEvent({ event: "buffer", data: { duration } }),
    [trackEvent],
  );
  const trackError = useCallback(
    (error: string) => trackEvent({ event: "error", data: { error } }),
    [trackEvent],
  );
  const trackQualityChange = useCallback(
    (quality: string) =>
      trackEvent({ event: "quality_change", data: { quality } }),
    [trackEvent],
  );
  const trackViewTime = useCallback(
    (seconds: number) => trackEvent({ event: "view_time", data: { seconds } }),
    [trackEvent],
  );

  return {
    analytics,
    loading,
    error,
    hasBufferedEvents: eventBuffer.current.length > 0,
    fetchAnalytics,
    trackEvent,
    flushEventBuffer,
    trackPlay,
    trackPause,
    trackBuffer,
    trackError,
    trackQualityChange,
    trackViewTime,
    refresh: () => fetchAnalytics(),
    clearError: () => setError(null),
  };
};

export default useStreamAnalytics;
