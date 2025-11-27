import { useState, useEffect, useRef, useCallback } from "react";

// Types should be in a separate file, e.g., frontend/src/types/sse.ts
// For now, defining them here as per the prompt structure.
export interface SSEEvent<T> {
  id: string;
  type: string;
  data: T;
  timestamp: string;
  priority: "low" | "medium" | "high" | "critical";
  metadata?: any;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface SSEChannelState<T> {
  lastEvent: SSEEvent<T> | null;
  status: ConnectionStatus;
  error: Error | null;
}

export type MultiSSEState<T> = Record<string, SSEChannelState<T>>;

const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const MAX_RETRIES = 5;

const useMultiSSE = <T>(
  channels: Record<string, string | null>,
): MultiSSEState<T> => {
  const [states, setStates] = useState<MultiSSEState<T>>(() => {
    const initialState: MultiSSEState<T> = {};
    Object.keys(channels).forEach((key) => {
      initialState[key] = {
        lastEvent: null,
        status: "disconnected",
        error: null,
      };
    });
    return initialState;
  });

  const eventSourcesRef = useRef<Record<string, EventSource>>({});
  const reconnectTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const retryCountsRef = useRef<Record<string, number>>({});

  const connect = useCallback((key: string, url: string) => {
    // Retrieve token for auth
    const token = localStorage.getItem("token");
    if (!token) {
      setStates((prev) => ({
        ...prev,
        [key]: {
          lastEvent: null,
          status: "error",
          error: new Error("Authentication token not found."),
        },
      }));
      return;
    }

    setStates((prev) => ({
      ...prev,
      [key]: { lastEvent: null, status: "connecting", error: null },
    }));

    const fullUrl = `${url}?token=${token}`;
    const es = new EventSource(fullUrl);
    eventSourcesRef.current[key] = es;

    es.onopen = () => {
      console.log(
        `[SSE] Connection established to ${url} for channel [${key}]`,
      );
      retryCountsRef.current[key] = 0;
      setStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], status: "connected", error: null },
      }));
      if (reconnectTimeoutsRef.current[key]) {
        clearTimeout(reconnectTimeoutsRef.current[key]);
      }
    };

    es.onmessage = (event: MessageEvent) => {
      try {
        const parsedData: SSEEvent<T> = JSON.parse(event.data);
        setStates((prev) => ({
          ...prev,
          [key]: { ...prev[key], lastEvent: parsedData },
        }));
      } catch (e) {
        console.error(
          `[SSE] Failed to parse event data for channel [${key}]:`,
          event.data,
        );
      }
    };

    es.onerror = () => {
      console.error(
        `[SSE] Error with connection to ${url} for channel [${key}]. Attempting to reconnect.`,
      );
      es.close();
      setStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], status: "error" },
      }));

      const retryCount = retryCountsRef.current[key] || 0;

      // Check if we've reached the maximum retry attempts
      if (retryCount >= MAX_RETRIES) {
        console.error(
          `[SSE] Max retries reached for ${key}. Stopping reconnection attempts.`,
        );
        return;
      }

      const delay = Math.min(
        MAX_RECONNECT_DELAY,
        1000 * Math.pow(2, retryCount),
      );
      retryCountsRef.current[key] = retryCount + 1;

      console.log(
        `[SSE] Reconnecting channel [${key}] in ${delay}ms... (Retry ${retryCount + 1}/${MAX_RETRIES})`,
      );
      reconnectTimeoutsRef.current[key] = setTimeout(
        () => connect(key, url),
        delay,
      );
    };
  }, []);

  useEffect(() => {
    Object.entries(channels).forEach(([key, url]) => {
      if (url) {
        retryCountsRef.current[key] = 0;
        connect(key, url);
      }
    });

    return () => {
      // Close all EventSource connections
      Object.values(eventSourcesRef.current).forEach((es) => {
        if (es) {
          es.close();
          console.log(`[SSE] Closed connection for channel`);
        }
      });

      // Clear all reconnect timeouts
      Object.values(reconnectTimeoutsRef.current).forEach((timeout) => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });

      // Reset retry counters
      Object.keys(retryCountsRef.current).forEach((key) => {
        retryCountsRef.current[key] = 0;
      });
    };
  }, [channels, connect]);

  return states;
};

export default useMultiSSE;
