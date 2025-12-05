import React, { useState, useCallback } from "react";
import { useUserForm } from "../../hooks/useUserForm";
import { useUserSubscription } from "../../hooks/useUserSubscription";
import { useToast } from "../../hooks/useToast";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import ErrorMessage from "../shared/ErrorMessage";
import ImageGalleryUpload from "../shared/ImageGalleryUpload";
import SubscriptionTabs from "./SubscriptionTabs";
import type { User } from "../../types";
import { adminAPI } from "../../services/api"; // Added for balance adjustment
import ConfirmDialog from "../shared/ConfirmDialog"; // Added for balance adjustment confirmation

type UserRole = "operator" | "venue" | "gallera" | "user";
type FormMode = "create" | "edit";
type ActiveTab = "profile" | "subscription" | "balance"; // Added 'balance'

interface UserModalProps {
  mode: FormMode;
  role: UserRole;
  user?: User; // Required for edit mode
  onClose: () => void;
  onSuccess: (user?: User) => void;
}

const UserModal: React.FC<UserModalProps> = ({
  mode,
  role,
  user,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile"); // Use new ActiveTab type
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New states for balance adjustment
  const [balanceAdjustmentType, setBalanceAdjustmentType] = useState<
    "credit" | "debit"
  >("credit");
  const [balanceAdjustmentAmount, setBalanceAdjustmentAmount] =
    useState<number>(0);
  const [balanceAdjustmentReason, setBalanceAdjustmentReason] =
    useState<string>("");
  const [showConfirmAdjustmentModal, setShowConfirmAdjustmentModal] =
    useState<boolean>(false);
  const {
    formData,
    handleChange,
    handleArrayChange,
    handleImagesChange,
    handleSubmit,
  } = useUserForm(mode, role, user);

  const { subscription, updateSubscription } = useUserSubscription(
    user?.id || "",
    user?.subscription,
  );

  const getModalTitle = () => {
    if (mode === "create") {
      switch (role) {
        case "operator":
          return "Crear Nuevo Operador";
        case "venue":
          return "Crear Nueva Gallera";
        case "gallera":
          return "Crear Nuevo Criadero";
        case "user":
          return "Crear Nuevo Usuario";
      }
    } else {
      return "Editar Usuario";
    }
  };

  const [pendingSubscription, setPendingSubscription] = useState<{
    membership_type: string;
    assigned_username: string;
  } | null>(null);

  // Memoize onSave to prevent infinite re-renders in SubscriptionTabs
  const handleSubscriptionSave = useCallback((subscriptionData: any) => {
    // Always save to pending subscription state
    // This will be applied when the user clicks the main "Crear/Actualizar" button
    setPendingSubscription({
      membership_type:
        subscriptionData.membership_type || subscriptionData.type || "free",
      assigned_username: subscriptionData.assigned_username || "",
    });
  }, []);

  const handleAdjustBalance = async () => {
    if (
      !user?.id ||
      balanceAdjustmentAmount <= 0 ||
      !balanceAdjustmentReason ||
      balanceAdjustmentReason.length < 10
    ) {
      toast.error(
        "Por favor, rellena todos los campos de ajuste de saldo y asegúrate de que el monto sea positivo y la razón tenga al menos 10 caracteres.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.adjustUserBalance(user.id, {
        type: balanceAdjustmentType,
        amount: balanceAdjustmentAmount,
        reason: balanceAdjustmentReason,
      });

      // ✅ Check if API call was actually successful before closing modal
      if (response.success && response.data) {
        // Check for response.data
        toast.success("Saldo ajustado exitosamente.");
        // We now have the updated user object from the backend response
        onSuccess(response.data.user); // Pass the UPDATED user to the parent
        setActiveTab("balance"); // Keep modal on balance tab

        // Reset form for next adjustment
        setBalanceAdjustmentAmount(0);
        setBalanceAdjustmentReason("");
        setBalanceAdjustmentType("credit");

        // onClose(); // DO NOT close the modal immediately - modal remains open for further adjustments/verification
      } else {
        // API returned error response - show error and stay on balance tab
        const errorMsg = response.error || "Error al ajustar el saldo.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "Error al ajustar el saldo.");
      toast.error(err.message || "Error al ajustar el saldo.");
    } finally {
      setIsLoading(false);
      setShowConfirmAdjustmentModal(false);
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await handleSubmit();
      if (response.success) {
        const createdOrUpdatedUser = response.data as User;

        // Handle subscription logic after user creation/update
        if (pendingSubscription && createdOrUpdatedUser?.id) {
          try {
            const { adminAPI } = await import("../../services/api");

            // Check if subscription needs to be updated
            const currentType =
              user?.subscription?.plan === "basic"
                ? "24-hour"
                : user?.subscription?.plan === "premium"
                  ? "monthly"
                  : "free";
            const newType = pendingSubscription.membership_type;

            // Only update if different from current subscription
            if (mode === "create" || currentType !== newType) {
              await adminAPI.updateUserMembership(
                createdOrUpdatedUser.id,
                pendingSubscription,
              );
              const action = mode === "create" ? "creados" : "actualizados";
              toast.success(`Usuario y suscripción ${action} exitosamente`);
            } else {
              toast.success("Usuario actualizado (suscripción sin cambios)");
            }
          } catch (subError) {
            const action = mode === "create" ? "creado" : "actualizado";
            toast.warning(
              `Usuario ${action}, pero error al asignar suscripción`,
            );
          }
        } else if (!pendingSubscription) {
          // No subscription changes
          const action = mode === "create" ? "creado" : "actualizado";
          toast.success(`Usuario ${action} exitosamente`);
        }

        onSuccess(createdOrUpdatedUser);
        onClose();
      }
    } catch (err) {
      // Error is already handled in the hook
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle =
    "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{getModalTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                👤 Perfil
              </button>
              <button
                onClick={() => setActiveTab("subscription")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "subscription"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                💳 Suscripción
              </button>
              <button // New "Ajuste de Saldo" tab
                onClick={() => setActiveTab("balance")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "balance"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                💰 Ajuste de Saldo
              </button>
            </nav>
          </div>

          {error && <ErrorMessage error={error} />}

          {activeTab === "profile" ? (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div>
                  <label htmlFor="username" className={labelStyle}>
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={mode === "edit"} // Username is read-only in edit mode
                    className={`${inputStyle} ${mode === "edit" ? "bg-gray-100" : ""}`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelStyle}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Password - only show in create mode */}
              {mode === "create" && (
                <div>
                  <label htmlFor="password" className={labelStyle}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password || ""}
                      onChange={handleChange}
                      required={mode === "create"}
                      minLength={8}
                      className={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <hr />

              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Información de Perfil (Opcional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className={labelStyle}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="profileInfo.fullName"
                    value={formData.profileInfo.fullName}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className={labelStyle}>
                    Número de Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="profileInfo.phoneNumber"
                    value={formData.profileInfo.phoneNumber}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {role === "venue" && (
                <>
                  <hr />
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Información de la Gallera
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="venueName" className={labelStyle}>
                        Nombre de la Gallera
                      </label>
                      <input
                        type="text"
                        id="venueName"
                        name="profileInfo.venueName"
                        value={formData.profileInfo.venueName || ""}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="venueLocation" className={labelStyle}>
                        Ubicación
                      </label>
                      <input
                        type="text"
                        id="venueLocation"
                        name="profileInfo.venueLocation"
                        value={formData.profileInfo.venueLocation || ""}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="venueDescription" className={labelStyle}>
                      Descripción
                    </label>
                    <textarea
                      id="venueDescription"
                      name="profileInfo.venueDescription"
                      value={formData.profileInfo.venueDescription || ""}
                      onChange={handleChange}
                      rows={3}
                      className={inputStyle}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="venueEmail" className={labelStyle}>
                        Email de la Gallera
                      </label>
                      <input
                        type="email"
                        id="venueEmail"
                        name="profileInfo.venueEmail"
                        value={formData.profileInfo.venueEmail || ""}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="venueWebsite" className={labelStyle}>
                        Sitio Web
                      </label>
                      <input
                        type="url"
                        id="venueWebsite"
                        name="profileInfo.venueWebsite"
                        value={formData.profileInfo.venueWebsite || ""}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Venue Image Gallery */}
                  <div>
                    <ImageGalleryUpload
                      images={formData.profileInfo.images || []}
                      onImagesChange={handleImagesChange}
                      maxImages={2}
                      label="Imágenes de la Gallera"
                    />
                  </div>
                </>
              )}

              {/* Gallera-specific fields */}
              {role === "gallera" && (
                <>
                  <hr />
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Información del Criadero
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="galleraName" className={labelStyle}>
                        Nombre del Criadero
                      </label>
                      <input
                        type="text"
                        id="galleraName"
                        name="profileInfo.galleraName"
                        value={formData.profileInfo.galleraName || ""}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="galleraLocation" className={labelStyle}>
                        Ubicación
                      </label>
                      <input
                        type="text"
                        id="galleraLocation"
                        name="profileInfo.galleraLocation"
                        value={formData.profileInfo.galleraLocation || ""}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="galleraDescription" className={labelStyle}>
                      Descripción
                    </label>
                    <textarea
                      id="galleraDescription"
                      name="profileInfo.galleraDescription"
                      value={formData.profileInfo.galleraDescription || ""}
                      onChange={handleChange}
                      rows={3}
                      className={inputStyle}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="galleraEmail" className={labelStyle}>
                        Email del Criadero
                      </label>
                      <input
                        type="email"
                        id="galleraEmail"
                        name="profileInfo.galleraEmail"
                        value={formData.profileInfo.galleraEmail || ""}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="galleraWebsite" className={labelStyle}>
                        Sitio Web
                      </label>
                      <input
                        type="url"
                        id="galleraWebsite"
                        name="profileInfo.galleraWebsite"
                        value={formData.profileInfo.galleraWebsite || ""}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="galleraSpecialties" className={labelStyle}>
                      Especialidades (separadas por coma)
                    </label>
                    <textarea
                      id="galleraSpecialties"
                      value={(
                        formData.profileInfo.galleraSpecialties || []
                      ).join(", ")}
                      onChange={(e) =>
                        handleArrayChange("galleraSpecialties", e.target.value)
                      }
                      rows={2}
                      placeholder="ej: Gallos de Pelea, Crianza, Entrenamiento"
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="galleraActiveRoosters"
                      className={labelStyle}
                    >
                      Roosters Activos (separados por coma)
                    </label>
                    <textarea
                      id="galleraActiveRoosters"
                      value={(
                        formData.profileInfo.galleraActiveRoosters || []
                      ).join(", ")}
                      onChange={(e) =>
                        handleArrayChange(
                          "galleraActiveRoosters",
                          e.target.value,
                        )
                      }
                      rows={2}
                      placeholder="ej: Rojo, Negro, Pinto"
                      className={inputStyle}
                    />
                  </div>

                  {/* Gallera Image Gallery */}
                  <div>
                    <ImageGalleryUpload
                      images={formData.profileInfo.images || []}
                      onImagesChange={handleImagesChange}
                      maxImages={3}
                      label="Imágenes del Criadero"
                    />
                  </div>
                </>
              )}

              {/* Approval and Active Status - for both create and edit modes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="approved"
                    checked={formData.approved}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Usuario Aprobado
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Usuario Activo
                  </label>
                </div>
              </div>
            </form>
          ) : activeTab === "subscription" ? (
            // Subscription tab
            <SubscriptionTabs
              mode={mode}
              userId={user?.id || ""}
              subscription={subscription || user?.subscription}
              onSave={handleSubscriptionSave}
              onCancel={onClose}
            />
          ) : (
            // Balance Adjustment tab
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Ajuste Manual de Saldo para {user?.username}
              </h3>
              <p className="text-sm text-gray-600">
                Ajusta el saldo de la billetera del usuario. Esta acción
                requiere una justificación obligatoria y es irreversible.
              </p>

              {/* Current Balance Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">
                  Saldo Actual de Billetera
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {user?.wallet?.balance !== undefined &&
                  user?.wallet?.balance !== null
                    ? `$${parseFloat(String(user.wallet.balance)).toFixed(2)}`
                    : "No disponible"}
                </p>
              </div>

              {/* Balance Adjustment Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Ajuste
                </label>
                <div className="mt-1 flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="adjustmentType"
                      value="credit"
                      checked={balanceAdjustmentType === "credit"}
                      onChange={(e) =>
                        setBalanceAdjustmentType(
                          e.target.value as "credit" | "debit",
                        )
                      }
                    />
                    <span className="ml-2">Añadir Saldo (Crédito)</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="adjustmentType"
                      value="debit"
                      checked={balanceAdjustmentType === "debit"}
                      onChange={(e) =>
                        setBalanceAdjustmentType(
                          e.target.value as "credit" | "debit",
                        )
                      }
                    />
                    <span className="ml-2">Restar Saldo (Débito)</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="adjustmentAmount" className={labelStyle}>
                  Monto
                </label>
                <input
                  type="number"
                  id="adjustmentAmount"
                  name="adjustmentAmount"
                  value={balanceAdjustmentAmount || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === "" ? 0 : parseFloat(value);
                    setBalanceAdjustmentAmount(isNaN(numValue) ? 0 : numValue);
                  }}
                  min="0.01"
                  step="0.01"
                  required
                  className={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="adjustmentReason" className={labelStyle}>
                  Razón (Obligatoria para auditoría. Min 20 caracteres)
                </label>
                <textarea
                  id="adjustmentReason"
                  name="adjustmentReason"
                  value={balanceAdjustmentReason}
                  onChange={(e) => setBalanceAdjustmentReason(e.target.value)}
                  rows={3}
                  minLength={10}
                  maxLength={255}
                  required
                  className={inputStyle}
                  placeholder="Ej: Bonificación por lealtad, corrección de depósito erróneo, etc."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmAdjustmentModal(true)}
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  disabled={
                    isLoading ||
                    balanceAdjustmentAmount <= 0 ||
                    !balanceAdjustmentReason ||
                    balanceAdjustmentReason.length < 10
                  }
                >
                  Confirmar Ajuste
                </button>
              </div>

              {/* Confirmation Modal */}
              <ConfirmDialog
                isOpen={showConfirmAdjustmentModal}
                onClose={() => setShowConfirmAdjustmentModal(false)}
                onConfirm={handleAdjustBalance}
                title="Confirmar Ajuste de Saldo"
                message={`¿Está seguro que desea ${balanceAdjustmentType === "credit" ? "AÑADIR" : "RESTAR"} $${balanceAdjustmentAmount.toFixed(2)} al saldo de la billetera de ${user?.username}? Esta acción es irreversible y se registrará como: "${balanceAdjustmentReason}".`}
                details={
                  user?.wallet?.balance !== undefined
                    ? (() => {
                        const currentBalance = parseFloat(
                          String(user.wallet.balance),
                        );
                        const newBalance =
                          balanceAdjustmentType === "credit"
                            ? currentBalance + balanceAdjustmentAmount
                            : currentBalance - balanceAdjustmentAmount;
                        return (
                          `Saldo Actual: $${currentBalance.toFixed(2)}\n` +
                          `Ajuste: ${balanceAdjustmentType === "credit" ? "+" : "-"}$${balanceAdjustmentAmount.toFixed(2)}\n` +
                          `Nuevo Saldo: $${newBalance.toFixed(2)}`
                        );
                      })()
                    : undefined
                }
                confirmText={
                  balanceAdjustmentType === "credit" ? "Añadir" : "Restar"
                }
                isConfirming={isLoading}
              />
            </div>
          )}
        </div>

        {/* Footer unificado - siempre visible */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-400 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "create" ? "Creando..." : "Actualizando..."}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {mode === "create" ? "Crear" : "Actualizar"}{" "}
                  {role === "operator"
                    ? "Operador"
                    : role === "venue"
                      ? "Gallera"
                      : role === "gallera"
                        ? "Criadero"
                        : "Usuario"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
