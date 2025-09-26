import { useState, useEffect, useRef, useCallback } from "react";

// As per technical_requirements.event_format
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

interface UseSSEReturn<T> {
  lastEvent: SSEEvent<T> | null;
  status: ConnectionStatus;
  error: Error | null;
  eventSourceInstance: EventSource | null;
  data: T | null;
}

const MAX_RECONNECT_DELAY = 30000; // 30 seconds, as per connection_management

const useSSE = <T>(url: string | null): UseSSEReturn<T> => {
  const [lastEvent, setLastEvent] = useState<SSEEvent<T> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!url) {
      setStatus("disconnected");
      return;
    }

    // Ensure no parallel connections
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Retrieve token for auth
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("error");
      setError(new Error("Authentication token not found."));
      return;
    }

    setStatus("connecting");
    setError(null);

    try {
      // The prompt mentions JWT in headers, but EventSource standard API doesn't support custom headers.
      // The common workaround is to pass the token as a query parameter.
      // Assuming the backend is built to handle this.
      const fullUrl = `${url}?token=${token}`;
      const es = new EventSource(fullUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log(`[SSE] Connection established to ${url}`);
        setStatus("connected");
        retryCountRef.current = 0; // Reset on successful connection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      es.onmessage = (event: MessageEvent) => {
        try {
          const parsedData: SSEEvent<T> = JSON.parse(event.data);
          setLastEvent(parsedData);
          setData(parsedData.data);
        } catch (e) {
          console.error("[SSE] Failed to parse event data:", event.data);
        }
      };

      es.onerror = () => {
        console.error(
          `[SSE] Error with connection to ${url}. Attempting to reconnect.`,
        );
        es.close();
        setStatus("error");

        // Exponential backoff as required
        const delay = Math.min(
          MAX_RECONNECT_DELAY,
          1000 * Math.pow(2, retryCountRef.current),
        );
        retryCountRef.current++;

        console.log(`[SSE] Reconnecting in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    } catch (e) {
      console.error("[SSE] Could not create EventSource:", e);
      setStatus("error");
      setError(e as Error);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        console.log(`[SSE] Closing connection to ${url}`);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect, url]);

  return {
    lastEvent,
    status,
    error,
    eventSourceInstance: eventSourceRef.current,
    data,
  };
};

export default useSSE;
