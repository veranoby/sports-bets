// frontend/src/contexts/WebSocketContext.tsx
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
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Referencias estables
  const socketRef = useRef<Socket | null>(null);
  const listenersMapRef = useRef<Map<string, Map<Function, Function>>>(
    new Map()
  );
  const pendingRoomsRef = useRef<Set<string>>(new Set());
  const connectionPromiseRef = useRef<Promise<void> | null>(null);
  const listenersRegistryRef = useRef<Map<string, Set<Function>>>(new Map());

  const removeListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current || !event || !handler) return;
      socketRef.current.off(event, handler);
      const eventListeners = listenersRegistryRef.current.get(event);
      if (eventListeners) {
        eventListeners.delete(handler);
        if (eventListeners.size === 0) {
          listenersRegistryRef.current.delete(event);
        }
      }
    },
    []
  );

  // Crear conexión con singleton pattern
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

  // Emit optimizado
  const emit = useCallback((event: string, data?: any): boolean => {
    if (!socketRef.current?.connected) {
      console.warn("⚠️ Socket no conectado");
      return false;
    }
    socketRef.current.emit(event, data);
    return true;
  }, []);

  // Room management
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

  // Sistema de listeners mejorado con cleanup automático
  const addListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current || !event || !handler) {
        return () => {};
      }

      if (!listenersRegistryRef.current.has(event)) {
        listenersRegistryRef.current.set(event, new Set());
      }

      const eventListeners = listenersRegistryRef.current.get(event)!;

      if (eventListeners.has(handler)) {
        console.warn(`⚠️ Listener ya registrado para evento: ${event}`);
        return () => {};
      }

      eventListeners.add(handler);
      socketRef.current.on(event, handler);

      // Retornar cleanup
      return () => {
        removeListener(event, handler);
      };
    },
    [removeListener]
  );

  // Efecto principal de conexión
  useEffect(() => {
    let mounted = true;
    const reconnectTimeout: NodeJS.Timeout | null = null;

    if (isAuthenticated && token) {
      createConnection().catch((error) => {
        if (mounted) {
          console.error("Error conectando:", error);
        }
      });
    } else if (socketRef.current) {
      // Desconectar si no está autenticado
      socketRef.current.disconnect();
      socketRef.current = null;
      listenersMapRef.current.clear();
      pendingRoomsRef.current.clear();
      setIsConnected(false);
    }

    return () => {
      mounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      listenersMapRef.current.clear();
      pendingRoomsRef.current.clear();
    };
  }, [isAuthenticated, token, createConnection]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      listenersMapRef.current.clear();
      pendingRoomsRef.current.clear();
    };
  }, []);

  const value = React.useMemo<WebSocketContextType>(
    () => ({
      isConnected,
      connectionError,
      isConnecting,
      emit,
      joinRoom,
      leaveRoom,
      addListener,
    }),
    [
      isConnected,
      connectionError,
      isConnecting,
      emit,
      joinRoom,
      leaveRoom,
      addListener,
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
