/**
 * UserManagementTable Component
 * Tabla para gestionar usuarios, cambiar roles y estados
 */
"use client";

import React, { useState, useEffect } from "react";
import type { User } from "../../types";
import { Search, RefreshCw, UserCheck, UserX } from "lucide-react";
import StatusChip from "../shared/StatusChip";
import TableLoadingRow from "../shared/TableLoadingRow";
import FilterBar from "../shared/FilterBar";
import ErrorMessage from "../shared/ErrorMessage";
import EmptyState from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";

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

const TABLE_COLUMNS = [
  "Usuario",
  "Email",
  "Rol",
  "Estado",
  "Fecha Registro",
  "Acciones",
];

const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "status" | "role";
    user: User;
    newValue: any;
  }>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usersAPI.getAll();
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err) {
      setError((err as Error).message || "Error al cargar usuarios");
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
  const handleToggleStatus = (user: User) => {
    setConfirmAction({ type: "status", user, newValue: !user.isActive });
  };

  // Cambiar rol de usuario
  const handleChangeRole = (
    user: User,
    newRole: "admin" | "operator" | "venue" | "user" | "gallera"
  ) => {
    setConfirmAction({ type: "role", user, newValue: newRole });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsUpdating(true);
    setError(null);
    try {
      if (confirmAction.type === "status") {
        await usersAPI.updateStatus(
          confirmAction.user.id,
          confirmAction.newValue
        );
        setUsers(
          users.map((u) =>
            u.id === confirmAction.user.id
              ? { ...u, isActive: confirmAction.newValue }
              : u
          )
        );
        setSuccessMsg(`Estado actualizado correctamente.`);
      } else if (confirmAction.type === "role") {
        await usersAPI.updateRole(
          confirmAction.user.id,
          confirmAction.newValue
        );
        setUsers(
          users.map((u) =>
            u.id === confirmAction.user.id
              ? { ...u, role: confirmAction.newValue }
              : u
          )
        );
        setSuccessMsg(`Rol actualizado correctamente.`);
      }
    } catch (err) {
      setError((err as Error).message || "Error al actualizar usuario");
    } finally {
      setIsUpdating(false);
      setConfirmAction(null);
      setTimeout(() => setSuccessMsg(null), 2000);
    }
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
              <option value="gallera">Gallera</option>
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
        <ErrorMessage error={error} onRetry={loadUsers} className="mb-4" />
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
              <TableLoadingRow colSpan={TABLE_COLUMNS.length} />
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} className="text-center py-4">
                  <EmptyState
                    title="No hay usuarios"
                    description="No se encontraron usuarios para los filtros seleccionados."
                  />
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
                    <StatusChip
                      status={user.role === "venue" ? "pending" : "active"}
                      variant="outline"
                      className="mr-2"
                    />
                    <span className="text-xs font-medium">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusChip
                      status={user.isActive ? "active" : "inactive"}
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
                            {["admin", "operator", "venue", "user", "gallera"].map(
                              (role) => (
                                <button
                                  key={role}
                                  onClick={() =>
                                    handleChangeRole(user, role as any)
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
                        onClick={() => handleToggleStatus(user)}
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

      <FilterBar
        searchPlaceholder="Buscar usuarios..."
        onSearch={setSearchTerm}
        filters={[
          {
            key: "role",
            label: "Rol",
            type: "select",
            options: [
              { value: "admin", label: "Administradores" },
              { value: "operator", label: "Operadores" },
              { value: "venue", label: "Galleras" },
              { value: "user", label: "Usuarios" },
              { value: "gallera", label: "Galleras" },
            ],
          },
          {
            key: "status",
            label: "Estado",
            type: "select",
            options: [
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Inactivos" },
            ],
          },
        ]}
        className="mb-4"
      />

      {/* Modal de confirmación */}
      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.type === "status"
              ? `¿Confirmar cambio de estado?`
              : `¿Confirmar cambio de rol?`
          }
          message={
            confirmAction.type === "status"
              ? `¿Seguro que deseas ${
                  confirmAction.newValue ? "activar" : "desactivar"
                } al usuario ${confirmAction.user.username}?`
              : `¿Seguro que deseas cambiar el rol de ${confirmAction.user.username} a ${confirmAction.newValue}?`
          }
          isOpen={!!confirmAction}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          confirmText="Confirmar"
          cancelText="Cancelar"
          variant={confirmAction.type === "status" ? "warning" : "info"}
        />
      )}
      {/* Mensaje de éxito */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          {successMsg}
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
