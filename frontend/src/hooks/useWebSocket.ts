// 🔧 HOOK USEWEBSOCKET V4 - ANTI-CICLO INFINITO
// ==========================================

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useWebSocketContext } from "../contexts/WebSocketContext";

interface UseWebSocketOptions {
  shouldConnect?: boolean;
  debounceMs?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  isConnecting: boolean;
  emit: (event: string, data?: any) => boolean;
}

// 🛡️ FUNCIÓN PARA COMPARAR LISTENERS SIN CAUSAR RE-RENDERS
const createStableListenersKey = (
  listeners?: Record<string, Function>
): string => {
  if (!listeners) return "";
  return JSON.stringify(Object.keys(listeners).sort());
};

// 🚀 HOOK PRINCIPAL ANTI-CICLO
export const useWebSocket = (
  roomId?: string,
  listeners?: Record<string, (data: any) => void>,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const { debounceMs = 100 } = options;

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

  // 📝 REFERENCIAS ESTABLES
  const currentRoomRef = useRef<string | null>(null);
  const listenersRef = useRef<Record<string, Function>>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 🔑 CLAVE ESTABLE PARA LISTENERS (evita re-ejecutar efecto innecesariamente)
  const listenersKey = useMemo(
    () => createStableListenersKey(listeners),
    [listeners]
  );

  // 🧹 CLEANUP AL DESMONTAR
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Limpiar timeout de debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Remover todos los listeners registrados
      Object.entries(listenersRef.current).forEach(([event, handler]) => {
        removeListener(event, handler);
      });
      listenersRef.current = {};

      // Salir de room actual
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
    };
  }, [removeListener, leaveRoom]);

  // 🚪 MANEJO DE ROOMS (SALAS)
  useEffect(() => {
    if (!isConnected || !isMountedRef.current) return;

    // Cambio de room
    if (roomId !== currentRoomRef.current) {
      // Salir de room anterior
      if (currentRoomRef.current) {
        leaveRoom(currentRoomRef.current);
      }

      // Unirse a nueva room
      if (roomId) {
        joinRoom(roomId);
        if (process.env.NODE_ENV === "development") {
          console.log(`🚪 Cambiado a sala: ${roomId}`);
        }
      }

      currentRoomRef.current = roomId || null;
    }
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  // 🎧 MANEJO DE LISTENERS CON DEBOUNCE
  useEffect(() => {
    if (!isConnected || !listeners || !isMountedRef.current) {
      return;
    }

    // Cancelar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce para evitar múltiples actualizaciones rápidas
    debounceTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      // Comparar listeners actuales vs nuevos
      const currentEvents = Object.keys(listenersRef.current);
      const newEvents = Object.keys(listeners);

      // Remover listeners que ya no están
      currentEvents.forEach((event) => {
        if (!newEvents.includes(event)) {
          removeListener(event, listenersRef.current[event]);
          delete listenersRef.current[event];
        }
      });

      // Agregar listeners nuevos o actualizados
      newEvents.forEach((event) => {
        const newHandler = listeners[event];
        const currentHandler = listenersRef.current[event];

        // Solo agregar si es diferente
        if (newHandler !== currentHandler) {
          // Remover anterior si existe
          if (currentHandler) {
            removeListener(event, currentHandler);
          }

          // Agregar nuevo
          addListener(event, newHandler);
          listenersRef.current[event] = newHandler;
        }
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          `🎧 Listeners sincronizados:`,
          Object.keys(listenersRef.current)
        );
      }
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [listenersKey, isConnected, addListener, removeListener, debounceMs]);

  // 📤 FUNCIÓN EMIT ESTABLE
  const stableEmit = useCallback(
    (event: string, data?: any): boolean => {
      return emit(event, data);
    },
    [emit]
  );

  // 📊 RETURN ESTABLE
  return useMemo(
    () => ({
      isConnected,
      connectionError,
      isConnecting,
      emit: stableEmit,
    }),
    [isConnected, connectionError, isConnecting, stableEmit]
  );
};
