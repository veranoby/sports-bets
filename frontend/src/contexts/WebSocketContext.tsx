// frontend/src/contexts/WebSocketContext.tsx - VERSIÓN COMPLETA CORREGIDA
// ==================================================================

import React, {
  createContext,
  useContext,
  ReactNode,
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
  emit: (event: string, data?: any) => boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  addListener: (
    event: string,
    handler: (data: any) => void,
    componentId?: string
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
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ REGISTRY OPTIMIZADO
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

  // 🧹 FUNCIÓN DE LIMPIEZA DE LISTENERS HUÉRFANOS
  const cleanupOrphanedListeners = useCallback(() => {
    if (!socketRef.current) return 0;

    const cutoffTime = Date.now() - 10 * 60 * 1000; // 10 minutos
    let cleanedCount = 0;

    listenersRegistryRef.current.forEach((eventListeners, event) => {
      const listenersToRemove: Function[] = [];

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
        `🧹 WebSocket: Limpiados ${cleanedCount} listeners huérfanos`
      );
    }

    return cleanedCount;
  }, []);

  // 📊 ESTADÍSTICAS DE LISTENERS
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

  // 🎧 AGREGAR LISTENER CON LÍMITES
  const addListener = useCallback(
    (event: string, handler: (data: any) => void, componentId?: string) => {
      if (!socketRef.current) {
        console.warn("⚠️ WebSocket: No hay conexión activa");
        return () => {};
      }

      // Verificar límite total de eventos
      if (listenersRegistryRef.current.size >= MAX_TOTAL_EVENTS) {
        console.warn(`⚠️ WebSocket: Demasiados eventos registrados`);
        cleanupOrphanedListeners();
      }

      // Obtener o crear lista de listeners para el evento
      let eventListeners = listenersRegistryRef.current.get(event);
      if (!eventListeners) {
        eventListeners = new Map();
        listenersRegistryRef.current.set(event, eventListeners);
      }

      // Verificar límite por evento
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
    [cleanupOrphanedListeners]
  );

  // 🔗 CREAR CONEXIÓN - CORREGIDO
  const createConnection = useCallback(async () => {
    if (connectionPromiseRef.current) {
      return connectionPromiseRef.current;
    }

    // ✅ VERIFICAR ESTADO ANTES DE CONECTAR
    if (socketRef.current?.connected) {
      return Promise.resolve();
    }

    connectionPromiseRef.current = new Promise((resolve, reject) => {
      try {
        setIsConnecting(true);
        setConnectionError(null);

        const WEBSOCKET_URL =
          import.meta.env.VITE_WS_URL || "http://localhost:3001";

        // ✅ LIMPIAR SOCKET ANTERIOR SOLO SI EXISTE Y ESTÁ DESCONECTADO
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
          console.log("🟢 WebSocket conectado exitosamente");
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionError(null);
          socketRef.current = socket;
          connectionPromiseRef.current = null;

          // Reconectar a rooms pendientes
          pendingRoomsRef.current.forEach((roomId) => {
            socket.emit("join_room", roomId);
          });

          resolve();
        });

        socket.on("disconnect", (reason) => {
          console.log("🔴 WebSocket desconectado:", reason);
          setIsConnected(false);

          // ✅ NO limpiar socket en disconnect automático
          if (reason !== "io client disconnect") {
            setConnectionError(`Disconnected: ${reason}`);
          }
        });

        socket.on("connect_error", (error) => {
          console.error("🚨 Error de conexión:", error.message);
          setConnectionError(error.message);
          setIsConnecting(false);
          connectionPromiseRef.current = null;
          reject(error);
        });
      } catch (error: any) {
        console.error("❌ Error creando WebSocket:", error);
        setConnectionError(error.message);
        setIsConnecting(false);
        connectionPromiseRef.current = null;
        reject(error);
      }
    });

    return connectionPromiseRef.current;
  }, [token]); // ✅ Solo token como dependencia

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

  // 🏗️ EFECTO PRINCIPAL DE CONEXIÓN - CORREGIDO
  useEffect(() => {
    let mounted = true;
    let connectTimer: NodeJS.Timeout;

    if (isAuthenticated && token) {
      // Pequeño delay para evitar reconexiones rápidas
      connectTimer = setTimeout(() => {
        if (mounted && !socketRef.current?.connected && !isConnecting) {
          createConnection().catch((error) => {
            if (mounted) {
              console.error("Error conectando:", error);
            }
          });
        }
      }, 100);

      // ✅ INICIALIZAR CLEANUP AUTOMÁTICO
      if (!cleanupIntervalRef.current) {
        cleanupIntervalRef.current = setInterval(() => {
          cleanupOrphanedListeners();
        }, CLEANUP_INTERVAL);
      }
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
      if (connectTimer) {
        clearTimeout(connectTimer);
      }
    };
  }, [isAuthenticated, token, isConnecting, cleanupOrphanedListeners]); // ✅ Dependencias corregidas

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
    ]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// ✅ HOOK BASE
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext debe usarse dentro de WebSocketProvider"
    );
  }
  return context;
};

// 🎯 HOOK PARA SOLO EMITIR (sin listeners)
export const useWebSocketEmit = () => {
  const { emit, isConnected } = useWebSocketContext();

  return useMemo(
    () => ({
      isConnected,
      emit,
      emitBetCreated: (betData: any) => emit("bet_created", betData),
      emitBetAccepted: (betId: string) => emit("bet_accepted", { betId }),
      emitJoinFight: (fightId: string) => emit("join_fight", { fightId }),
      emitLeaveFight: (fightId: string) => emit("leave_fight", { fightId }),
    }),
    [isConnected, emit]
  );
};

// 🎧 HOOK PARA UN SOLO LISTENER
export const useWebSocketListener = <T = any,>(
  event: string,
  handler: (data: T) => void,
  dependencies: any[] = []
) => {
  const { isConnected, addListener } = useWebSocketContext();
  const componentIdRef = useRef(`listener-${event}-${Date.now()}`);
  const cleanupRef = useRef<(() => void) | null>(null);

  const stableHandler = useCallback(handler, dependencies);

  useEffect(() => {
    if (!event || !isConnected) return;

    if (cleanupRef.current) {
      cleanupRef.current();
    }

    cleanupRef.current = addListener(
      event,
      stableHandler,
      componentIdRef.current
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

// 🏠 HOOK PARA GESTIÓN DE ROOMS
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
