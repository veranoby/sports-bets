// 🚀 WEBSOCKET CONTEXT V4 - SOLUCIÓN CICLO INFINITO

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
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

  // Referencias estables
  const socketRef = useRef<any>(null);
  const listenersRegistryRef = useRef<Map<string, Set<Function>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🛡️ FUNCIONES ESTABLES MEMOIZADAS
  const emit = useCallback((event: string, data?: any): boolean => {
    if (!socketRef.current?.connected) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Intento de emit sin conexión WebSocket");
      }
      return false;
    }

    socketRef.current.emit(event, data);
    return true;
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join_room", roomId);
      if (process.env.NODE_ENV === "development") {
        console.log(`🚪 Uniéndose a sala: ${roomId}`);
      }
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_room", roomId);
      if (process.env.NODE_ENV === "development") {
        console.log(`🚪 Saliendo de sala: ${roomId}`);
      }
    }
  }, []);

  // 🔧 REGISTRY DE LISTENERS PARA EVITAR DUPLICADOS
  const addListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current) return;

      // Verificar si ya está registrado
      const eventListeners =
        listenersRegistryRef.current.get(event) || new Set();
      if (eventListeners.has(handler)) {
        return; // Ya está registrado, no agregar duplicado
      }

      // Agregar al registry
      eventListeners.add(handler);
      listenersRegistryRef.current.set(event, eventListeners);

      // Agregar al socket
      socketRef.current.on(event, handler);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `🎧 Listener agregado para: ${event} (Total: ${eventListeners.size})`
        );
      }
    },
    []
  );

  const removeListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current) return;

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
          `🎧 Listener removido para: ${event} (Restantes: ${
            eventListeners?.size || 0
          })`
        );
      }
    },
    []
  );

  // 🔌 FUNCIÓN DE CONEXIÓN CON CLEANUP COMPLETO
  const createConnection = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return null;
    }

    // Limpiar conexión anterior si existe
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Limpiar registry de listeners
    listenersRegistryRef.current.clear();

    try {
      const { io } = await import("socket.io-client");
      const WEBSOCKET_URL =
        import.meta.env.VITE_WS_URL || "http://localhost:3001";

      const newSocket = io(WEBSOCKET_URL, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true, // 🔥 FORZAR NUEVA CONEXIÓN
        auth: { token },
        query: { userId: token },
      });

      // Eventos de conexión
      newSocket.on("connect", () => {
        if (process.env.NODE_ENV === "development") {
          console.log("✅ WebSocket conectado:", newSocket.id);
        }
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
      });

      newSocket.on("disconnect", (reason) => {
        if (process.env.NODE_ENV === "development") {
          console.log("🔌 WebSocket desconectado:", reason);
        }
        setIsConnected(false);
        setIsConnecting(false);

        // Error solo si no fue desconexión intencional
        if (reason !== "io client disconnect") {
          setConnectionError(`Desconectado: ${reason}`);
          // Auto-reconectar después de 3 segundos
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated && token) {
              createConnection();
            }
          }, 3000);
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ Error de conexión WebSocket:", error);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError(error.message || "Error de conexión");
      });

      socketRef.current = newSocket;
      return newSocket;
    } catch (error) {
      console.error("Error creating socket:", error);
      setIsConnecting(false);
      setConnectionError("Error al crear conexión");
      return null;
    }
  }, [isAuthenticated, token]);

  // 🔄 EFECTO PRINCIPAL DE CONEXIÓN
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated && token) {
      setIsConnecting(true);
      setConnectionError(null);

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
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(null);
    }

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      listenersRegistryRef.current.clear();
    };
  }, [isAuthenticated, token, createConnection]);

  // 📊 VALOR DEL CONTEXTO - ESTABLE
  const contextValue: WebSocketContextType = React.useMemo(
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
