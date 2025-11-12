// frontend/src/components/forms/SubscriptionForm.tsx
// Formulario para editar suscripciones de usuarios

import React, { useState } from "react";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { CreditCard, Crown } from "lucide-react";
import type { UserSubscription } from "../../types";

interface SubscriptionFormData {
  planType: "daily" | "monthly";
  status: "active" | "cancelled" | "expired" | "pending";
  action: "none" | "create" | "cancel" | "renew";
}

interface SubscriptionFormProps {
  userId: string;
  subscription?: UserSubscription;
  onSave: (subscriptionData: Partial<UserSubscription>) => void;
  onCancel: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  userId,
  subscription,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<SubscriptionFormData>({
    planType: (subscription && typeof subscription.plan !== 'undefined' 
      ? (subscription.plan === "free" || subscription.plan === "basic" ? "daily" : "monthly")
      : "daily") as "daily" | "monthly", // Explicit cast to satisfy TypeScript
    status: "cancelled" as const,
    action: "none",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      switch (formData.action) {
        case "create":
        case "renew":
          // TODO: Implementar creación/renovación de suscripción
          console.log("Crear/renovar suscripción para usuario:", userId);
          break;
        case "cancel":
          // TODO: Implementar cancelación de suscripción
          console.log("Cancelar suscripción para usuario:", userId);
          break;
        default:
          // No action needed
          break;
      }

      // Simular guardado
      onSave({
        ...subscription,
        type: formData.planType,
        status: formData.action === "cancel" ? "cancelled" : formData.status,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update subscription",
      );
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Gestionar Suscripción
        </h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          Suscripción Actual
        </h4>

        {subscription ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Plan:</span>
              <span className="font-medium">
                {subscription.type === "daily" ? "📅 Diario" : "📆 Mensual"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionStatusColor(subscription.status)}`}
              >
                {subscription.status}
              </span>
            </div>
            {subscription.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expira:</span>
                <span className="text-sm font-medium">
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            El usuario no tiene suscripción activa
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Acción
          </label>
          <select
            name="action"
            value={formData.action}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="none">Sin cambios</option>
            {!subscription && <option value="create">Crear suscripción</option>}
            {subscription && (
              <>
                <option value="renew">Renovar suscripción</option>
                <option value="cancel">Cancelar suscripción</option>
              </>
            )}
          </select>
        </div>

        {(formData.action === "create" || formData.action === "renew") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Plan
            </label>
            <select
              name="planType"
              value={formData.planType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">📅 Plan Diario</option>
              <option value="monthly">📆 Plan Mensual</option>
            </select>
          </div>
        )}

        {formData.action === "cancel" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              ⚠️ Esta acción cancelará la suscripción del usuario
              inmediatamente.
            </p>
          </div>
        )}

        {error && <ErrorMessage error={error} />}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || formData.action === "none"}
            className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubscriptionForm;
