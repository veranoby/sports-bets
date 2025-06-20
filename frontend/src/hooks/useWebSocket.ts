// frontend/src/hooks/useWebSocket.ts - HOOKS OPTIMIZADOS ANTI-THRASHING
// ========================================================================

import { useEffect, useRef, useCallback, useMemo } from "react";
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
  const componentIdRef = useRef(`component-${Date.now()}-${Math.random()}`);
  const isMountedRef = useRef(true);
  const listenersRegisteredRef = useRef(false);

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
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
    };
  }, [shouldConnect, isConnected, roomId, joinRoom, leaveRoom]);

  // 🎧 GESTIÓN DE LISTENERS SIMPLIFICADA
  useEffect(() => {
    if (
      !shouldConnect ||
      !isConnected ||
      !listeners ||
      listenersRegisteredRef.current
    ) {
      return;
    }

    console.log(`🎧 ${componentIdRef.current} configurando listeners...`);

    // Registrar todos los listeners nuevos
    const listenersToAdd = Object.entries(listeners);

    listenersToAdd.forEach(([event, handler]) => {
      addListener(event, handler);
      listenersRefRef.current[event] = handler;
    });

    listenersRegisteredRef.current = true;

    return () => {
      if (listenersRegisteredRef.current) {
        console.log(`🧹 ${componentIdRef.current} limpiando listeners...`);

        Object.entries(listenersRefRef.current).forEach(([event, handler]) => {
          removeListener(event, handler);
        });

        listenersRefRef.current = {};
        listenersRegisteredRef.current = false;
      }
    };
  }, [shouldConnect, isConnected, addListener, removeListener]); // ✅ listeners NO es dependencia

  // 🧹 CLEANUP EN UNMOUNT
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Cleanup forzado si aún hay listeners
      if (listenersRegisteredRef.current) {
        Object.entries(listenersRefRef.current).forEach(([event, handler]) => {
          removeListener(event, handler);
        });
        listenersRefRef.current = {};
        listenersRegisteredRef.current = false;
      }
    };
  }, [removeListener]);

  // ✅ MEMOIZAR RESULTADO PARA EVITAR RE-RENDERS
  return useMemo(
    () => ({
      isConnected,
      connectionError,
      isConnecting,
      emit,
    }),
    [isConnected, connectionError, isConnecting, emit]
  );
};

// 🎯 HOOK ESPECIALIZADO PARA COMPONENTES QUE SOLO NECESITAN EMITIR
export const useWebSocketEmit = () => {
  const { emit, isConnected } = useWebSocketContext();

  return useMemo(
    () => ({
      emit,
      isConnected,
    }),
    [emit, isConnected]
  );
};

// 🏠 HOOK ESPECIALIZADO PARA GESTIÓN DE ROOMS
export const useWebSocketRoom = (roomId: string) => {
  const { isConnected, joinRoom, leaveRoom } = useWebSocketContext();
  const currentRoomRef = useRef<string | null>(null);
  const componentIdRef = useRef(`room-${Date.now()}`);

  useEffect(() => {
    if (!isConnected || !roomId) return;

    if (currentRoomRef.current !== roomId) {
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        console.log(
          `🚪 ${componentIdRef.current} salió de room: ${currentRoomRef.current}`
        );
      }

      joinRoom(roomId);
      currentRoomRef.current = roomId;
      console.log(`🏠 ${componentIdRef.current} se unió a room: ${roomId}`);
    }

    return () => {
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        console.log(
          `🧹 ${componentIdRef.current} cleanup room: ${currentRoomRef.current}`
        );
        currentRoomRef.current = null;
      }
    };
  }, [isConnected, roomId, joinRoom, leaveRoom]);

  return useMemo(() => ({ isConnected }), [isConnected]);
};

// 🎧 HOOK ESPECIALIZADO PARA LISTENERS ÚNICOS
export const useWebSocketListener = <T = any>(
  event: string,
  handler: (data: T) => void,
  dependencies: React.DependencyList = []
) => {
  const { addListener, removeListener, isConnected } = useWebSocketContext();
  const handlerRef = useRef(handler);
  const listenerRegisteredRef = useRef(false);
  const componentIdRef = useRef(`listener-${event}-${Date.now()}`);

  // Mantener handler actualizado
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Wrapper estable para el handler
  const stableHandler = useCallback((data: T) => {
    handlerRef.current(data);
  }, []);

  useEffect(() => {
    if (!isConnected || !event || listenerRegisteredRef.current) {
      return;
    }

    console.log(`🎧 ${componentIdRef.current} registrando listener: ${event}`);
    addListener(event, stableHandler);
    listenerRegisteredRef.current = true;

    return () => {
      if (listenerRegisteredRef.current) {
        console.log(
          `🧹 ${componentIdRef.current} limpiando listener: ${event}`
        );
        removeListener(event, stableHandler);
        listenerRegisteredRef.current = false;
      }
    };
  }, [
    event,
    isConnected,
    stableHandler,
    addListener,
    removeListener,
    ...dependencies,
  ]);

  return useMemo(() => ({ isConnected }), [isConnected]);
};

// 🎪 HOOK ESPECIALIZADO PARA EVENTOS (sin listeners constantes)
export const useWebSocketEvents = () => {
  const { isConnected, emit } = useWebSocketContext();

  const emitBetCreated = useCallback(
    (betData: any) => {
      return emit("bet_created", betData);
    },
    [emit]
  );

  const emitBetAccepted = useCallback(
    (betId: string) => {
      return emit("bet_accepted", { betId });
    },
    [emit]
  );

  const emitJoinFight = useCallback(
    (fightId: string) => {
      return emit("join_fight", { fightId });
    },
    [emit]
  );

  const emitLeaveFight = useCallback(
    (fightId: string) => {
      return emit("leave_fight", { fightId });
    },
    [emit]
  );

  return useMemo(
    () => ({
      isConnected,
      emitBetCreated,
      emitBetAccepted,
      emitJoinFight,
      emitLeaveFight,
    }),
    [
      isConnected,
      emitBetCreated,
      emitBetAccepted,
      emitJoinFight,
      emitLeaveFight,
    ]
  );
};

// 📊 HOOK PARA ESTADÍSTICAS DE WEBSOCKET (desarrollo)
export const useWebSocketStats = () => {
  const { isConnected, connectionError, isConnecting } = useWebSocketContext();

  return useMemo(
    () => ({
      isConnected,
      connectionError,
      isConnecting,
      status: isConnecting
        ? "connecting"
        : isConnected
        ? "connected"
        : "disconnected",
    }),
    [isConnected, connectionError, isConnecting]
  );
};
