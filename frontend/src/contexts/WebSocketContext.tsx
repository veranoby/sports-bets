// frontend/src/contexts/WebSocketContext.tsx
// 🚀 WEBSOCKET CONTEXT V3 - OPTIMIZACIÓN COMPLETA

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
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

  // Referencia al socket global
  const [socket, setSocket] = useState<any>(null);

  // Función para crear/obtener conexión WebSocket
  const getSocket = async () => {
    if (!isAuthenticated || !token) {
      return null;
    }

    // Si ya tenemos socket conectado, devolverlo
    if (socket?.connected) {
      return socket;
    }

    // Importación dinámica para evitar problemas de SSR
    const { io } = await import("socket.io-client");

    const WEBSOCKET_URL =
      import.meta.env.VITE_WS_URL || "http://localhost:3001";

    const newSocket = io(WEBSOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 10000,
      forceNew: false,
      auth: {
        token: token, // Enviar token para autenticación
      },
      query: {
        userId: token, // También en query como backup
      },
    });

    // Configurar listeners básicos
    newSocket.on("connect", () => {
      console.log("✅ WebSocket conectado:", newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 WebSocket desconectado:", reason);
      setIsConnected(false);
      setIsConnecting(false);

      // Solo mostrar error si no fue desconexión intencional
      if (reason !== "io client disconnect") {
        setConnectionError(`Desconectado: ${reason}`);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Error de conexión WebSocket:", error);
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(error.message || "Error de conexión");
    });

    // Eventos específicos de la aplicación
    newSocket.on("auth_error", (data) => {
      console.error("🚫 Error de autenticación WebSocket:", data);
      setConnectionError("Error de autenticación");
    });

    setSocket(newSocket);
    return newSocket;
  };

  // Efecto para manejar conexión basada en autenticación
  useEffect(() => {
    if (isAuthenticated && token) {
      setIsConnecting(true);
      setConnectionError(null);

      getSocket().catch((error) => {
        console.error("Error getting socket:", error);
        setIsConnecting(false);
        setConnectionError(error.message);
      });
    } else {
      // Desconectar si no está autenticado
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(null);
    }

    // Cleanup al desmontar
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  // Funciones del contexto
  const emit = (event: string, data?: any): boolean => {
    if (!socket || !socket.connected) {
      console.warn("⚠️ Intento de emit sin conexión WebSocket");
      return false;
    }

    socket.emit(event, data);
    return true;
  };

  const joinRoom = (roomId: string) => {
    if (socket?.connected) {
      socket.emit("join_room", roomId);
      console.log(`🚪 Uniéndose a sala: ${roomId}`);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket?.connected) {
      socket.emit("leave_room", roomId);
      console.log(`🚪 Saliendo de sala: ${roomId}`);
    }
  };

  const addListener = (event: string, handler: (data: any) => void) => {
    if (socket) {
      socket.on(event, handler);
      console.log(`🎧 Listener agregado para: ${event}`);
    }
  };

  const removeListener = (event: string, handler: (data: any) => void) => {
    if (socket) {
      socket.off(event, handler);
      console.log(`🎧 Listener removido para: ${event}`);
    }
  };

  // Valor del contexto
  const contextValue: WebSocketContextType = {
    isConnected,
    connectionError,
    isConnecting,
    emit,
    joinRoom,
    leaveRoom,
    addListener,
    removeListener,
  };

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
