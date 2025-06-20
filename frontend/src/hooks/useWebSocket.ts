// frontend/src/hooks/useWebSocket.ts
// 🔧 HOOK USEWEBSOCKET V3 - SIMPLIFICADO Y ROBUSTO

import { useEffect, useRef, useCallback } from "react";
import { useWebSocketContext } from "../contexts/WebSocketContext";

interface UseWebSocketOptions {
  roomId?: string;
  listeners?: Record<string, (data: any) => void>;
  shouldConnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  isConnecting: boolean;
  emit: (event: string, data?: any) => boolean;
}

// 🚀 Hook principal simplificado que usa el contexto
export const useWebSocket = (
  roomId?: string,
  listeners?: Record<string, (data: any) => void>,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  // Usar el contexto WebSocket
  const {
    isConnected,
    connectionError,
    isConnecting,
    emit,
    joinRoom,
    leaveRoom,
    addListener,
    removeListener,
  } = useWebSocketContext();

  // Referencias para evitar re-renders innecesarios
  const listenersRef = useRef<Record<string, (data: any) => void>>({});
  const currentRoomRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup al desmontar componente
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Limpiar listeners
      Object.entries(listenersRef.current).forEach(([event, handler]) => {
        removeListener(event, handler);
      });

      // Salir de room si estaba en una
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
    };
  }, []);

  // Manejar room (sala)
  useEffect(() => {
    if (!isConnected || !isMountedRef.current) return;

    // Si hay roomId y es diferente al actual
    if (roomId && roomId !== currentRoomRef.current) {
      // Salir de room anterior si existía
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
      }

      // Unirse a nueva room
      joinRoom(roomId);
      currentRoomRef.current = roomId;

      console.log(`🚪 Cambiado a sala: ${roomId}`);
    }

    // Si no hay roomId pero estábamos en una, salir
    if (!roomId && currentRoomRef.current) {
      leaveRoom(currentRoomRef.current);
      currentRoomRef.current = null;
    }
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  // Manejar listeners
  useEffect(() => {
    if (!isConnected || !listeners || !isMountedRef.current) return;

    // Remover listeners anteriores
    Object.entries(listenersRef.current).forEach(([event, handler]) => {
      removeListener(event, handler);
    });

    // Agregar nuevos listeners
    Object.entries(listeners).forEach(([event, handler]) => {
      addListener(event, handler);
    });

    // Actualizar referencia
    listenersRef.current = { ...listeners };

    console.log(`🎧 Listeners actualizados:`, Object.keys(listeners));
  }, [listeners, isConnected, addListener, removeListener]);

  // Función emit mejorada con validación
  const emitSafe = useCallback(
    (event: string, data?: any): boolean => {
      if (!isMountedRef.current) {
        console.warn("⚠️ Intento de emit en componente desmontado");
        return false;
      }

      return emit(event, data);
    },
    [emit]
  );

  return {
    isConnected,
    connectionError,
    isConnecting,
    emit: emitSafe,
  };
};

// 🎯 Hook especializado para componentes que solo necesitan estado de conexión
export const useWebSocketStatus = () => {
  const { isConnected, connectionError, isConnecting } = useWebSocketContext();

  return {
    isConnected,
    connectionError,
    isConnecting,
    status: isConnected
      ? "connected"
      : isConnecting
      ? "connecting"
      : "disconnected",
  };
};

// 🎯 Hook para emitir eventos sin listeners
export const useWebSocketEmit = () => {
  const { emit, isConnected } = useWebSocketContext();

  const emitEvent = useCallback(
    (event: string, data?: any) => {
      if (!isConnected) {
        console.warn(`⚠️ Intento de emit '${event}' sin conexión`);
        return false;
      }

      return emit(event, data);
    },
    [emit, isConnected]
  );

  return emitEvent;
};

// 🎯 Hook para unirse a una sala específica
export const useWebSocketRoom = (roomId: string) => {
  const { joinRoom, leaveRoom, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);

      return () => {
        leaveRoom(roomId);
      };
    }
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  return { isConnected };
};

// Export principal para compatibilidad
export default useWebSocket;
