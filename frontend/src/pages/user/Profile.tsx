import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  User as UserIcon,
  Edit3,
  Shield,
  Calendar,
  Camera,
  Clock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import UserProfileForm from "../../components/forms/UserProfileForm";
import UnifiedEntityForm from "../../components/forms/UnifiedEntityForm";
import useMembershipCheck from "../../hooks/useMembershipCheck";
import MembershipSection from "../../components/user/MembershipSection";
import BusinessInfoSection from "../../components/user/BusinessInfoSection";

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  useMembershipCheck();

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const membershipRef = useRef<HTMLDivElement>(null);

  // ✅ Auto-scroll to membership section when navigated with state.section = "membership"
  useEffect(() => {
    if (
      (location.state as any)?.section === "membership" &&
      membershipRef.current
    ) {
      setTimeout(() => {
        membershipRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [location.state]);

  const handleSaveSuccess = useCallback(async () => {
    await refreshUser();
    setIsEditing(false);
  }, [refreshUser]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleBusinessSave = useCallback(
    async (updatedUser: any) => {
      // Refresh user context with updated profileInfo
      await refreshUser();
      setIsEditingBusiness(false);
    },
    [refreshUser],
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
            {!(user as any).approved &&
              ["venue", "gallera"].includes(user.role) && (
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
                data={
                  {
                    ...user.profileInfo,
                    name:
                      user.role === "venue"
                        ? user.profileInfo?.venueName
                        : user.profileInfo?.galleraName,
                    location:
                      user.role === "venue"
                        ? user.profileInfo?.venueLocation
                        : user.profileInfo?.galleraLocation,
                    description:
                      user.role === "venue"
                        ? user.profileInfo?.venueDescription
                        : user.profileInfo?.galleraDescription,
                    status: user.profileInfo?.verificationLevel || "pending",
                    certified: user.profileInfo?.certified || false,
                    images: user.profileInfo?.images || [],
                    contactInfo: {
                      email:
                        user.role === "venue"
                          ? user.profileInfo?.venueEmail
                          : user.profileInfo?.galleraEmail,
                      phone: user.profileInfo?.phoneNumber,
                      website:
                        user.role === "venue"
                          ? user.profileInfo?.venueWebsite
                          : user.profileInfo?.galleraWebsite,
                      address: user.profileInfo?.address,
                    },
                  } as any
                } // Temporary type assertion - needs better type mapping
                onEdit={() => setIsEditingBusiness(true)}
              />
            ) : (
              <div className="bg-blue-50 rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                <UnifiedEntityForm
                  entityType={user.role as "venue" | "gallera"}
                  userId={user.id}
                  initialData={user.profileInfo || {}}
                  onSuccess={handleBusinessSave}
                  onCancel={handleBusinessCancel}
                />
              </div>
            )}
          </>
        )}

        {/* Membership Section */}
        {!isEditing && (
          <div ref={membershipRef} id="membership" className="mt-6">
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
