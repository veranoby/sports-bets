// frontend/src/components/shared/SubscriptionModal.tsx
// Modal usando useSubscriptions existente de useApi.ts

import React, { useState, useEffect, useCallback } from "react";
import { Check, Crown, Clock, CreditCard } from "lucide-react";
import { useSubscriptions } from "../../hooks/useApi";
import Modal from "./Modal";
import type { UserSubscription } from "../../types";

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number;
  durationUnit: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const {
    subscription,
    loading,
    error,
    fetchPlans,
    fetchCurrent,
    createSubscription,
    cancelSubscription,
  } = useSubscriptions();

  const loadPlans = useCallback(async () => {
    try {
      const response = await fetchPlans();
      if (response.success && Array.isArray(response.data)) {
        setPlans(response.data as Plan[]);
      }
    } catch (err) {
      console.error("Error loading plans:", err);
    }
  }, [fetchPlans]);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      fetchCurrent();
    }
  }, [isOpen, loadPlans, fetchCurrent]);

  const handleSubscribe = async () => {
    try {
      await createSubscription({
        plan: selectedPlan as "daily" | "monthly",
        autoRenew: true,
      });
      onClose();
    } catch (err) {
      console.error("Error creating subscription:", err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!(subscription as UserSubscription)?.id) return;

    try {
      await cancelSubscription((subscription as UserSubscription).id);
      onClose();
    } catch (err) {
      console.error("Error canceling subscription:", err);
    }
  };

  // Función para obtener clases de color según el estado
  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      case "expired":
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      default:
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subscription ? "Gestionar Suscripción" : "Planes de Suscripción"}
      size="lg"
    >
      {subscription && (
        <div className={`mb-6 p-4 rounded-lg border ${getStatusColorClasses(subscription.status || "active")}`}>
          <div className="flex items-center">
            <Crown className="w-5 h-5 mr-2" />
            <div>
              <p className="font-medium">Suscripción Activa</p>
              <p className="text-sm">
                Plan {subscription.plan} - Renovación:{" "}
                {subscription.autoRenew ? "Automática" : "Manual"}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500">
          <p>{String(error)}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`
              p-6 rounded-lg border cursor-pointer transition-all duration-200
              ${selectedPlan === plan.id 
                ? "border-[#cd6263] bg-[#cd6263]/10" // color-secondary
                : "border-gray-200 dark:border-gray-700 hover:border-[#596c95] hover:bg-[#596c95]/5" // color-primary
              }
              ${plan.recommended ? "ring-2 ring-[#596c95]/50 relative" : ""}
            `}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Recomendado
                </span>
              </div>
            )}

            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${plan.price}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  /{plan.durationUnit === "hours" ? "24h" : "30d"}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{plan.description}</p>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {subscription ? (
          <>
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Cancelar Suscripción
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubscribe}
              disabled={loading || !selectedPlan}
              className="flex-1 px-6 py-3 bg-[#cd6263] text-white rounded-lg font-medium hover:bg-[#b55456] disabled:opacity-50 transition-colors flex items-center justify-center" // color-secondary
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Suscribirse
                </>
              )}
            </button>
          </>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <Clock className="w-4 h-4 inline mr-1" />
        Pago seguro con Kushki • Cancela en cualquier momento
      </div>
    </Modal>
  );
};

export default SubscriptionModal;
