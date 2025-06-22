// frontend/src/hooks/useWebSocket.ts - VERSIÓN SIMPLIFICADA
// ==============================================================

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useWebSocketContext } from "../contexts/WebSocketContext";

// 🎯 HOOK PRINCIPAL - SIMPLIFICADO Y OPTIMIZADO
export const useWebSocket = (
  roomId?: string,
  listeners?: Record<string, (data: any) => void>
) => {
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

  // Referencias estables para evitar re-renders
  const currentRoomRef = useRef<string | null>(null);
  const listenersRef = useRef<Record<string, () => void>>({});
  const componentIdRef = useRef(
    `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  );

  // 🏠 GESTIÓN DE ROOM - Simplificada
  useEffect(() => {
    if (!isConnected || !roomId || currentRoomRef.current === roomId) {
      return;
    }

    // Salir de room anterior
    if (currentRoomRef.current) {
      leaveRoom(currentRoomRef.current);
      console.log(
        `🚪 ${componentIdRef.current} salió de room: ${currentRoomRef.current}`
      );
    }

    // Entrar a nueva room
    joinRoom(roomId);
    currentRoomRef.current = roomId;
    console.log(`🏠 ${componentIdRef.current} entró a room: ${roomId}`);

    return () => {
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
    };
  }, [isConnected, roomId, joinRoom, leaveRoom]);

  // 🎧 GESTIÓN DE LISTENERS - Simplificada
  useEffect(() => {
    if (!isConnected || !listeners) {
      return;
    }

    console.log(
      `🎧 ${componentIdRef.current} registrando listeners:`,
      Object.keys(listeners)
    );

    // Registrar todos los listeners
    Object.entries(listeners).forEach(([event, handler]) => {
      const cleanup = addListener(event, handler);
      listenersRef.current[event] = cleanup;
    });

    return () => {
      console.log(`🧹 ${componentIdRef.current} limpiando listeners`);

      // Limpiar todos los listeners
      Object.values(listenersRef.current).forEach((cleanup) => cleanup());
      listenersRef.current = {};
    };
  }, [isConnected, addListener]); // ✅ listeners NO es dependencia para evitar re-registros

  // 📤 FUNCIONES DE EMISIÓN - Memoizadas
  const emitEvent = useCallback(
    (event: string, data?: any) => {
      if (!isConnected) {
        console.warn(
          `⚠️ ${componentIdRef.current} - Socket no conectado para emitir: ${event}`
        );
        return false;
      }
      return emit(event, data);
    },
    [isConnected, emit]
  );

  // ✅ RESULTADO MEMOIZADO para evitar re-renders
  return useMemo(
    () => ({
      isConnected,
      connectionError,
      isConnecting,
      emit: emitEvent,

      // Estados de conexión
      status: isConnecting
        ? "connecting"
        : isConnected
        ? "connected"
        : "disconnected",

      // Metadata para debugging
      componentId: componentIdRef.current,
      currentRoom: currentRoomRef.current,
    }),
    [isConnected, connectionError, isConnecting, emitEvent]
  );
};

// 🎯 HOOK ESPECIALIZADO PARA COMPONENTES QUE SOLO EMITEN
export const useWebSocketEmit = () => {
  const { emit, isConnected } = useWebSocketContext();

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

// 🎧 HOOK PARA LISTENER ÚNICO (más simple que el anterior)
export const useWebSocketListener = <T = any>(
  event: string,
  handler: (data: T) => void,
  dependencies: any[] = []
) => {
  const { isConnected, addListener } = useWebSocketContext();
  const componentIdRef = useRef(`listener-${event}-${Date.now()}`);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Handler estable - memoizado con dependencias
  const stableHandler = useCallback(handler, dependencies);

  useEffect(() => {
    if (!event || !isConnected) {
      return;
    }

    console.log(
      `🎧 ${componentIdRef.current} - Registrando listener: ${event}`
    );

    // Registrar listener y guardar cleanup
    cleanupRef.current = addListener(event, stableHandler);

    return () => {
      if (cleanupRef.current) {
        console.log(
          `🧹 ${componentIdRef.current} - Limpiando listener: ${event}`
        );
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [event, isConnected, stableHandler, addListener]);

  return useMemo(
    () => ({
      isConnected,
      componentId: componentIdRef.current,
    }),
    [isConnected]
  );
};

// 🏠 HOOK PARA GESTIÓN DE ROOMS (opcional, solo si necesitas control granular)
export const useWebSocketRoom = (roomId: string) => {
  const { isConnected, joinRoom, leaveRoom } = useWebSocketContext();
  const currentRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !roomId) return;

    if (currentRoomRef.current !== roomId) {
      // Salir de room anterior
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
      }

      // Entrar a nueva room
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

  return useMemo(
    () => ({
      isConnected,
      currentRoom: currentRoomRef.current,
    }),
    [isConnected]
  );
};

// 📊 HOOK PARA ESTADÍSTICAS (desarrollo/debugging)
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
      timestamp: Date.now(),
    }),
    [isConnected, connectionError, isConnecting]
  );
};

// 🎯 HOOK PARA MÚLTIPLES LISTENERS (alternativa al objeto de listeners)
export const useWebSocketListeners = (
  listeners: Array<{
    event: string;
    handler: (data: any) => void;
    dependencies?: any[];
  }>
) => {
  const { isConnected, addListener } = useWebSocketContext();
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!isConnected || !listeners.length) {
      return;
    }

    console.log(`🎧 Registrando ${listeners.length} listeners múltiples`);

    // Registrar todos los listeners
    cleanupFunctionsRef.current = listeners.map(({ event, handler }) => {
      return addListener(event, handler);
    });

    return () => {
      console.log(
        `🧹 Limpiando ${cleanupFunctionsRef.current.length} listeners múltiples`
      );

      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, [isConnected, addListener]); // ✅ listeners NO es dependencia

  return useMemo(() => ({ isConnected }), [isConnected]);
};
