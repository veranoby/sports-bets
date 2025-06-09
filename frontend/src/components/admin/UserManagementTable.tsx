/**
 * UserManagementTable Component
 * Tabla para gestionar usuarios, cambiar roles y estados
 */
"use client";

import React, { useState, useEffect } from "react";
import type { User } from "../../types";
import {
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Shield,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import StatusChip from "../shared/StatusChip";

// Configuración de la API (ajusta según tu estructura)
const usersAPI = {
  getAll: async () => {
    const response = await fetch("/api/users");
    return response.json();
  },
  updateStatus: async (userId: string, isActive: boolean) => {
    await fetch(`/api/users/${userId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
  },
  updateRole: async (userId: string, role: string) => {
    await fetch(`/api/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  },
};

const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usersAPI.getAll();
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrar usuarios cuando cambian los criterios
  useEffect(() => {
    let result = [...users];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }

    // Filtrar por rol
    if (roleFilter) {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Filtrar por estado
    if (statusFilter) {
      const isActive = statusFilter === "active";
      result = result.filter((user) => user.isActive === isActive);
    }

    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Cambiar estado de usuario (activar/desactivar)
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setIsUpdating(true);
      await usersAPI.updateStatus(userId, !currentStatus);
      // Actualizar localmente
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, isActive: !currentStatus } : user
        )
      );
    } catch (err: any) {
      setError(err.message || "Error al actualizar estado");
    } finally {
      setIsUpdating(false);
    }
  };

  // Cambiar rol de usuario
  const handleChangeRole = async (
    userId: string,
    newRole: "admin" | "operator" | "venue" | "user"
  ) => {
    try {
      setIsUpdating(true);
      await usersAPI.updateRole(userId, newRole);
      // Actualizar localmente
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err: any) {
      setError(err.message || "Error al actualizar rol");
    } finally {
      setIsUpdating(false);
    }
  };

  // Renderizar chip de rol con color apropiado
  const renderRoleChip = (role: string) => {
    const roleConfig = {
      admin: {
        bg: "rgba(89, 108, 149, 0.1)",
        text: "#596c95",
        icon: <Shield className="w-3 h-3 mr-1" />,
      },
      operator: {
        bg: "rgba(205, 98, 99, 0.1)",
        text: "#cd6263",
        icon: <UserCheck className="w-3 h-3 mr-1" />,
      },
      venue: {
        bg: "rgba(16, 185, 129, 0.1)",
        text: "rgb(16, 185, 129)",
        icon: <Building className="w-3 h-3 mr-1" />,
      },
      user: {
        bg: "rgba(107, 114, 128, 0.1)",
        text: "rgb(107, 114, 128)",
        icon: <UserIcon className="w-3 h-3 mr-1" />,
      },
    };

    const config =
      roleConfig[role as keyof typeof roleConfig] || roleConfig.user;

    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        {config.icon}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  // Renderizar chip de estado
  const renderStatusChip = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-green-500"></span>
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-500"></span>
        Inactivo
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Filtros y búsqueda */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o email"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="operator">Operador</option>
              <option value="venue">Venue</option>
              <option value="user">Usuario</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>

            <button
              onClick={() => loadUsers()}
              className="px-3 py-2 rounded-lg text-sm flex items-center bg-blue-50 text-blue-800 hover:bg-blue-100"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Registro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                  <span className="mt-2 block">Cargando usuarios...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No se encontraron usuarios con los filtros aplicados
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {renderRoleChip(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusChip
                      status={user.isActive ? "active" : "inactive"}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <div className="relative group">
                        <button
                          className="px-2 py-1 text-xs rounded"
                          style={{
                            backgroundColor: "rgba(89, 108, 149, 0.1)",
                            color: "#596c95",
                          }}
                        >
                          Cambiar Rol
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200 hidden group-hover:block">
                          <div className="py-1">
                            {["admin", "operator", "venue", "user"].map(
                              (role) => (
                                <button
                                  key={role}
                                  onClick={() =>
                                    handleChangeRole(user.id, role as any)
                                  }
                                  disabled={user.role === role || isUpdating}
                                  className={`w-full text-left px-4 py-2 text-sm ${
                                    user.role === role
                                      ? "bg-gray-100 text-gray-700"
                                      : "text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleToggleStatus(user.id, user.isActive)
                        }
                        disabled={isUpdating}
                        className="px-2 py-1 text-xs rounded flex items-center"
                        style={{
                          backgroundColor: user.isActive
                            ? "rgba(239, 68, 68, 0.1)"
                            : "rgba(16, 185, 129, 0.1)",
                          color: user.isActive
                            ? "rgb(239, 68, 68)"
                            : "rgb(16, 185, 129)",
                        }}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
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
    </div>
  );
};

export default UserManagementTable;
