// frontend/src/pages/admin/Users.tsx
// 👥 GESTIÓN USUARIOS ADMIN - Layout vertical optimizado
// Secciones: Pendientes → Nuevos → Herramientas → Lista Principal + Modal Detalle

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Building2,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

// APIs
import {
  usersAPI,
  walletAPI,
  betsAPI,
  subscriptionsAPI,
} from "../../config/api";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "operator" | "venue" | "user" | "gallera";
  status: "active" | "inactive" | "pending";
  createdAt: string;
  lastLogin?: string;
  profileInfo?: {
    fullName?: string;
    avatar?: string;
  };
  subscription?: {
    status: "active" | "expired" | "none";
    plan?: string;
  };
}

interface UserDetailData {
  user: User;
  wallet: {
    balance: number;
    frozenAmount: number;
    transactions: any[];
  };
  bets: {
    total: number;
    active: number;
    won: number;
    lost: number;
    totalAmount: number;
  };
  subscription: {
    current?: any;
    history: any[];
  };
}

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados principales
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || searchParams.get("filter") || ""
  );

  // Paginación
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [pageSize] = useState(50);

  // Modal detalle
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailData, setUserDetailData] = useState<UserDetailData | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("general");

  // Fetch usuarios con filtrado por operator
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        limit: 1000, // Obtener todos para filtrado local
        includeProfile: true,
        includeSubscription: true,
      };

      const response = await usersAPI.getAll(params);
      let allUsers = response.data?.users || [];

      // Aplicar filtrado por rol de operator según claude-prompt.json
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.role === 'operator') {
        // Operador solo ve: venue, gallera, user (no admin, no operator)
        allUsers = allUsers.filter(user => 
          ['venue', 'gallera', 'user'].includes(user.role)
        );
      }

      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading users");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch detalle usuario
  const fetchUserDetail = useCallback(async (userId: string) => {
    try {
      setDetailLoading(true);

      const [userRes, walletRes, betsRes, subsRes] = await Promise.all([
        usersAPI.getById(userId),
        walletAPI.getUserWallet(userId),
        betsAPI.getUserBets(userId, { limit: 10 }),
        subscriptionsAPI.getUserSubscriptions(userId),
      ]);

      setUserDetailData({
        user: userRes.data,
        wallet: walletRes.data || {
          balance: 0,
          frozenAmount: 0,
          transactions: [],
        },
        bets: betsRes.data?.stats || {
          total: 0,
          active: 0,
          won: 0,
          lost: 0,
          totalAmount: 0,
        },
        subscription: subsRes.data || { history: [] },
      });
    } catch (err) {
      console.error("Error loading user detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Filtrado y paginación
  const { pendingUsers, newUsersThisWeek, filteredUsers, totalPages } =
    useMemo(() => {
      let result = [...users];

      // Usuarios pendientes
      const pending = result.filter((u) => u.status === "pending");

      // Nuevos esta semana (últimos 7 días)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsers = result
        .filter(
          (u) => new Date(u.createdAt) >= weekAgo && u.status !== "pending"
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 20);

      // Aplicar filtros para lista principal
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (u) =>
            u.username.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.profileInfo?.fullName?.toLowerCase().includes(term)
        );
      }

      if (roleFilter) {
        result = result.filter((u) => u.role === roleFilter);
      }

      if (statusFilter) {
        result = result.filter((u) => u.status === statusFilter);
      }

      const total = Math.ceil(result.length / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedUsers = result.slice(startIndex, startIndex + pageSize);

      return {
        pendingUsers: pending,
        newUsersThisWeek: newUsers,
        filteredUsers: paginatedUsers,
        totalPages: total,
      };
    }, [users, searchTerm, roleFilter, statusFilter, currentPage, pageSize]);

  // Actualizar URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());

    setSearchParams(params);
  }, [searchTerm, roleFilter, statusFilter, currentPage, setSearchParams]);

  // Acciones
  const handleApproveUser = async (userId: string) => {
    try {
      await usersAPI.updateStatus(userId, "active");
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
      );
    } catch (err) {
      setError("Error al aprobar usuario");
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await usersAPI.updateStatus(userId, "inactive");
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, status: "inactive" } : u))
      );
    } catch (err) {
      setError("Error al rechazar usuario");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await usersAPI.updateStatus(userId, newStatus);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      setError("Error al cambiar estado");
    }
  };

  const openUserDetail = (userId: string) => {
    setSelectedUserId(userId);
    fetchUserDetail(userId);
  };

  const closeUserDetail = () => {
    setSelectedUserId(null);
    setUserDetailData(null);
    setActiveDetailTab("general");
  };

  // Fetch inicial
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Componentes auxiliares
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || colors.pending
        }`}
      >
        {status}
      </span>
    );
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800",
      operator: "bg-blue-100 text-blue-800",
      venue: "bg-green-100 text-green-800",
      regular_user: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[role as keyof typeof colors] || colors.regular_user
        }`}
      >
        {role.replace("_", " ")}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Cargando usuarios..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">{users.length} usuarios totales</p>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchUsers} className="mb-6" />
      )}

      {/* Sección 1: Pendientes Aprobación */}
      {pendingUsers.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🟡 Usuarios Pendientes de Aprobación ({pendingUsers.length})
          </h2>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Registrado:{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveUser(user.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                  >
                    <UserCheck className="w-4 h-4" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleRejectUser(user.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                  >
                    <UserX className="w-4 h-4" />
                    Rechazar
                  </button>
                  <button
                    onClick={() => openUserDetail(user.id)}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sección 2: Nuevos Esta Semana */}
      {newUsersThisWeek.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🆕 Nuevos Esta Semana ({newUsersThisWeek.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {newUsersThisWeek.map((user) => (
              <div
                key={user.id}
                className="p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <RoleBadge role={user.role} />
                  <button
                    onClick={() => openUserDetail(user.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sección 3: Herramientas */}
      <Card className="mb-6 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por username, email o nombre..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="operator">Operadores</option>
                <option value="venue">Venues</option>
                <option value="user">Usuarios</option>
                <option value="gallera">Galleras</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/users/create")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Crear Usuario
          </button>
        </div>
      </Card>

      {/* Sección 4: Lista Principal */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Usuarios ({filteredUsers.length})
          </h2>
          {(searchTerm || roleFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla */}
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
                  Última conexión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suscripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No se encontraron usuarios con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          {user.profileInfo?.avatar ? (
                            <img
                              src={user.profileInfo.avatar}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <UsersIcon className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Nunca"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.subscription?.status === "active" ? (
                        <span className="text-green-600">Premium</span>
                      ) : (
                        <span className="text-gray-400">Gratuito</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openUserDetail(user.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(user.id, user.status)
                          }
                          className={`flex items-center gap-1 ${
                            user.status === "active"
                              ? "text-red-600 hover:text-red-900"
                              : "text-green-600 hover:text-green-900"
                          }`}
                        >
                          {user.status === "active" ? (
                            <>
                              <UserX className="w-4 h-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4" />
                              Activar
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Detalle Usuario */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalle de Usuario
              </h2>
              <button
                onClick={closeUserDetail}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { id: "general", label: "Información General" },
                  { id: "edit", label: "Editar Perfil" },
                  { id: "wallet", label: "Billetera" },
                  { id: "bets", label: "Apuestas" },
                  { id: "subscription", label: "Suscripción" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      activeDetailTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {detailLoading ? (
                <LoadingSpinner text="Cargando detalle..." />
              ) : userDetailData ? (
                <>
                  {/* Tab Información General */}
                  {activeDetailTab === "general" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Datos Personales
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Username
                              </label>
                              <p className="text-sm text-gray-900">
                                {userDetailData.user.username}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Email
                              </label>
                              <p className="text-sm text-gray-900">
                                {userDetailData.user.email}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Nombre Completo
                              </label>
                              <p className="text-sm text-gray-900">
                                {userDetailData.user.profileInfo?.fullName ||
                                  "No especificado"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Estado de Cuenta
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Rol
                              </label>
                              <RoleBadge role={userDetailData.user.role} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Estado
                              </label>
                              <StatusBadge
                                status={userDetailData.user.status}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Fecha de Registro
                              </label>
                              <p className="text-sm text-gray-900">
                                {new Date(
                                  userDetailData.user.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Última Conexión
                              </label>
                              <p className="text-sm text-gray-900">
                                {userDetailData.user.lastLogin
                                  ? new Date(
                                      userDetailData.user.lastLogin
                                    ).toLocaleDateString()
                                  : "Nunca"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Editar Perfil */}
                  {activeDetailTab === "edit" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Editar Información Personal */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Editar Información Personal
                          </h3>
                          <form className="space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            // Handle profile update
                          }}>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de Usuario
                              </label>
                              <input
                                type="text"
                                defaultValue={userDetailData.user.username}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                defaultValue={userDetailData.user.email}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Completo
                              </label>
                              <input
                                type="text"
                                defaultValue={userDetailData.user.profileInfo?.fullName || ""}
                                placeholder="Nombre completo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rol
                              </label>
                              <select 
                                defaultValue={userDetailData.user.role}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="user">Usuario</option>
                                <option value="gallera">Gallera</option>
                                <option value="venue">Venue</option>
                                <option value="operator">Operador</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Guardar Cambios
                            </button>
                          </form>
                        </div>

                        {/* Cambiar Contraseña */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Cambiar Contraseña
                          </h3>
                          <form className="space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            // Handle password change
                          }}>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nueva Contraseña
                              </label>
                              <input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Contraseña
                              </label>
                              <input
                                type="password"
                                placeholder="Confirmar nueva contraseña"
                                minLength={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                            >
                              Cambiar Contraseña
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Acciones Administrativas */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Acciones Administrativas
                        </h3>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              // Handle status toggle
                            }}
                            className={`px-4 py-2 rounded-md transition-colors ${
                              userDetailData.user.status === 'active' 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {userDetailData.user.status === 'active' ? 'Desactivar Usuario' : 'Activar Usuario'}
                          </button>
                          <button 
                            onClick={() => {
                              // Handle force logout
                            }}
                            className="px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors"
                          >
                            Cerrar Sesión Forzada
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Billetera */}
                  {activeDetailTab === "wallet" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card
                          variant="stat"
                          title="Balance Disponible"
                          value={`$${userDetailData.wallet.balance.toLocaleString()}`}
                          color="green"
                        />
                        <Card
                          variant="stat"
                          title="Fondos Congelados"
                          value={`$${userDetailData.wallet.frozenAmount.toLocaleString()}`}
                          color="yellow"
                        />
                        <Card
                          variant="stat"
                          title="Transacciones"
                          value={userDetailData.wallet.transactions.length}
                          color="blue"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Últimas Transacciones
                        </h3>
                        <div className="space-y-2">
                          {userDetailData.wallet.transactions
                            .slice(0, 10)
                            .map((tx, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {tx.type}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(tx.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <span
                                  className={`font-medium ${
                                    tx.amount > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {tx.amount > 0 ? "+" : ""}$
                                  {Math.abs(tx.amount).toLocaleString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Apuestas */}
                  {activeDetailTab === "bets" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card
                          variant="stat"
                          title="Total Apuestas"
                          value={userDetailData.bets.total}
                          color="blue"
                        />
                        <Card
                          variant="stat"
                          title="Activas"
                          value={userDetailData.bets.active}
                          color="yellow"
                        />
                        <Card
                          variant="stat"
                          title="Ganadas"
                          value={userDetailData.bets.won}
                          color="green"
                        />
                        <Card
                          variant="stat"
                          title="Perdidas"
                          value={userDetailData.bets.lost}
                          color="red"
                        />
                      </div>
                      <Card
                        variant="stat"
                        title="Monto Total Apostado"
                        value={`$${userDetailData.bets.totalAmount.toLocaleString()}`}
                        color="purple"
                      />
                    </div>
                  )}

                  {/* Tab Suscripción */}
                  {activeDetailTab === "subscription" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Suscripción Actual
                        </h3>
                        {userDetailData.subscription.current ? (
                          <Card className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {userDetailData.subscription.current.plan}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Vence:{" "}
                                  {new Date(
                                    userDetailData.subscription.current.endDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <StatusBadge
                                status={
                                  userDetailData.subscription.current.status
                                }
                              />
                            </div>
                          </Card>
                        ) : (
                          <p className="text-gray-500">
                            Sin suscripción activa
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Historial de Suscripciones
                        </h3>
                        <div className="space-y-2">
                          {userDetailData.subscription.history.length > 0 ? (
                            userDetailData.subscription.history.map(
                              (sub, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {sub.plan}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(
                                        sub.startDate
                                      ).toLocaleDateString()}{" "}
                                      -{" "}
                                      {new Date(
                                        sub.endDate
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <StatusBadge status={sub.status} />
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-gray-500">
                              Sin historial de suscripciones
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">
                  Error al cargar los datos del usuario
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
