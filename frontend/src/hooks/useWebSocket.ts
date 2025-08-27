// frontend/src/hooks/useWebSocket.ts
// VERSIÓN UNIFICADA - Exporta todos los hooks desde WebSocketContext
// ==============================================================

export {
  useWebSocketContext as useWebSocket,
  useWebSocketContext,
  useWebSocketListener,
  useWebSocketEmit,
  useWebSocketRoom,
} from "../contexts/WebSocketContext";

// Este archivo es un alias para mantener compatibilidad con imports existentes
// Todos los componentes usarán el mismo sistema WebSocket del contexto
