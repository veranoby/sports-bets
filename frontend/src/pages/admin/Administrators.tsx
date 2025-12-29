// frontend/src/pages/admin/Administrators.tsx
// Página de administración de administradores y operadores

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  User,
  Filter,
  Eye,
  X,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import SubscriptionBadge from "../../components/shared/SubscriptionBadge";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";
import UserModal from "../../components/admin/UserModal";
import { userAPI, adminAPI } from "../../services/api";
import type { User as UserType } from "../../types";

type RoleFilter = "all" | "admin" | "operator";

const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;

const AdminAdministratorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [administrators, setAdministrators] = useState<UserType[]>([]);
  const [operators, setOperators] = useState<UserType[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleSelectModalOpen, setIsRoleSelectModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "operator">(
    "admin",
  );
  const [modalState, setModalState] = useState<{
    mode: "create" | "edit" | null;
    user?: UserType;
  }>({ mode: null });
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [checkingDisconnect, setCheckingDisconnect] = useState<string | null>(
    null,
  );

  // Function to fetch online status for all users
  const fetchOnlineStatus = useCallback(async () => {
    try {
      const response = await adminAPI.getActiveUsers();
      if (response.success && response.data) {
        setOnlineUserIds(new Set(response.data.activeUserIds || []));
      }
    } catch (error) {
      console.error("Error fetching online status:", error);
    }
  }, []);

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

  // Fetch current user to prevent self-editing
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userAPI.getProfile();
        if (response.success && response.data?.user) {
          setCurrentUser(response.data.user);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchAdministrators = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch admins
      const adminResponse = await userAPI.getAll({
        role: "admin",
        limit: 1000,
      });

      // Fetch operators
      const operatorResponse = await userAPI.getAll({
        role: "operator",
        limit: 1000,
      });

      if (adminResponse.success) {
        setAdministrators(adminResponse.data?.users ?? []);
      } else {
        throw new Error(adminResponse.error || "Error loading administrators");
      }

      if (operatorResponse.success) {
        setOperators(operatorResponse.data?.users ?? []);
      } else {
        throw new Error(operatorResponse.error || "Error loading operators");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error loading administrator data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdministrators();
  }, [fetchAdministrators]);

  // Add useEffect to periodically update online status
  useEffect(() => {
    // Initial fetch
    fetchOnlineStatus();

    // Update every 15 seconds
    const interval = setInterval(fetchOnlineStatus, 15000);

    return () => clearInterval(interval);
  }, [fetchOnlineStatus]);

  // Combine and filter users
  const allUsers = [...administrators, ...operators];
  const filteredUsers = allUsers.filter((user) => {
    // Apply search filter
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.profileInfo?.fullName &&
        user.profileInfo.fullName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    // Apply role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: UserType) => {
    // Prevent editing yourself
    if (currentUser && currentUser.id === user.id) {
      alert(
        "No puedes editarte a ti mismo. Usa el perfil para cambiar tu información.",
      );
      return;
    }

    setModalState({ mode: "edit", user: user });
  };

  const handleDeleteUser = (user: UserType) => {
    // Prevent deleting yourself
    if (currentUser && currentUser.id === user.id) {
      alert("No puedes eliminarte a ti mismo.");
      return;
    }

    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const response = await userAPI.delete(deletingUser.id);
      if (response.success) {
        // Refresh the list
        fetchAdministrators();
        setIsDeleteModalOpen(false);
        setDeletingUser(null);
      } else {
        setError(response.error || "Error deleting user");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error deleting user"));
    }
  };

  // ✅ NUEVO: Funciones para aprobar/rechazar usuarios
  const handleApproveUser = async (userId: string) => {
    try {
      const response = await userAPI.update(userId, { approved: true });
      if (response && response.success) {
        // Refresh list
        fetchAdministrators();
      } else {
        setError("Error approving user");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error approving user"));
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const response = await userAPI.update(userId, {
        approved: false,
        isActive: false,
      });
      if (response && response.success) {
        // Refresh list
        fetchAdministrators();
      } else {
        setError("Error rejecting user");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error rejecting user"));
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </span>
        );
      case "operator":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <User className="w-3 h-3 mr-1" />
            Operator
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {role}
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading administrators and operators..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={fetchAdministrators} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                Administradores y Operadores
              </h1>
              <p className="text-gray-600 mt-1">
                Gestión de cuentas de administradores y operadores
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setIsRoleSelectModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Administrador u Operador
              </button>
            </div>
          </div>
        </div>
        {/* Role Selection Dialog */}
        {isRoleSelectModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Seleccionar Tipo de Usuario
                </h2>
                <button
                  onClick={() => setIsRoleSelectModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  ¿Qué tipo de usuario desea crear?
                </p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setSelectedRole("admin");
                      setIsRoleSelectModalOpen(false);
                      setModalState({ mode: "create", user: undefined });
                    }}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">
                        Administrador
                      </h3>
                      <p className="text-sm text-gray-500">
                        Acceso completo al sistema
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole("operator");
                      setIsRoleSelectModalOpen(false);
                      setModalState({ mode: "create", user: undefined });
                    }}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Operador</h3>
                      <p className="text-sm text-gray-500">
                        Gestión limitada de eventos y usuarios
                      </p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setIsRoleSelectModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by username, email, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="operator">Operators</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Administradores
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {administrators.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Operadores
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {operators.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  Total
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {allUsers.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sesión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Ingreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No se encontraron administradores u operadores
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            {user.profileInfo?.fullName && (
                              <div className="text-xs text-gray-400">
                                {user.profileInfo.fullName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
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
                        <SubscriptionBadge subscription={user.subscription} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : "Nunca"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
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
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Eliminar usuario"
                            disabled={currentUser?.id === user.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* User Modal (Unified Create/Edit) */}
      {modalState.mode && (
        <UserModal
          mode={modalState.mode}
          role={
            modalState.mode === "edit" && modalState.user
              ? modalState.user.role
              : selectedRole
          }
          user={modalState.user}
          onClose={() => setModalState({ mode: null })}
          onSuccess={() => {
            setModalState({ mode: null });
            fetchAdministrators();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete Administrator/Operator"
        message={
          deletingUser
            ? `Are you sure you want to delete ${deletingUser.username}? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        variant="danger"
        type="delete"
      />
    </div>
  );
};

export default AdminAdministratorsPage;
