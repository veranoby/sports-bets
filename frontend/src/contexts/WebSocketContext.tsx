// frontend/src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

interface WebSocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  isConnecting: boolean;
  emit: (event: string, data?: any) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const websocket = useWebSocket();

  return (
    <WebSocketContext.Provider value={websocket}>
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
