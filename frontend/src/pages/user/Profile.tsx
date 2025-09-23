import React, { useState, useCallback } from "react";
import { User, Edit3, Save, X, Mail, Shield, Calendar, Camera, CheckCircle, XCircle, Lock, Key, Crown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useBets, useUsers, useAuthOperations } from "../../hooks/useApi";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import PaymentProofUpload from '../../components/user/PaymentProofUpload';
import useMembershipCheck from '../../hooks/useMembershipCheck';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { bets } = useBets();
  const { updateProfile } = useUsers();
  const { changePassword } = useAuthOperations();
  const { isBettingEnabled } = useFeatureFlags();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [formData, setFormData] = useState({ fullName: user?.profileInfo?.fullName || "", phoneNumber: user?.profileInfo?.phoneNumber || "", address: user?.profileInfo?.address || "" });
  const navigate = useNavigate();
  const { membershipStatus, refreshMembership } = useMembershipCheck();

  const userStats = {
    totalBets: bets?.length || 0,
    winRate: bets?.length > 0 ? ((bets.filter((b) => b.result === "win").length / bets.length) * 100).toFixed(1) : "0.0",
    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long" }) : "Reciente",
  };

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setLoading(true);
      setSaveStatus("idle");
      await updateProfile({ profileInfo: formData });
      setSaveStatus("success");
      setIsEditing(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setLoading(false);
    }
  }, [formData, updateProfile]);

  const handleCancel = useCallback(() => {
    setFormData({ fullName: user?.profileInfo?.fullName || "", phoneNumber: user?.profileInfo?.phoneNumber || "", address: user?.profileInfo?.address || "" });
    setIsEditing(false);
    setSaveStatus("idle");
  }, [user]);

  const handleChangePassword = useCallback(async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    try {
      setPasswordLoading(true);
      await changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      setShowPasswordModal(false);
      alert("Contraseña actualizada correctamente");
    } catch (error) {
      alert("Error al cambiar contraseña. Verifica tu contraseña actual.");
    } finally {
      setPasswordLoading(false);
    }
  }, [passwordData, changePassword]);

  if (!user) {
    return <LoadingSpinner />;
  }

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
              <button onClick={() => setShowAvatarModal(true)} className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all duration-200 hover:scale-110 border border-gray-200" title="Cambiar avatar">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{formData.fullName || user.username}</h1>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><User className="w-3 h-3" />{user.username}</div>
              <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Shield className="w-3 h-3" />{user.role}</div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {isBettingEnabled && (
                <>
                  <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">🎯 {userStats.totalBets} apuestas</div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">📊 {userStats.winRate}% efectividad</div>
                </>
              )}
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />{userStats.memberSince}</div>
            </div>
          </div>
        </div>

        {/* Información Personal */}
        <div className="bg-indigo-50  rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Información Personal
            </h2>

            {/* Botón editar/guardar/cancelar */}
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-200 text-blue-600 rounded-lg hover:bg-blue-300 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-red-200 text-gray-600 rounded-lg hover:bg-red-300 transition-colors"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-200 text-green-600 rounded-lg hover:bg-green-300 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Status message */}
          {saveStatus !== "idle" && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                saveStatus === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {saveStatus === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {saveStatus === "success"
                  ? "Perfil actualizado correctamente"
                  : "Error al guardar el perfil. Inténtalo de nuevo."}
              </span>
            </div>
          )}

          {/* Formulario */}
          <div className="space-y-4">
            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={
                    formData.fullName !== undefined
                      ? formData.fullName
                      : user.profileInfo?.fullName || user.username || ""
                  }
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  className="w-full px-3 text-sm font-medium text-gray-700 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ingresa tu nombre completo"
                />
              ) : (
                <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {formData.fullName ||
                    user.profileInfo?.fullName ||
                    user.username ||
                    "No especificado"}
                </div>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de teléfono
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={
                    formData.phoneNumber !== undefined
                      ? formData.phoneNumber
                      : user.profileInfo?.phoneNumber || ""
                  }
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className="text-sm font-medium text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ingresa tu número de teléfono"
                />
              ) : (
                <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {formData.phoneNumber ||
                    user.profileInfo?.phoneNumber ||
                    "No especificado"}
                </div>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              {isEditing ? (
                <textarea
                  value={
                    formData.address !== undefined
                      ? formData.address
                      : user.profileInfo?.address || ""
                  }
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={3}
                  className="text-sm font-medium text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Ingresa tu dirección"
                />
              ) : (
                <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-lg text-gray-900 min-h-[76px]">
                  {formData.address ||
                    user.profileInfo?.address ||
                    "No especificado"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔒 SEGURIDAD Y CONTRASEÑA */}
        <div className="bg-indigo-50 rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Seguridad</h2>
            <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </div>
            {/* Email verification chip - CONDICIONAL */}
            {user.emailVerified ? (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Verificado
              </div>
            ) : (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Verificacion Pendiente
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-theme-main rounded-lg border border-theme-primary">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-theme-text-secondary" />
                  <div>
                    <p className="font-medium text-theme-text-primary">
                      Contraseña
                    </p>
                    <p className="text-sm text-theme-text-secondary">
                      Última actualización:{" "}
                      {user.passwordUpdatedAt
                        ? new Date(user.passwordUpdatedAt).toLocaleDateString(
                            "es-ES"
                          )
                        : "No disponible"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-red-300 text-gray-600 rounded-lg hover:bg-red-400 transition-colors text-gray-700 px-4 py-2 rounded-lg  duration-200 flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Cambiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NEW SUBSCRIPTION SECTION */}
        <div className="bg-indigo-50 rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Membership</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-theme-main rounded-lg border">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#596c95]" />
                <span className="text-theme-text-primary">Current Plan:</span>
                <span className="font-medium text-theme-primary">
                  {membershipStatus?.current_status === 'active' ? membershipStatus.membership_type : 'Free'}
                </span>
              </div>
            </div>
            {membershipStatus?.expires_at && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">Expires: {new Date(membershipStatus.expires_at).toLocaleDateString()}</p>
              </div>
            )}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium mb-3">Upgrade Instructions</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Bank Transfer (Ecuador):</p>
                  <p className="text-gray-600">Banco Pichincha - Account: 2100XXXXXX</p>
                  <p className="text-gray-600">Daily: $2.99 | Monthly: $9.99</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">PayPal:</p>
                  <p className="text-gray-600">paypal@galleros.net</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">WhatsApp Support:</p>
                  <p className="text-gray-600">+593-XX-XXXXX</p>
                </div>
              </div>
              <div className="mt-4">
                <PaymentProofUpload onUploadSuccess={() => refreshMembership()} />
              </div>
            </div>
          </div>
        </div>

        {/* MODALS ... (Modals remain the same) ... */}
      </div>
    </div>
  );
};

export default Profile;