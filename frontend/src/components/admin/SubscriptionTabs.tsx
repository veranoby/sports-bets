// frontend/src/components/admin/SubscriptionTabs.tsx
// Componente para gestionar suscripciones con radio buttons

import React, { useState } from "react";
import { adminAPI } from "../../config/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { notification } from "antd";
import { CreditCard, Crown, User, Clock } from "lucide-react";

interface SubscriptionData {
  id?: string;
  status?: string;
  type?: string;
  createdAt?: string;
  manual_expires_at?: string;
  assigned_username?: string;
  [key: string]: unknown; // Allow additional properties
}

interface SubscriptionTabsProps {
  userId: string;
  subscription?: SubscriptionData;
  onSave: (subscriptionData: SubscriptionData) => void;
  onCancel: () => void;
}

const SubscriptionTabs: React.FC<SubscriptionTabsProps> = ({
  userId,
  subscription,
  onSave,
  onCancel,
}) => {
  const [selectedType, setSelectedType] = useState<string>("free");
  const [assignedUsername, setAssignedUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Opciones de membresía freemium
  const membershipOptions = [
    {
      value: "free",
      label: "Gratuita",
      icon: <User className="w-4 h-4" />,
      description: "Acceso básico limitado",
    },
    {
      value: "24h",
      label: "24 Horas Premium",
      icon: <Clock className="w-4 h-4" />,
      description: "Acceso completo por 24 horas",
    },
    {
      value: "monthly",
      label: "1 Mes Premium",
      icon: <Crown className="w-4 h-4" />,
      description: "Acceso completo por 30 días",
    },
  ];

  const handleMembershipUpdate = async () => {
    if (selectedType !== "free" && !assignedUsername.trim()) {
      notification.error({
        message: "Se requiere asignar un nombre de usuario responsable",
      });
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await adminAPI.updateUserMembership(userId, {
        membership_type: selectedType,
        assigned_username: assignedUsername.trim(),
      });

      notification.success({
        message: `Membresía actualizada a ${membershipOptions.find((o) => o.value === selectedType)?.label}`,
        description:
          selectedType !== "free"
            ? `Asignada por: ${assignedUsername}`
            : "Revocada a gratuita",
      });

      if (onSave)
        onSave({
          membership_type: selectedType,
          assigned_username: assignedUsername.trim(),
        });
      onCancel();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al actualizar membresía";
      setError(errorMsg);
      notification.error({ message: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Plan de Suscripción
        </h3>
      </div>

      <div className="space-y-6">
        {/* Estado Actual de Membresía */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Estado Actual de Membresía
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Estado:</span>{" "}
              {subscription?.status || "gratuita"}
            </div>
            <div>
              <span className="text-gray-500">Tipo:</span>{" "}
              {subscription?.type || "N/A"}
            </div>
            <div>
              <span className="text-gray-500">Última Activación:</span>{" "}
              {subscription?.createdAt
                ? new Date(subscription.createdAt).toLocaleDateString("es-ES")
                : "N/A"}
            </div>
            <div>
              <span className="text-gray-500">Expira:</span>{" "}
              {subscription?.manual_expires_at
                ? new Date(subscription.manual_expires_at).toLocaleDateString(
                    "es-ES",
                  )
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Gestión de Membresía Freemium */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Gestionar Membresía
          </h4>

          <div className="space-y-3 mb-4">
            {membershipOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="membershipType"
                  value={option.value}
                  checked={selectedType === option.value}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex items-center gap-2">
                  {option.icon}
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Campo de usuario responsable */}
          {selectedType !== "free" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario Responsable de la Asignación
              </label>
              <input
                type="text"
                value={assignedUsername}
                onChange={(e) => setAssignedUsername(e.target.value)}
                placeholder="Ingresa tu nombre de usuario"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Se registrará quién asignó esta membresía para auditoría
              </p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleMembershipUpdate}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                Actualizando...
              </>
            ) : (
              "Actualizar Membresía"
            )}
          </button>
        </div>

        {error && <ErrorMessage error={error} />}
      </div>
    </div>
  );
};

export default SubscriptionTabs;
