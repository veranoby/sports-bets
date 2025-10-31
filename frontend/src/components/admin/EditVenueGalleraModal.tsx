// frontend/src/components/admin/EditVenueGalleraModal.tsx
// Modal unificado para editar venues y galleras con pestañas

import React, { useState } from "react";
import { usersAPI } from "../../config/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import SubscriptionTabs from "./SubscriptionTabs";
import { User, Building2, CreditCard, X, Info } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import type {
  User as UserType,
  Venue,
  Gallera,
  UserSubscription,
} from "../../types";

interface EditVenueGalleraModalProps {
  user: UserType;
  venue?: Venue | Gallera;
  role: "venue" | "gallera";
  onClose: () => void;
  onSaved: (updatedData: { user: UserType; venue: Venue | Gallera }) => void;
}

type ProfileData = {
  username: string;
  email: string;
  profileInfo: {
    fullName: string;
    phoneNumber: string;
    address: string;
    identificationNumber: string;
  };
  is_active: boolean;
};

type EntityData = Partial<Venue & Gallera>;

const EditVenueGalleraModal: React.FC<EditVenueGalleraModalProps> = ({
  user,
  venue,
  role,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "entity" | "subscription"
  >("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Profile form data
  const [profileData, setProfileData] = useState<ProfileData>({
    username: user?.username || "",
    email: user?.email || "",
    profileInfo: {
      fullName: user?.profileInfo?.fullName || "",
      phoneNumber: user?.profileInfo?.phoneNumber || "",
      address: user?.profileInfo?.address || "",
      identificationNumber: user?.profileInfo?.identificationNumber || "",
    },
    is_active: user?.isActive !== false,
  });

  // Entity form data
  const [entityData, setEntityData] = useState<EntityData>({
    name: venue?.name || "",
    location: venue?.location || "",
    description: venue?.description || "",
    contactInfo: venue?.contactInfo || {
      phone: "",
      email: "",
      website: "",
      address: "",
    },
    status: venue?.status || "pending",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

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
        [name]: value,
      }));
    }
  };

  const handleEntityChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("contactInfo.")) {
      const field = name.split(".")[1];
      setEntityData((prev) => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value,
        },
      }));
    } else {
      setEntityData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);

    setError(null);

    try {
      // Map entity form fields to User.profileInfo based on role
      const entityProfileInfoUpdate = {
        ...(role === "venue"
          ? {
              venueName: entityData.name || "New Venue",
              venueLocation: entityData.location || "Location TBD",
              venueDescription: entityData.description,
              venueEmail: entityData.contactInfo?.email,
              venueWebsite: entityData.contactInfo?.website,
            }
          : {
              galleraName: entityData.name || "New Gallera",
              galleraLocation: entityData.location || "Location TBD",
              galleraDescription: entityData.description,
              galleraEmail: entityData.contactInfo?.email,
              galleraWebsite: entityData.contactInfo?.website,
            }),
      };

      // Update user profile with both personal and entity info
      console.log("Updating user profile with data:", {
        ...profileData.profileInfo,
        ...entityProfileInfoUpdate,
      });
      await usersAPI.updateProfile({
        profileInfo: {
          ...profileData.profileInfo,
          ...entityProfileInfoUpdate,
        },
      });

      // Update user email
      if (profileData.email !== user.email) {
        console.log("Updating user email to:", profileData.email);
        await usersAPI.update(user.id, { email: profileData.email });
      }

      const updatedUser = {
        ...user,
        username: profileData.username,
        email: profileData.email,
        isActive: profileData.is_active,
        profileInfo: {
          ...profileData.profileInfo,
          ...entityProfileInfoUpdate,
          verificationLevel: user.profileInfo?.verificationLevel || "none",
        },
      } as UserType;

      onSaved({
        user: updatedUser,
        venue: undefined,
      });

      // Show success message
      toast.success("¡Éxito!", "Los cambios se han guardado exitosamente");

      onClose();
    } catch (err) {
      console.error("Error saving data:", err);
      const errorMessage =
        err instanceof Error ? err.message : `Error al actualizar ${role}`;
      setError(errorMessage);
      toast.error("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionUpdate = (subscriptionData: {
    type?: "free" | "daily" | "monthly";
    status?: "active" | "cancelled" | "expired" | "pending";
    expiresAt?: string | null;
    features?: string[];
    remainingDays?: number;
    manual_expires_at?: string;
    membership_type?: string;
    assigned_username?: string;
  }) => {
    // Convert SubscriptionTabs data to UserSubscription format
    const planMapping = {
      free: "free",
      "24h": "basic",
      monthly: "premium",
    };
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

    onSaved({
      user: { ...user, subscription: userSubscription },
      venue,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Editar {role === "venue" ? "Local" : "Gallera"}
            </h2>
            <p className="text-sm text-gray-500">
              {user.username} - {venue ? venue.name : "Sin entidad asignada"}
            </p>
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
              <User className="w-4 h-4 inline mr-2" />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab("entity")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "entity"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              {role === "venue" ? "Local" : "Gallera"}
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "subscription"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Suscripción
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
                    Nombre de Usuario
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
                  Nombre del Representante
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

              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={profileData.is_active}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Cuenta Activa
                </label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 z-10">
                    Controla si el usuario puede iniciar sesión
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "entity" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {role === "venue"
                    ? "Nombre del Local"
                    : "Nombre de la Gallera"}
                </label>
                <input
                  type="text"
                  name="name"
                  value={entityData.name}
                  onChange={handleEntityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="location"
                  value={entityData.location}
                  onChange={handleEntityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={entityData.description}
                  onChange={handleEntityChange}
                  rows={3}
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
                    name="contactInfo.phone"
                    value={entityData.contactInfo?.phone}
                    onChange={handleEntityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={entityData.contactInfo?.email}
                    onChange={handleEntityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <input
                  type="url"
                  name="contactInfo.website"
                  value={entityData.contactInfo?.website}
                  onChange={handleEntityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Completa
                </label>
                <input
                  type="text"
                  name="contactInfo.address"
                  value={entityData.contactInfo?.address}
                  onChange={handleEntityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de Aprobación
                </label>
                <select
                  name="status"
                  value={entityData.status}
                  onChange={handleEntityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendiente de Aprobación</option>
                  <option value="active">Aprobado y Activo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="rejected">Rechazado</option>
                </select>
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
            Cerrar
          </button>
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              "Guardar Todos los Cambios"
            )}
          </button>
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

export default EditVenueGalleraModal;
