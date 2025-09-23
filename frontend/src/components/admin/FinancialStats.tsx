/**
 * FinancialStats Component
 * Muestra estadísticas financieras y gráficos del sistema
 */
"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Users, Activity } from "lucide-react";
import Card from "../shared/Card";
import ErrorMessage from "../shared/ErrorMessage";
import LoadingSpinner from "../shared/LoadingSpinner";
import EmptyState from "../shared/EmptyState";

interface FinancialData {
  totalRevenue: number;
  totalTransactions: number;
  activeWallets: number;
  averageDeposit: number;
  averageWithdrawal: number;
  pendingWithdrawals: number;
  transactionsByDay: { date: string; amount: number }[];
  transactionsByType: { type: string; count: number; amount: number }[];
}

const FinancialStats: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">(
    "month",
  );

  // Cargar datos financieros (sin mock)
  const loadFinancialData = React.useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ range: dateRange });
      const response = await fetch(`/api/wallet/stats?${params}`);
      const data = await response.json();
      setFinancialData(data.data);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos financieros");
      setFinancialData(null); // Limpiar datos en caso de error
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadFinancialData();
  }, [dateRange, loadFinancialData]);

  // Formatear valores monetarios
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value ?? 0);

  // Solo usar datos reales de la API
  const data = financialData;

  // Renderizado condicional
  if (isLoading) return <LoadingSpinner text="Cargando datos financieros..." />;
  if (error) return <ErrorMessage error={error} onRetry={loadFinancialData} />;
  if (!financialData) {
    return (
      <EmptyState
        title="Sin datos"
        description="No hay datos financieros disponibles."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Estadísticas Financieras
        </h3>
        <div className="flex space-x-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => setDateRange("week")}
              className={`px-3 py-1.5 text-sm ${
                dateRange === "week"
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={dateRange === "week" ? { backgroundColor: "#596c95" } : {}}
            >
              Semana
            </button>
            <button
              onClick={() => setDateRange("month")}
              className={`px-3 py-1.5 text-sm ${
                dateRange === "month"
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={
                dateRange === "month" ? { backgroundColor: "#596c95" } : {}
              }
            >
              Mes
            </button>
            <button
              onClick={() => setDateRange("year")}
              className={`px-3 py-1.5 text-sm ${
                dateRange === "year"
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              style={dateRange === "year" ? { backgroundColor: "#596c95" } : {}}
            >
              Año
            </button>
          </div>
          <button
            onClick={loadFinancialData}
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
          onRetry={loadFinancialData}
          className="mb-6"
        />
      )}

      {/* Estado de carga */}
      {isLoading && (
        <LoadingSpinner text="Cargando datos financieros..." className="py-8" />
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          variant="stat"
          title="Ingresos Totales"
          value={`${data?.totalRevenue?.toLocaleString?.() ?? 0}`}
          color="blue"
          trend={{
            value: data?.totalRevenue && data.totalRevenue > 0 ? 10 : -5,
            direction:
              data?.totalRevenue && data.totalRevenue > 0 ? "up" : "down",
          }}
        />
        <Card
          title="Active Users"
          value={data?.activeWallets?.toLocaleString?.() ?? 0}
          icon={<Users />}
          trend={data?.activeWallets && data.activeWallets > 0 ? "up" : "down"}
          color="green"
        />
        <Card
          title="Avg. Bet Amount"
          value={`${data?.averageDeposit?.toFixed?.(2) ?? 0}`}
          icon={<Activity />}
          color="red"
        />
      </div>

      {/* Gráfico de transacciones (simulado con divs) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h4 className="text-base font-semibold text-gray-900 mb-4">
          Transacciones por Día
        </h4>
        <div className="h-64 flex items-end justify-between space-x-2">
          {data?.transactionsByDay && data.transactionsByDay.length > 0 ? (
            data.transactionsByDay.map((day, index) => {
              const height =
                (day.amount /
                  Math.max(...data.transactionsByDay!.map((d) => d.amount))) *
                100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${height}%`,
                      backgroundColor: index % 2 === 0 ? "#596c95" : "#cd6263",
                      minHeight: "10px",
                    }}
                    title={`${new Date(
                      day.date,
                    ).toLocaleDateString()}: ${formatCurrency(day.amount)}`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(day.date).toLocaleDateString(undefined, {
                      weekday: "short",
                    })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-center w-full">Sin datos</div>
          )}
        </div>
      </div>

      {/* Tabla de transacciones por tipo */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <h4 className="text-base font-semibold text-gray-900 p-6 pb-4">
          Transacciones por Tipo
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.transactionsByType &&
              data.transactionsByType.length > 0 ? (
                data.transactionsByType.map((type, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {type.type.charAt(0).toUpperCase() + type.type.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(type.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(type.amount / type.count)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-4">
                    Sin datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialStats;
