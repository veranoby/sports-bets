// frontend/src/contexts/WebSocketContext.tsx V9 - SOLUCIÓN DEFINITIVA ANTI-THRASHING
// =====================================================================================

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

  // 🛡️ NUEVO SISTEMA ANTI-THRASHING INTELIGENTE
  const operationQueueRef = useRef<Array<() => void>>([]);
  const isProcessingQueueRef = useRef(false);
  const lastComponentMountTimeRef = useRef<number>(0);
  const BATCH_DELAY_MS = 50; // Reducido drásticamente
  const MOUNT_GRACE_PERIOD_MS = 100; // Período de gracia para montajes

  // 🚀 FUNCIÓN DE PROCESAMIENTO POR LOTES
  const processOperationQueue = useCallback(() => {
    if (
      isProcessingQueueRef.current ||
      operationQueueRef.current.length === 0
    ) {
      return;
    }

    isProcessingQueueRef.current = true;

    // Procesar todas las operaciones en lote
    const operations = [...operationQueueRef.current];
    operationQueueRef.current = [];

    // Ejecutar en el siguiente tick para evitar conflictos
    setTimeout(() => {
      operations.forEach((operation) => {
        try {
          operation();
        } catch (error) {
          console.error("Error ejecutando operación WebSocket:", error);
        }
      });

      isProcessingQueueRef.current = false;

      // Si hay más operaciones en cola, procesarlas
      if (operationQueueRef.current.length > 0) {
        processOperationQueue();
      }
    }, 0);
  }, []);

  // 🔄 FUNCIÓN DE CONEXIÓN SIMPLIFICADA
  const createConnection = useCallback(async () => {
    if (!isAuthenticated || !token) return null;

    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    if (isConnecting) return null;

    try {
      setIsConnecting(true);
      setConnectionError(null);

      // Importación dinámica para evitar problemas de SSR
      const { io } = await import("socket.io-client");

      const WEBSOCKET_URL =
        import.meta.env.VITE_WS_URL || "http://localhost:3001";

      const newSocket = io(WEBSOCKET_URL, {
        transports: ["websocket", "polling"],
        timeout: 15000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        forceNew: false,
        auth: { token },
      });

      // Configurar eventos del socket
      newSocket.on("connect", () => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        console.log("✅ WebSocket conectado");
      });

      newSocket.on("disconnect", (reason) => {
        setIsConnected(false);
        console.log("❌ WebSocket desconectado:", reason);
      });

      newSocket.on("connect_error", (error) => {
        setConnectionError(error.message);
        setIsConnecting(false);
        console.error("❌ Error de conexión WebSocket:", error);
      });

      socketRef.current = newSocket;
      return newSocket;
    } catch (error: any) {
      setConnectionError(error?.message || "Error desconocido");
      setIsConnecting(false);
      console.error("❌ Error creando conexión WebSocket:", error);
    }
  }, [isAuthenticated, token]);

  // 📡 FUNCIONES DE COMUNICACIÓN ESTABLES
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
      console.log(`🚪 Uniéndose a sala: ${roomId}`);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_room", roomId);
      console.log(`🚪 Saliendo de sala: ${roomId}`);
    }
  }, []);

  // 🎧 SISTEMA DE LISTENERS OPTIMIZADO POR LOTES
  const addListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      const operation = () => {
        if (!socketRef.current) {
          console.warn(`⚠️ Intento de agregar listener ${event} sin socket`);
          return;
        }

        // Verificar si ya está registrado (evitar duplicados)
        const eventListeners =
          listenersRegistryRef.current.get(event) || new Set();

        for (const existingHandler of eventListeners) {
          if (existingHandler === handler) {
            if (process.env.NODE_ENV === "development") {
              console.warn(`🔄 Listener duplicado ignorado para: ${event}`);
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
            `🎧 Listener agregado: ${event} (Total: ${eventListeners.size})`
          );
        }
      };

      // Agregar a la cola de operaciones
      operationQueueRef.current.push(operation);

      // Procesar cola después de un breve delay
      setTimeout(processOperationQueue, BATCH_DELAY_MS);
    },
    [processOperationQueue]
  );

  const removeListener = useCallback(
    (event: string, handler: (data: any) => void) => {
      const operation = () => {
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
            `🎧 Listener removido: ${event} (Restantes: ${
              eventListeners?.size || 0
            })`
          );
        }
      };

      // Agregar a la cola de operaciones
      operationQueueRef.current.push(operation);

      // Procesar cola inmediatamente para removals (mayor prioridad)
      setTimeout(processOperationQueue, 10);
    },
    [processOperationQueue]
  );

  // 🔄 EFFECT PRINCIPAL DE CONEXIÓN
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

      // Limpiar cola de operaciones
      operationQueueRef.current = [];
      isProcessingQueueRef.current = false;

      // Desconectar socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Limpiar registry
      listenersRegistryRef.current.clear();
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
