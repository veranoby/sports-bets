// frontend/src/hooks/useWebSocket.ts
import { useContext, useMemo, useCallback, useRef, useEffect } from "react";
import { WebSocketContext } from "../contexts/WebSocketContext";

// ✅ BASE HOOK
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider",
    );
  }
  return context;
};

// 🎯 HOOK FOR EMITTING ONLY (no listeners)
export const useWebSocketEmit = () => {
  const { emit, isConnected } = useWebSocketContext();

  return useMemo(
    () => ({
      isConnected,
      emit,
      emitBetCreated: (betData: unknown) => emit("bet_created", betData),
      emitBetAccepted: (betId: string) => emit("bet_accepted", { betId }),
      emitJoinFight: (fightId: string) => emit("join_fight", { fightId }),
      emitLeaveFight: (fightId: string) => emit("leave_fight", { fightId }),
    }),
    [isConnected, emit],
  );
};

// 🎧 HOOK FOR A SINGLE LISTENER
export const useWebSocketListener = <T = unknown,>(
  event: string,
  handler: (data: T) => void,
  dependencies: unknown[] = [],
) => {
  const { isConnected, addListener } = useWebSocketContext();
  const componentIdRef = useRef(`listener-${event}-${Date.now()}`);
  const cleanupRef = useRef<(() => void) | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableHandler = useCallback(handler, [...dependencies]);

  useEffect(() => {
    if (!event || !isConnected) return;

    if (cleanupRef.current) {
      cleanupRef.current();
    }

    cleanupRef.current = addListener(
      event,
      stableHandler,
      componentIdRef.current,
    );

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [event, isConnected, stableHandler, addListener]);

  return { isConnected };
};

// 🏠 HOOK FOR ROOM MANAGEMENT
export const useWebSocketRoom = (roomId: string) => {
  const { joinRoom, leaveRoom, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (!roomId || !isConnected) return;

    joinRoom(roomId);

    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  return { isConnected, roomId };
};
