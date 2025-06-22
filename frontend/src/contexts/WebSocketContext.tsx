// frontend/src/contexts/WebSocketContext.tsx - REGISTRY OPTIMIZADO
// ==================================================================

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface WebSocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  isConnecting: boolean;
  emit: (event: string, data?: any) => boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  addListener: (event: string, handler: (data: any) => void) => () => void;

  // ✅ NUEVOS: Funciones de debugging/monitoreo
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

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Referencias estables
  const socketRef = useRef<Socket | null>(null);
  const pendingRoomsRef = useRef<Set<string>>(new Set());
  const connectionPromiseRef = useRef<Promise<void> | null>(null);

  // ✅ REGISTRY OPTIMIZADO con límites y cleanup
  const listenersRegistryRef = useRef<
    Map<
      string,
      Map<
        Function,
        {
          addedAt: number;
          componentId?: string;
        }
      >
    >
  >(new Map());

  // Cleanup automático cada 5 minutos
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🧹 FUNCIÓN DE CLEANUP OPTIMIZADA
  const cleanupOrphanedListeners = useCallback(() => {
    let removedCount = 0;
    const now = Date.now();
    const STALE_THRESHOLD = 10 * 60 * 1000; // 10 minutos

    for (const [
      event,
      listenersMap,
    ] of listenersRegistryRef.current.entries()) {
      const staleListeners: Function[] = [];

      for (const [handler, metadata] of listenersMap.entries()) {
        // Remover listeners antiguos sin actividad
        if (now - metadata.addedAt > STALE_THRESHOLD) {
          staleListeners.push(handler);
        }
      }

      // Remover listeners huérfanos
      staleListeners.forEach((handler) => {
        if (socketRef.current) {
          socketRef.current.off(event, handler);
        }
        listenersMap.delete(handler);
        removedCount++;
      });

      // Remover eventos sin listeners
      if (listenersMap.size === 0) {
        listenersRegistryRef.current.delete(event);
      }
    }

    if (removedCount > 0) {
      console.log(
        `🧹 WebSocket: Limpiados ${removedCount} listeners huérfanos`
      );
    }

    return removedCount;
  }, []);

  // 📊 FUNCIÓN DE ESTADÍSTICAS
  const getListenerStats = useCallback(() => {
    const stats = {
      totalEvents: listenersRegistryRef.current.size,
      totalListeners: 0,
      events: {} as Record<string, number>,
    };

    for (const [
      event,
      listenersMap,
    ] of listenersRegistryRef.current.entries()) {
      const count = listenersMap.size;
      stats.events[event] = count;
      stats.totalListeners += count;
    }

    return stats;
  }, []);

  // 🎧 FUNCIÓN OPTIMIZADA PARA AGREGAR LISTENERS
  const addListener = useCallback(
    (event: string, handler: (data: any) => void, componentId?: string) => {
      if (!socketRef.current || !event || !handler) {
        console.warn("⚠️ WebSocket: Parámetros inválidos para addListener");
        return () => {};
      }

      // ✅ VERIFICAR LÍMITES
      const currentStats = getListenerStats();

      if (currentStats.totalEvents >= MAX_TOTAL_EVENTS) {
        console.warn(
          `⚠️ WebSocket: Demasiados eventos (${currentStats.totalEvents}), ejecutando cleanup`
        );
        cleanupOrphanedListeners();
      }

      if (!listenersRegistryRef.current.has(event)) {
        listenersRegistryRef.current.set(event, new Map());
      }

      const eventListeners = listenersRegistryRef.current.get(event)!;

      if (eventListeners.size >= MAX_LISTENERS_PER_EVENT) {
        console.warn(
          `⚠️ WebSocket: Demasiados listeners para evento '${event}' (${eventListeners.size})`
        );

        // Intentar cleanup antes de agregar
        const oldestEntry = Array.from(eventListeners.entries()).sort(
          (a, b) => a[1].addedAt - b[1].addedAt
        )[0];

        if (oldestEntry) {
          const [oldHandler] = oldestEntry;
          socketRef.current.off(event, oldHandler);
          eventListeners.delete(oldHandler);
          console.log(
            `🧹 WebSocket: Removido listener más antiguo para '${event}'`
          );
        }
      }

      // Verificar si ya está registrado
      if (eventListeners.has(handler)) {
        console.warn(
          `⚠️ WebSocket: Listener ya registrado para evento '${event}'`
        );
        return () => {};
      }

      // ✅ REGISTRAR LISTENER con metadata
      eventListeners.set(handler, {
        addedAt: Date.now(),
        componentId,
      });

      socketRef.current.on(event, handler);

      console.log(
        `🎧 WebSocket: Listener agregado para '${event}' (total: ${eventListeners.size})`
      );

      // ✅ RETORNAR FUNCIÓN DE CLEANUP
      return () => {
        if (socketRef.current && eventListeners.has(handler)) {
          socketRef.current.off(event, handler);
          eventListeners.delete(handler);

          // Limpiar evento si no tiene listeners
          if (eventListeners.size === 0) {
            listenersRegistryRef.current.delete(event);
          }

          console.log(`🧹 WebSocket: Listener removido para '${event}'`);
        }
      };
    },
    [getListenerStats, cleanupOrphanedListeners]
  );

  // 🔗 CREAR CONEXIÓN (singleton pattern mantenido)
  const createConnection = useCallback(async () => {
    if (connectionPromiseRef.current) {
      return connectionPromiseRef.current;
    }

    if (socketRef.current?.connected) {
      return Promise.resolve();
    }

    connectionPromiseRef.current = new Promise((resolve, reject) => {
      try {
        setIsConnecting(true);
        setConnectionError(null);

        const WEBSOCKET_URL =
          import.meta.env.VITE_WS_URL || "http://localhost:3001";

        const socket = io(WEBSOCKET_URL, {
          auth: { token },
          transports: ["websocket"],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
          console.log("✅ WebSocket conectado");
          setIsConnected(true);
          setConnectionError(null);

          // Reconectar a rooms pendientes
          pendingRoomsRef.current.forEach((roomId) => {
            socket.emit("join_room", roomId);
          });

          resolve();
        });

        socket.on("disconnect", (reason) => {
          console.log("❌ WebSocket desconectado:", reason);
          setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
          console.error("🚨 Error de conexión:", error.message);
          setConnectionError(error.message);
          reject(error);
        });

        socketRef.current = socket;
      } catch (error) {
        reject(error);
      } finally {
        setIsConnecting(false);
        connectionPromiseRef.current = null;
      }
    });

    return connectionPromiseRef.current;
  }, [token]);

  // 📤 EMIT OPTIMIZADO
  const emit = useCallback((event: string, data?: any): boolean => {
    if (!socketRef.current?.connected) {
      console.warn("⚠️ Socket no conectado");
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

  // 🏗️ EFECTO PRINCIPAL DE CONEXIÓN
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated && token) {
      createConnection().catch((error) => {
        if (mounted) {
          console.error("Error conectando:", error);
        }
      });

      // ✅ INICIALIZAR CLEANUP AUTOMÁTICO
      cleanupIntervalRef.current = setInterval(() => {
        cleanupOrphanedListeners();
      }, CLEANUP_INTERVAL);
    } else if (socketRef.current) {
      // Desconectar si no está autenticado
      socketRef.current.disconnect();
      socketRef.current = null;
      listenersRegistryRef.current.clear();
      pendingRoomsRef.current.clear();
      setIsConnected(false);

      // Limpiar intervalo
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    }

    return () => {
      mounted = false;

      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      listenersRegistryRef.current.clear();
      pendingRoomsRef.current.clear();
    };
  }, [isAuthenticated, token, createConnection, cleanupOrphanedListeners]);

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      listenersRegistryRef.current.clear();
      pendingRoomsRef.current.clear();
    };
  }, []);

  // ✅ VALOR MEMOIZADO
  const value = React.useMemo<WebSocketContextType>(
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
    ]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext debe usarse dentro de WebSocketProvider"
    );
  }
  return context;
};
