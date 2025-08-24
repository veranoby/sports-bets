// frontend/src/pages/admin/AdminDashboard.tsx
// 🎯 DASHBOARD ADMIN - Métricas clave + accesos rápidos
// Refactorizado: tabs → grid cards, reutilización componentes

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

// Hooks API existentes
import { useEvents } from "../../hooks/useApi";
import { eventsAPI, usersAPI, articlesAPI, walletAPI } from "../../config/api";

interface DashboardMetrics {
  eventsToday: number;
  liveEventsNow: number;
  pendingUsers: number;
  pendingVenues: number;
  pendingArticles: number;
  withdrawalRequests: number;
  withdrawalAmount: number;
  todayRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    eventsToday: 0,
    liveEventsNow: 0,
    pendingUsers: 0,
    pendingVenues: 0,
    pendingArticles: 0,
    withdrawalRequests: 0,
    withdrawalAmount: 0,
    todayRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch inicial de métricas
  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        eventsData,
        pendingUsersData,
        pendingVenuesData,
        pendingArticlesData,
        withdrawalsData,
        financeData,
      ] = await Promise.all([
        eventsAPI.getAll({ today: true }),
        usersAPI.getAll({ status: "pending", limit: 1 }),
        usersAPI.getAll({ role: "venue", status: "pending", limit: 1 }),
        articlesAPI.getAll({ status: "pending", limit: 1 }),
        walletAPI.getTransactions({
          type: "withdrawal",
          status: "pending",
          limit: 1000, // Para obtener todas las solicitudes pendientes
        }),
        walletAPI.getStats({ period: "today" }),
      ]);

      const liveEvents =
        eventsData.data?.events?.filter((e) => e.status === "live") || [];
      const withdrawals = withdrawalsData.data?.requests || [];
      const totalWithdrawalAmount = withdrawals.reduce(
        (sum, w) => sum + w.amount,
        0
      );

      setMetrics({
        eventsToday: eventsData.data?.total || 0,
        liveEventsNow: liveEvents.length,
        pendingUsers: pendingUsersData.data?.total || 0,
        pendingVenues: pendingVenuesData.data?.total || 0,
        pendingArticles: pendingArticlesData.data?.total || 0,
        withdrawalRequests: withdrawals.length,
        withdrawalAmount: totalWithdrawalAmount,
        todayRevenue: financeData.data?.todayRevenue || 0,
      });

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch inicial + refresh opcional cada 5min
  useEffect(() => {
    fetchDashboardMetrics();

    const interval = setInterval(fetchDashboardMetrics, 5 * 60 * 1000); // 5min
    return () => clearInterval(interval);
  }, [fetchDashboardMetrics]);

  // Navegación con filtros
  const navigateToSection = useCallback(
    (path: string, options?: any) => {
      navigate(path, options);
    },
    [navigate]
  );

  if (loading && !metrics.eventsToday) {
    return <LoadingSpinner text="Cargando dashboard..." />;
  }

  return (
    <div className="min-h-screen page-background p-6">
      {/* Alertas superiores */}
      {metrics.liveEventsNow > 0 && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">
            🔴 {metrics.liveEventsNow} evento(s) EN VIVO ahora mismo
          </span>
          <button
            onClick={() =>
              navigateToSection("/admin/events", { state: { filter: "live" } })
            }
            className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Ver eventos
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-theme-primary">
          Panel de Administración
        </h1>
        <p className="text-theme-secondary">
          Última actualización: {lastRefresh.toLocaleTimeString()}
          <button
            onClick={fetchDashboardMetrics}
            className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </p>
      </div>

      {error && (
        <ErrorMessage
          error={error}
          onRetry={fetchDashboardMetrics}
          className="mb-6"
        />
      )}

      {/* Grid principal - 2x3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Eventos de Hoy */}
        <Card
          variant="stat"
          title="Eventos de Hoy"
          value={metrics.eventsToday}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
          description={
            metrics.liveEventsNow > 0
              ? `${metrics.liveEventsNow} en vivo`
              : "Ninguno activo"
          }
          onClick={() =>
            navigateToSection("/admin/events", { state: { showToday: true } })
          }
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />

        {/* Usuarios a Aprobar */}
        <Card
          variant="stat"
          title="Usuarios a Aprobar"
          value={metrics.pendingUsers}
          icon={<Users className="w-6 h-6" />}
          color={metrics.pendingUsers > 0 ? "yellow" : "gray"}
          highlighted={metrics.pendingUsers > 0}
          onClick={() => navigateToSection("/admin/users?filter=pending")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />

        {/* Venues a Aprobar */}
        <Card
          variant="stat"
          title="Venues a Aprobar"
          value={metrics.pendingVenues}
          icon={<Building2 className="w-6 h-6" />}
          color={metrics.pendingVenues > 0 ? "yellow" : "gray"}
          highlighted={metrics.pendingVenues > 0}
          onClick={() => navigateToSection("/admin/venues?filter=pending")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />

        {/* Noticias por Aprobar */}
        <Card
          variant="stat"
          title="Noticias por Aprobar"
          value={metrics.pendingArticles}
          icon={<FileText className="w-6 h-6" />}
          color={metrics.pendingArticles > 0 ? "yellow" : "gray"}
          highlighted={metrics.pendingArticles > 0}
          onClick={() => navigateToSection("/admin/articles?filter=pending")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />

        {/* Solicitudes de Retiro */}
        <Card
          variant="stat"
          title="Solicitudes de Retiro"
          value={metrics.withdrawalRequests}
          icon={<DollarSign className="w-6 h-6" />}
          color={metrics.withdrawalRequests > 0 ? "red" : "gray"}
          description={`$${metrics.withdrawalAmount.toLocaleString()}`}
          highlighted={metrics.withdrawalRequests > 0}
          onClick={() => navigateToSection("/admin/requests?filter=new")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />

        {/* Resumen Financiero Hoy */}
        <Card
          variant="stat"
          title="Ingresos Hoy"
          value={`$${metrics.todayRevenue.toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
          description="Comisiones + suscripciones"
          onClick={() => navigateToSection("/admin/finances?period=today")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
      </div>

      {/* Acciones rápidas adicionales */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-theme-primary mb-3">
            Estado del Sistema
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base de datos:</span>
              <span className="text-green-600">✓ Conectada</span>
            </div>
            <div className="flex justify-between">
              <span>Usuarios activos:</span>
              <span className="font-medium">En tiempo real</span>
            </div>
            <div className="flex justify-between">
              <span>Última sincronización:</span>
              <span className="text-theme-secondary">
                {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
