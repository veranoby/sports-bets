// frontend/src/hooks/useWebSocket.ts - SIMPLIFICADO Y ESTABLE
// ==============================================================

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useWebSocketContext } from "../contexts/WebSocketContext";

// 🎯 HOOK PRINCIPAL - CORREGIDO
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
  } = useWebSocketContext();

  // Referencias estables
  const currentRoomRef = useRef<string | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  const componentIdRef = useRef(
    `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  );

  // 🏠 GESTIÓN DE ROOM
  useEffect(() => {
    if (!isConnected || !roomId || currentRoomRef.current === roomId) {
      return;
    }

    // Salir de room anterior si existe
    if (currentRoomRef.current) {
      console.log(`🚪 ${componentIdRef.current} saliendo de room: ${currentRoomRef.current}`);
      leaveRoom(currentRoomRef.current);
    }

    // Entrar a nueva room
    console.log(`🏠 ${componentIdRef.current} entrando a room: ${roomId}`);
    joinRoom(roomId);
    currentRoomRef.current = roomId;

    // Cleanup al desmontar
    return () => {
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
    };
  }, [isConnected, roomId, joinRoom, leaveRoom]);

  // 🎧 GESTIÓN DE LISTENERS - CORREGIDO
  useEffect(() => {
    if (!isConnected || !listeners) {
      return;
    }

    console.log(
      `🎧 ${componentIdRef.current} registrando ${Object.keys(listeners).length} listeners`
    );

    // Limpiar listeners anteriores
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];

    // Registrar nuevos listeners
    Object.entries(listeners).forEach(([event, handler]) => {
      const cleanup = addListener(event, handler, componentIdRef.current);
      cleanupFunctionsRef.current.push(cleanup);
    });

    // Cleanup al desmontar o cambiar listeners
    return () => {
      console.log(`🧹 ${componentIdRef.current} limpiando listeners`);
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, [isConnected, listeners, addListener]);

  // 📤 FUNCIÓN DE EMISIÓN
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

  // ✅ RESULTADO MEMOIZADO
  return useMemo(
    () => ({
      isConnected,
      connectionError,
      isConnecting,
      emit: emitEvent,
      status: isConnecting
        ? "connecting"
        : isConnected
        ? "connected"
        : "disconnected",
      componentId: componentIdRef.current,
      currentRoom: currentRoomRef.current,
    }),
    [isConnected, connectionError, isConnecting, emitEvent]
  );
};

// 🎯 HOOK PARA SOLO EMITIR (sin listeners)
export const useWebSocketEmit = () => {
  const { emit, isConnected } = useWebSocketContext();

  const emitBetCreated = useCallback(
    (betData: any) => emit("bet_created", betData),
    [emit]
  );

  const emitBetAccepted = useCallback(
    (betId: string) => emit("bet_accepted", { betId }),
    [emit]
  );

  const emitJoinFight = useCallback(
    (fightId: string) => emit("join_fight", { fightId }),
    [emit]
  );

  const emitLeaveFight = useCallback(
    (fightId: string) => emit("leave_fight", { fightId }),
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
    [isConnected, emitBetCreated, emitBetAccepted, emitJoinFight, emitLeaveFight]
  );
};

// 🎧 HOOK PARA UN SOLO LISTENER
export const useWebSocketListener = <T = any>(
  event: string,
  handler: (data: T) => void,
  dependencies: any[] = []
) => {
  const { isConnected, addListener } = useWebSocketContext();
  const componentIdRef = useRef(`listener-${event}-${Date.now()}`);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Handler memoizado con dependencias
  const stableHandler = useCallback(handler, dependencies);

  useEffect(() => {
    if (!event || !isConnected) {
      return;
    }

    console.log(`🎧 ${componentIdRef.current} registrando listener para: ${event}`);

    // Limpiar listener anterior si existe
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Registrar nuevo listener
    cleanupRef.current = addListener(event, stableHandler, componentIdRef.current);

    return () => {
      if (cleanupRef.current) {
        console.log(`🧹 ${componentIdRef.current} limpiando listener para: ${event}`);
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

// 🏠 HOOK PARA GESTIÓN DE ROOMS
export const useWebSocketRoom = (roomId: string) => {
  const { joinRoom, leaveRoom, isConnected } = useWebSocketContext();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !isConnected || joinedRef.current) {
      return;
    }

    console.log(`🏠 Uniéndose a room: ${roomId}`);
    joinRoom(roomId);
    joinedRef.current = true;

    return () => {
      if (joinedRef.current) {
        console.log(`🚪 Saliendo de room: ${roomId}`);
        leaveRoom(roomId);
        joinedRef.current = false;
      }
    };
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  return { isConnected, roomId };
};