/**
 * FinancialStats Component
 * Muestra estadísticas financieras y gráficos del sistema
 */
"use client";

import React, { useState, useEffect } from "react";
import { walletAPI } from "../../config/api";
import {
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Wallet,
  Activity,
} from "lucide-react";
import DataCard from "../shared/DataCard";

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
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">(
    "month"
  );

  // Cargar datos financieros
  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ range: dateRange });
      const response = await fetch(`/api/wallet/stats?${params}`);
      const data = await response.json();
      setFinancialData(data.data);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos financieros");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  // Formatear valores monetarios
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  // Datos mock para visualización (se reemplazarían con datos reales de la API)
  const mockData: FinancialData = {
    totalRevenue: 1250000,
    totalTransactions: 8750,
    activeWallets: 1200,
    averageDeposit: 850,
    averageWithdrawal: 1200,
    pendingWithdrawals: 15,
    transactionsByDay: [
      { date: "2023-01-01", amount: 12500 },
      { date: "2023-01-02", amount: 15000 },
      { date: "2023-01-03", amount: 18000 },
      { date: "2023-01-04", amount: 14000 },
      { date: "2023-01-05", amount: 21000 },
      { date: "2023-01-06", amount: 19500 },
      { date: "2023-01-07", amount: 22000 },
    ],
    transactionsByType: [
      { type: "deposit", count: 4500, amount: 3825000 },
      { type: "withdrawal", count: 2800, amount: 3360000 },
      { type: "bet", count: 12000, amount: 6000000 },
      { type: "win", count: 5000, amount: 7500000 },
    ],
  };

  // Usar datos mock hasta que la API esté lista
  const data = financialData || mockData;

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
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Cargando datos financieros...</p>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toLocaleString()}`}
          icon={<DollarSign />}
          color="blue"
        />
        <DataCard
          title="Active Users"
          value={data.activeWallets.toLocaleString()}
          icon={<Users />}
          trend={data.activeWallets > 0 ? "up" : "down"}
          color="green"
        />
        <DataCard
          title="Avg. Bet Amount"
          value={`$${data.averageDeposit.toFixed(2)}`}
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
          {data.transactionsByDay.map((day, index) => {
            const height =
              (day.amount /
                Math.max(...data.transactionsByDay.map((d) => d.amount))) *
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
                    day.date
                  ).toLocaleDateString()}: ${formatCurrency(day.amount)}`}
                ></div>
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </span>
              </div>
            );
          })}
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
              {data.transactionsByType.map((type, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialStats;
