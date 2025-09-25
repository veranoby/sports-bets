import React, { useState, useCallback } from "react";
import {
  User,
  Edit3,
  Shield,
  Calendar,
  Camera,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import UserProfileForm from "../../components/forms/UserProfileForm";
import useMembershipCheck from "../../hooks/useMembershipCheck";

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  useMembershipCheck();

  const [isEditing, setIsEditing] = useState(false);

  const handleSaveSuccess = useCallback(async () => {
    await refreshUser();
    setIsEditing(false);
  }, [refreshUser]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

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
          Nombre completo
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
        <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900 min-h-[76px]">
          {user.profileInfo?.address || "No especificado"}
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
              <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => {}}
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all duration-200 hover:scale-110 border border-gray-200"
                title="Cambiar avatar"
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {user.profileInfo?.fullName || user.username}
            </h1>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <User className="w-3 h-3" />
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
          </div>
        </div>

        {/* Información Personal */}
        <div className="bg-indigo-50 rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Información Personal y de Entidad
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
              onSave={handleSaveSuccess}
              onCancel={handleCancel}
            />
          ) : (
            renderProfileInfo()
          )}
        </div>

        {/* Security and other sections remain the same... */}
      </div>
    </div>
  );
};

export default Profile;
