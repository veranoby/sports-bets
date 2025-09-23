import { useState, useEffect, useRef } from "react";

interface SSEOptions {
  reconnectTime?: number; // Time in ms to wait before reconnecting
  maxRetries?: number; // Max number of retries
}

interface SSEReturn<T> {
  data: T | null;
  isConnected: boolean;
  error: Error | null;
}

const useSSE = <T>(
  endpoint: string,
  options: SSEOptions = {},
): SSEReturn<T> => {
  const {
    reconnectTime = 3000, // Default 3 seconds
    maxRetries = 5,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      setError(null);

      try {
        const eventSource = new EventSource(endpoint, {
          withCredentials: true,
        });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (!isMounted) return;
          console.log(`SSE connection opened to ${endpoint}`);
          setIsConnected(true);
          retryCountRef.current = 0; // Reset retries on successful connection
        };

        eventSource.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
          } catch (e) {
            console.error("Failed to parse SSE message data:", e);
            setError(new Error("Failed to parse SSE message data"));
          }
        };

        eventSource.onerror = (err) => {
          if (!isMounted) return;
          console.error(`SSE error on ${endpoint}:`, err);
          setIsConnected(false);
          eventSource.close();

          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            console.log(
              `SSE reconnecting in ${reconnectTime}ms (attempt ${retryCountRef.current}/${maxRetries})`,
            );
            setTimeout(connect, reconnectTime);
          } else {
            console.error(`SSE max retries reached for ${endpoint}`);
            setError(new Error("SSE connection failed after max retries"));
          }
        };
      } catch (e) {
        if (!isMounted) return;
        console.error("Could not create EventSource:", e);
        setError(e as Error);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        console.log(`Closing SSE connection to ${endpoint}`);
        eventSourceRef.current.close();
      }
    };
  }, [endpoint, reconnectTime, maxRetries]);

  return { data, isConnected, error };
};

export default useSSE;
