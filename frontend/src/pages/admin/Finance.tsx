// frontend/src/pages/admin/Finance.tsx
// 💰 GESTIÓN FINANZAS ADMIN - Dashboard financiero completo

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Download,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Users,
  Activity,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

// APIs
import {
  walletAPI,
} from "../../config/api";

interface FinancialMetrics {
  totalRevenue: number;
  commissionsRevenue: number;
  subscriptionsRevenue: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBetsVolume: number;
  activeUsers: number;
  premiumUsers: number;
  netIncome: number;
  previousPeriodRevenue: number;
}

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "commission" | "subscription";
  amount: number;
  userId: string;
  username: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
  description: string;
}

interface RevenueBySource {
  commissions: number;
  subscriptions: number;
  other: number;
}

interface TrendData {
  date: string;
  revenue: number;
  commissions: number;
  subscriptions: number;
  deposits: number;
  withdrawals: number;
}

const AdminFinancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados principales
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenueBySource, setRevenueBySource] =
    useState<RevenueBySource | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros temporales
  const [timePeriod, setTimePeriod] = useState(
    searchParams.get("period") || "month",
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");

  // Estados UI
  const [showTransactionDetail, setShowTransactionDetail] =
    useState<Transaction | null>(null);

  // Fetch datos financieros
  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        period: timePeriod,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const [metricsRes, transactionsRes, revenueRes, trendsRes] =
        await Promise.all([
          walletAPI.getFinancialMetrics(params),
          walletAPI.getTransactions({ ...params, limit: 100 }),
          walletAPI.getRevenueBySource(params),
          walletAPI.getRevenueTrends(params),
        ]);

      setMetrics(metricsRes.data || null);
      setTransactions(transactionsRes.data?.transactions || []);
      setRevenueBySource(revenueRes.data || null);
      setTrendData(trendsRes.data || []);
    } catch {
      setError("Error al cargar datos financieros");
      setMetrics(null);
      setTransactions([]);
      setRevenueBySource(null);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  }, [timePeriod, dateFrom, dateTo]);

  // Cálculos derivados
  const calculatedMetrics = useMemo(() => {
    if (!metrics) return null;

    const revenueGrowth =
      metrics.previousPeriodRevenue > 0
        ? ((metrics.totalRevenue - metrics.previousPeriodRevenue) /
            metrics.previousPeriodRevenue) *
          100
        : 0;

    const commissionRate =
      metrics.totalBetsVolume > 0
        ? (metrics.commissionsRevenue / metrics.totalBetsVolume) * 100
        : 0;

    const arpu =
      metrics.activeUsers > 0 ? metrics.totalRevenue / metrics.activeUsers : 0;

    return {
      revenueGrowth,
      commissionRate,
      arpu,
      netMargin:
        metrics.totalRevenue > 0
          ? (metrics.netIncome / metrics.totalRevenue) * 100
          : 0,
    };
  }, [metrics]);

  // Exportar datos
  const exportFinancialReport = () => {
    if (!metrics || !transactions) return;

    const report = {
      periodo: `${dateFrom || "Inicio"} - ${dateTo || "Fin"}`,
      metricas: metrics,
      transacciones: transactions.length,
      crecimiento: calculatedMetrics?.revenueGrowth?.toFixed(2) + "%",
      generado: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_financiero_${timePeriod}_${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
  };

  // Actualizar URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (timePeriod !== "month") params.set("period", timePeriod);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    setSearchParams(params);
  }, [timePeriod, dateFrom, dateTo, setSearchParams]);

  // Fetch inicial
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Helpers de formato
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (loading) {
    return <LoadingSpinner text="Cargando datos financieros..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={fetchFinancialData} />;
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-center text-gray-500">
        <p>No hay datos financieros disponibles.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Panel Financiero
            </h1>
            <p className="text-gray-600">
              Resumen{" "}
              {timePeriod === "today"
                ? "del día"
                : timePeriod === "week"
                  ? "semanal"
                  : timePeriod === "month"
                    ? "mensual"
                    : "anual"}
              {metrics &&
                ` • ${formatCurrency(metrics.totalRevenue)} ingresos totales`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportFinancialReport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={fetchFinancialData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Filtros temporales */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex gap-2">
            {[
              { id: "today", label: "Hoy" },
              { id: "week", label: "Semana" },
              { id: "month", label: "Mes" },
              { id: "year", label: "Año" },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setTimePeriod(period.id)}
                className={`px-3 py-1 rounded text-sm ${
                  timePeriod === period.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">a</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card
          variant="stat"
          title="Ingresos Totales"
          value={metrics ? formatCurrency(metrics.totalRevenue) : "$0"}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          trend={
            calculatedMetrics
              ? {
                  value: Math.abs(calculatedMetrics.revenueGrowth),
                  direction:
                    calculatedMetrics.revenueGrowth >= 0 ? "up" : "down",
                  period: "vs período anterior",
                }
              : undefined
          }
        />

        <Card
          variant="stat"
          title="Comisiones (5%)"
          value={metrics ? formatCurrency(metrics.commissionsRevenue) : "$0"}
          icon={<BarChart3 className="w-6 h-6" />}
          color="blue"
          description={
            calculatedMetrics
              ? `${formatPercentage(
                  calculatedMetrics.commissionRate,
                )} del volumen`
              : undefined
          }
        />

        <Card
          variant="stat"
          title="Suscripciones"
          value={metrics ? formatCurrency(metrics.subscriptionsRevenue) : "$0"}
          icon={<CreditCard className="w-6 h-6" />}
          color="purple"
          description={
            metrics ? `${metrics.premiumUsers} usuarios premium` : undefined
          }
        />

        <Card
          variant="stat"
          title="Beneficio Neto"
          value={metrics ? formatCurrency(metrics.netIncome) : "$0"}
          icon={<TrendingUp className="w-6 h-6" />}
          color={metrics && metrics.netIncome >= 0 ? "green" : "red"}
          description={
            calculatedMetrics
              ? `${formatPercentage(calculatedMetrics.netMargin)} margen`
              : undefined
          }
        />
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card
          variant="stat"
          title="Depósitos"
          value={metrics ? formatCurrency(metrics.totalDeposits) : "$0"}
          icon={<ArrowDown className="w-6 h-6 text-green-600" />}
          color="green"
        />

        <Card
          variant="stat"
          title="Retiros"
          value={metrics ? formatCurrency(metrics.totalWithdrawals) : "$0"}
          icon={<ArrowUp className="w-6 h-6 text-red-600" />}
          color="red"
        />

        <Card
          variant="stat"
          title="Volumen Apuestas"
          value={metrics ? formatCurrency(metrics.totalBetsVolume) : "$0"}
          icon={<Activity className="w-6 h-6" />}
          color="yellow"
        />

        <Card
          variant="stat"
          title="ARPU"
          value={
            calculatedMetrics ? formatCurrency(calculatedMetrics.arpu) : "$0"
          }
          icon={<Users className="w-6 h-6" />}
          color="blue"
          description="Ingreso promedio por usuario"
        />
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribución de ingresos */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Ingresos
          </h3>
          {revenueBySource ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-700">Comisiones</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(revenueBySource.commissions)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {metrics
                      ? (
                          (revenueBySource.commissions / metrics.totalRevenue) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-sm text-gray-700">Suscripciones</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(revenueBySource.subscriptions)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {metrics
                      ? (
                          (revenueBySource.subscriptions /
                            metrics.totalRevenue) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Barra de progreso visual */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 float-left"
                    style={{
                      width: metrics
                        ? `${
                            (revenueBySource.commissions /
                              metrics.totalRevenue) *
                            100
                          }%`
                        : "0%",
                    }}
                  ></div>
                  <div
                    className="h-full bg-purple-500 float-left"
                    style={{
                      width: metrics
                        ? `${
                            (revenueBySource.subscriptions /
                              metrics.totalRevenue) *
                            100
                          }%`
                        : "0%",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-8 h-8 mx-auto mb-2" />
              <p>Cargando distribución...</p>
            </div>
          )}
        </Card>

        {/* Tendencia de ingresos (simplificada) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendencia de Ingresos
          </h3>
          <div className="space-y-3">
            {trendData.slice(-7).map((day) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString("es", {
                    weekday: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{
                      width: `${
                        (day.revenue /
                          Math.max(...trendData.map((d) => d.revenue))) *
                        60
                      }px`,
                    }}
                  ></div>
                  <span className="text-sm font-medium">
                    {formatCurrency(day.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transacciones recientes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Transacciones Recientes
          </h3>
          <span className="text-sm text-gray-600">
            {transactions.length} transacciones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No hay transacciones para mostrar
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {transaction.type === "commission" && (
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                        )}
                        {transaction.type === "subscription" && (
                          <CreditCard className="w-4 h-4 text-purple-600" />
                        )}
                        {transaction.type === "deposit" && (
                          <ArrowDown className="w-4 h-4 text-green-600" />
                        )}
                        {transaction.type === "withdrawal" && (
                          <ArrowUp className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm capitalize">
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setShowTransactionDetail(transaction)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal detalle transacción */}
      {showTransactionDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalle de Transacción
              </h2>
              <button
                onClick={() => setShowTransactionDetail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  ID
                </label>
                <p className="text-sm text-gray-900 font-mono">
                  {showTransactionDetail.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Tipo
                </label>
                <p className="text-sm text-gray-900 capitalize">
                  {showTransactionDetail.type}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Usuario
                </label>
                <p className="text-sm text-gray-900">
                  {showTransactionDetail.username}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Monto
                </label>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(showTransactionDetail.amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Descripción
                </label>
                <p className="text-sm text-gray-900">
                  {showTransactionDetail.description}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Fecha
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(showTransactionDetail.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancePage;
