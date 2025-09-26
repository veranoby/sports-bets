// frontend/src/contexts/WebSocketContext.tsx - RESTRICTED TO BETTING ONLY
// ========================================================================
//
// ⚠️  USAGE RESTRICTION: This WebSocket context is ONLY for betting features
// - PAGO/DOY bet proposals and responses
// - Real-time betting workflows requiring bidirectional communication
// - Betting timeouts and notifications
//
// 🚫 DO NOT USE FOR:
// - Admin notifications (use SSE instead)
// - Event status updates (use SSE instead)
// - System monitoring (use SSE instead)
// - General real-time updates (use SSE instead)
//
// ✅ ALLOWED USAGE:
// - components/betting/* components
// - pages/user/Bets.tsx
// - Betting-related real-time interactions
// ==================================================================

import React, {
  createContext,
  useContext,
  type ReactNode,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface WebSocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  isConnecting: boolean;
  emit: (event: string, data?: unknown) => boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  addListener: (
    event: string,
    handler: (data: unknown) => void,
    componentId?: string,
  ) => () => void;
  getListenerStats: () => {
    totalEvents: number;
    totalListeners: number;
    events: Record<string, number>;
  };
  cleanupOrphanedListeners: () => number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// 🏭 CONFIGURACIÓN
const MAX_LISTENERS_PER_EVENT = 10;
const MAX_TOTAL_EVENTS = 50;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutos
const MAX_CLEANUP_ATTEMPTS = 3; // Prevent infinite cleanup loops

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const { isAuthenticated, token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Referencias estables
  const socketRef = useRef<Socket | null>(null);
  const pendingRoomsRef = useRef<Set<string>>(new Set());
  const connectionPromiseRef = useRef<Promise<void> | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupAttemptsRef = useRef(0); // Track cleanup attempts

  // ✅ REGISTRY OPTIMIZED
  const listenersRegistryRef = useRef<
    Map<
      string,
      Map<
        (...args: unknown[]) => void,
        {
          addedAt: number;
          componentId?: string;
        }
      >
    >
  >(new Map());

  // 🧹 FUNCTION TO CLEAN UP ORPHANED LISTENERS
  const cleanupOrphanedListeners = useCallback(() => {
    if (!socketRef.current) return 0;

    // Prevent infinite cleanup loops
    if (cleanupAttemptsRef.current >= MAX_CLEANUP_ATTEMPTS) {
      console.warn("⚠️ WebSocket: Max cleanup attempts reached, stopping");
      return 0;
    }

    const cutoffTime = Date.now() - 10 * 60 * 1000; // 10 minutos
    let cleanedCount = 0;

    listenersRegistryRef.current.forEach((eventListeners, event) => {
      const listenersToRemove: ((...args: unknown[]) => void)[] = [];

      eventListeners.forEach((metadata, handler) => {
        if (metadata.addedAt < cutoffTime) {
          listenersToRemove.push(handler);
          cleanedCount++;
        }
      });

      listenersToRemove.forEach((handler) => {
        socketRef.current?.off(event, handler);
        eventListeners.delete(handler);
      });

      if (eventListeners.size === 0) {
        listenersRegistryRef.current.delete(event);
      }
    });

    if (cleanedCount > 0) {
      console.log(
        `🧹 WebSocket: Cleaned up ${cleanedCount} orphaned listeners`,
      );
      cleanupAttemptsRef.current++; // Increment attempts
    } else {
      cleanupAttemptsRef.current = 0; // Reset if nothing to clean
    }

    return cleanedCount;
  }, []);

  // 📊 LISTENER STATISTICS
  const getListenerStats = useCallback(() => {
    const events: Record<string, number> = {};
    let totalListeners = 0;

    listenersRegistryRef.current.forEach((eventListeners, event) => {
      events[event] = eventListeners.size;
      totalListeners += eventListeners.size;
    });

    return {
      totalEvents: listenersRegistryRef.current.size,
      totalListeners,
      events,
    };
  }, []);

  // 🎧 ADD LISTENER WITH LIMITS
  const addListener = useCallback(
    (event: string, handler: (data: unknown) => void, componentId?: string) => {
      if (!socketRef.current) {
        console.warn("⚠️ WebSocket: No active connection");
        return () => {};
      }

      // Check total event limit
      if (listenersRegistryRef.current.size >= MAX_TOTAL_EVENTS) {
        console.warn(`⚠️ WebSocket: Too many events registered`);
        cleanupOrphanedListeners();
      }

      // Get or create listener list for the event
      let eventListeners = listenersRegistryRef.current.get(event);
      if (!eventListeners) {
        eventListeners = new Map();
        listenersRegistryRef.current.set(event, eventListeners);
      }

      // Check per-event limit
      if (eventListeners.size >= MAX_LISTENERS_PER_EVENT) {
        console.warn(
          `⚠️ WebSocket: Too many listeners for event '${event}' (${eventListeners.size})`,
        );

        // Try cleanup before adding
        const oldestEntry = Array.from(eventListeners.entries()).sort(
          (a, b) => a[1].addedAt - b[1].addedAt,
        )[0];

        if (oldestEntry) {
          const [oldHandler] = oldestEntry;
          socketRef.current.off(event, oldHandler);
          eventListeners.delete(oldHandler);
          console.log(`🧹 WebSocket: Removed oldest listener for '${event}'`);
        }
      }

      // Check if already registered
      if (eventListeners.has(handler)) {
        console.warn(
          `⚠️ WebSocket: Listener already registered for event '${event}'`,
        );
        return () => {};
      }

      // ✅ REGISTER LISTENER with metadata
      eventListeners.set(handler, {
        addedAt: Date.now(),
        componentId,
      });

      socketRef.current.on(event, handler);

      console.log(
        `🎧 WebSocket: Listener added for '${event}' (total: ${eventListeners.size})`,
      );

      // ✅ RETURN CLEANUP FUNCTION
      return () => {
        if (socketRef.current && eventListeners.has(handler)) {
          socketRef.current.off(event, handler);
          eventListeners.delete(handler);

          // Clean up event if no listeners remain
          if (eventListeners.size === 0) {
            listenersRegistryRef.current.delete(event);
          }

          console.log(`🧹 WebSocket: Listener removed for '${event}'`);
        }
      };
    },
    [cleanupOrphanedListeners],
  );

  // 🔗 CREATE CONNECTION - FIXED
  const createConnection = useCallback(async () => {
    if (connectionPromiseRef.current) {
      return connectionPromiseRef.current;
    }

    // ✅ CHECK STATE BEFORE CONNECTING
    if (socketRef.current?.connected) {
      return Promise.resolve();
    }

    connectionPromiseRef.current = new Promise((resolve, reject) => {
      try {
        setIsConnecting(true);
        setConnectionError(null);

        const WEBSOCKET_URL =
          import.meta.env.VITE_WS_URL || "http://localhost:3001";

        // ✅ CLEAN UP PREVIOUS SOCKET ONLY IF EXISTS AND IS DISCONNECTED
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.removeAllListeners();
          socketRef.current = null;
        }

        const socket = io(WEBSOCKET_URL, {
          auth: { token },
          transports: ["websocket", "polling"],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
          console.log("🟢 WebSocket connected successfully");
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionError(null);
          socketRef.current = socket;
          connectionPromiseRef.current = null;
          cleanupAttemptsRef.current = 0; // Reset cleanup attempts on successful connection

          // Reconnect to pending rooms
          pendingRoomsRef.current.forEach((roomId) => {
            socket.emit("join_room", roomId);
          });

          resolve();
        });

        socket.on("disconnect", (reason) => {
          console.log("🔴 WebSocket disconnected:", reason);
          setIsConnected(false);

          // ✅ DON'T clean up socket on automatic disconnect
          if (reason !== "io client disconnect") {
            setConnectionError(`Disconnected: ${reason}`);
          }
        });

        socket.on("connect_error", (error) => {
          console.error("🚨 Connection error:", error.message);
          setConnectionError(error.message);
          setIsConnecting(false);
          connectionPromiseRef.current = null;
          reject(error);
        });
      } catch (error: unknown) {
        console.error("❌ Error creating WebSocket:", error);
        let errorMessage = "Failed to create WebSocket";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setConnectionError(errorMessage);
        setIsConnecting(false);
        connectionPromiseRef.current = null;
        reject(error);
      }
    });

    return connectionPromiseRef.current;
  }, [token]); // ✅ Only token as dependency

  // 📤 OPTIMIZED EMIT
  const emit = useCallback((event: string, data?: unknown): boolean => {
    if (!socketRef.current?.connected) {
      console.warn("⚠️ Socket not connected");
      return false;
    }
    socketRef.current.emit(event, data);
    return true;
  }, []);

  // 🏠 ROOM MANAGEMENT
  const joinRoom = useCallback((roomId: string) => {
    if (!roomId) return;
    pendingRoomsRef.current.add(roomId);
    if (socketRef.current?.connected) {
      socketRef.current.emit("join_room", roomId);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (!roomId) return;
    pendingRoomsRef.current.delete(roomId);
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_room", roomId);
    }
  }, []);

  // 🏗️ MAIN CONNECTION EFFECT - FIXED
  useEffect(() => {
    let mounted = true;
    let connectTimer: NodeJS.Timeout;

    if (isAuthenticated && token && user?.subscription?.status === "active") {
      // Small delay to avoid rapid reconnections
      connectTimer = setTimeout(() => {
        if (mounted && !socketRef.current?.connected && !isConnecting) {
          createConnection().catch((error) => {
            if (mounted) {
              console.error("Connection error:", error);
            }
          });
        }
      }, 100);

      // Initialize automatic cleanup
      if (!cleanupIntervalRef.current) {
        cleanupIntervalRef.current = setInterval(() => {
          cleanupOrphanedListeners();
        }, CLEANUP_INTERVAL);
      }
    } else if (socketRef.current) {
      // Disconnect if requirements are not met
      socketRef.current.disconnect();
      socketRef.current = null;
      listenersRegistryRef.current.clear();
      pendingRoomsRef.current.clear();
      setIsConnected(false);
      cleanupAttemptsRef.current = 0; // Reset cleanup attempts

      // Clean up interval
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    }

    return () => {
      mounted = false;
      if (connectTimer) {
        clearTimeout(connectTimer);
      }
    };
  }, [
    isAuthenticated,
    token,
    user?.subscription?.status,
    isConnecting,
    cleanupOrphanedListeners,
    createConnection,
  ]); // ✅ Fixed dependencies

  // 🧹 CLEANUP ON UNMOUNT
  useEffect(() => {
    const listenersRegistry = listenersRegistryRef.current;
    const pendingRooms = pendingRoomsRef.current;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      listenersRegistry.clear();
      pendingRooms.clear();
      cleanupAttemptsRef.current = 0; // Reset cleanup attempts
    };
  }, []);

  // ✅ MEMOIZED VALUE
  const value = useMemo<WebSocketContextType>(
    () => ({
      isConnected,
      connectionError,
      isConnecting,
      emit,
      joinRoom,
      leaveRoom,
      addListener,
      getListenerStats,
      cleanupOrphanedListeners,
    }),
    [
      isConnected,
      connectionError,
      isConnecting,
      emit,
      joinRoom,
      leaveRoom,
      addListener,
      getListenerStats,
      cleanupOrphanedListeners,
    ],
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// ✅ BASE HOOK
// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider",
    );
  }
  return context;
};

