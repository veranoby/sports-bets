// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  emit: (event: string, data?: any) => void;
  reconnect: () => void;
}

/**
 * Hook para manejar conexiones WebSocket con Socket.IO
 * @param url URL del servidor (opcional)
 * @param listeners Objeto con eventos y sus handlers
 * @returns Estado de conexión y métodos para interactuar
 */
export const useWebSocket = (
  url?: string,
  listeners?: Record<string, (...args: any[]) => void>
): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Referencias para evitar re-renders innecesarios
  const listenersRef = useRef(listeners);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Actualizar listeners sin recrear el socket
  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  // Función para crear/recrear la conexión
  const createConnection = useCallback(() => {
    const socketUrl = url || "http://localhost:3001";

    console.log(`🔌 Intentando conectar WebSocket a: ${socketUrl}`);

    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"], // Fallback a polling si WebSocket falla
      timeout: 5000,
      forceNew: true,
    });

    // Evento de conexión exitosa
    newSocket.on("connect", () => {
      console.log("✅ WebSocket conectado:", newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
    });

    // Evento de desconexión
    newSocket.on("disconnect", (reason) => {
      console.log("❌ WebSocket desconectado:", reason);
      setIsConnected(false);

      // Intentar reconexión automática solo si no fue intencional
      if (reason !== "io client disconnect") {
        scheduleReconnect();
      }
    });

    // Evento de error de conexión
    newSocket.on("connect_error", (error) => {
      console.error("🚨 Error de conexión WebSocket:", error.message);
      setConnectionError(error.message);
      setIsConnected(false);
      scheduleReconnect();
    });

    // Registrar listeners dinámicos
    if (listenersRef.current) {
      Object.entries(listenersRef.current).forEach(([event, handler]) => {
        newSocket.on(event, handler);
      });
    }

    setSocket(newSocket);
    return newSocket;
  }, [url]);

  // Función para programar reconexión
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttempts.current),
        10000
      );

      console.log(
        `🔄 Intentando reconexión en ${delay}ms (intento ${
          reconnectAttempts.current + 1
        }/${maxReconnectAttempts})`
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        createConnection();
      }, delay);
    } else {
      setConnectionError("Máximo número de intentos de reconexión alcanzado");
    }
  }, [createConnection]);

  // Función para reconexión manual
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttempts.current = 0;
    setConnectionError(null);

    if (socket) {
      socket.disconnect();
    }

    createConnection();
  }, [socket, createConnection]);

  // Función para emitir eventos
  const emit = useCallback(
    (event: string, data?: any) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn(
          "⚠️ Intentando emitir evento pero WebSocket no está conectado:",
          event
        );
      }
    },
    [socket, isConnected]
  );

  // Efecto principal para crear la conexión
  useEffect(() => {
    const currentSocket = createConnection();

    // Cleanup al desmontar el componente
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (currentSocket) {
        // Remover listeners específicos
        if (listenersRef.current) {
          Object.entries(listenersRef.current).forEach(([event, handler]) => {
            currentSocket.off(event, handler);
          });
        }

        currentSocket.disconnect();
      }
    };
  }, []); // Solo se ejecuta al montar/desmontar

  // Efecto para actualizar listeners cuando cambian
  useEffect(() => {
    if (socket && listenersRef.current) {
      // Remover listeners anteriores
      socket.removeAllListeners();

      // Re-agregar listeners del sistema
      socket.on("connect", () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      });

      socket.on("disconnect", (reason) => {
        setIsConnected(false);
        if (reason !== "io client disconnect") {
          scheduleReconnect();
        }
      });

      socket.on("connect_error", (error) => {
        setConnectionError(error.message);
        setIsConnected(false);
        scheduleReconnect();
      });

      // Agregar listeners del usuario
      Object.entries(listenersRef.current).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
    }
  }, [socket, listeners, scheduleReconnect]);

  return {
    socket,
    isConnected,
    connectionError,
    emit,
    reconnect,
  };
};
