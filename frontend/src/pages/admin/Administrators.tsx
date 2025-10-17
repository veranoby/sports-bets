// frontend/src/pages/admin/Administrators.tsx
// Página de administración de administradores y operadores

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
import {
  Search,
  Edit,
  Trash2,
  Shield,
  User,
  Filter,
  Eye,
  X,
} from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import SubscriptionBadge from "../../components/shared/SubscriptionBadge";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";
import EditUserModal from "../../components/admin/EditUserModal";
import CreateUserModal from "../../components/admin/CreateUserModal";
import { usersAPI } from "../../services/api";
import type { User as UserType } from "../../types";

const AdminAdministratorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [administrators, setAdministrators] = useState<UserType[]>([]);
  const [operators, setOperators] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "operator">(
    "all",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRoleSelectModalOpen, setIsRoleSelectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "operator">(
    "admin",
  );
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Fetch current user to prevent self-editing
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await usersAPI.getProfile();
        if (response.success) {
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
      const adminResponse = await usersAPI.getAll({
        role: "admin",
        limit: 1000,
      });

      // Fetch operators
      const operatorResponse = await usersAPI.getAll({
        role: "operator",
        limit: 1000,
      });

      if (adminResponse.success) {
        setAdministrators((adminResponse.data as any)?.users || []);
      } else {
        throw new Error(adminResponse.error || "Error loading administrators");
      }

      if (operatorResponse.success) {
        setOperators((operatorResponse.data as any)?.users || []);
      } else {
        throw new Error(operatorResponse.error || "Error loading operators");
      }
    } catch (err: any) {
      setError(err.message || "Error loading administrator data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdministrators();
  }, [fetchAdministrators]);

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

    setEditingUser(user);
    setIsEditModalOpen(true);
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
      const response = await usersAPI.delete(deletingUser.id);
      if (response.success) {
        // Refresh the list
        fetchAdministrators();
        setIsDeleteModalOpen(false);
        setDeletingUser(null);
      } else {
        setError(response.error || "Error deleting user");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting user");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Administrators & Operators
          </h1>
          <p className="text-gray-600 mt-1">
            Manage administrator and operator accounts
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsRoleSelectModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Admin/Operator
          </button>
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
                    setIsCreateModalOpen(true);
                  }}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Administrador</h3>
                    <p className="text-sm text-gray-500">
                      Acceso completo al sistema
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedRole("operator");
                    setIsRoleSelectModalOpen(false);
                    setIsCreateModalOpen(true);
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
              onChange={(e) => setRoleFilter(e.target.value as any)}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Administrators
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {administrators.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Operators</p>
              <p className="text-2xl font-bold text-gray-900">
                {operators.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
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
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                    No administrators or operators found
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
                      <SubscriptionBadge subscription={user.subscription} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete user"
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

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <EditUserModal
          user={editingUser as UserType}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onUserUpdated={(updatedUser) => {
            fetchAdministrators();
          }}
        />
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <CreateUserModal
          role={selectedRole}
          onClose={() => setIsCreateModalOpen(false)}
          onUserCreated={() => {
            setIsCreateModalOpen(false);
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
