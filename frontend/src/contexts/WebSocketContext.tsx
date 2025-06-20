// frontend/src/contexts/WebSocketContext.tsx V8 - CHEQUEAR ANTI-CICLO INFINITO Y TRASHING y DEPENDENCIES ESTABLES

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

  // 🛡️ GUARDS ANTI-THRASHING - REFS SIMPLES (sin función inestable)
  const operationInProgressRef = useRef(false);
  const lastOperationTimeRef = useRef<number>(0);
  const OPERATION_DEBOUNCE_MS = 200;

  // 🛡️ FUNCIONES ESTABLES CON GUARDS - SIN DEPENDENCIES VARIABLES
  const emit = useCallback((event: string, data?: any): boolean => {
    if (!socketRef.current?.connected) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Intento de emit sin conexión WebSocket");
      }
      return false;
    }

    socketRef.current.emit(event, data);
    return true;
  }, []); // 🔑 DEPENDENCIES VACÍAS

  const joinRoom = useCallback((roomId: string) => {
    if (!canPerformOperation()) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit("join_room", roomId);
      if (process.env.NODE_ENV === "development") {
        console.log(`🚪 Uniéndose a sala: ${roomId}`);
      }
    }
  }, []); // 🔑 DEPENDENCIES VACÍAS

  const leaveRoom = useCallback((roomId: string) => {
    if (!canPerformOperation()) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_room", roomId);
      if (process.env.NODE_ENV === "development") {
        console.log(`🚪 Saliendo de sala: ${roomId}`);
      }
    }
  }, []); // 🔑 DEPENDENCIES VACÍAS

  // 🔧 REGISTRY DE LISTENERS - FUNCIONES ESTABLES SIN DEPENDENCIES
  const addListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`⚠️ Intento de agregar listener ${event} sin socket`);
        }
        return;
      }

      // Guard anti-thrashing usando ref directamente (sin dependency)
      const now = Date.now();
      const timeSinceLastOp = now - lastOperationTimeRef.current;

      if (
        operationInProgressRef.current ||
        timeSinceLastOp < OPERATION_DEBOUNCE_MS
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn("🛡️ addListener bloqueado para prevenir thrashing");
        }
        return;
      }

      operationInProgressRef.current = true;
      lastOperationTimeRef.current = now;

      // Verificar si ya está registrado
      const eventListeners =
        listenersRegistryRef.current.get(event) || new Set();

      for (const existingHandler of eventListeners) {
        if (existingHandler === handler) {
          operationInProgressRef.current = false;
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `🔄 Listener duplicado detectado para: ${event} - IGNORADO`
            );
          }
          return;
        }
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

      // Liberar flag después del debounce
      setTimeout(() => {
        operationInProgressRef.current = false;
      }, OPERATION_DEBOUNCE_MS);
    },
    []
  ); // 🔑 NO DEPENDENCIES - FUNCIÓN COMPLETAMENTE ESTABLE

  const removeListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current) return;

      // Guard anti-thrashing usando ref directamente (sin dependency)
      const now = Date.now();
      const timeSinceLastOp = now - lastOperationTimeRef.current;

      if (
        operationInProgressRef.current ||
        timeSinceLastOp < OPERATION_DEBOUNCE_MS
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn("🛡️ removeListener bloqueado para prevenir thrashing");
        }
        return;
      }

      operationInProgressRef.current = true;
      lastOperationTimeRef.current = now;

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

      // Liberar flag después del debounce
      setTimeout(() => {
        operationInProgressRef.current = false;
      }, OPERATION_DEBOUNCE_MS);
    },
    []
  ); // 🔑 NO DEPENDENCIES - FUNCIÓN COMPLETAMENTE ESTABLE

  // 🔌 FUNCIÓN DE CONEXIÓN ESTABLE
  const createConnection = useCallback(async () => {
    if (!isAuthenticated || !token) {
      return null;
    }

    // Guard para prevenir múltiples conexiones simultáneas
    if (operationInProgressRef.current) {
      console.warn("🛡️ Conexión en progreso, esperando...");
      return null;
    }

    try {
      setIsConnecting(true);
      operationInProgressRef.current = true;

      // Limpiar conexión anterior si existe
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Limpiar registry de listeners
      listenersRegistryRef.current.clear();

      const { io } = await import("socket.io-client");
      const WEBSOCKET_URL =
        import.meta.env.VITE_WS_URL || "http://localhost:3001";

      const newSocket = io(WEBSOCKET_URL, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
        auth: { token },
        query: { userId: token },
      });

      // Eventos de conexión
      newSocket.on("connect", () => {
        setIsConnected(true);
        setConnectionError(null);
        setIsConnecting(false);
        if (process.env.NODE_ENV === "development") {
          console.log(`✅ WebSocket conectado: ${newSocket.id}`);
        }
      });

      newSocket.on("disconnect", (reason) => {
        setIsConnected(false);
        if (process.env.NODE_ENV === "development") {
          console.log(`❌ WebSocket desconectado: ${reason}`);
        }
      });

      newSocket.on("connect_error", (error) => {
        setConnectionError(error.message);
        setIsConnected(false);
        setIsConnecting(false);
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Error de conexión WebSocket:", error);
        }
      });

      socketRef.current = newSocket;
      return newSocket;
    } catch (error: any) {
      setConnectionError(error?.message || "Error desconocido");
      setIsConnecting(false);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [isAuthenticated, token]); // 🔑 SOLO AUTH DEPENDENCIES

  // 🔄 EFFECT PRINCIPAL
  useEffect(() => {
    let mounted = true;

    if (isAuthenticated && token) {
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
      operationInProgressRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      listenersRegistryRef.current.clear();
    };
  }, [isAuthenticated, token]); // 🔑 SOLO AUTH DEPENDENCIES

  // 📊 VALOR DEL CONTEXTO - FUNCIONES ESTABLES
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
