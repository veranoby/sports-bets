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
import ErrorMessage from "../shared/ErrorMessage";
import LoadingSpinner from "../shared/LoadingSpinner";
import Card from "../shared/Card";
import useSSE from "../../hooks/useSSE";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Usar SSE para obtener el estado del sistema en tiempo real
  const { data: systemStatus, error: sseError } = useSSE('/api/sse/system/status');

  // Actualizar la fecha de última actualización cuando se reciben datos
  useEffect(() => {
    if (systemStatus) {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  }, [systemStatus]);

  // Manejar errores de SSE
  useEffect(() => {
    if (sseError) {
      setError("Sistema de monitoreo no disponible");
      setIsLoading(false);
    }
  }, [sseError]);

  // Función para actualizar el estado (no hace nada porque usamos SSE)
  const loadSystemStatus = async (): Promise<void> => {
    // No es necesario hacer nada aquí porque usamos SSE para actualizaciones en tiempo real
    // Esta función se mantiene para compatibilidad con la UI
  };

  // Renderizar indicador de estado
  const renderStatusChip = (status: "healthy" | "degraded" | "down") => {
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
              onClick={() => setRefreshInterval(null)}
              className={`px-2 py-1 text-xs ${
                !refreshInterval ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setRefreshInterval(30)}
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
              onClick={() => setRefreshInterval(60)}
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
              onClick={() => setRefreshInterval(300)}
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
        <ErrorMessage
          error={error}
          onRetry={loadSystemStatus}
          className="mb-4"
        />
      )}

      {/* Estado de carga */}
      {isLoading && !systemStatus && (
        <LoadingSpinner
          text="Cargando estado del sistema..."
          className="py-8"
        />
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
                {systemStatus.api ? renderStatusChip(systemStatus.api.status) : renderStatusChip('down')}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tiempo de respuesta:</span>
                  <span className="font-medium">
                    {systemStatus.api?.responseTime || 'N/A'} ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uptime:</span>
                  <span className="font-medium">
                    {systemStatus.api?.uptime || 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Último reinicio:</span>
                  <span className="font-medium">
                    {systemStatus.api?.lastRestart ? new Date(systemStatus.api.lastRestart).toLocaleString() : 'N/A'}
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
                {systemStatus.database ? renderStatusChip(systemStatus.database.status) : renderStatusChip('down')}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Conexiones:</span>
                  <span className="font-medium">
                    {systemStatus.database?.connections || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tiempo de consulta:</span>
                  <span className="font-medium">
                    {systemStatus.database?.queryTime || 'N/A'} ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uso de disco:</span>
                  <span className="font-medium">
                    {systemStatus.database?.diskUsage || 'N/A'}%
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
                {systemStatus.streaming ? renderStatusChip(systemStatus.streaming.status) : renderStatusChip('down')}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Streams activos:</span>
                  <span className="font-medium">
                    {systemStatus.streaming?.activeStreams || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ancho de banda:</span>
                  <span className="font-medium">
                    {systemStatus.streaming?.bandwidth || 'N/A'} Mbps
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Errores:</span>
                  <span className="font-medium">
                    {systemStatus.streaming?.errors || 'N/A'}
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
                {systemStatus.cache ? renderStatusChip(systemStatus.cache.status) : renderStatusChip('down')}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hit rate:</span>
                  <span className="font-medium">
                    {systemStatus.cache?.hitRate || 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tamaño:</span>
                  <span className="font-medium">
                    {systemStatus.cache?.size || 'N/A'} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium">
                    {systemStatus.cache?.items ? systemStatus.cache.items.toLocaleString() : 'N/A'}
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
                  {systemStatus.recentErrors?.map((error, index) => {
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
