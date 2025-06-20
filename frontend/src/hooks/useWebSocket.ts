// frontend/src/hooks/useWebSocket.ts - VERSIÓN OPTIMIZADA
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// Singleton WebSocket instance - UNA SOLA INSTANCIA GLOBAL
let globalSocket: Socket | null = null;
let globalConnectionPromise: Promise<Socket> | null = null;
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

interface WebSocketState {
  isConnected: boolean;
  connectionError: string | null;
  isConnecting: boolean;
}

// Hook optimizado - NO reconecta innecesariamente
export const useWebSocket = (
  roomId?: string,
  listeners?: Record<string, (data: any) => void>
) => {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionError: null,
    isConnecting: false,
  });

  const listenersRef = useRef<Record<string, (data: any) => void>>({});
  const roomRef = useRef<string | undefined>();
  const mountedRef = useRef(true);

  // Función para crear conexión única
  const createConnection = useCallback(async (): Promise<Socket> => {
    if (globalSocket?.connected) {
      return globalSocket;
    }

    if (globalConnectionPromise) {
      return globalConnectionPromise;
    }

    const WEBSOCKET_URL =
      import.meta.env.VITE_WS_URL || "http://localhost:3001";

    globalConnectionPromise = new Promise((resolve, reject) => {
      connectionAttempts++;
      console.log(
        `🔌 Creando conexión WebSocket única (intento ${connectionAttempts})`
      );

      const socket = io(WEBSOCKET_URL, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        reconnection: false, // Manejamos reconexiones manualmente
        forceNew: false, // Reutilizar conexión existente
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error("Timeout de conexión"));
      }, 10000);

      socket.on("connect", () => {
        clearTimeout(timeout);
        globalSocket = socket;
        globalConnectionPromise = null;
        connectionAttempts = 0;
        console.log("✅ WebSocket conectado globalmente");
        resolve(socket);
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 WebSocket desconectado:", reason);
        globalSocket = null;
        globalConnectionPromise = null;
      });

      socket.on("connect_error", (error) => {
        clearTimeout(timeout);
        globalConnectionPromise = null;

        if (connectionAttempts < MAX_RETRIES) {
          console.log(
            `🔄 Reintentando conexión en ${RETRY_DELAY}ms (${connectionAttempts}/${MAX_RETRIES})`
          );
          setTimeout(() => {
            createConnection().then(resolve).catch(reject);
          }, RETRY_DELAY);
        } else {
          console.error(`❌ Falló después de ${MAX_RETRIES} intentos`);
          reject(error);
        }
      });
    });

    return globalConnectionPromise;
  }, []);

  // Actualizar estado de forma segura
  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Conectar y configurar listeners
  const connect = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      updateState({ isConnecting: true, connectionError: null });

      const socket = await createConnection();

      if (!mountedRef.current) return;

      // Limpiar listeners previos de este hook únicamente
      Object.keys(listenersRef.current).forEach((event) => {
        socket.off(event, listenersRef.current[event]);
      });

      // Agregar nuevos listeners
      if (listeners) {
        Object.entries(listeners).forEach(([event, handler]) => {
          socket.on(event, handler);
          listenersRef.current[event] = handler;
        });
      }

      // Unirse a room si se especifica
      if (roomId && roomId !== roomRef.current) {
        if (roomRef.current) {
          socket.emit("leave-room", roomRef.current);
        }
        socket.emit("join-room", roomId);
        roomRef.current = roomId;
      }

      updateState({
        isConnected: true,
        isConnecting: false,
        connectionError: null,
      });
    } catch (error) {
      if (mountedRef.current) {
        updateState({
          isConnected: false,
          isConnecting: false,
          connectionError: (error as Error).message,
        });
      }
    }
  }, [roomId, listeners, createConnection, updateState]);

  // Función emit optimizada
  const emit = useCallback((event: string, data?: any) => {
    if (globalSocket?.connected) {
      globalSocket.emit(event, data);
      return true;
    }
    return false;
  }, []);

  // Cleanup al desmontar
  const cleanup = useCallback(() => {
    if (!globalSocket) return;

    // Salir de room
    if (roomRef.current) {
      globalSocket.emit("leave-room", roomRef.current);
      roomRef.current = undefined;
    }

    // Remover listeners de este hook específico
    Object.keys(listenersRef.current).forEach((event) => {
      globalSocket!.off(event, listenersRef.current[event]);
    });

    listenersRef.current = {};
  }, []);

  // Effect principal - SOLO conecta una vez
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []); // SIN DEPENDENCIAS - evita reconexiones

  // Effect separado para actualizar listeners - SIN reconectar
  useEffect(() => {
    if (globalSocket?.connected && listeners) {
      // Remover listeners previos
      Object.keys(listenersRef.current).forEach((event) => {
        globalSocket!.off(event, listenersRef.current[event]);
      });

      // Agregar nuevos listeners
      Object.entries(listeners).forEach(([event, handler]) => {
        globalSocket!.on(event, handler);
        listenersRef.current[event] = handler;
      });
    }
  }, [listeners]);

  // Effect para room changes - SIN reconectar
  useEffect(() => {
    if (globalSocket?.connected && roomId && roomId !== roomRef.current) {
      if (roomRef.current) {
        globalSocket.emit("leave-room", roomRef.current);
      }
      globalSocket.emit("join-room", roomId);
      roomRef.current = roomId;
    }
  }, [roomId]);

  return {
    isConnected: state.isConnected,
    connectionError: state.connectionError,
    isConnecting: state.isConnecting,
    emit,
    socket: globalSocket,
  };
};
