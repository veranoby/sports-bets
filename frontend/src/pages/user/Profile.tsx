// frontend/src/pages/user/Profile.tsx
// 👤 PROFILE ELEGANTE - Diseño original mejorado con tema consistente

import React, { useState } from "react";
import {
  User,
  Edit3,
  Save,
  X,
  Mail,
  Shield,
  Calendar,
  Award,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useBets, useWallet } from "../../hooks/useApi";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import UserHeader from "../../components/user/UserHeader";
import StatusChip from "../../components/shared/StatusChip";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Navigation from "../../components/user/Navigation";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { bets } = useBets();
  const { wallet } = useWallet();
  const theme = getUserThemeClasses();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.profileInfo?.fullName || "",
    phoneNumber: user?.profileInfo?.phoneNumber || "",
    address: user?.profileInfo?.address || "",
  });

  // ✅ REAL DATA (no mock)
  const userStats = {
    totalBets: bets?.length || 0,
    winRate:
      bets?.length > 0
        ? (
            (bets.filter((b) => b.result === "win").length / bets.length) *
            100
          ).toFixed(1)
        : "0.0",
    totalBalance: Number(wallet?.balance || 0),
    memberSince: user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("es-ES", {
          month: "long",
          year: "numeric",
        })
      : "Reciente",
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Conectar con API real
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = () => {
    const level = user?.profileInfo?.verificationLevel || "none";
    switch (level) {
      case "full":
        return { label: "Verificado", variant: "success" as const };
      case "basic":
        return { label: "Básico", variant: "warning" as const };
      default:
        return { label: "Sin verificar", variant: "error" as const };
    }
  };

  return (
    <div className={theme.pageBackground}>
      <UserHeader
        title="Mi Perfil"
        customActions={
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#596c95] text-white rounded-lg hover:bg-[#4a5b80] transition-colors text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </button>
          ) : null
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Avatar y Info Principal - Estilo Original Mejorado */}
        <div className="bg-gradient-to-br from-[#2a325c] to-[#1a1f37] rounded-2xl p-8 mb-6 border border-[#596c95]/20">
          <div className="text-center">
            {/* Avatar Grande */}
            <div className="relative mx-auto mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#596c95] to-[#cd6263] p-1">
                <div className="w-full h-full rounded-full bg-[#2a325c] flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>
              {isEditing && (
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-[#cd6263] rounded-full flex items-center justify-center hover:bg-[#b85456] transition-colors">
                  <Edit3 className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            {/* Nombre y Estado */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                {" "}
                <h2 className="text-3xl font-bold text-white mb-2">
                  {formData.fullName || user?.username || "Usuario"}
                </h2>
                <StatusChip {...getVerificationBadge()} size="sm" />
                <div className="flex items-center gap-1 text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span className="capitalize text-xs">{user?.role}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user?.email}</span>
                <Calendar className="w-5 h-5 text-[#596c95]" />
                <span className="font-medium text-white">Miembro desde</span>
                <span className="text-sm text-gray-400">
                  {userStats.memberSince}
                </span>
              </div>
            </div>

            {/* Estadísticas Elegantes */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#596c95] mb-1">
                  {userStats.totalBets}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  Apuestas
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {userStats.winRate}%
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  Aciertos
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  ${userStats.totalBalance.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  Balance
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información Personal - Estilo Elegante */}
        <div className="bg-[#2a325c] rounded-2xl p-6 mb-6 border border-[#596c95]/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">
              Información Personal
            </h3>
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nombre Completo
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1a1f37] border border-[#596c95] text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#596c95] focus:border-transparent"
                  placeholder="Tu nombre completo"
                />
              ) : (
                <div className="bg-[#1a1f37] rounded-lg px-4 py-3 text-white">
                  {formData.fullName || "No especificado"}
                </div>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Teléfono
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1a1f37] border border-[#596c95] text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#596c95] focus:border-transparent"
                  placeholder="+593 99 123 4567"
                />
              ) : (
                <div className="bg-[#1a1f37] rounded-lg px-4 py-3 text-white">
                  {formData.phoneNumber || "No especificado"}
                </div>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Dirección
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1a1f37] border border-[#596c95] text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#596c95] focus:border-transparent"
                  placeholder="Tu dirección"
                />
              ) : (
                <div className="bg-[#1a1f37] rounded-lg px-4 py-3 text-white">
                  {formData.address || "No especificado"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información de Cuenta */}
        <div className="bg-[#2a325c] rounded-2xl p-6 border border-[#596c95]/20">
          <h3 className="text-xl font-bold text-white mb-6">Cuenta</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#1a1f37] rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#596c95]" />
                <div>
                  <p className="font-medium text-white">Seguridad</p>
                  <p className="text-sm text-gray-400">Cambiar contraseña</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#596c95] text-white rounded-lg hover:bg-[#4a5b80] transition-colors text-sm">
                Cambiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <Navigation currentPage="profile" />
    </div>
  );
};

export default Profile;
