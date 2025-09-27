import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from '../contexts/AuthContext';

// Enhanced SSE Event Types matching backend service
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

// Admin Channels matching backend
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

// As per technical_requirements.event_format
export interface SSEEvent<T> {
  id: string;
  type: SSEEventType | string;
  data: T;
  timestamp: string;
  priority: "low" | "medium" | "high" | "critical";
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
  // Enhanced methods
  subscribe: (eventType: SSEEventType, handler: (event: SSEEvent<T>) => void) => () => void;
  subscribeToEvents: (eventHandlers: Partial<Record<SSEEventType, (event: SSEEvent<T>) => void>>) => () => void;
  reconnect: () => void;
}

// Event handler type
export type SSEEventHandler<T> = (event: SSEEvent<T>) => void;

const MAX_RECONNECT_DELAY = 30000; // 30 seconds, as per connection_management

const useSSE = <T>(url: string | null): UseSSEReturn<T> => {
  const { user, token } = useAuth();
  const [lastEvent, setLastEvent] = useState<SSEEvent<T> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const eventHandlersRef = useRef<Map<SSEEventType, Set<SSEEventHandler<T>>>>(new Map());
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!url || !user || !token || !mountedRef.current) {
      setStatus("disconnected");
      return;
    }

    // Ensure no parallel connections
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus("connecting");
    setError(null);

    try {
      // Build SSE URL with auth token matching backend expectations
      const fullUrl = `${url}?token=${encodeURIComponent(token)}`;
      console.log(`🔄 SSE: Connecting to ${fullUrl}`);

      const es = new EventSource(fullUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;

        console.log(`✅ SSE: Connection established to ${url}`);
        setStatus("connected");
        retryCountRef.current = 0; // Reset on successful connection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      es.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;

        try {
          const parsedData: SSEEvent<T> = JSON.parse(event.data);
          setLastEvent(parsedData);
          setData(parsedData.data);

          // Call registered event handlers
          const handlers = eventHandlersRef.current.get(parsedData.type as SSEEventType);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(parsedData);
              } catch (error) {
                console.error(`❌ SSE: Error in event handler for ${parsedData.type}:`, error);
              }
            });
          }

          // Log high priority events
          if (parsedData.priority === 'high' || parsedData.priority === 'critical') {
            console.log(`🔔 SSE: ${parsedData.priority.toUpperCase()} event received:`, parsedData.type);
          }
        } catch (e) {
          console.error("❌ SSE: Failed to parse event data:", event.data);
        }
      };

      // Handle specific event types
      Object.values(SSEEventType).forEach(eventType => {
        es.addEventListener(eventType, (event: any) => {
          if (!mountedRef.current) return;

          try {
            const parsedData: SSEEvent<T> = {
              ...JSON.parse(event.data),
              id: event.lastEventId || 'unknown',
              type: eventType
            };

            setLastEvent(parsedData);
            setData(parsedData.data);

            // Call registered handlers
            const handlers = eventHandlersRef.current.get(eventType);
            handlers?.forEach(handler => {
              try {
                handler(parsedData);
              } catch (error) {
                console.error(`❌ SSE: Error in event handler for ${eventType}:`, error);
              }
            });

          } catch (error) {
            console.error(`❌ SSE: Error parsing ${eventType} event:`, error);
          }
        });
      });

      es.onerror = () => {
        if (!mountedRef.current) return;

        console.warn(`⚠️ SSE: Connection error for ${url}. Attempting to reconnect.`);
        es.close();
        setStatus("error");

        // Exponential backoff as required
        const delay = Math.min(
          MAX_RECONNECT_DELAY,
          1000 * Math.pow(2, retryCountRef.current),
        );
        retryCountRef.current++;

        console.log(`🔄 SSE: Reconnecting in ${delay}ms (attempt ${retryCountRef.current})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, delay);
      };
    } catch (e) {
      console.error("❌ SSE: Could not create EventSource:", e);
      setStatus("error");
      setError(e as Error);
    }
  }, [url, user, token]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    console.log(`🔄 SSE: Manual reconnect requested for ${url}`);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    retryCountRef.current = 0; // Reset retry count for manual reconnect
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [connect, url]);

  // Subscribe to specific event types
  const subscribe = useCallback((eventType: SSEEventType, handler: SSEEventHandler<T>) => {
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set());
    }

    eventHandlersRef.current.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = eventHandlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  // Subscribe to multiple event types at once
  const subscribeToEvents = useCallback((eventHandlers: Partial<Record<SSEEventType, SSEEventHandler<T>>>) => {
    const unsubscribeFunctions = Object.entries(eventHandlers).map(([eventType, handler]) => {
      if (handler) {
        return subscribe(eventType as SSEEventType, handler);
      }
      return () => {};
    });

    // Return function to unsubscribe from all
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe]);

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
        console.log(`🔌 SSE: Closing connection to ${url}`);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect, url, user, token]);

  return {
    lastEvent,
    status,
    error,
    eventSourceInstance: eventSourceRef.current,
    data,
    subscribe,
    subscribeToEvents,
    reconnect,
  };
};

/**
 * Specialized hook for admin-specific SSE connections
 * Automatically determines the appropriate admin channel based on user role
 */
export function useAdminSSE<T = any>(
  specificChannel?: AdminChannel,
  eventFilters?: SSEEventType[]
) {
  const { user } = useAuth();

  // Determine default channel based on user role and current page
  const defaultChannel = specificChannel || AdminChannel.GLOBAL;

  // Only connect if user is admin or operator
  const shouldConnect = user && ['admin', 'operator'].includes(user.role);

  // Build URL for admin SSE endpoint
  const url = shouldConnect
    ? `${process.env.NODE_ENV === 'production' ? 'https://your-production-domain.com' : 'http://localhost:3001'}/api/sse/${defaultChannel}`
    : null;

  const sse = useSSE<T>(url);

  // Filter events if specified
  const filteredEventHandlers = useCallback((eventHandlers: Partial<Record<SSEEventType, SSEEventHandler<T>>>) => {
    if (!eventFilters) return eventHandlers;

    const filtered: Partial<Record<SSEEventType, SSEEventHandler<T>>> = {};
    eventFilters.forEach(eventType => {
      if (eventHandlers[eventType]) {
        filtered[eventType] = eventHandlers[eventType];
      }
    });
    return filtered;
  }, [eventFilters]);

  return {
    ...sse,
    subscribeToEvents: (eventHandlers: Partial<Record<SSEEventType, SSEEventHandler<T>>>) =>
      sse.subscribeToEvents(filteredEventHandlers(eventHandlers)),
    isAdminConnection: shouldConnect,
    channel: defaultChannel
  };
}

/**
 * Hook for fight-specific SSE events
 * Subscribes to fight updates, betting events, and proposals
 */
export function useFightSSE(fightId?: string) {
  const sse = useAdminSSE(AdminChannel.FIGHT_MANAGEMENT, [
    SSEEventType.FIGHT_STATUS_UPDATE,
    SSEEventType.BETTING_WINDOW_OPENED,
    SSEEventType.BETTING_WINDOW_CLOSED,
    SSEEventType.NEW_BET,
    SSEEventType.PAGO_PROPOSAL,
    SSEEventType.DOY_PROPOSAL
  ]);

  const [fightData, setFightData] = useState<any>(null);
  const [bettingWindow, setBettingWindow] = useState<boolean>(false);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    if (sse.status !== 'connected') return;

    const unsubscribers = [
      sse.subscribe(SSEEventType.FIGHT_STATUS_UPDATE, (event) => {
        if (!fightId || event.metadata?.fightId === fightId) {
          setFightData(event.data);
          setBettingWindow(event.data.status === 'betting');
        }
      }),

      sse.subscribe(SSEEventType.BETTING_WINDOW_OPENED, (event) => {
        if (!fightId || event.metadata?.fightId === fightId) {
          setBettingWindow(true);
        }
      }),

      sse.subscribe(SSEEventType.BETTING_WINDOW_CLOSED, (event) => {
        if (!fightId || event.metadata?.fightId === fightId) {
          setBettingWindow(false);
        }
      }),

      sse.subscribe(SSEEventType.PAGO_PROPOSAL, (event) => {
        if (!fightId || event.metadata?.fightId === fightId) {
          setProposals(prev => [...prev, { ...event.data, type: 'PAGO' }]);
        }
      }),

      sse.subscribe(SSEEventType.DOY_PROPOSAL, (event) => {
        if (!fightId || event.metadata?.fightId === fightId) {
          setProposals(prev => [...prev, { ...event.data, type: 'DOY' }]);
        }
      })
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [sse.status, sse.subscribe, fightId]);

  return {
    ...sse,
    fightData,
    bettingWindow,
    proposals,
    clearProposals: () => setProposals([])
  };
}

export default useSSE;
