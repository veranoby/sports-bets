import React, { useState, useCallback, useEffect } from "react";
import {
  User as UserIcon,
  Edit3,
  Shield,
  Calendar,
  Camera,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import UserProfileForm from "../../components/forms/UserProfileForm";
import VenueEntityForm from "../../components/forms/VenueEntityForm";
import GalleraEntityForm from "../../components/forms/GalleraEntityForm";
import useMembershipCheck from "../../hooks/useMembershipCheck";
import MembershipSection from "../../components/user/MembershipSection";
import BusinessInfoSection from "../../components/user/BusinessInfoSection";
import { apiClient } from "../../services/api";
import type { Venue, Gallera } from "../../types";

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  useMembershipCheck();

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [venueData, setVenueData] = useState<Venue | null>(null);
  const [galleraData, setGalleraData] = useState<Gallera | null>(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user) return;

      try {
        // ⚡ Optimized: Use dedicated endpoint instead of full list queries
        const response = await apiClient.get(
          `/users/${user.id}/business-entity`,
        );

        if (
          response.data?.data?.type === "venue" &&
          response.data?.data?.entity
        ) {
          setVenueData(response.data.data.entity);
        } else if (
          response.data?.data?.type === "gallera" &&
          response.data?.data?.entity
        ) {
          setGalleraData(response.data.data.entity);
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
      }
    };

    fetchBusinessData();
  }, [user]);

  const handleSaveSuccess = useCallback(async () => {
    await refreshUser();
    setIsEditing(false);
  }, [refreshUser]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleBusinessSave = useCallback(
    async (savedData: Venue | Gallera) => {
      // Update local state with saved business data
      if (user?.role === "venue") {
        setVenueData(savedData as Venue);
      } else if (user?.role === "gallera") {
        setGalleraData(savedData as Gallera);
      }
      setIsEditingBusiness(false);
    },
    [user?.role],
  );

  const handleBusinessCancel = useCallback(() => {
    setIsEditingBusiness(false);
  }, []);

  const getProfileFieldLabel = (field: string): string => {
    if (field === "fullName") {
      if (user?.role === "venue" || user?.role === "gallera") {
        return "Nombre del representante";
      }
      return "Nombre completo";
    }
    return field;
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
      })
    : "Reciente";

  const renderProfileInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {getProfileFieldLabel("fullName")}
        </label>
        <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
          {user.profileInfo?.fullName || user.username || "No especificado"}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de teléfono
        </label>
        <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
          {user.profileInfo?.phoneNumber || "No especificado"}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección
        </label>
        <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
          {user.profileInfo?.address || "No especificado"}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de Identificación
        </label>
        <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
          {user.profileInfo?.identificationNumber || "No especificado"}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo Electrónico
        </label>
        <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
          {user.email || "No especificado"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-background min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-indigo-50 rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-6">
              {user.profileInfo?.imageUrl ? (
                <img
                  src={user.profileInfo.imageUrl}
                  alt={user.username}
                  className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {(user.role === "venue"
                    ? user.profileInfo?.venueName ||
                      user.profileInfo?.businessName ||
                      user.username
                    : user.role === "gallera"
                      ? user.profileInfo?.galleraName ||
                        user.profileInfo?.businessName ||
                        user.username
                      : user.username
                  )
                    ?.charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-0 right-0 bg-blue-50 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all duration-200 hover:scale-110 border border-gray-200"
                title="Editar perfil para cambiar imagen"
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {user.role === "venue"
                ? user.profileInfo?.venueName ||
                  user.profileInfo?.businessName ||
                  user.profileInfo?.fullName ||
                  user.username
                : user.role === "gallera"
                  ? user.profileInfo?.galleraName ||
                    user.profileInfo?.businessName ||
                    user.profileInfo?.fullName ||
                    user.username
                  : user.profileInfo?.fullName || user.username}
            </h1>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                {user.username}
              </div>
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user.role}
              </div>
            </div>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {memberSince}
            </div>

            {/* ✅ NUEVO: Chip de pendiente aprobación para roles venue/gallera */}
            {!user.approved && ["venue", "gallera"].includes(user.role) && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 animate-pulse mt-3">
                <Clock className="w-3 h-3" />
                Pendiente de aprobación
              </div>
            )}
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="bg-blue-50 rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Información Personal
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-200 text-blue-600 rounded-lg hover:bg-blue-300 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>

          {isEditing ? (
            <UserProfileForm
              user={user}
              onUpdate={handleSaveSuccess}
              onCancel={handleCancel}
            />
          ) : (
            renderProfileInfo()
          )}
        </div>

        {/* Business Info Section (Conditional) */}
        {!isEditing && (user.role === "venue" || user.role === "gallera") && (
          <>
            {!isEditingBusiness ? (
              <BusinessInfoSection
                type={user.role}
                data={user.role === "venue" ? venueData : galleraData}
                onEdit={() => setIsEditingBusiness(true)}
              />
            ) : (
              <div className="bg-blue-50 rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                {user.role === "venue" && (
                  <VenueEntityForm
                    venue={venueData || undefined}
                    userId={user.id}
                    onSave={handleBusinessSave}
                    onCancel={handleBusinessCancel}
                  />
                )}
                {user.role === "gallera" && (
                  <GalleraEntityForm
                    gallera={galleraData || undefined}
                    userId={user.id}
                    onSave={handleBusinessSave}
                    onCancel={handleBusinessCancel}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Membership Section */}
        {!isEditing && (
          <div className="mt-6">
            <MembershipSection
              user={user}
              subscription={
                user.subscription
                  ? ({
                      ...user.subscription,
                      status: user.subscription.status as
                        | "pending"
                        | "active"
                        | "expired", // Cast to expected type
                    } as any)
                  : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
