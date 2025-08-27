// frontend/src/components/shared/WebSocketDiagnostics.tsx - MONITOR OPTIMIZADO
// =============================================================================

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Activity,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useAuth } from "../../contexts/AuthContext";

interface LogEntry {
  timestamp: Date;
  type: "connect" | "disconnect" | "error" | "info";
  message: string;
  details?: any;
}

interface WebSocketDiagnosticsProps {
  showDetails?: boolean;
  position?: "fixed" | "relative";
  onClose?: () => void;
}

// 🔍 COMPONENTE DE DIAGNÓSTICO OPTIMIZADO (sin interferir con WebSocket)
const WebSocketDiagnostics: React.FC<WebSocketDiagnosticsProps> = memo(
  ({ showDetails = false, position = "fixed", onClose }) => {
    const { isConnected, connectionError, isConnecting } =
      useWebSocketContext();
    const { isAuthenticated, user } = useAuth();

    // Estados locales minimalistas
    const [expanded, setExpanded] = useState(showDetails);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState({
      connectTime: null as Date | null,
      reconnects: 0,
      errors: 0,
    });

    // Referencias para evitar re-renders
    const lastStatusRef = useRef<boolean>(false);
    const componentIdRef = useRef(`diagnostics-${Date.now()}`);
    const isMountedRef = useRef(true);

    // 📝 FUNCIÓN PARA AGREGAR LOGS (estable)
    const addLog = useCallback((entry: Omit<LogEntry, "timestamp">) => {
      if (!isMountedRef.current) return;

      const logEntry: LogEntry = {
        ...entry,
        timestamp: new Date(),
      };

      setLogs((prev) => [logEntry, ...prev.slice(0, 49)]); // Mantener solo 50 logs

      // Actualizar stats según el tipo
      if (entry.type === "error") {
        setStats((prev) => ({ ...prev, errors: prev.errors + 1 }));
      } else if (entry.type === "connect") {
        setStats((prev) => ({
          ...prev,
          connectTime: new Date(),
          reconnects: prev.connectTime ? prev.reconnects + 1 : 0,
        }));
      }
    }, []);

    // 👀 MONITOR DE CAMBIOS DE ESTADO (sin listeners WebSocket)
    useEffect(() => {
      const currentStatus = isConnected;
      const previousStatus = lastStatusRef.current;

      if (currentStatus !== previousStatus) {
        if (currentStatus) {
          addLog({
            type: "connect",
            message: "✅ WebSocket conectado",
            details: { user: user?.username, timestamp: new Date() },
          });
        } else {
          addLog({
            type: "disconnect",
            message: "❌ WebSocket desconectado",
            details: { user: user?.username, timestamp: new Date() },
          });
        }

        lastStatusRef.current = currentStatus;
      }
    }, [isConnected, user?.username, addLog]);

    // 🚨 MONITOR DE ERRORES
    useEffect(() => {
      if (connectionError) {
        addLog({
          type: "error",
          message: `🚨 Error de conexión: ${connectionError}`,
          details: { error: connectionError, timestamp: new Date() },
        });
      }
    }, [connectionError, addLog]);

    // 🧹 CLEANUP EN UNMOUNT
    useEffect(() => {
      isMountedRef.current = true;

      return () => {
        console.log(
          `🗑️ ${componentIdRef.current} desmontado - cleanup completo`
        );
        isMountedRef.current = false;
      };
    }, []);

    // 🎨 OBTENER ICONO Y COLOR SEGÚN ESTADO
    const getStatusInfo = () => {
      if (isConnecting) {
        return {
          icon: Activity,
          color: "text-yellow-500",
          bg: "bg-yellow-50",
          label: "Conectando...",
        };
      } else if (isConnected) {
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bg: "bg-green-50",
          label: "Conectado",
        };
      } else if (connectionError) {
        return {
          icon: AlertTriangle,
          color: "text-red-500",
          bg: "bg-red-50",
          label: "Error",
        };
      } else {
        return {
          icon: WifiOff,
          color: "text-gray-500",
          bg: "bg-gray-50",
          label: "Desconectado",
        };
      }
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV !== "development" && !showDetails) {
      return null;
    }

    return (
      <div
        className={`
      ${position === "fixed" ? "fixed bottom-4 right-4 z-50" : "relative"}
    `}
      >
        {/* 🎛️ INDICADOR PRINCIPAL */}
        <div
          className={`
          ${statusInfo.bg} ${statusInfo.color} 
          rounded-lg p-3 border border-gray-200 shadow-sm
          cursor-pointer transition-all duration-200
          ${expanded ? "mb-2" : ""}
        `}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center space-x-2">
            <StatusIcon size={18} className={statusInfo.color} />
            <span className="text-sm font-medium">
              WebSocket: {statusInfo.label}
            </span>
            {expanded ? <EyeOff size={14} /> : <Eye size={14} />}
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 📊 STATS RESUMIDAS */}
          <div className="text-xs text-gray-600 mt-1 space-x-4">
            <span>Reconexiones: {stats.reconnects}</span>
            <span>Errores: {stats.errors}</span>
            {stats.connectTime && (
              <span>
                Activo:{" "}
                {Math.round((Date.now() - stats.connectTime.getTime()) / 1000)}s
              </span>
            )}
          </div>
        </div>

        {/* 📋 PANEL EXPANDIDO */}
        {expanded && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 w-80 max-h-96 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">
                Diagnóstico WebSocket
              </h3>
              <button
                onClick={() => setExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* 📊 INFORMACIÓN DETALLADA */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </div>

              {isAuthenticated && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuario:</span>
                  <span className="text-gray-900">
                    {user?.username || "N/A"}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Logs:</span>
                <span className="text-gray-900">{logs.length}</span>
              </div>
            </div>

            {/* 📜 LOGS RECIENTES */}
            <div className="border-t border-gray-200 pt-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Logs Recientes
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {logs.slice(0, 10).map((log, index) => (
                  <div key={index} className="text-xs p-2 rounded bg-gray-50">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-gray-600">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span
                        className={`
                      px-1 rounded text-xs
                      ${
                        log.type === "error"
                          ? "bg-red-100 text-red-700"
                          : log.type === "connect"
                          ? "bg-green-100 text-green-700"
                          : log.type === "disconnect"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    `}
                      >
                        {log.type}
                      </span>
                    </div>
                    <div className="text-gray-800 mt-1">{log.message}</div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No hay logs disponibles
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

WebSocketDiagnostics.displayName = "WebSocketDiagnostics";

export default WebSocketDiagnostics;
