import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

/**
 * useWebSocket
 * Hook para conexión WebSocket con listeners dinámicos y limpieza automática.
 * @param url URL del servidor WebSocket
 * @param listeners Objeto { [eventName]: handler } para registrar listeners
 */
export const useWebSocket = (
  url: string = "http://localhost:3001",
  listeners?: Record<string, (...args: unknown[]) => void>
) => {
  // Si el tipado de Socket da error, usar 'any' para el estado del socket
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(listeners);

  // Mantener referencia actualizada de listeners
  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  useEffect(() => {
    const newSocket = io(url);

    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));
    setSocket(newSocket);

    // Registrar listeners dinámicos
    if (listenersRef.current) {
      Object.entries(listenersRef.current).forEach(([event, handler]) => {
        newSocket.on(event, handler);
      });
    }

    // Cleanup: quitar listeners y cerrar socket
    return () => {
      if (listenersRef.current) {
        Object.entries(listenersRef.current).forEach(([event, handler]) => {
          newSocket.off(event, handler);
        });
      }
      newSocket.close();
    };
  }, [url, listeners]);

  return { socket, isConnected };
};
