// frontend/src/hooks/useWebSocket.ts
// 🔧 WEBSOCKET HOOK FIXED - Sin loops setState

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

  // 🔧 FIX: useRef para evitar re-renders
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef(listeners);
  const mountedRef = useRef(true);

  // 🔧 FIX: Estado inicial estable
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionError: null,
    retryCount: 0,
    lastConnected: null,
  });

  // URL del WebSocket
  const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

  // 🔧 FIX: updateState con useCallback y verificación de mounted
  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 🔧 FIX: Actualizar listeners ref sin causar re-render
  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  // 🔧 FIX: Connect function estable
  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Si ya existe un socket, no crear otro
    if (socketRef.current?.connected) return;

    try {
      console.log("🔌 Conectando WebSocket:", WEBSOCKET_URL);

      const socket = io(WEBSOCKET_URL + (namespace || ""), {
        transports: ["websocket", "polling"],
        upgrade: true,
        timeout: 20000,
        forceNew: false, // 🔧 FIX: No forzar nueva conexión
        reconnection: reconnect,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: retryDelay,
        autoConnect: false,
      });

      socketRef.current = socket;

      // Event listeners
      socket.on("connect", () => {
        if (!mountedRef.current) return;
        console.log("✅ WebSocket conectado");
        updateState({
          isConnected: true,
          connectionError: null,
          retryCount: 0,
          lastConnected: new Date(),
        });
      });

      socket.on("disconnect", (reason) => {
        if (!mountedRef.current) return;
        console.log("❌ WebSocket desconectado:", reason);
        updateState({
          isConnected: false,
          connectionError: `Desconectado: ${reason}`,
        });
      });

      socket.on("connect_error", (error) => {
        if (!mountedRef.current) return;
        console.error("❌ Error WebSocket:", error);

        setState((prev) => {
          const newRetryCount = prev.retryCount + 1;

          // 🔧 FIX: Retry lógica mejorada
          if (reconnect && newRetryCount <= maxRetries) {
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                console.log(`🔄 Reintento ${newRetryCount}/${maxRetries}`);
                socket.connect();
              }
            }, retryDelay);
          }

          return {
            ...prev,
            isConnected: false,
            connectionError: error.message,
            retryCount: newRetryCount,
          };
        });
      });

      // 🔧 FIX: Aplicar listeners de manera estable
      if (listenersRef.current) {
        Object.entries(listenersRef.current).forEach(([event, handler]) => {
          socket.on(event, handler);
        });
      }

      // Conectar si autoConnect está habilitado
      if (autoConnect) {
        socket.connect();
      }
    } catch (error) {
      console.error("❌ Error creando socket:", error);
      if (mountedRef.current) {
        updateState({
          connectionError: (error as Error).message,
        });
      }
    }
  }, [
    WEBSOCKET_URL,
    namespace,
    autoConnect,
    reconnect,
    maxRetries,
    retryDelay,
    updateState,
  ]);

  // 🔧 FIX: Disconnect function estable
  const disconnect = useCallback(() => {
    // Limpiar timeout de reconexión
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Desconectar socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Actualizar estado solo si está montado
    if (mountedRef.current) {
      updateState({
        isConnected: false,
        connectionError: null,
        retryCount: 0,
      });
    }
  }, [updateState]);

  // 🔧 FIX: Emit function estable
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    } else {
      console.warn("⚠️ No se puede emitir - Socket no conectado");
      return false;
    }
  }, []);

  // 🔧 FIX: Force reconnect function estable
  const forceReconnect = useCallback(() => {
    disconnect();
    setState((prev) => ({ ...prev, retryCount: 0 }));
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect]);

  // 🔧 FIX: useEffect principal SIN dependencias problemáticas
  useEffect(() => {
    mountedRef.current = true;
    connect();

    // Cleanup function
    return () => {
      mountedRef.current = false;

      // Limpiar timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Desconectar socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // 🔧 FIX: Array de dependencias VACÍO para evitar loops

  // 🔧 FIX: useEffect separado para actualizar listeners sin reconectar
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && listeners) {
      // Remover listeners anteriores
      socket.removeAllListeners();

      // Agregar listeners del sistema
      socket.on("connect", () => {
        if (!mountedRef.current) return;
        updateState({
          isConnected: true,
          connectionError: null,
          retryCount: 0,
          lastConnected: new Date(),
        });
      });

      socket.on("disconnect", (reason) => {
        if (!mountedRef.current) return;
        updateState({
          isConnected: false,
          connectionError: `Desconectado: ${reason}`,
        });
      });

      // Agregar listeners personalizados
      Object.entries(listeners).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
    }
  }, [listeners, updateState]);

  return {
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    retryCount: state.retryCount,
    lastConnected: state.lastConnected,
    connect,
    disconnect,
    emit,
    forceReconnect,
    // 🔧 NEW: Función para verificar si está realmente conectado
    isReallyConnected: () => socketRef.current?.connected || false,
  };
};
