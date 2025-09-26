// frontend/src/components/shared/SubscriptionModal.tsx
// Modal usando useSubscriptions existente de useApi.ts

import React, { useState, useEffect, useCallback } from "react";
import { Check, Crown, Clock, CreditCard } from "lucide-react";
import { useSubscriptions } from "../../hooks/useApi";
import Modal from "./Modal";
import Card from "./Card";
import StatusChip from "./StatusChip";
import LoadingSpinner from "./LoadingSpinner";
import type { Subscription } from "../../types";

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

// ... (rest of the file)

  const handleCancelSubscription = async () => {
    if (!(subscription as Subscription)?.id) return;

    try {
      await cancelSubscription((subscription as Subscription).id);
      onClose();
    } catch (err) {
      console.error("Error canceling subscription:", err);
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
        <Card variant="success" className="mb-6">
          <div className="flex items-center">
            <Crown className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="font-medium text-green-800">Suscripción Activa</p>
              <p className="text-sm text-green-600">
                Plan {subscription.plan} - Renovación:{" "}
                {subscription.autoRenew ? "Automática" : "Manual"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card variant="error" className="mb-6">
          <p>{String(error)}</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            variant={selectedPlan === plan.id ? "stat" : "default"}
            highlighted={plan.recommended}
            onClick={() => setSelectedPlan(plan.id)}
            className="cursor-pointer relative"
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <StatusChip status="active" label="Recomendado" />
              </div>
            )}

            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {plan.name}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-500">
                  /{plan.durationUnit === "hours" ? "24h" : "30d"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {subscription ? (
          <>
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Cancelar Suscripción
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubscribe}
              disabled={loading || !selectedPlan}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
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

      <div className="mt-4 text-center text-sm text-gray-500">
        <Clock className="w-4 h-4 inline mr-1" />
        Pago seguro con Kushki • Cancela en cualquier momento
      </div>
    </Modal>
  );
};

export default SubscriptionModal;
