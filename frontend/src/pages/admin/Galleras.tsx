// frontend/src/pages/admin/Galleras.tsx
// 🐓 GESTIÓN GALLERAS - Página dedicada para admin
// Muestra usuarios con rol "gallera" y sus entidades de gallera asociadas

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Users, Plus, Search, Edit, Trash2, Wifi, WifiOff } from "lucide-react";

// Componentes
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import UserModal from "../../components/admin/UserModal";

// APIs
import { userAPI, adminAPI } from "../../services/api";

// Tipos
import type { User as UserType } from "../../types";

interface CombinedGalleraData {
  user: UserType;
}

const AdminGallerasPage: React.FC = () => {
  // Estados
  const navigate = useNavigate();
  const location = useLocation();
  const [combinedData, setCombinedData] = useState<CombinedGalleraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [galleraStatus, setGalleraStatus] = useState<string>(
    new URLSearchParams(location.search).get("status") || "all",
  );
  const [ownerApproved, setOwnerApproved] = useState<string>(
    new URLSearchParams(location.search).get("ownerApproved") || "all",
  );
  const [ownerSubscription, setOwnerSubscription] = useState<string>(
    new URLSearchParams(location.search).get("subscription") || "all",
  );
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [checkingDisconnect, setCheckingDisconnect] = useState<string | null>(
    null,
  );

  // Fetch de datos combinados - sin filtros
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.getAll({ limit: 1000, role: "gallera" });
      if (!res.success) {
        throw new Error(res.error || "Failed to load galleras");
      }

      const users = res.data?.users ?? [];
      const data = users.map((user) => ({
        user,
      }));
      setCombinedData(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to fetch online status for all users
  const fetchOnlineStatus = useCallback(async () => {
    try {
      const response = await adminAPI.getActiveUsers();
      if (response.success && response.data) {
        setOnlineUserIds(new Set(response.data.activeUserIds || []));
      }
    } catch (error: unknown) {
      console.error("Error fetching online status:", error);
    }
  }, []);

  // Periodically update online status
  useEffect(() => {
    fetchOnlineStatus();
    const interval = setInterval(fetchOnlineStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchOnlineStatus]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (galleraStatus !== "all") {
      params.set("status", galleraStatus);
    } else {
      params.delete("status");
    }

    if (ownerApproved !== "all") {
      params.set("ownerApproved", ownerApproved);
    } else {
      params.delete("ownerApproved");
    }

    if (ownerSubscription !== "all") {
      params.set("subscription", ownerSubscription);
    } else {
      params.delete("subscription");
    }

    const newSearch = params.toString();
    if (newSearch !== new URLSearchParams(location.search).toString()) {
      navigate(`?${newSearch}`, { replace: true });
    }
  }, [
    galleraStatus,
    ownerApproved,
    ownerSubscription,
    navigate,
    location.search,
  ]);

  // Filtrado local aplicando todos los filtros
  const filteredData = useMemo(
    () =>
      combinedData.filter(({ user }) => {
        // Apply search filter
        const matchesSearch =
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email &&
            user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.profileInfo?.galleraName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        // Apply gallera status filter
        let matchesGalleraStatus = true;
        if (galleraStatus !== "all") {
          if (galleraStatus === "active" || galleraStatus === "inactive") {
            matchesGalleraStatus =
              user.isActive === (galleraStatus === "active");
          } else if (
            galleraStatus === "pending" ||
            galleraStatus === "suspended"
          ) {
            matchesGalleraStatus =
              user.approved === (galleraStatus === "pending");
          }
        }

        // Apply owner approved filter
        let matchesOwnerApproved = true;
        if (ownerApproved !== "all") {
          matchesOwnerApproved =
            user.approved === (ownerApproved === "approved");
        }

        // Apply subscription filter
        let matchesOwnerSubscription = true;
        if (ownerSubscription !== "all") {
          if (user.subscription) {
            matchesOwnerSubscription =
              user.subscription.type === ownerSubscription;
          } else {
            // If no subscription object exists, treat as "free"
            matchesOwnerSubscription = ownerSubscription === "free";
          }
        }

        return (
          matchesSearch &&
          matchesGalleraStatus &&
          matchesOwnerApproved &&
          matchesOwnerSubscription
        );
      }),
    [combinedData, searchTerm, galleraStatus, ownerApproved, ownerSubscription],
  );

  // Estado para unified modal
  const [modalState, setModalState] = useState<{
    mode: "create" | "edit" | null;
    user?: UserType;
  }>({ mode: null });

  // Handlers para edición dual
  const handleEdit = (userId: string) => {
    const userData = combinedData.find((item) => item.user.id === userId);
    if (userData) {
      setModalState({ mode: "edit", user: userData.user });
    }
  };

  const handleCreate = () => {
    setModalState({ mode: "create", user: undefined });
  };

  const handleCloseModal = () => {
    setModalState({ mode: null });
  };

  const handleSave = () => {
    handleCloseModal();
    fetchData(); // Refresh data
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const actionMessage = currentStatus ? "desactivar" : "reactivar";

    if (
      !window.confirm(
        `¿Estás seguro de que quieres ${actionMessage} este criadero?`,
      )
    ) {
      return;
    }

    try {
      await userAPI.updateStatus(userId, newStatus);
      fetchData();
    } catch {
      setError(`Error al ${actionMessage} el criadero`);
    }
  };

  // Check if a user is online
  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUserIds.has(userId);
    },
    [onlineUserIds],
  );

  // Function to force disconnect a user
  const handleDisconnectUser = async (userId: string, username: string) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres desconectar al criadero "${username}"?`,
      )
    ) {
      return;
    }

    setCheckingDisconnect(userId);

    try {
      const response = await adminAPI.forceLogoutUser(userId);

      if (response.success) {
        // Update online status by removing user from online set
        setOnlineUserIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });

        alert(`Criadero ${username} ha sido desconectado exitosamente`);
      } else {
        alert(
          `Error al desconectar al criadero: ${response.message || "Error desconocido"}`,
        );
      }
    } catch (error) {
      console.error("Error disconnecting user:", error);
      alert("Error al intentar desconectar al criadero");
    } finally {
      setCheckingDisconnect(null);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar el criadero "${username}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await userAPI.delete(userId);
      fetchData();
    } catch {
      setError("Error al eliminar el criadero");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando criaderos..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Criaderos
          </h1>
          <p className="text-gray-600">
            {combinedData.length} criaderos registrados
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Criadero
        </button>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchData} className="mb-6" />
      )}

      <Card className="p-6">
        {/* Barra de filtros */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por usuario, email o nombre del criadero..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={galleraStatus}
            onChange={(e) => setGalleraStatus(e.target.value)}
            className="border rounded px-3 py-2 min-w-[150px]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="pending">Pendiente</option>
            <option value="suspended">Suspendido</option>
          </select>

          <select
            value={ownerApproved}
            onChange={(e) => setOwnerApproved(e.target.value)}
            className="border rounded px-3 py-2 min-w-[150px]"
          >
            <option value="all">Todos los propietarios</option>
            <option value="approved">Propietario aprobado</option>
            <option value="pending">Propietario pendiente</option>
          </select>

          <select
            value={ownerSubscription}
            onChange={(e) => setOwnerSubscription(e.target.value)}
            className="border rounded px-3 py-2 min-w-[150px]"
          >
            <option value="all">Todas las suscripciones</option>
            <option value="free">Gratis</option>
            <option value="daily">24h (Diaria)</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nombre del Criadero
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Sesión
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Suscripción
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Expira
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Miembro Desde
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map(({ user }) => {
                const profile = user.profileInfo || {};
                const galleraName = profile.galleraName || user.username;
                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {galleraName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isActive && user.approved
                        ? "Activo"
                        : user.isActive && !user.approved
                          ? "Pendiente"
                          : "Inactivo"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isUserOnline(user.id) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Wifi className="w-3 h-3 mr-1 text-green-500" />
                            En línea
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <WifiOff className="w-3 h-3 mr-1 text-red-500" />
                            Fuera de línea
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.subscription?.type === "free"
                        ? "Gratuito"
                        : user.subscription?.type === "daily"
                          ? "24 Horas"
                          : user.subscription?.type === "monthly"
                            ? "Mensual"
                            : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.subscription?.expiresAt
                        ? new Date(
                            user.subscription.expiresAt,
                          ).toLocaleDateString()
                        : user.subscription?.manual_expires_at
                          ? new Date(
                              user.subscription.manual_expires_at,
                            ).toLocaleDateString()
                          : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() =>
                            handleDisconnectUser(user.id, galleraName)
                          }
                          disabled={checkingDisconnect === user.id}
                          className={`flex items-center gap-1 ${
                            isUserOnline(user.id)
                              ? "text-red-600 hover:text-red-800"
                              : "text-gray-400 cursor-not-allowed"
                          } ${checkingDisconnect === user.id ? "opacity-50" : ""}`}
                        >
                          {checkingDisconnect === user.id ? (
                            <span className="w-4 h-4 flex items-center justify-center">
                              <span className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-transparent"></span>
                            </span>
                          ) : (
                            <>
                              <WifiOff className="w-4 h-4" />
                              <span>Desconectar</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() =>
                              handleToggleStatus(user.id, user.isActive)
                            }
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Desactivar
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                handleToggleStatus(user.id, user.isActive)
                              }
                              className="text-green-600 hover:text-green-800 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Activar
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, galleraName)}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">
              No se encontraron criaderos
            </h3>
            <p className="text-sm">
              No hay criaderos que coincidan con la búsqueda.
            </p>
          </div>
        )}
      </Card>

      {/* User Modal (Unified Create/Edit) */}
      {modalState.mode && (
        <UserModal
          mode={modalState.mode}
          role="gallera"
          user={modalState.user}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default AdminGallerasPage;
