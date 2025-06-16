// frontend/src/hooks/useWebSocket.ts
// 🔧 WEBSOCKET CONNECTION FIX

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface WebSocketState {
  isConnected: boolean;
  connectionError: string | null;
  retryCount: number;
  lastConnected: Date | null;
}

export const useWebSocket = (
  namespace?: string,
  listeners?: Record<string, (data: any) => void>,
  options: UseWebSocketOptions = {}
) => {
  const {
    autoConnect = true,
    reconnect = true,
    maxRetries = 5,
    retryDelay = 3000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionError: null,
    retryCount: 0,
    lastConnected: null,
  });

  // 🔧 FIX: URL correcta del WebSocket
  const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    try {
      console.log("🔌 Intentando conectar WebSocket a:", WEBSOCKET_URL);

      // 🔧 FIX: Configuración correcta de socket.io
      const socket = io(WEBSOCKET_URL + (namespace || ""), {
        transports: ["websocket", "polling"], // Fallback a polling
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true,
        reconnection: reconnect,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: retryDelay,
        autoConnect: false, // Control manual
      });

      socketRef.current = socket;

      // 🔧 FIX: Event listeners básicos
      socket.on("connect", () => {
        console.log("✅ WebSocket conectado exitosamente");
        updateState({
          isConnected: true,
          connectionError: null,
          retryCount: 0,
          lastConnected: new Date(),
        });
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ WebSocket desconectado:", reason);
        updateState({
          isConnected: false,
          connectionError: `Desconectado: ${reason}`,
        });
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Error de conexión WebSocket:", error);
        updateState({
          isConnected: false,
          connectionError: error.message,
          retryCount: state.retryCount + 1,
        });

        // 🔧 FIX: Retry lógico
        if (reconnect && state.retryCount < maxRetries) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `🔄 Reintentando conexión (${state.retryCount + 1}/${maxRetries})`
            );
            socket.connect();
          }, retryDelay);
        }
      });

      // 🔧 FIX: Registrar listeners personalizados
      if (listeners) {
        Object.entries(listeners).forEach(([event, handler]) => {
          socket.on(event, handler);
        });
      }

      // Conectar si autoConnect está habilitado
      if (autoConnect) {
        socket.connect();
      }
    } catch (error) {
      console.error("❌ Error al crear socket:", error);
      updateState({
        connectionError: (error as Error).message,
      });
    }
  }, [
    WEBSOCKET_URL,
    namespace,
    listeners,
    autoConnect,
    reconnect,
    maxRetries,
    retryDelay,
    state.retryCount,
    updateState,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    updateState({
      isConnected: false,
      connectionError: null,
      retryCount: 0,
    });
  }, [updateState]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("⚠️ No se puede emitir - Socket no conectado");
    }
  }, []);

  const forceReconnect = useCallback(() => {
    disconnect();
    setState((prev) => ({ ...prev, retryCount: 0 }));
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // 🔧 FIX: useEffect con dependencias correctas
  useEffect(() => {
    connect();
    return disconnect;
  }, []); // Solo al montar/desmontar

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    retryCount: state.retryCount,
    lastConnected: state.lastConnected,
    connect,
    disconnect,
    emit,
    forceReconnect,
  };
};
