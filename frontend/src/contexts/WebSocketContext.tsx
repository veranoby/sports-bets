// frontend/src/contexts/WebSocketContext.tsx - ANTI-THRASHING V5

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

  // 🛡️ GUARDS ANTI-THRASHING
  const operationInProgressRef = useRef(false);
  const lastOperationTimeRef = useRef<number>(0);
  const OPERATION_DEBOUNCE_MS = 150; // Debounce más agresivo

  // 🔒 FUNCIÓN PARA PREVENIR THRASHING
  const canPerformOperation = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastOp = now - lastOperationTimeRef.current;

    if (
      operationInProgressRef.current ||
      timeSinceLastOp < OPERATION_DEBOUNCE_MS
    ) {
      if (process.env.NODE_ENV === "development") {
        console.warn("🛡️ Operación bloqueada para prevenir thrashing");
      }
      return false;
    }

    operationInProgressRef.current = true;
    lastOperationTimeRef.current = now;

    // Liberar flag después del debounce
    setTimeout(() => {
      operationInProgressRef.current = false;
    }, OPERATION_DEBOUNCE_MS);

    return true;
  }, []);

  // 🛡️ FUNCIONES ESTABLES CON GUARDS
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

  const joinRoom = useCallback(
    (roomId: string) => {
      if (!canPerformOperation()) return;

      if (socketRef.current?.connected) {
        socketRef.current.emit("join_room", roomId);
        if (process.env.NODE_ENV === "development") {
          console.log(`🚪 Uniéndose a sala: ${roomId}`);
        }
      }
    },
    [canPerformOperation]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (!canPerformOperation()) return;

      if (socketRef.current?.connected) {
        socketRef.current.emit("leave_room", roomId);
        if (process.env.NODE_ENV === "development") {
          console.log(`🚪 Saliendo de sala: ${roomId}`);
        }
      }
    },
    [canPerformOperation]
  );

  // 🔧 REGISTRY DE LISTENERS CON ANTI-DUPLICACIÓN MEJORADA
  const addListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`⚠️ Intento de agregar listener ${event} sin socket`);
        }
        return;
      }

      // Guard anti-thrashing
      if (!canPerformOperation()) return;

      // Verificar si ya está registrado (comparación por referencia)
      const eventListeners =
        listenersRegistryRef.current.get(event) || new Set();

      // 🔍 VERIFICACIÓN ESTRICTA DE DUPLICADOS
      for (const existingHandler of eventListeners) {
        if (existingHandler === handler) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `🔄 Listener duplicado detectado para: ${event} - IGNORADO`
            );
          }
          return; // Ya está registrado, no agregar duplicado
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
    },
    [canPerformOperation]
  );

  const removeListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (!socketRef.current) return;

      // Guard anti-thrashing
      if (!canPerformOperation()) return;

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
    [canPerformOperation]
  );

  // 🔌 FUNCIÓN DE CONEXIÓN CON CLEANUP COMPLETO Y GUARDS
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

      // Eventos de conexión con guards
      newSocket.on("connect", () => {
        console.log("✅ WebSocket conectado:", newSocket.id);
        setIsConnected(true);
        setConnectionError(null);
        setIsConnecting(false);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ WebSocket desconectado:", reason);
        setIsConnected(false);

        // Reconexión automática con backoff
        if (reason === "io server disconnect") {
          // Server desconectó, no intentar reconectar automáticamente
          setConnectionError("Servidor desconectó la conexión");
        } else {
          // Reconexión automática con delay
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated && token) {
              console.log("🔄 Intentando reconexión automática...");
              createConnection();
            }
          }, 3000);
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ Error de conexión WebSocket:", error);
        setConnectionError(error.message);
        setIsConnecting(false);
      });

      socketRef.current = newSocket;
    } catch (error) {
      console.error("❌ Error creando conexión WebSocket:", error);
      setConnectionError(
        error instanceof Error ? error.message : "Error desconocido"
      );
      setIsConnecting(false);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [isAuthenticated, token]);

  // 🔄 EFFECT PRINCIPAL CON GUARDS
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
  }, [isAuthenticated, token, createConnection]);

  // 📊 VALOR DEL CONTEXTO - COMPLETAMENTE ESTABLE
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
