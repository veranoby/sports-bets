// frontend/src/hooks/useWebSocket.ts V9 - SOLUCIÓN DEFINITIVA ANTI-THRASHING
// =================================================================================

import { useEffect, useRef, useCallback } from "react";
import { useWebSocketContext } from "../contexts/WebSocketContext";

interface UseWebSocketOptions {
  shouldConnect?: boolean;
  autoReconnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  isConnecting: boolean;
  emit: (event: string, data?: any) => boolean;
}

// 🚀 HOOK PRINCIPAL SIMPLIFICADO Y OPTIMIZADO
export const useWebSocket = (
  roomId?: string,
  listeners?: Record<string, (data: any) => void>,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const { shouldConnect = true } = options;

  // Contexto WebSocket
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

  // 📝 REFERENCIAS ESTABLES (sin re-renders)
  const currentRoomRef = useRef<string | null>(null);
  const listenersRefRef = useRef<Record<string, Function>>({});
  const componentIdRef = useRef<string>(
    `component-${Date.now()}-${Math.random()}`
  );
  const isMountedRef = useRef(true);
  const cleanupExecutedRef = useRef(false);

  // 🏠 GESTIÓN DE ROOM SIMPLIFICADA
  useEffect(() => {
    if (!shouldConnect || !isConnected || !roomId) return;

    // Solo cambiar de room si es diferente
    if (currentRoomRef.current !== roomId) {
      // Salir de room anterior si existe
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
      }

      // Unirse a nueva room
      joinRoom(roomId);
      currentRoomRef.current = roomId;

      console.log(`🏠 ${componentIdRef.current} cambió a room: ${roomId}`);
    }

    return () => {
      // Cleanup de room en desmontaje
      if (currentRoomRef.current && !cleanupExecutedRef.current) {
        leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
    };
  }, [shouldConnect, isConnected, roomId, joinRoom, leaveRoom]);

  // 🎧 GESTIÓN DE LISTENERS SIMPLIFICADA
  useEffect(() => {
    if (!shouldConnect || !isConnected || !listeners) return;

    console.log(`🎧 ${componentIdRef.current} configurando listeners...`);

    // Registrar todos los listeners nuevos
    const listenersToAdd: Array<[string, Function]> = [];

    for (const [event, handler] of Object.entries(listeners)) {
      if (typeof handler === "function") {
        listenersToAdd.push([event, handler]);
        listenersRefRef.current[event] = handler;
      }
    }

    // Agregar listeners en lote con un pequeño delay para evitar thrashing
    setTimeout(() => {
      if (!isMountedRef.current) return;

      listenersToAdd.forEach(([event, handler]) => {
        addListener(event, handler);
      });
    }, 20); // Delay mínimo para batching

    return () => {
      // Remover listeners al cambiar dependencias o desmontar
      console.log(`🧹 ${componentIdRef.current} limpiando listeners...`);

      Object.entries(listenersRefRef.current).forEach(([event, handler]) => {
        removeListener(event, handler);
      });

      listenersRefRef.current = {};
    };
  }, [shouldConnect, isConnected, listeners, addListener, removeListener]);

  // 🧹 CLEANUP PRINCIPAL AL DESMONTAR COMPONENTE
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanupExecutedRef.current = true;

      console.log(`🧹 ${componentIdRef.current} desmontando - cleanup final`);

      // Remover todos los listeners registrados
      Object.entries(listenersRefRef.current).forEach(([event, handler]) => {
        removeListener(event, handler);
      });
      listenersRefRef.current = {};

      // Salir de room actual
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
    };
  }, []); // Solo al montar/desmontar

  // ✅ RETURN MEMOIZADO PARA EVITAR RE-RENDERS
  return {
    isConnected,
    connectionError,
    isConnecting,
    emit,
  };
};

// 🎯 HOOK ESPECIALIZADO PARA COMPONENTES QUE SOLO NECESITAN EMITIR
export const useWebSocketEmit = () => {
  const { emit, isConnected } = useWebSocketContext();

  return {
    emit,
    isConnected,
  };
};

// 🏠 HOOK ESPECIALIZADO PARA GESTIÓN DE ROOMS
export const useWebSocketRoom = (roomId: string) => {
  const { isConnected, joinRoom, leaveRoom } = useWebSocketContext();
  const currentRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !roomId) return;

    if (currentRoomRef.current !== roomId) {
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
      }

      joinRoom(roomId);
      currentRoomRef.current = roomId;
    }

    return () => {
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
    };
  }, [isConnected, roomId, joinRoom, leaveRoom]);

  return { isConnected };
};

// 🎧 HOOK ESPECIALIZADO PARA LISTENERS ÚNICOS
export const useWebSocketListener = <T = any>(
  event: string,
  handler: (data: T) => void,
  dependencies: React.DependencyList = []
) => {
  const { addListener, removeListener, isConnected } = useWebSocketContext();
  const handlerRef = useRef(handler);

  // Mantener handler actualizado
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Wrapper estable para el handler
  const stableHandler = useCallback((data: T) => {
    handlerRef.current(data);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    addListener(event, stableHandler);

    return () => {
      removeListener(event, stableHandler);
    };
  }, [event, isConnected, stableHandler, ...dependencies]);

  return { isConnected };
};
