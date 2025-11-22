"use strict";
// frontend/src/hooks/useWebSocket.ts
// VERSIÓN UNIFICADA - Exporta todos los hooks desde WebSocketContext
// ==============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocketRoom = exports.useWebSocketEmit = exports.useWebSocketListener = exports.useWebSocketContext = exports.useWebSocket = void 0;
var WebSocketContext_1 = require("../contexts/WebSocketContext");
Object.defineProperty(exports, "useWebSocket", { enumerable: true, get: function () { return WebSocketContext_1.useWebSocketContext; } });
Object.defineProperty(exports, "useWebSocketContext", { enumerable: true, get: function () { return WebSocketContext_1.useWebSocketContext; } });
Object.defineProperty(exports, "useWebSocketListener", { enumerable: true, get: function () { return WebSocketContext_1.useWebSocketListener; } });
Object.defineProperty(exports, "useWebSocketEmit", { enumerable: true, get: function () { return WebSocketContext_1.useWebSocketEmit; } });
Object.defineProperty(exports, "useWebSocketRoom", { enumerable: true, get: function () { return WebSocketContext_1.useWebSocketRoom; } });
// Este archivo es un alias para mantener compatibilidad con imports existentes
// Todos los componentes usarán el mismo sistema WebSocket del contexto
