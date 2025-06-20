// frontend/src/components/shared/WebSocketDiagnostics.tsx
import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useWebSocketContext } from "../../contexts/WebSocketContext";

interface DiagnosticsProps {
  showDetails?: boolean;
  onConnectionRestore?: () => void;
}

const WebSocketDiagnostics: React.FC<DiagnosticsProps> = ({
  showDetails = false,
  onConnectionRestore,
}) => {
  const { isConnected, connectionError, isConnecting } = useWebSocketContext();
  const [backendHealth, setBackendHealth] = useState<
    "checking" | "healthy" | "unhealthy"
  >("checking");
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Verificar salud del backend
  const checkBackendHealth = async () => {
    setBackendHealth("checking");
    try {
      const response = await fetch("http://localhost:3001/health", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setBackendHealth("healthy");
        setLastCheck(new Date());
      } else {
        setBackendHealth("unhealthy");
      }
    } catch (error) {
      console.error("Backend health check failed:", error);
      setBackendHealth("unhealthy");
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check cada 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isConnected && onConnectionRestore) {
      onConnectionRestore();
    }
  }, [isConnected, onConnectionRestore]);

  const getStatusColor = () => {
    if (backendHealth === "checking") return "text-yellow-500";
    if (backendHealth === "unhealthy") return "text-red-500";
    if (!isConnected) return "text-orange-500";
    return "text-green-500";
  };

  const getStatusIcon = () => {
    if (backendHealth === "checking")
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (backendHealth === "unhealthy")
      return <AlertTriangle className="w-4 h-4" />;
    if (!isConnected) return <WifiOff className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (backendHealth === "checking") return "Verificando...";
    if (backendHealth === "unhealthy") return "Servidor desconectado";
    if (!isConnected) return "WebSocket desconectado";
    return "Conectado";
  };

  const handleReconnect = () => {
    checkBackendHealth();
  };

  if (!showDetails && isConnected && backendHealth === "healthy") {
    return null; // No mostrar nada si todo está bien y no se requieren detalles
  }

  return (
    <div
      className={`rounded-lg p-3 ${
        isConnected && backendHealth === "healthy"
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={getStatusColor()}>{getStatusIcon()}</div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {(!isConnected || backendHealth === "unhealthy") && (
          <button
            onClick={handleReconnect}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reconectar
          </button>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Backend:</span>
            <span
              className={
                backendHealth === "healthy" ? "text-green-600" : "text-red-600"
              }
            >
              {backendHealth === "healthy" ? "✓ Activo" : "✗ Inactivo"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>WebSocket:</span>
            <span className={isConnected ? "text-green-600" : "text-red-600"}>
              {isConnected ? "✓ Conectado" : "✗ Desconectado"}
            </span>
          </div>
          {lastCheck && (
            <div className="flex justify-between">
              <span>Última verificación:</span>
              <span>{lastCheck.toLocaleTimeString()}</span>
            </div>
          )}
          {connectionError && (
            <div className="mt-2 p-2 bg-red-100 rounded text-red-700">
              <strong>Error:</strong> {connectionError}
            </div>
          )}
        </div>
      )}

      {connectionError && !showDetails && (
        <div className="mt-1 text-xs text-red-600">{connectionError}</div>
      )}
    </div>
  );
};

export default WebSocketDiagnostics;
