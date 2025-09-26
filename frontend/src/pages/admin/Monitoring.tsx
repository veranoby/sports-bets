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

interface AlertItem {
  id: string;
  level: "critical" | "warning" | "info";
  service: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface LiveStats {
  activeUsers: number;
  liveEvents: number;
  activeBets: number;
  connectionCount: number;
  requestsPerMinute: number;
  errorRate: number;
}

const AdminMonitoringPage: React.FC = () => {
  // Estados principales
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener rol actual para restricciones
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isOperator = currentUser.role === "operator";

  // Estados UI
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch datos iniciales
  const fetchInitialData = useCallback(async () => {
    setError(null);

    if (isOperator) {
      // Operadores solo ven alertas de streaming y stats limitadas
      const alertsRes = await systemAPI
        .getAlerts()
        .catch(() => ({ success: true, data: [] }));
      const statsRes = await systemAPI
        .getLiveStats()
        .catch(() => ({ success: true, data: null }));

      setAlerts(
        alertsRes.success
          ? alertsRes.data?.filter(
              (alert: AlertItem) =>
                alert.service.toLowerCase().includes("stream") ||
                alert.service.toLowerCase().includes("rtmp"),
            ) || []
          : [],
      );
      setLiveStats({
        ...(statsRes.success ? statsRes.data : {}),
        activeUsers: statsRes.success ? statsRes.data?.activeUsers || 0 : 0,
        liveEvents: statsRes.success ? statsRes.data?.liveEvents || 0 : 0,
        activeBets: 0,
        connectionCount: statsRes.success
          ? statsRes.data?.connectionCount || 0
          : 0,
        requestsPerMinute: 0,
        errorRate: 0,
      });
    } else {
      // Admin ve todo
      const alertsRes = await systemAPI.getAlerts();
      const statsRes = await systemAPI.getLiveStats();

      if (alertsRes.success && statsRes.success) {
        setAlerts(alertsRes.data);
        setLiveStats(statsRes.data);
      } else {
        setError("Error al cargar datos iniciales de monitoreo");
        setAlerts([]);
        setLiveStats(null);
      }
    }

    setLastUpdate(new Date());
    setLoading(false);
  }, [isOperator]);

  // Fetch inicial
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Export report
  const exportSystemReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      alerts: alerts.filter((a) => !a.resolved),
      liveStats,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_report_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando monitoreo del sistema..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Monitoreo del Sistema
            </h1>
            <p className="text-gray-600">
              Estado general • Datos actualizados en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportSystemReport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <ErrorMessage
          error={error}
          onRetry={fetchInitialData}
          className="mb-6"
        />
      )}

      {/* Estadísticas en vivo */}
      {liveStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card
            variant="stat"
            title="Usuarios Activos"
            value={liveStats.activeUsers.toLocaleString()}
            color="blue"
            icon={<Users className="w-5 h-5" />}
          />
          <Card
            variant="stat"
            title="Eventos Live"
            value={liveStats.liveEvents}
            color="red"
            icon={<Activity className="w-5 h-5" />}
          />
          <Card
            variant="stat"
            title="Apuestas Activas"
            value={liveStats.activeBets.toLocaleString()}
            color="yellow"
            icon={<Zap className="w-5 h-5" />}
          />
          <Card
            variant="stat"
            title="Conexiones SSE"
            value={liveStats.connectionCount}
            color="green"
            icon={<Wifi className="w-5 h-5" />}
          />
          <Card
            variant="stat"
            title="Req/min"
            value={liveStats.requestsPerMinute.toLocaleString()}
            color="purple"
            icon={<Zap className="w-5 h-5" />}
          />
          <Card
            variant="stat"
            title="Error Rate"
            value={`${liveStats.errorRate}%`}
            color={liveStats.errorRate > 1 ? "red" : "green"}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>
      )}

      <SSEErrorBoundary>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {!isOperator && <LiveSystemStatus />}
          <LiveEventMonitor />
        </div>
      </SSEErrorBoundary>

      {/* Alertas y logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Alertas del Sistema
          </h3>
          <span className="text-sm text-gray-600">
            {alerts.filter((a) => !a.resolved).length} activas
          </span>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p>No hay alertas activas</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertColor(
                  alert.level,
                )} ${alert.resolved ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {alert.service}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          alert.level === "critical"
                            ? "bg-red-600 text-white"
                            : alert.level === "warning"
                              ? "bg-yellow-600 text-white"
                              : "bg-blue-600 text-white"
                        }`}
                      >
                        {alert.level}
                      </span>
                      {alert.resolved && (
                        <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                          Resuelto
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-1">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modal detalle alerta */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalle de Alerta
              </h2>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Servicio
                </label>
                <p className="text-sm text-gray-900">{selectedAlert.service}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Nivel
                </label>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    selectedAlert.level === "critical"
                      ? "bg-red-600 text-white"
                      : selectedAlert.level === "warning"
                        ? "bg-yellow-600 text-white"
                        : "bg-blue-600 text-white"
                  }`}
                >
                  {selectedAlert.level}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Mensaje
                </label>
                <p className="text-sm text-gray-900">{selectedAlert.message}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Timestamp
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Estado
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAlert.resolved ? "Resuelto" : "Activo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringPage;
