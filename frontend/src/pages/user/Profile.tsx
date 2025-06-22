// frontend/src/pages/user/Profile.tsx - MIGRADO V9
// ===================================================
// ELIMINADO: getUserThemeClasses() import y usage
// APLICADO: Clases CSS estáticas directas

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
// ❌ ELIMINADO: import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import StatusChip from "../../components/shared/StatusChip";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { bets } = useBets();
  const { wallet } = useWallet();
  // ❌ ELIMINADO: const theme = getUserThemeClasses();

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
      ? new Date(user.createdAt).getFullYear()
      : new Date().getFullYear(),
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call to update profile
      console.log("Saving profile:", formData);
      // await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.profileInfo?.fullName || "",
      phoneNumber: user?.profileInfo?.phoneNumber || "",
      address: user?.profileInfo?.address || "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return <LoadingSpinner text="Cargando perfil..." />;
  }

  return (
    /* ✅ MIGRADO: theme.pageBackground → page-background */
    <div className="page-background pb-24">
      <div className="p-4 space-y-6">
        {/* 👤 PERFIL PRINCIPAL */}
        <div className="card-background p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#596c95] to-[#4a5b80] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                {/* ✅ MIGRADO: theme.primaryText → text-theme-primary */}
                <h1 className="text-2xl font-bold text-theme-primary">
                  {user.username}
                </h1>
                {/* ✅ MIGRADO: theme.lightText → text-theme-light */}
                <p className="text-theme-light flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-ghost flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* INFORMACIÓN DEL PERFIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* ✅ MIGRADO: theme.lightText → text-theme-light */}
              <label className="block text-sm font-medium text-theme-light mb-2">
                Nombre Completo
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  className="input-theme w-full"
                  placeholder="Ingresa tu nombre completo"
                />
              ) : (
                /* ✅ MIGRADO: theme.primaryText → text-theme-primary */
                <p className="text-theme-primary">
                  {formData.fullName || "No especificado"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-light mb-2">
                Teléfono
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className="input-theme w-full"
                  placeholder="Ingresa tu teléfono"
                />
              ) : (
                <p className="text-theme-primary">
                  {formData.phoneNumber || "No especificado"}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-theme-light mb-2">
                Dirección
              </label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="input-theme w-full"
                  rows={3}
                  placeholder="Ingresa tu dirección"
                />
              ) : (
                <p className="text-theme-primary">
                  {formData.address || "No especificado"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 📊 ESTADÍSTICAS DEL USUARIO */}
        <div className="card-background p-6">
          <h2 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Estadísticas
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-theme-primary">
                {userStats.totalBets}
              </p>
              <p className="text-sm text-theme-light">Apuestas Total</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-theme-primary">
                {userStats.winRate}%
              </p>
              <p className="text-sm text-theme-light">Tasa de Acierto</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-theme-primary">
                ${userStats.totalBalance.toFixed(2)}
              </p>
              <p className="text-sm text-theme-light">Balance Actual</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-theme-primary">
                {userStats.memberSince}
              </p>
              <p className="text-sm text-theme-light">Miembro Desde</p>
            </div>
          </div>
        </div>

        {/* 🔐 INFORMACIÓN DE CUENTA */}
        <div className="card-background p-6">
          <h2 className="text-xl font-bold text-theme-primary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Información de Cuenta
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-theme-light">Estado de la cuenta:</span>
              <StatusChip status="active" text="Activa" />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-theme-light">Rol:</span>
              <span className="text-theme-primary capitalize">{user.role}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-theme-light">Email verificado:</span>
              <StatusChip
                status={user.emailVerified ? "verified" : "pending"}
                text={user.emailVerified ? "Verificado" : "Pendiente"}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-theme-light">Fecha de registro:</span>
              <span className="text-theme-primary">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("es-ES")
                  : "No disponible"}
              </span>
            </div>
          </div>
        </div>

        {/* 🔒 ACCIONES DE SEGURIDAD */}
        <div className="card-background p-6">
          <h2 className="text-xl font-bold text-theme-primary mb-4">
            Seguridad
          </h2>

          <div className="space-y-3">
            <button className="btn-secondary w-full">Cambiar Contraseña</button>
            <button className="btn-ghost w-full">
              Configurar Autenticación 2FA
            </button>
            <button className="btn-ghost w-full text-red-400 border-red-400 hover:bg-red-500/10">
              Desactivar Cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