// 🎯 HOOK FOR EMITTING ONLY (no listeners)
// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocketEmit = () => {
  const { emit, isConnected } = useWebSocketContext();

  return useMemo(
    () => ({
      isConnected,
      emit,
      emitBetCreated: (betData: unknown) => emit("bet_created", betData),
      emitBetAccepted: (betId: string) => emit("bet_accepted", { betId }),
      emitJoinFight: (fightId: string) => emit("join_fight", { fightId }),
      emitLeaveFight: (fightId: string) => emit("leave_fight", { fightId }),
    }),
    [isConnected, emit],
  );
};

// 🎧 HOOK FOR A SINGLE LISTENER

export const useWebSocketListener = <T = unknown,>(
  event: string,
  handler: (data: T) => void,
  dependencies: unknown[] = [],
) => {
  const { isConnected, addListener } = useWebSocketContext();
  const componentIdRef = useRef(`listener-${event}-${Date.now()}`);
  const cleanupRef = useRef<(() => void) | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableHandler = useCallback(handler, [...dependencies]);

  useEffect(() => {
    if (!event || !isConnected) return;

    if (cleanupRef.current) {
      cleanupRef.current();
    }

    cleanupRef.current = addListener(
      event,
      stableHandler,
      componentIdRef.current,
    );

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [event, isConnected, stableHandler, addListener]);

  return { isConnected };
};

// 🏠 HOOK FOR ROOM MANAGEMENT
// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocketRoom = (roomId: string) => {
  const { joinRoom, leaveRoom, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (!roomId || !isConnected) return;

    joinRoom(roomId);

    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  return { isConnected, roomId };
};
