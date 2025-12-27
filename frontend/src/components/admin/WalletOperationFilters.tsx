// frontend/src/components/admin/WalletOperationFilters.tsx

import React from "react";
import {
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface WalletOperationFiltersProps {
  filters: {
    status: string;
    dateFrom: string;
    dateTo: string;
    type: "deposit" | "withdrawal";
  };
  onChange: (newFilters: Partial<WalletOperationFiltersProps["filters"]>) => void;
  onTabChange: (tab: "deposits" | "withdrawals" | "history") => void;
  activeTab: "deposits" | "withdrawals" | "history";
}

const WalletOperationFilters: React.FC<WalletOperationFiltersProps> = ({
  filters,
  onChange,
  onTabChange,
  activeTab,
}) => {
  // Opciones de estado
  const statusOptions = [
    { value: "", label: "Todos", icon: Filter },
    { value: "pending", label: "Pendiente", icon: Clock },
    { value: "approved", label: "Aprobado", icon: CheckCircle },
    { value: "rejected", label: "Rechazado", icon: XCircle },
    { value: "completed", label: "Completado", icon: TrendingUp },
    { value: "cancelled", label: "Cancelado", icon: AlertCircle },
  ];

  // Opciones de tipo
  const typeOptions = [
    { value: "deposit", label: "Depósito", icon: TrendingUp },
    { value: "withdrawal", label: "Retiro", icon: TrendingDown },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-wrap gap-6 mb-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "deposits"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => onTabChange("deposits")}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Depósitos
            </span>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "withdrawals"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => onTabChange("withdrawals")}
          >
            <span className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Retiros
            </span>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => onTabChange("history")}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historial
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        {/* Filtro de estado */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de tipo - Solo mostrar si no está en historial */}
        {activeTab !== "history" && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                onChange({ type: e.target.value as "deposit" | "withdrawal" })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro de fecha desde */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtro de fecha hasta */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default WalletOperationFilters;
