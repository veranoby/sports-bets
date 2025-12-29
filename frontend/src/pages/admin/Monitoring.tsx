// frontend/src/pages/admin/Monitoring.tsx
// 📊 MONITOREO SISTEMA ADMIN - Estado servicios + métricas + alertas

import React, { useState, useEffect, useCallback } from "react";
import {
  Wifi,
  Zap,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Download,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import LiveSystemStatus from "../../components/admin/LiveSystemStatus";
import LiveEventMonitor from "../../components/admin/LiveEventMonitor";
import SSEErrorBoundary from "../../components/admin/SSEErrorBoundary";

// APIs (con fallback a mock)
import { systemAPI } from "../../services/api";
import type { MonitoringAlert, SystemStats, User } from "../../types";

type LiveStats = Pick<
  SystemStats,
  | "activeUsers"
  | "liveEvents"
  | "activeBets"
  | "connectionCount"
  | "requestsPerMinute"
  | "errorRate"
>;

const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;

const parseStoredUser = (): User | null => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser);
    if (parsed && typeof parsed === "object" && "role" in parsed) {
      return parsed as User;
    }
  } catch {
    // Ignore malformed data
  }
  return null;
};

const buildLiveStats = (
  stats: SystemStats | null,
  options?: { restrictSensitiveMetrics?: boolean },
): LiveStats => {
  const baseStats: LiveStats = {
    activeUsers: stats?.activeUsers ?? 0,
    liveEvents: stats?.liveEvents ?? 0,
    activeBets: stats?.activeBets ?? 0,
    connectionCount: stats?.connectionCount ?? 0,
    requestsPerMinute: stats?.requestsPerMinute ?? 0,
    errorRate: stats?.errorRate ?? 0,
  };

  if (options?.restrictSensitiveMetrics) {
    return {
      ...baseStats,
      activeBets: 0,
      requestsPerMinute: 0,
      errorRate: 0,
    };
  }

  return baseStats;
};

const filterStreamingAlerts = (alerts: MonitoringAlert[]): MonitoringAlert[] =>
  alerts.filter((alert) => {
    const service = alert.service.toLowerCase();
    return service.includes("stream") || service.includes("rtmp");
  });

const AdminMonitoringPage: React.FC = () => {
  // Estados principales
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener rol actual para restricciones
  const currentUser = parseStoredUser();
  const isOperator = currentUser?.role === "operator";

  // Estados UI
  const [selectedAlert, setSelectedAlert] = useState<MonitoringAlert | null>(
    null,
  );
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch datos iniciales
  const fetchInitialData = useCallback(async () => {
    setError(null);

    try {
      const [alertsRes, statsRes] = await Promise.all([
        systemAPI.getAlerts(),
        systemAPI.getLiveStats(),
      ]);

      if (isOperator) {
        const alertsData = alertsRes.success ? (alertsRes.data ?? []) : [];
        setAlerts(filterStreamingAlerts(alertsData));

        const statsPayload = buildLiveStats(
          statsRes.success ? (statsRes.data ?? null) : null,
          { restrictSensitiveMetrics: true },
        );
        setLiveStats(statsPayload);
      } else {
        if (!alertsRes.success || !statsRes.success) {
          throw new Error(
            alertsRes.error ||
              statsRes.error ||
              "Error al cargar datos iniciales de monitoreo",
          );
        }

        setAlerts(alertsRes.data ?? []);
        setLiveStats(buildLiveStats(statsRes.data ?? null));
      }

      setLastUpdate(new Date());
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Error al cargar datos iniciales de monitoreo"),
      );
      setAlerts([]);
      setLiveStats(null);
    } finally {
      setLoading(false);
    }
  }, [isOperator]);

  // Polling cada 5 segundos para datos en tiempo real
  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchInitialData, 5000);
    return () => clearInterval(interval);
  }, [fetchInitialData]);

  // Resolver alerta individual
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert,
      ),
    );
  }, []);

  // Obtener color según nivel de alerta
  const getAlertColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-500 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-500 bg-yellow-50 border-yellow-200";
      case "info":
        return "text-blue-500 bg-blue-50 border-blue-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  // Exportar datos de monitoreo (solo admin)
  const exportMonitoringData = useCallback(() => {
    const data = {
      alerts: alerts.filter((alert) => !alert.resolved),
      stats: liveStats,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [alerts, liveStats]);

  if (loading) return <LoadingSpinner text="Cargando monitoreo..." />;
  if (error) return <ErrorMessage error={error} onRetry={fetchInitialData} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con título y controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Monitoreo del Sistema
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Última actualización:{" "}
              {lastUpdate.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isOperator && (
              <button
                onClick={exportMonitoringData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Exportar Datos
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">En Vivo</span>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        {liveStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {liveStats.activeUsers}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Eventos en Vivo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {liveStats.liveEvents}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <Zap className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            {!isOperator && (
              <>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Apuestas Activas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {liveStats.activeBets}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Conexiones</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {liveStats.connectionCount}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Wifi className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Req/min</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {liveStats.requestsPerMinute}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tasa Error</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(liveStats.errorRate * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Grid principal con SSE Boundary */}
        <SSEErrorBoundary>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estado de Servicios */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Estado de Servicios
                </h2>
              </div>
              <LiveSystemStatus />
            </Card>

            {/* Monitor de Eventos en Vivo */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Eventos en Vivo
                </h2>
              </div>
              <LiveEventMonitor />
            </Card>
          </div>
        </SSEErrorBoundary>

        {/* Alertas Recientes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Alertas Recientes
              {alerts.filter((alert) => !alert.resolved).length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {alerts.filter((alert) => !alert.resolved).length} activas
                </span>
              )}
            </h2>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No hay alertas activas</p>
              <p className="text-sm mt-1">
                Todos los servicios funcionan correctamente
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts
                .filter((alert) => !alert.resolved)
                .slice(0, 10)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${getAlertColor(alert.level)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {alert.level === "critical" && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          {alert.level === "warning" && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          {alert.level === "info" && (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="font-medium capitalize">
                            {alert.level}
                          </span>
                          <span className="text-sm text-gray-600">
                            • {alert.service}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString("es-ES")}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="ml-4 p-1 hover:bg-white/50 rounded transition-colors"
                        title="Marcar como resuelto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de detalle de alerta */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalle de Alerta
              </h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Nivel:
                </span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getAlertColor(selectedAlert.level)}`}
                >
                  {selectedAlert.level}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Servicio:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {selectedAlert.service}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Mensaje:
                </span>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedAlert.message}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Timestamp:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(selectedAlert.timestamp).toLocaleString("es-ES")}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  resolveAlert(selectedAlert.id);
                  setSelectedAlert(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Resolver
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringPage;
