// frontend/src/pages/admin/Bets.tsx
// Admin page to view all user bets with filtering and export functionality

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { betsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import {
  Calendar,
  DollarSign,
  User as UserIcon,
  TrendingUp,
  Download,
} from "lucide-react";

// Import Bet interface type
import type { Bet } from "../../types";
import { exportToCSV } from "../../utils/exportCSV";

interface BetFilter {
  userId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  fightId?: string;
}

const AdminBetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BetFilter>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Verify admin access
  useEffect(() => {
    if (
      !currentUser ||
      (currentUser.role !== "admin" && currentUser.role !== "operator")
    ) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  // Load bets with filters and pagination
  const loadBets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = await betsAPI.getAllAdmin(params);

      if (response.success && response.data) {
        const responseData = response.data as {
          bets?: Bet[];
          total?: number;
          totalPages?: number;
          page?: number;
          offset?: number;
        };
        setBets(responseData.bets || []);
        setPagination((prev) => ({
          ...prev,
          total: responseData.total || 0,
          totalPages: responseData.totalPages || 1,
        }));
      } else {
        throw new Error(response.error || "Error loading bets");
      }
    } catch (err) {
      console.error("Error loading bets:", err);
      setError(err instanceof Error ? err.message : "Error loading bets");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Handle filter changes
  const handleFilterChange = (field: keyof BetFilter, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 when filters change
  };

  useEffect(() => {
    loadBets();
  }, [filters, pagination.page, loadBets]);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-yellow-100 text-yellow-800";
      case "won":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate statistics
  const stats = {
    totalBets: bets.length,
    totalAmount: bets.reduce((sum, bet) => sum + bet.amount, 0),
    completedBets: bets.filter((b) => ["won", "lost"].includes(b.status))
      .length,
    activeBets: bets.filter((b) => ["pending", "active"].includes(b.status))
      .length,
    pendingBets: bets.filter((b) => b.status === "pending").length,
    wonBets: bets.filter((b) => b.status === "won").length,
    lostBets: bets.filter((b) => b.status === "lost").length,
  };

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "operator")
  ) {
    return null; // Will redirect via useEffect
  }

  if (loading && bets.length === 0) {
    return <LoadingSpinner text="Cargando historial de apuestas..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage error={error} onRetry={loadBets} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Historial de Apuestas
          </h1>
          <p className="text-gray-600 mt-1">
            Supervisión global de todas las apuestas realizadas por usuarios
          </p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => {
            // Export bets data to CSV
            const columns = [
              { key: "id" as const, header: "ID" },
              { key: "userId" as const, header: "Usuario ID" },
              { key: "user" as const, header: "Nombre de Usuario" },
              { key: "fightId" as const, header: "ID Pelea" },
              { key: "fight" as const, header: "Pelea" },
              { key: "amount" as const, header: "Monto" },
              { key: "side" as const, header: "Lado" },
              { key: "status" as const, header: "Estado" },
              { key: "createdAt" as const, header: "Fecha Creación" },
            ];

            // Process data to extract proper values for CSV export
            const processedBets = bets.map((bet) => ({
              ...bet,
              user: bet.userId || "Usuario Desconocido",
              fight: `${bet.fightId || "N/A"}`,
              createdAt: new Date(bet.createdAt).toLocaleString("es-ES"),
            }));

            exportToCSV(
              processedBets,
              `apuestas_${new Date().toISOString().slice(0, 10)}.csv`,
              columns,
            );
          }}
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-lg bg-blue-100">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Apostado</p>
            <p className="text-xl font-semibold text-gray-900">
              ${stats.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-lg bg-green-100">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Apuestas Activas</p>
            <p className="text-xl font-semibold text-gray-900">
              {stats.activeBets}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-lg bg-yellow-100">
            <UserIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Usuarios Activos</p>
            <p className="text-xl font-semibold text-gray-900">
              {[...new Set(bets.map((b) => b.userId))].length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-lg bg-purple-100">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Hoy</p>
            <p className="text-xl font-semibold text-gray-900">
              {
                bets.filter(
                  (b) =>
                    new Date(b.createdAt).toDateString() ===
                    new Date().toDateString(),
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={filters.userId || ""}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              placeholder="ID o nombre de usuario"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="active">Activa</option>
              <option value="won">Ganada</option>
              <option value="lost">Perdida</option>
              <option value="cancelled">Cancelada</option>
              <option value="refunded">Reembolsada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pelea
            </label>
            <input
              type="text"
              value={filters.fightId || ""}
              onChange={(e) => handleFilterChange("fightId", e.target.value)}
              placeholder="ID de pelea"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Bets Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pelea
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apuesta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bets.length > 0 ? (
                bets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {bet.userId || "Usuario desconocido"}
                      </div>
                      <div className="text-sm text-gray-500">{"N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bet.fightId || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${bet.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Potencial: ${"N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bet.side === "red"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {bet.side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {"Estándar"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bet.status)}`}
                      >
                        {bet.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bet.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No se encontraron apuestas con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </span>{" "}
                  de <span className="font-medium">{pagination.total}</span>{" "}
                  resultados
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => goToPage(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span>Anterior</span>
                  </button>

                  {/* Pagination numbers */}
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        // If total pages <= 5, show all pages
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        // If current page is near the beginning, show 1-5
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        // If current page is near the end, show last 5
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        // Otherwise, show current page centered
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}

                  <button
                    onClick={() =>
                      goToPage(
                        Math.min(pagination.totalPages, pagination.page + 1),
                      )
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span>Siguiente</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBetsPage;
