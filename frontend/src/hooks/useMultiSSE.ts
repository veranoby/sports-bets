import { useState, useEffect, useRef, useCallback } from 'react';

// Types should be in a separate file, e.g., frontend/src/types/sse.ts
// For now, defining them here as per the prompt structure.
export interface SSEEvent<T> {
  id: string;
  type: string;
  data: T;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SSEChannelState<T> {
  lastEvent: SSEEvent<T> | null;
  status: ConnectionStatus;
  error: Error | null;
}

export type MultiSSEState<T> = Record<string, SSEChannelState<T>>;

const MAX_RECONNECT_DELAY = 30000; // 30 seconds

const useMultiSSE = <T>(channels: Record<string, string | null>): MultiSSEState<T> => {
  const [states, setStates] = useState<MultiSSEState<T>>(() => {
    const initialState: MultiSSEState<T> = {};
    Object.keys(channels).forEach(key => {
      initialState[key] = { lastEvent: null, status: 'disconnected', error: null };
    });
    return initialState;
  });

  const eventSourcesRef = useRef<Record<string, EventSource>>({});
  const reconnectTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const retryCountsRef = useRef<Record<string, number>>({});

  const connect = useCallback((key: string, url: string) => {
    // Retrieve token for auth
    const token = localStorage.getItem('token');
    if (!token) {
      setStates(prev => ({ ...prev, [key]: { lastEvent: null, status: 'error', error: new Error('Authentication token not found.') } }));
      return;
    }

    setStates(prev => ({ ...prev, [key]: { lastEvent: null, status: 'connecting', error: null } }));

    const fullUrl = `${url}?token=${token}`;
    const es = new EventSource(fullUrl);
    eventSourcesRef.current[key] = es;

    es.onopen = () => {
      console.log(`[SSE] Connection established to ${url} for channel [${key}]`);
      retryCountsRef.current[key] = 0;
      setStates(prev => ({ ...prev, [key]: { ...prev[key], status: 'connected', error: null } }));
      if (reconnectTimeoutsRef.current[key]) {
        clearTimeout(reconnectTimeoutsRef.current[key]);
      }
    };

    es.onmessage = (event: MessageEvent) => {
      try {
        const parsedData: SSEEvent<T> = JSON.parse(event.data);
        setStates(prev => ({ ...prev, [key]: { ...prev[key], lastEvent: parsedData } }));
      } catch (e) {
        console.error(`[SSE] Failed to parse event data for channel [${key}]:`, event.data);
      }
    };

    es.onerror = () => {
      console.error(`[SSE] Error with connection to ${url} for channel [${key}]. Attempting to reconnect.`);
      es.close();
      setStates(prev => ({ ...prev, [key]: { ...prev[key], status: 'error' } }));

      const retryCount = retryCountsRef.current[key] || 0;
      const delay = Math.min(MAX_RECONNECT_DELAY, 1000 * Math.pow(2, retryCount));
      retryCountsRef.current[key] = retryCount + 1;

      console.log(`[SSE] Reconnecting channel [${key}] in ${delay}ms...`);
      reconnectTimeoutsRef.current[key] = setTimeout(() => connect(key, url), delay);
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
      Object.values(eventSourcesRef.current).forEach(es => es.close());
      Object.values(reconnectTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [channels, connect]);

  return states;
};

export default useMultiSSE;