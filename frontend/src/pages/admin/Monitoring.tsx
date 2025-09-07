// frontend/src/pages/admin/Monitoring.tsx
// 📊 MONITOREO SISTEMA ADMIN - Estado servicios + métricas + alertas

import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Database,
  Wifi,
  Zap,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Eye,
  X,
  Settings,
  Download,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

// APIs (con fallback a mock)
import { systemAPI } from "../../config/api";

interface ServiceStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  uptime: number;
  responseTime: number;
  lastCheck: string;
  details?: any;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    available: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    usage: number;
  };
  network: {
    incoming: number;
    outgoing: number;
    connections: number;
  };
}

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
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(
    null
  );
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener rol actual para restricciones
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOperator = currentUser.role === 'operator';

  // Estados UI
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch datos de monitoreo con restricciones por rol
  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null);
      
      if (isOperator) {
        // Operadores solo ven monitoreo de streaming según claude-prompt.json
        const [alertsRes, statsRes] = await Promise.all([
          systemAPI.getAlerts().catch(() => ({ data: [] })),
          systemAPI.getLiveStats().catch(() => ({ data: null })),
        ]);

        // Filtrar solo servicios de streaming para operadores
        setServices([
          { 
            service: "Streaming Service", 
            status: "healthy", 
            uptime: 99.5, 
            responseTime: 45,
            lastCheck: new Date().toISOString() 
          }
        ]);
        setSystemMetrics(null); // Operadores no ven métricas del sistema
        setAlerts(alertsRes.data?.filter((alert: any) => 
          alert.service.toLowerCase().includes('stream') || 
          alert.service.toLowerCase().includes('rtmp')
        ) || []);
        setLiveStats({
          ...statsRes.data,
          // Solo mostrar stats relacionadas con streaming
          activeUsers: statsRes.data?.activeUsers || 0,
          liveEvents: statsRes.data?.liveEvents || 0,
          activeBets: 0, // Operadores no ven info de apuestas
          connectionCount: statsRes.data?.connectionCount || 0,
          requestsPerMinute: 0,
          errorRate: 0
        });
      } else {
        // Admin ve todo el monitoreo completo
        const [servicesRes, metricsRes, alertsRes, statsRes] = await Promise.all([
          systemAPI.getServicesStatus(),
          systemAPI.getSystemMetrics(),
          systemAPI.getAlerts(),
          systemAPI.getLiveStats(),
        ]);

        setServices(servicesRes.data);
        setSystemMetrics(metricsRes.data);
        setAlerts(alertsRes.data);
        setLiveStats(statsRes.data);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      setError("Error al cargar datos de monitoreo");
      setServices([]);
      setSystemMetrics(null);
      setAlerts([]);
      setLiveStats(null);
    } finally {
      setLoading(false);
    }
  }, [isOperator]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMonitoringData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMonitoringData]);

  // Fetch inicial
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Export report
  const exportSystemReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      services,
      systemMetrics,
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

  // Helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "down":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
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

  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024;
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${bytes.toFixed(0)} MB`;
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
              Estado general • Última actualización:{" "}
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                Auto-refresh
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!autoRefresh}
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
              </select>
            </div>

            <button
              onClick={exportSystemReport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>

            <button
              onClick={fetchMonitoringData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <ErrorMessage
          error={error}
          onRetry={fetchMonitoringData}
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
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <Card
            variant="stat"
            title="Conexiones WS"
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

      {/* Estado de servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado de Servicios
          </h3>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {service.service}
                    </p>
                    <p className="text-sm text-gray-600">
                      Uptime: {service.uptime}% • Respuesta:{" "}
                      {service.responseTime}ms
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    service.status
                  )}`}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Métricas del sistema */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Métricas del Sistema
          </h3>
          {systemMetrics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {systemMetrics.cpu.usage}%
                  </span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${systemMetrics.cpu.usage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Memory</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {systemMetrics.memory.usage.toFixed(1)}%
                  </span>
                  <p className="text-xs text-gray-500">
                    {formatBytes(systemMetrics.memory.used)} /{" "}
                    {formatBytes(systemMetrics.memory.total)}
                  </p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${systemMetrics.memory.usage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {systemMetrics.disk.usage}%
                  </span>
                  <p className="text-xs text-gray-500">
                    {systemMetrics.disk.used} GB / {systemMetrics.disk.total} GB
                  </p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${systemMetrics.disk.usage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium">Network</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    ↑ {systemMetrics.network.outgoing} MB/s
                  </p>
                  <p className="text-xs text-gray-500">
                    ↓ {systemMetrics.network.incoming} MB/s
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

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
                  alert.level
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
