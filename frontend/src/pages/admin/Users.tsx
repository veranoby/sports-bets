// frontend/src/pages/admin/Users.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Wifi, WifiOff } from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import UserModal from "../../components/admin/UserModal";
import { usersAPI, userAPI, adminAPI } from "../../services/api";
import type { User } from "../../types";

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(
    new URLSearchParams(location.search).get("status") || "all",
  );
  const [selectedSubscription, setSelectedSubscription] = useState<string>(
    new URLSearchParams(location.search).get("subscription") || "all",
  );
  const [modalState, setModalState] = useState<{
    mode: "create" | "edit" | null;
    user?: User;
  }>({ mode: null });
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [checkingDisconnect, setCheckingDisconnect] = useState<string | null>(
    null,
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Always fetch all users initially without filters
    const params: any = { role: "user", limit: 1000 };

    const res = await usersAPI.getAll(params);
    if (res.success) {
      setUsers((res.data as any)?.users || []);
    } else {
      setError(res.error || "Error loading users");
    }
    setLoading(false);
  }, []);

  // Function to fetch online status for all users
  const fetchOnlineStatus = useCallback(async () => {
    try {
      const response = await adminAPI.getActiveUsers();
      if (response.success && response.data) {
        const activeIds = (response.data as any)?.activeUserIds || [];
        setOnlineUserIds(new Set(activeIds));
      }
    } catch (error) {
      console.error("Error fetching online status:", error);
    }
  }, []);

  // Add useEffect to periodically update online status
  useEffect(() => {
    // Initial fetch
    fetchOnlineStatus();

    // Update every 15 seconds
    const interval = setInterval(fetchOnlineStatus, 15000);

    return () => clearInterval(interval);
  }, [fetchOnlineStatus]);

  // Check if a user is online based on their session activity
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
        `¿Estás seguro de que quieres desconectar al usuario "${username}"?`,
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

        alert(`Usuario ${username} ha sido desconectado exitosamente`);
      } else {
        alert(
          `Error al desconectar al usuario: ${response.message || "Error desconocido"}`,
        );
      }
    } catch (error) {
      console.error("Error disconnecting user:", error);
      alert("Error al intentar desconectar al usuario");
    } finally {
      setCheckingDisconnect(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (selectedStatus !== "all") {
      params.set("status", selectedStatus);
    } else {
      params.delete("status");
    }

    if (selectedSubscription !== "all") {
      params.set("subscription", selectedSubscription);
    } else {
      params.delete("subscription");
    }

    const newSearch = params.toString();
    if (newSearch !== new URLSearchParams(location.search).toString()) {
      navigate(`?${newSearch}`, { replace: true });
    }
  }, [selectedStatus, selectedSubscription, navigate, location.search]);

  // Apply all filters locally on the loaded data
  const filteredUsers = users.filter((user) => {
    // Apply search filter
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply status filter
    let matchesStatus = true;
    if (selectedStatus !== "all") {
      if (selectedStatus === "active" || selectedStatus === "inactive") {
        matchesStatus = user.isActive === (selectedStatus === "active");
      } else if (
        selectedStatus === "approved" ||
        selectedStatus === "pending"
      ) {
        matchesStatus = user.approved === (selectedStatus === "approved");
      }
    }

    // Apply subscription filter
    let matchesSubscription = true;
    if (selectedSubscription !== "all") {
      if (user.subscription) {
        matchesSubscription = user.subscription.type === selectedSubscription;
      } else {
        // If no subscription object exists, treat as "free"
        matchesSubscription = selectedSubscription === "free";
      }
    }

    return matchesSearch && matchesStatus && matchesSubscription;
  });

  const handleEditUser = async (userId: string) => {
    try {
      // Fetch full user data including wallet
      const response = await usersAPI.getById(userId);
      const fullUser = response.data;
      setModalState({ mode: "edit", user: fullUser });
    } catch (err) {
      console.error("Error loading user details:", err);
      // Fallback to list data if endpoint fails
      const user = users.find((u) => u.id === userId);
      if (user) {
        setModalState({ mode: "edit", user: user });
      }
    }
  };

  const handleCloseModal = () => {
    setModalState({ mode: null });
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    // DO NOT close modal - allow admin to see updated balance and make additional adjustments
  };

  const handleCreateUser = () => {
    setModalState({ mode: "create", user: undefined });
  };

  const handleUserCreated = () => {
    fetchUsers();
    handleCloseModal();
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newStatus = !currentStatus;
    const actionMessage = currentStatus ? "desactivar" : "reactivar";

    if (
      !window.confirm(
        `¿Estás seguro de que quieres ${actionMessage} al usuario "${user.username}"?`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      const res = await usersAPI.updateStatus(userId, newStatus);
      if (res.success) {
        // Update the user's status in the local state
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, isActive: newStatus } : u,
          ),
        );
      } else {
        setError(res.error || `Error al ${actionMessage} usuario`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Error al ${actionMessage} usuario`,
      );
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando usuarios..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600">
            {users.length} usuarios de tipo "user" registrados
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Usuario
        </button>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchUsers} className="mb-6" />
      )}

      <Card className="p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded px-3 py-2 min-w-[150px]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="approved">Aprobado</option>
            <option value="pending">Pendiente</option>
          </select>

          <select
            value={selectedSubscription}
            onChange={(e) => setSelectedSubscription(e.target.value)}
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
                  Nombre de Usuario
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
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? "Activo" : "Inactivo"}
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
                          handleDisconnectUser(user.id, user.username)
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
                        onClick={() => handleEditUser(user.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      {user.isActive ? (
                        <button
                          onClick={() =>
                            handleToggleUserStatus(user.id, user.isActive)
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
                              handleToggleUserStatus(user.id, user.isActive)
                            }
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Activar
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Estás seguro de que quieres eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`,
                                )
                              ) {
                                userAPI.delete(user.id);
                              }
                            }}
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
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron usuarios.
          </div>
        )}
      </Card>

      {modalState.mode && (
        <UserModal
          mode={modalState.mode}
          role="user"
          user={modalState.user}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
