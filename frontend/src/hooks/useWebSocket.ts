// frontend/src/hooks/useWebSocket.ts
// 🔧 WEBSOCKET HOOK COMPLETO - Mantiene todas las funcionalidades + Fix loops

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  forceNew?: boolean;
  timeout?: number;
}

interface WebSocketState {
  isConnected: boolean;
  connectionError: string | null;
  retryCount: number;
  lastConnected: Date | null;
  reconnecting: boolean;
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
    forceNew = false,
    timeout = 20000,
  } = options;

  // Refs para prevenir re-renders y memory leaks
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef(listeners);
  const mountedRef = useRef(true);
  const connectionAttemptsRef = useRef(0);

  // Estado con manejo avanzado
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionError: null,
    retryCount: 0,
    lastConnected: null,
    reconnecting: false,
  });

  // URL del WebSocket
  const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

  // 🔧 FIX: updateState seguro
  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 🔧 Mantener listeners actualizados sin reconectar
  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  // 🔧 FUNCIÓN DE CONEXIÓN PRINCIPAL
  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Prevenir múltiples conexiones
    if (socketRef.current?.connected) {
      console.log("🔌 Socket ya conectado, omitiendo conexión");
      return;
    }

    // Incrementar intentos SOLO si no hay socket o está desconectado
    if (!socketRef.current) {
      connectionAttemptsRef.current++;
      console.log(
        `🔌 Intento de conexión #${connectionAttemptsRef.current} - WebSocket: ${WEBSOCKET_URL}`
      );
    }

    try {
      updateState({ reconnecting: true });

      const socket = io(WEBSOCKET_URL + (namespace || ""), {
        transports: ["websocket", "polling"],
        upgrade: true,
        timeout,
        forceNew,
        reconnection: false, // 🔧 MANEJAMOS NOSOTROS LAS RECONEXIONES
        autoConnect: false,
      });

      socketRef.current = socket;

      // 🔧 EVENTOS DEL SISTEMA
      socket.on("connect", () => {
        if (!mountedRef.current) return;
        console.log("✅ WebSocket conectado exitosamente");
        connectionAttemptsRef.current = 0; // Reset attempts en éxito
        updateState({
          isConnected: true,
          connectionError: null,
          retryCount: 0,
          lastConnected: new Date(),
          reconnecting: false,
        });
      });

      socket.on("disconnect", (reason) => {
        if (!mountedRef.current) return;
        console.log("❌ WebSocket desconectado:", reason);
        updateState({
          isConnected: false,
          connectionError: `Desconectado: ${reason}`,
          reconnecting: false,
        });

        // 🔧 AUTO-RECONEXIÓN INTELIGENTE
        if (reconnect && reason !== "io client disconnect") {
          scheduleReconnect();
        }
      });

      socket.on("connect_error", (error) => {
        if (!mountedRef.current) return;
        console.error("❌ Error de conexión WebSocket:", error.message);

        setState((prev) => {
          const newRetryCount = prev.retryCount + 1;

          updateState({
            isConnected: false,
            connectionError: error.message,
            retryCount: newRetryCount,
            reconnecting: false,
          });

          // Programar reintento si no hemos excedido máximo
          if (reconnect && newRetryCount < maxRetries) {
            scheduleReconnect();
          } else if (newRetryCount >= maxRetries) {
            console.error(`❌ Máximo de reintentos alcanzado (${maxRetries})`);
          }

          return prev;
        });
      });

      // 🔧 APLICAR LISTENERS PERSONALIZADOS
      if (listenersRef.current) {
        Object.entries(listenersRef.current).forEach(([event, handler]) => {
          socket.on(event, handler);
        });
      }

      // 🔧 CONECTAR SI AUTO-CONNECT HABILITADO
      if (autoConnect) {
        socket.connect();
      }
    } catch (error) {
      console.error("❌ Error crítico creando socket:", error);
      if (mountedRef.current) {
        updateState({
          connectionError: (error as Error).message,
          reconnecting: false,
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
    timeout,
    forceNew,
    updateState,
  ]);

  // 🔧 FUNCIÓN DE RECONEXIÓN PROGRAMADA
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const currentRetryCount = state.retryCount;
    const delay = retryDelay * Math.pow(1.5, currentRetryCount); // Exponential backoff

    console.log(
      `🔄 Programando reconexión en ${delay}ms (intento ${
        currentRetryCount + 1
      }/${maxRetries})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !socketRef.current?.connected) {
        console.log(`🔄 Ejecutando reconexión...`);
        connect();
      }
    }, delay);
  }, [state.retryCount, retryDelay, maxRetries, connect]);

  // 🔧 FUNCIÓN DE DESCONEXIÓN
  const disconnect = useCallback(() => {
    console.log("🔌 Desconectando WebSocket...");

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

    // Reset estado
    if (mountedRef.current) {
      updateState({
        isConnected: false,
        connectionError: null,
        retryCount: 0,
        reconnecting: false,
      });
    }

    connectionAttemptsRef.current = 0;
  }, [updateState]);

  // 🔧 FUNCIÓN EMIT MEJORADA
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    } else {
      console.warn(
        `⚠️ No se puede emitir evento '${event}' - Socket no conectado`
      );
      return false;
    }
  }, []);

  // 🔧 FUNCIÓN DE RECONEXIÓN FORZADA
  const forceReconnect = useCallback(() => {
    console.log("🔄 Forzando reconexión...");
    disconnect();
    updateState({ retryCount: 0 });

    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect, updateState]);

  // 🔧 FUNCIÓN PARA UNIRSE A ROOM
  const joinRoom = useCallback(
    (room: string) => {
      return emit("join-room", room);
    },
    [emit]
  );

  // 🔧 FUNCIÓN PARA SALIR DE ROOM
  const leaveRoom = useCallback(
    (room: string) => {
      return emit("leave-room", room);
    },
    [emit]
  );

  // 🔧 USEEFFECT PRINCIPAL - SOLO SE EJECUTA UNA VEZ
  useEffect(() => {
    mountedRef.current = true;
    connect();

    // 🔧 CLEANUP AL DESMONTAR COMPONENTE
    return () => {
      console.log("🧹 Limpiando WebSocket hook...");
      mountedRef.current = false;

      // Limpiar timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Desconectar socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // 🔧 FIX: DEPENDENCIAS VACÍAS PARA EVITAR LOOPS

  // 🔧 USEEFFECT SEPARADO PARA ACTUALIZAR LISTENERS SIN RECONECTAR
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && listeners) {
      // 🔧 ACTUALIZAR LISTENERS SIN REMOVER TODOS
      Object.entries(listeners).forEach(([event, handler]) => {
        // Remover listener previo solo para este evento específico
        socket.off(event);
        // Agregar nuevo listener
        socket.on(event, handler);
      });
    }
  }, [listeners]);

  // 🔧 FUNCIONES DE UTILIDAD ADICIONALES
  const getConnectionStatus = useCallback(() => {
    return {
      connected: socketRef.current?.connected || false,
      socket: socketRef.current,
      attempts: connectionAttemptsRef.current,
      ...state,
    };
  }, [state]);

  // 🔧 RETURN INTERFACE COMPLETA
  return {
    // Estado
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    retryCount: state.retryCount,
    lastConnected: state.lastConnected,
    reconnecting: state.reconnecting,

    // Funciones de control
    connect,
    disconnect,
    forceReconnect,

    // Comunicación
    emit,
    joinRoom,
    leaveRoom,

    // Utilidades
    getConnectionStatus,
    isReallyConnected: () => socketRef.current?.connected || false,

    // Socket directo (para casos especiales)
    socket: socketRef.current,
  };
};
