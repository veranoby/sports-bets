import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

// Interface for the streaming monitoring data
export interface SSEStreamingData {
  connectionCount: number;
  activeBets: number;
  streamStatus: {
    isLive: boolean;
    timestamp: string;
    memory: {
      currentMB: number;
      limitMB: number;
      percentUsed: number;
    };
    database: {
      activeConnections: number;
      availableConnections: number;
      queuedRequests: number;
      totalConnections: number;
      status: string;
    };
  };
}

export interface UseSSEConnectionReturn {
  data: SSEStreamingData | null;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

const useSSEConnection = (): UseSSEConnectionReturn => {
  const { user, token } = useAuth();
  const [data, setData] = useState<SSEStreamingData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const MAX_RECONNECT_DELAY = 30000; // 30 seconds max delay
  const MAX_SSE_RETRIES = 10; // Maximum number of reconnection attempts

  const connect = useCallback(() => {
    if (!user || !token || !mountedRef.current) {
      setIsConnected(false);
      return;
    }

    // Ensure no parallel connections
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Use the new SSE endpoint for streaming monitoring
      const url = `${process.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/sse/streaming?token=${encodeURIComponent(token)}`;
      console.log(`🔄 SSE: Connecting to ${url}`);

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;

        console.log(`✅ SSE: Streaming monitoring connection established`);
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0; // Reset on successful connection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      es.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;

        try {
          // The data should be in event.data directly since our backend sends "data: {json}"
          const parsedData: SSEStreamingData = JSON.parse(event.data);
          setData(parsedData);
          console.log(
            "📈 SSE: Received streaming monitoring data:",
            parsedData,
          );
        } catch (parseError) {
          console.error(
            "❌ SSE: Failed to parse streaming monitoring data:",
            event.data,
            parseError,
          );
          setError(new Error(`Failed to parse SSE data: ${parseError}`));
        }
      };

      es.onerror = () => {
        if (!mountedRef.current) return;

        console.warn(
          "⚠️ SSE: Streaming monitoring connection error. Attempting to reconnect.",
        );
        setIsConnected(false);
        eventSourceRef.current?.close();

        // Check if we've reached the maximum retry attempts
        if (retryCountRef.current >= MAX_SSE_RETRIES) {
          console.error(
            `❌ SSE: Max retries (${MAX_SSE_RETRIES}) reached for streaming monitoring. Stopping reconnection.`,
          );
          setError(
            new Error(`Connection failed after ${MAX_SSE_RETRIES} attempts`),
          );
          return;
        }

        // Exponential backoff for reconnection
        const delay = Math.min(
          MAX_RECONNECT_DELAY,
          1000 * Math.pow(2, retryCountRef.current),
        );
        retryCountRef.current++;

        console.log(
          `🔄 SSE: Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${MAX_SSE_RETRIES})`,
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, delay);
      };
    } catch (e) {
      console.error(
        "❌ SSE: Could not create streaming monitoring EventSource:",
        e,
      );
      setError(e as Error);
      setIsConnected(false);
    }
  }, [user, token]);

  const reconnect = useCallback(() => {
    console.log("🔄 SSE: Manual reconnect requested for streaming monitoring");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    retryCountRef.current = 0; // Reset retry count for manual reconnect
    setIsConnected(false);
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [connect]);

  useEffect(() => {
    if (user && token) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        console.log("🔌 SSE: Closing streaming monitoring connection");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect, user, token]);

  return {
    data,
    isConnected,
    error,
    reconnect,
  };
};

export { useSSEConnection };
export default useSSEConnection;
