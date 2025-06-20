// frontend/src/components/shared/WebSocketDiagnostics.tsx - MONITOR ANTI-THRASHING

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  X,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useAuth } from "../../contexts/AuthContext";

interface LogEntry {
  timestamp: Date;
  type:
    | "connect"
    | "disconnect"
    | "listener_add"
    | "listener_remove"
    | "thrashing"
    | "error";
  message: string;
  details?: any;
}

interface WebSocketDiagnosticsProps {
  showDetails?: boolean;
  position?: "fixed" | "relative";
  onClose?: () => void;
}

const WebSocketDiagnostics: React.FC<WebSocketDiagnosticsProps> = ({
  showDetails = false,
  position = "fixed",
  onClose,
}) => {
  const { isConnected, connectionError, isConnecting } = useWebSocketContext();
  const { isAuthenticated, user } = useAuth();

  // Estados locales
  const [expanded, setExpanded] = useState(showDetails);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [thrashingAlerts, setThrashingAlerts] = useState(0);
  const [listenerCount, setListenerCount] = useState(0);

  // Referencias para monitoreo
  const lastActivityRef = useRef<Date>(new Date());
  const activityCountRef = useRef(0);
  const thrashingWindowRef = useRef<Date[]>([]);

  // 🔍 DETECTOR DE THRASHING
  const detectThrashing = useCallback(() => {
    const now = new Date();
    const THRASHING_WINDOW = 5000; // 5 segundos
    const THRASHING_THRESHOLD = 10; // 10 operaciones en 5 segundos = thrashing

    // Limpiar ventana antigua
    thrashingWindowRef.current = thrashingWindowRef.current.filter(
      (timestamp) => now.getTime() - timestamp.getTime() < THRASHING_WINDOW
    );

    // Agregar actividad actual
    thrashingWindowRef.current.push(now);

    // Detectar thrashing
    if (thrashingWindowRef.current.length >= THRASHING_THRESHOLD) {
      setThrashingAlerts((prev) => prev + 1);

      addLog({
        type: "thrashing",
        message: `🚨 LISTENER THRASHING DETECTADO: ${
          thrashingWindowRef.current.length
        } operaciones en ${THRASHING_WINDOW / 1000}s`,
        details: {
          operations: thrashingWindowRef.current.length,
          windowMs: THRASHING_WINDOW,
        },
      });

      // Reset window después de alert
      thrashingWindowRef.current = [];
    }
  }, []);

  // 📝 FUNCIÓN PARA AGREGAR LOGS
  const addLog = useCallback(
    (entry: Omit<LogEntry, "timestamp">) => {
      const logEntry: LogEntry = {
        ...entry,
        timestamp: new Date(),
      };

      setLogs((prev) => [logEntry, ...prev.slice(0, 99)]); // Mantener solo 100 logs

      // Detectar thrashing en cada log
      if (entry.type === "listener_add" || entry.type === "listener_remove") {
        detectThrashing();
      }
    },
    [detectThrashing]
  );

  // 📊 MONITOREAR ESTADOS DE CONEXIÓN
  useEffect(() => {
    if (isConnected) {
      addLog({
        type: "connect",
        message: "✅ WebSocket conectado",
        details: { authenticated: isAuthenticated, user: user?.username },
      });
    } else if (!isConnecting) {
      addLog({
        type: "disconnect",
        message: "❌ WebSocket desconectado",
        details: { error: connectionError },
      });
    }
  }, [
    isConnected,
    isConnecting,
    connectionError,
    isAuthenticated,
    user,
    addLog,
  ]);

  // 🎧 INTERCEPTAR CONSOLE LOGS PARA DETECTAR LISTENER ACTIVITY
  useEffect(() => {
    const originalLog = console.log;

    console.log = (...args) => {
      const message = args.join(" ");

      // Detectar logs de listeners
      if (message.includes("🎧 Listener agregado")) {
        const match = message.match(
          /Listener agregado para: (.*?) \(Total: (\d+)\)/
        );
        if (match) {
          addLog({
            type: "listener_add",
            message: `➕ Listener agregado: ${match[1]}`,
            details: { event: match[1], total: parseInt(match[2]) },
          });
          setListenerCount(parseInt(match[2]));
        }
      } else if (message.includes("🎧 Listener removido")) {
        const match = message.match(
          /Listener removido para: (.*?) \(Restantes: (\d+)\)/
        );
        if (match) {
          addLog({
            type: "listener_remove",
            message: `➖ Listener removido: ${match[1]}`,
            details: { event: match[1], remaining: parseInt(match[2]) },
          });
        }
      }

      // Llamar al log original
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, [addLog]);

  // 🔄 ACTUALIZAR ACTIVIDAD
  useEffect(() => {
    lastActivityRef.current = new Date();
    activityCountRef.current++;
  }, [logs]);

  // 🎨 FUNCIÓN PARA OBTENER COLOR DEL ESTADO
  const getStatusColor = () => {
    if (thrashingAlerts > 0) return "text-red-500";
    if (!isConnected) return "text-red-500";
    if (isConnecting) return "text-yellow-500";
    return "text-green-500";
  };

  // 🎨 FUNCIÓN PARA OBTENER ICONO DEL ESTADO
  const getStatusIcon = () => {
    if (thrashingAlerts > 0) return <Zap className="w-4 h-4" />;
    if (!isConnected) return <WifiOff className="w-4 h-4" />;
    if (isConnecting) return <RefreshCw className="w-4 h-4 animate-spin" />;
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <div
      className={`
      ${position === "fixed" ? "fixed bottom-4 right-4 z-[9999]" : "relative"}
    `}
    >
      {/* 🔘 INDICATOR COMPACTO */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border 
            bg-white shadow-lg hover:shadow-xl transition-all
            ${
              thrashingAlerts > 0
                ? "border-red-500 bg-red-50"
                : "border-gray-300"
            }
          `}
        >
          <span className={getStatusColor()}>{getStatusIcon()}</span>
          <span className="text-sm font-medium">
            {isConnected ? "WS" : "Offline"}
          </span>
          {thrashingAlerts > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {thrashingAlerts}
            </span>
          )}
        </button>
      )}

      {/* 📊 PANEL EXPANDIDO */}
      {expanded && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-300 w-96 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <span className={getStatusColor()}>{getStatusIcon()}</span>
              <h3 className="font-semibold text-gray-900">WebSocket Monitor</h3>
              {thrashingAlerts > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {thrashingAlerts} alerts
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setExpanded(false);
                onClose?.();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {listenerCount}
                </div>
                <div className="text-gray-600">Listeners</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{logs.length}</div>
                <div className="text-gray-600">Events</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {thrashingAlerts}
                </div>
                <div className="text-gray-600">Thrashing</div>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Sin actividad reciente
              </div>
            ) : (
              logs.slice(0, 20).map((log, index) => (
                <div
                  key={index}
                  className={`
                    p-2 border-b border-gray-100 text-xs
                    ${
                      log.type === "thrashing" ? "bg-red-50 border-red-200" : ""
                    }
                    ${
                      log.type === "error"
                        ? "bg-yellow-50 border-yellow-200"
                        : ""
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-gray-900">
                      {log.message}
                    </span>
                    <span className="text-gray-500 ml-2">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {log.details && (
                    <div className="mt-1 text-gray-600 font-mono">
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <button
                onClick={() => setLogs([])}
                className="flex-1 text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Limpiar
              </button>
              <button
                onClick={() => setThrashingAlerts(0)}
                className="flex-1 text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reset Alerts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketDiagnostics;
