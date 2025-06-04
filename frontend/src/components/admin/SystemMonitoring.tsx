/**
 * SystemMonitoring Component
 * Panel para monitorear el estado del sistema, logs y rendimiento
 */
"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Server,
  Database,
  Cpu,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface SystemStatus {
  api: {
    status: "healthy" | "degraded" | "down";
    responseTime: number;
    uptime: number;
    lastRestart: string;
  };
  database: {
    status: "healthy" | "degraded" | "down";
    connections: number;
    queryTime: number;
    diskUsage: number;
  };
  streaming: {
    status: "healthy" | "degraded" | "down";
    activeStreams: number;
    bandwidth: number;
    errors: number;
  };
  cache: {
    status: "healthy" | "degraded" | "down";
    hitRate: number;
    size: number;
    items: number;
  };
  recentErrors: {
    timestamp: string;
    service: string;
    message: string;
    level: "error" | "warning" | "info";
  }[];
}

// Configuración de la API
const systemAPI = {
  getStatus: async () => {
    const response = await fetch("/api/system/status");
    return response.json();
  },
};

// Niveles de error con colores oficiales
const errorLevels = {
  error: "bg-red-100 text-red-800",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-800",
};

const SystemMonitoring: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Reemplazar mock con datos reales
  const loadSystemStatus = async () => {
    try {
      setIsLoading(true);
      const response = await systemAPI.getStatus();
      setSystemStatus(response.data); // Asume que la API devuelve { data: SystemStatus }
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || "Error al cargar estado del sistema");
    } finally {
      setIsLoading(false);
    }
  };

  // Configurar intervalo
  useEffect(() => {
    const interval = refreshInterval
      ? setInterval(loadSystemStatus, refreshInterval * 1000)
      : null;
    return () => interval && clearInterval(interval);
  }, [refreshInterval]);

  // Cambiar intervalo de actualización
  const setRefreshRate = (seconds: number | null) => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    if (seconds) {
      const interval = window.setInterval(() => {
        loadSystemStatus();
      }, seconds * 1000);
      setRefreshInterval(interval);
    }
  };

  // Renderizar indicador de estado
  const renderStatusIndicator = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Saludable
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Degradado
          </span>
        );
      case "down":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Caído
          </span>
        );
      default:
        return null;
    }
  };

  // Datos mock para visualización
  const mockSystemStatus: SystemStatus = {
    api: {
      status: "healthy",
      responseTime: 120,
      uptime: 99.98,
      lastRestart: "2023-01-15T08:30:00Z",
    },
    database: {
      status: "healthy",
      connections: 42,
      queryTime: 8.5,
      diskUsage: 68.2,
    },
    streaming: {
      status: "degraded",
      activeStreams: 8,
      bandwidth: 450.5,
      errors: 3,
    },
    cache: {
      status: "healthy",
      hitRate: 92.7,
      size: 256,
      items: 18540,
    },
    recentErrors: [
      {
        timestamp: "2023-01-20T14:32:15Z",
        service: "streaming",
        message: "Stream connection timeout for event ID: event-123",
        level: "warning",
      },
      {
        timestamp: "2023-01-20T13:45:22Z",
        service: "api",
        message: "Rate limit exceeded for IP: 192.168.1.42",
        level: "info",
      },
      {
        timestamp: "2023-01-20T12:18:05Z",
        service: "database",
        message:
          "Slow query detected: SELECT * FROM bets WHERE event_id = 'event-456'",
        level: "warning",
      },
      {
        timestamp: "2023-01-20T10:05:33Z",
        service: "api",
        message: "Authentication failure: Invalid token format",
        level: "error",
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Monitoreo del Sistema
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            Última actualización: {lastRefreshed.toLocaleTimeString()}
          </div>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => setRefreshRate(null)}
              className={`px-2 py-1 text-xs ${
                !refreshInterval ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setRefreshRate(30)}
              className={`px-2 py-1 text-xs ${
                refreshInterval === 30
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={
                refreshInterval === 30 ? { backgroundColor: "#596c95" } : {}
              }
            >
              30s
            </button>
            <button
              onClick={() => setRefreshRate(60)}
              className={`px-2 py-1 text-xs ${
                refreshInterval === 60
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={
                refreshInterval === 60 ? { backgroundColor: "#596c95" } : {}
              }
            >
              1m
            </button>
            <button
              onClick={() => setRefreshRate(300)}
              className={`px-2 py-1 text-xs ${
                refreshInterval === 300
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={
                refreshInterval === 300 ? { backgroundColor: "#596c95" } : {}
              }
            >
              5m
            </button>
          </div>
          <button
            onClick={loadSystemStatus}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center"
            style={{
              backgroundColor: "rgba(89, 108, 149, 0.1)",
              color: "#596c95",
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && !systemStatus && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Cargando estado del sistema...</p>
        </div>
      )}

      {systemStatus && (
        <>
          {/* Tarjetas de estado de servicios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* API Status */}
            <div className="bg-white p-6 rounded-xl border border-[#596c95] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-500">API</h4>
                <div className="p-2 rounded-full bg-blue-50">
                  <Server className="w-5 h-5 text-[#596c95]" />
                </div>
              </div>
              <div className="flex items-center mb-2">
                {renderStatusIndicator(systemStatus.api.status)}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tiempo de respuesta:</span>
                  <span className="font-medium">
                    {systemStatus.api.responseTime} ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uptime:</span>
                  <span className="font-medium">
                    {systemStatus.api.uptime}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Último reinicio:</span>
                  <span className="font-medium">
                    {new Date(systemStatus.api.lastRestart).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Database Status */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-500">
                  Base de Datos
                </h4>
                <div
                  className="p-2 rounded-full"
                  style={{ backgroundColor: "rgba(89, 108, 149, 0.1)" }}
                >
                  <Database className="w-5 h-5" style={{ color: "#596c95" }} />
                </div>
              </div>
              <div className="flex items-center mb-2">
                {renderStatusIndicator(systemStatus.database.status)}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Conexiones:</span>
                  <span className="font-medium">
                    {systemStatus.database.connections}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tiempo de consulta:</span>
                  <span className="font-medium">
                    {systemStatus.database.queryTime} ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uso de disco:</span>
                  <span className="font-medium">
                    {systemStatus.database.diskUsage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Streaming Status */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-500">Streaming</h4>
                <div
                  className="p-2 rounded-full"
                  style={{ backgroundColor: "rgba(205, 98, 99, 0.1)" }}
                >
                  <Cpu className="w-5 h-5" style={{ color: "#cd6263" }} />
                </div>
              </div>
              <div className="flex items-center mb-2">
                {renderStatusIndicator(systemStatus.streaming.status)}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Streams activos:</span>
                  <span className="font-medium">
                    {systemStatus.streaming.activeStreams}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ancho de banda:</span>
                  <span className="font-medium">
                    {systemStatus.streaming.bandwidth} Mbps
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Errores:</span>
                  <span className="font-medium">
                    {systemStatus.streaming.errors}
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Status */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-500">Cache</h4>
                <div
                  className="p-2 rounded-full"
                  style={{ backgroundColor: "rgba(89, 108, 149, 0.1)" }}
                >
                  <Database className="w-5 h-5" style={{ color: "#596c95" }} />
                </div>
              </div>
              <div className="flex items-center mb-2">
                {renderStatusIndicator(systemStatus.cache.status)}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hit rate:</span>
                  <span className="font-medium">
                    {systemStatus.cache.hitRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tamaño:</span>
                  <span className="font-medium">
                    {systemStatus.cache.size} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium">
                    {systemStatus.cache.items.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Errores recientes */}
          <div className="mt-8">
            <h4 className="text-base font-medium text-gray-900 mb-4">
              Errores Recientes
            </h4>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Timestamp
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Servicio
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Mensaje
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nivel
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {systemStatus.recentErrors.map((error, index) => {
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(error.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {error.service}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {error.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              errorLevels[error.level]
                            }`}
                          >
                            {error.level}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemMonitoring;
