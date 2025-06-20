// frontend/src/contexts/WebSocketContext.tsx - SOLUCIÓN DEFINITIVA ANTI-THRASHING
// ================================================================================

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
  addListener: (event: string, handler: (data: any) => void) => void;
  removeListener: (event: string, handler: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, token } = useAuth();

  // Estados del WebSocket
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // 🔒 REFERENCIAS ESTABLES - SIN RE-RENDERS
  const socketRef = useRef<Socket | null>(null);
  const listenersRegistryRef = useRef<Map<string, Set<Function>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectionInProgressRef = useRef(false);
  const pendingRoomsRef = useRef<Set<string>>(new Set());

  // 🚀 CONEXIÓN SIMPLIFICADA (sin batching complejo)
  const createConnection = useCallback(async () => {
    if (isConnectionInProgressRef.current || socketRef.current?.connected) {
      return;
    }

    try {
      isConnectionInProgressRef.current = true;
      setIsConnecting(true);
      setConnectionError(null);

      const WEBSOCKET_URL =
        import.meta.env.VITE_WS_URL || "http://localhost:3001";

      const socket = io(WEBSOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // 📡 EVENTOS DE CONEXIÓN
      socket.on("connect", () => {
        console.log("✅ WebSocket conectado");
        setIsConnected(true);
        setConnectionError(null);

        // Reconectar a rooms pendientes
        pendingRoomsRef.current.forEach((roomId) => {
          socket.emit("join_room", roomId);
        });
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ WebSocket desconectado:", reason);
        setIsConnected(false);

        if (reason === "io server disconnect") {
          socket.connect();
        }
      });

      socket.on("connect_error", (error) => {
        console.error("🚨 Error de conexión WebSocket:", error);
        setConnectionError(error.message);
        setIsConnecting(false);
      });

      socketRef.current = socket;
    } catch (error: any) {
      console.error("🚨 Error creando conexión WebSocket:", error);
      setConnectionError(error.message);
    } finally {
      isConnectionInProgressRef.current = false;
      setIsConnecting(false);
    }
  }, [token]);

  // 📤 EMIT SIMPLIFICADO
  const emit = useCallback((event: string, data?: any): boolean => {
    if (!socketRef.current?.connected) {
      console.warn("⚠️ Intento de emit sin conexión WebSocket");
      return false;
    }

    socketRef.current.emit(event, data);
    return true;
  }, []);

  // 🏠 GESTIÓN DE ROOMS SIMPLIFICADA
  const joinRoom = useCallback((roomId: string) => {
    if (!roomId) return;

    pendingRoomsRef.current.add(roomId);

    if (socketRef.current?.connected) {
      socketRef.current.emit("join_room", roomId);
      console.log(`🏠 Uniéndose a room: ${roomId}`);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (!roomId) return;

    pendingRoomsRef.current.delete(roomId);

    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_room", roomId);
      console.log(`🚪 Saliendo de room: ${roomId}`);
    }
  }, []);

  // 🎧 SISTEMA DE LISTENERS OPTIMIZADO (sin batching)
  const addListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current || !event || !handler) return;

      // Agregar al registry interno
      if (!listenersRegistryRef.current.has(event)) {
        listenersRegistryRef.current.set(event, new Set());
      }

      const eventListeners = listenersRegistryRef.current.get(event)!;

      // Evitar duplicados
      if (eventListeners.has(handler)) {
        console.warn(`⚠️ Listener ya registrado para evento: ${event}`);
        return;
      }

      eventListeners.add(handler);
      socketRef.current.on(event, handler);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `🎧 Listener agregado: ${event} (Total: ${eventListeners.size})`
        );
      }
    },
    []
  );

  const removeListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current || !event || !handler) return;

      // Remover del registry
      const eventListeners = listenersRegistryRef.current.get(event);
      if (eventListeners) {
        eventListeners.delete(handler);
        if (eventListeners.size === 0) {
          listenersRegistryRef.current.delete(event);
        }
      }

      // Remover del socket
      socketRef.current.off(event, handler);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `🎧 Listener removido: ${event} (Restantes: ${
            eventListeners?.size || 0
          })`
        );
      }
    },
    []
  );

  // 🔄 EFFECT PRINCIPAL DE CONEXIÓN (simplificado)
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated && token) {
      createConnection().then(() => {
        if (mounted) {
          setIsConnecting(false);
        }
      });
    } else {
      // Cleanup si no autenticado
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      listenersRegistryRef.current.clear();
      pendingRoomsRef.current.clear();
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(null);
    }

    return () => {
      mounted = false;

      // Limpiar timeout de reconexión
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Desconectar socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Limpiar registry
      listenersRegistryRef.current.clear();
      pendingRoomsRef.current.clear();
      isConnectionInProgressRef.current = false;
    };
  }, [isAuthenticated, token, createConnection]);

  // 📊 VALOR DEL CONTEXTO CON FUNCIONES MEMOIZADAS
  const contextValue = React.useMemo<WebSocketContextType>(
    () => ({
      isConnected,
      connectionError,
      isConnecting,
      emit,
      joinRoom,
      leaveRoom,
      addListener,
      removeListener,
    }),
    [
      isConnected,
      connectionError,
      isConnecting,
      emit,
      joinRoom,
      leaveRoom,
      addListener,
      removeListener,
    ]
  );

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider"
    );
  }
  return context;
};
