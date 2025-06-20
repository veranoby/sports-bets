// frontend/src/components/shared/WebSocketDiagnostics.tsx
// 🔧 HERRAMIENTA DE DIAGNÓSTICO WEBSOCKET V3

import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  Settings,
  X,
} from "lucide-react";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useAuth } from "../../contexts/AuthContext";

interface WebSocketDiagnosticsProps {
  showDetails?: boolean;
  position?: "fixed" | "relative";
  onClose?: () => void;
}

const WebSocketDiagnostics: React.FC<WebSocketDiagnosticsProps> = ({
  showDetails = false,
  position = "relative",
  onClose,
}) => {
  const { isConnected, connectionError, isConnecting } = useWebSocketContext();
  const { isAuthenticated, user, token } = useAuth();

  const [expanded, setExpanded] = useState(showDetails);
  const [lastConnectionAttempt, setLastConnectionAttempt] =
    useState<Date | null>(null);
  const [connectionHistory, setConnectionHistory] = useState<
    Array<{
      timestamp: Date;
      status: "connected" | "disconnected" | "error";
      message?: string;
    }>
  >([]);

  // Rastrear cambios de conexión
  useEffect(() => {
    const now = new Date();

    if (isConnected) {
      setConnectionHistory((prev) => [
        ...prev.slice(-9),
        {
          timestamp: now,
          status: "connected",
          message: "Conexión establecida",
        },
      ]);
    } else if (connectionError) {
      setConnectionHistory((prev) => [
        ...prev.slice(-9),
        {
          timestamp: now,
          status: "error",
          message: connectionError,
        },
      ]);
    } else if (!isConnecting) {
      setConnectionHistory((prev) => [
        ...prev.slice(-9),
        {
          timestamp: now,
          status: "disconnected",
          message: "Desconectado",
        },
      ]);
    }
  }, [isConnected, connectionError, isConnecting]);

  // Función para reconectar
  const handleReconnect = () => {
    setLastConnectionAttempt(new Date());
    window.location.reload(); // Simple reload para reconectar
  };

  // Estados visuales
  const getStatusIcon = () => {
    if (isConnecting) {
      return <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />;
    }
    if (isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (connectionError) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return <WifiOff className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isConnecting) return "Conectando...";
    if (isConnected) return "Conectado";
    if (connectionError) return "Error de conexión";
    return "Desconectado";
  };

  const getStatusColor = () => {
    if (isConnecting) return "text-yellow-600";
    if (isConnected) return "text-green-600";
    if (connectionError) return "text-red-600";
    return "text-gray-600";
  };

  const getBorderColor = () => {
    if (isConnecting) return "border-yellow-300 bg-yellow-50";
    if (isConnected) return "border-green-300 bg-green-50";
    if (connectionError) return "border-red-300 bg-red-50";
    return "border-gray-300 bg-gray-50";
  };

  // Clase base del contenedor
  const containerClass =
    position === "fixed"
      ? "fixed top-4 right-4 z-50 max-w-sm"
      : "w-full max-w-sm";

  return (
    <div
      className={`${containerClass} p-3 rounded-lg border ${getBorderColor()}`}
    >
      {/* Header básico */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            WebSocket: {getStatusText()}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isConnected && (
            <button
              onClick={handleReconnect}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
              title="Reconectar"
            >
              <RefreshCw className="w-3 h-3" />
              Reconectar
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 p-1"
            title={expanded ? "Contraer" : "Expandir"}
          >
            <Settings className="w-3 h-3" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Cerrar"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Error message rápido */}
      {connectionError && !expanded && (
        <div className="mt-1 text-xs text-red-600 truncate">
          {connectionError}
        </div>
      )}

      {/* Detalles expandidos */}
      {expanded && (
        <div className="mt-3 space-y-3 text-xs">
          {/* Estado de autenticación */}
          <div className="space-y-1">
            <div className="font-medium text-gray-700">
              Estado de Autenticación:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span>Autenticado:</span>
                <span
                  className={
                    isAuthenticated ? "text-green-600" : "text-red-600"
                  }
                >
                  {isAuthenticated ? "✓ Sí" : "✗ No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Usuario:</span>
                <span className="text-gray-600">{user?.username || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Token:</span>
                <span className={token ? "text-green-600" : "text-red-600"}>
                  {token ? "✓ Presente" : "✗ Ausente"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rol:</span>
                <span className="text-gray-600">{user?.role || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Estado de conexión */}
          <div className="space-y-1">
            <div className="font-medium text-gray-700">Estado de Conexión:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className={getStatusColor()}>{getStatusText()}</span>
              </div>

              {connectionError && (
                <div className="p-2 bg-red-100 rounded text-red-700">
                  <strong>Error:</strong> {connectionError}
                </div>
              )}

              {lastConnectionAttempt && (
                <div className="flex justify-between">
                  <span>Último intento:</span>
                  <span className="text-gray-600">
                    {lastConnectionAttempt.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Historial de conexiones */}
          {connectionHistory.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium text-gray-700">
                Historial Reciente:
              </div>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {connectionHistory
                  .slice(-5)
                  .reverse()
                  .map((entry, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="truncate flex-1 mr-2">
                        {entry.message}
                      </span>
                      <span className="text-gray-500 flex-shrink-0">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Información técnica */}
          <div className="space-y-1">
            <div className="font-medium text-gray-700">
              Información Técnica:
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                URL: {import.meta.env.VITE_WS_URL || "http://localhost:3001"}
              </div>
              <div>Environment: {import.meta.env.MODE}</div>
              <div>Transport: websocket/polling</div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={handleReconnect}
              className="flex-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reconectar
            </button>
            <button
              onClick={() => setConnectionHistory([])}
              className="flex-1 text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Limpiar Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketDiagnostics;
