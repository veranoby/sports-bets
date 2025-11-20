// frontend/src/components/admin/SubscriptionTabs.tsx
// Componente para gestionar suscripciones con radio buttons

import React, { useState, useEffect } from "react";
import ErrorMessage from "../shared/ErrorMessage";
import { CreditCard, Crown, User, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SubscriptionData {
  id?: string;
  status?: "active" | "cancelled" | "expired" | "pending";
  type?: "free" | "daily" | "monthly";
  createdAt?: string;
  manual_expires_at?: string;
  assigned_username?: string;
  // Add UserSubscription compatibility fields
  expiresAt?: string | null;
  features?: string[];
  remainingDays?: number;
  [key: string]: unknown; // Allow additional properties
}

interface SubscriptionTabsProps {
  userId: string;
  subscription?: SubscriptionData;
  mode?: "create" | "edit";
  onSave: (subscriptionData: SubscriptionData) => void;
  onCancel: () => void;
}

const SubscriptionTabs: React.FC<SubscriptionTabsProps> = ({
  userId,
  subscription,
  mode = "edit", // Default to 'edit' for backward compatibility
  onSave,
  onCancel,
}) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>("free");
  const [assignedUsername, setAssignedUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Auto-fill assigned username with current admin user
  useEffect(() => {
    if (user?.username) {
      setAssignedUsername(user.username);
    }
  }, [user]);

  // Auto-save to parent state when selection changes
  useEffect(() => {
    // Only save if we have required data
    if (
      selectedType === "free" ||
      (selectedType !== "free" && assignedUsername.trim())
    ) {
      setError(null);
      onSave({
        membership_type: selectedType,
        assigned_username: assignedUsername.trim(),
        type: selectedType as "free" | "daily" | "monthly",
        status: selectedType === "free" ? "active" : "pending",
        expiresAt: selectedType === "free" ? null : undefined,
        manual_expires_at: selectedType === "free" ? null : undefined,
        features: selectedType === "free" ? [] : undefined,
      });
    }
  }, [selectedType, assignedUsername, onSave]);

  // Opciones de suscripción freemium
  const membershipOptions = [
    {
      value: "free",
      label: "Gratuita",
      price: "$0",
      icon: <User className="w-4 h-4" />,
      description: "Acceso básico limitado - Sin eventos en vivo ni apuestas",
    },
    {
      value: "24-hour",
      label: "24 Horas",
      price: "$5",
      icon: <Clock className="w-4 h-4" />,
      description:
        "Acceso completo por 24 horas - Eventos en vivo + apuestas P2P",
    },
    {
      value: "monthly",
      label: "Mensual",
      price: "$10",
      icon: <Crown className="w-4 h-4" />,
      description:
        "Acceso ilimitado por 30 días - Todos los beneficios premium",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Plan de Suscripción
        </h3>
      </div>

      <div className="space-y-6">
        {/* Estado Actual de Suscripción */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Estado Actual de Suscripción
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
              {subscription?.expiresAt
                ? new Date(subscription.expiresAt).toLocaleDateString("es-ES")
                : subscription?.manual_expires_at
                  ? new Date(subscription.manual_expires_at).toLocaleDateString(
                      "es-ES",
                    )
                  : "N/A"}
            </div>
          </div>
        </div>

        {/* Lógica de gestión de suscripción condicional */}
        {/* Si la suscripción actual es gratuita, mostrar opciones de mejora */}
        {subscription?.type === "free" && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Gestionar Suscripción
            </h4>

            <div className="space-y-3 mb-4">
              {membershipOptions.filter(option => option.value !== "free").map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType === option.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
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
                        <div className="font-semibold text-gray-900">
                          {option.label}
                        </div>
                        <p className="text-xs text-gray-600">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {option.price}
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
                  Se registrará quién asignó esta suscripción para auditoría
                </p>
              </div>
            )}
          </div>
        )}
        {/* Si la suscripción actual es de pago (diaria o mensual) y aún es activa, mostrar botón de cancelar */}
        {subscription?.type && subscription.type !== "free" &&
         subscription.status !== "cancelled" &&
         subscription.status !== "expired" && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Administrar Suscripción
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              El usuario actualmente tiene una suscripción {subscription.type} activa.
            </p>
            <button
              onClick={() => {
                if (window.confirm("¿Estás seguro de que deseas cancelar esta suscripción? El usuario volverá a tener acceso gratuito.")) {
                  setSelectedType("free");
                  onSave({
                    membership_type: "free",
                    assigned_username: user?.username || "",
                    type: "free",
                    status: "active",
                    expiresAt: null,
                    features: [],
                  });
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancelar Suscripción
            </button>
          </div>
        )}
        {/* Si la suscripción actual es de pago pero ya expiró o está cancelada, mostrar opción de mejorar */}
        {subscription?.type && subscription.type !== "free" &&
         (subscription.status === "cancelled" || subscription.status === "expired") && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Gestionar Suscripción - {subscription.status === "expired" ? "Expirada" : "Cancelada"}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              La suscripción actual ha {subscription.status === "expired" ? "expirado" : "sido cancelada"}. Puedes asignar una nueva suscripción.
            </p>

            <div className="space-y-3 mb-4">
              {membershipOptions.filter(option => option.value !== "free").map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType === option.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
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
                        <div className="font-semibold text-gray-900">
                          {option.label}
                        </div>
                        <p className="text-xs text-gray-600">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {option.price}
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
                  Se registrará quién asignó esta suscripción para auditoría
                </p>
              </div>
            )}
          </div>
        )}

        {error && <ErrorMessage error={error} />}
      </div>
    </div>
  );
};

export default SubscriptionTabs;
