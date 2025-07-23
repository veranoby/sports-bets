// frontend/src/hooks/useWebSocket.ts
// VERSIÓN UNIFICADA - Solo exporta desde WebSocketContext
// ==============================================================

export {
  useWebSocketContext as useWebSocket,
  useWebSocketContext,
} from "../contexts/WebSocketContext";

// Este archivo ahora es solo un alias para mantener compatibilidad
// con imports existentes. Todos los componentes usarán el mismo
// sistema WebSocket del contexto.
