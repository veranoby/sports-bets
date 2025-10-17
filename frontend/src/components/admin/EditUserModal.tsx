// frontend/src/components/admin/EditUserModal.tsx
// Modal completo para editar usuarios incluyendo gestión de suscripciones

import React, { useState } from "react";
import { usersAPI } from "../../config/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";

import SubscriptionTabs from "./SubscriptionTabs";
import { User, X } from "lucide-react";
import type { User as UserType, UserSubscription } from "../../types";

interface EditUserFormData {
  username: string;
  email: string;
  isActive: boolean;
  role: UserType["role"];
  profileInfo: {
    fullName: string;
    phoneNumber: string;
    address: string;
    identificationNumber: string;
    verificationLevel: "none" | "basic" | "full";
  };
}

interface EditUserModalProps {
  user: UserType;
  onClose: () => void;
  onUserUpdated: (updatedUser: UserType) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "subscription">(
    "profile",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile form data
  const [profileData, setProfileData] = useState<EditUserFormData>({
    username: user.username,
    email: user.email,
    isActive: user.isActive,
    role: user.role,
    profileInfo: {
      fullName: user.profileInfo?.fullName || "",
      phoneNumber: user.profileInfo?.phoneNumber || "",
      address: user.profileInfo?.address || "",
      identificationNumber: user.profileInfo?.identificationNumber || "",
      verificationLevel: user.profileInfo?.verificationLevel || "none",
    },
  });

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, type, checked, value } = e.target as HTMLInputElement;

    if (name.startsWith("profileInfo.")) {
      const field = name.split(".")[1];
      setProfileData((prev) => ({
        ...prev,
        profileInfo: {
          ...prev.profileInfo,
          [field]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update user profile
      await usersAPI.update(user.id, {
        profileInfo: profileData.profileInfo,
      });

      // Update user role if changed (admin only)
      if (profileData.role !== user.role) {
        await usersAPI.updateRole(user.id, profileData.role);
      }

      // Update user status if changed
      if (profileData.isActive !== user.isActive) {
        await usersAPI.updateStatus(user.id, profileData.isActive);
      }

      // Update parent component
      onUserUpdated({
        ...user,
        ...profileData,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating user");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionUpdate = async (subscriptionData: {
    type?: "free" | "daily" | "monthly";
    status?: "active" | "cancelled" | "expired" | "pending";
    expiresAt?: string | null;
    features?: string[];
    remainingDays?: number;
    manual_expires_at?: string;
    membership_type?: string;
    assigned_username?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // Convert SubscriptionTabs data to UserSubscription format
      const planMapping = {
        free: "free",
        "24h": "basic",
        monthly: "premium",
      };

      // Update user membership through admin API
      const response = await adminAPI.updateUserMembership(user.id, {
        membership_type: subscriptionData.membership_type || "free",
        assigned_username: subscriptionData.assigned_username || "",
      });

      if (response.success) {
        const userSubscription: UserSubscription = {
          id: user.subscription?.id || "",
          plan: (planMapping[
            subscriptionData.membership_type as keyof typeof planMapping
          ] || "free") as UserSubscription["plan"],
          status: subscriptionData.status || "active",
          expiresAt:
            subscriptionData.expiresAt ||
            subscriptionData.manual_expires_at ||
            undefined,
          features: subscriptionData.features || [],
        };

        onUserUpdated({
          ...user,
          subscription: userSubscription,
        });

        // Show success message
        addToast({
          type: "success",
          title: "Membresía Actualizada",
          message: "La membresía del usuario se ha actualizado correctamente",
        });
      } else {
        throw new Error(response.error || "Error al actualizar membresía");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al actualizar membresía";
      setError(errorMsg);
      addToast({
        type: "error",
        title: "Error al Actualizar",
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Usuario: {user.username}
              </h2>
              <p className="text-sm text-gray-500">
                Gestionar perfil y suscripción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              👤 Perfil
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "subscription"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              💳 Suscripción
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="profileInfo.fullName"
                  value={profileData.profileInfo.fullName}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="profileInfo.phoneNumber"
                    value={profileData.profileInfo.phoneNumber}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula/ID
                  </label>
                  <input
                    type="text"
                    name="profileInfo.identificationNumber"
                    value={profileData.profileInfo.identificationNumber}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="profileInfo.address"
                  value={profileData.profileInfo.address}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    name="role"
                    value={profileData.role}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">Usuario</option>
                    <option value="venue">Venue</option>
                    <option value="gallera">Gallera</option>
                    <option value="operator">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={profileData.isActive}
                    onChange={handleProfileChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Usuario Activo
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "subscription" && (
            <SubscriptionTabs
              userId={user.id}
              subscription={user.subscription}
              onSave={handleSubscriptionUpdate}
              onCancel={onClose}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          {activeTab !== "subscription" && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="px-6 py-2">
            <ErrorMessage error={error} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUserModal;
