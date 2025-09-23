// frontend/src/pages/user/Subscriptions.tsx - NUEVA PÁGINA DEDICADA
// ================================================================
// NUEVA FUNCIONALIDAD: Página completa para gestión de suscripciones
// CARACTERÍSTICAS: Planes, historial, renovación, cancelación

import React, { useState, useEffect } from "react";
import {
  Crown,
  Check,
  Calendar,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Zap,
  Star,
} from "lucide-react";
import { useSubscriptions } from "../../hooks/useApi";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import StatusChip from "../../components/shared/StatusChip";

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

const SubscriptionsPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [showHistory, setShowHistory] = useState(false);

  const {
    subscription,
    loading,
    error,
    fetchPlans,
    fetchCurrent,
    createSubscription,
    cancelSubscription,
    toggleAutoRenew,
  } = useSubscriptions();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const plansData = await fetchPlans();

      const freePlan: Plan = {
        id: "free",
        name: "Plan Gratuito",
        price: 0,
        duration: 9999,
        durationUnit: "days",
        description: "Acceso limitado a noticias y resultados.",
        features: [
          "Acceso a noticias",
          "Resultados de eventos",
          "Soporte por correo",
          "Con publicidad",
        ],
        recommended: false,
      };

      const apiPlans = Array.isArray(plansData)
        ? plansData
        : (plansData as any)?.data || [];

      setPlans([freePlan, ...apiPlans]);
      await fetchCurrent();
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await createSubscription({
        plan: planId as "daily" | "monthly",
        autoRenew: true,
      });
      await loadData(); // Recargar datos
    } catch (err) {
      console.error("Error creating subscription:", err);
    }
  };

  const handleCancel = async () => {
    if (!subscription?.id) return;

    if (confirm("¿Estás seguro de cancelar tu suscripción?")) {
      try {
        await cancelSubscription(subscription.id);
        await loadData(); // Recargar datos
      } catch (err) {
        console.error("Error canceling subscription:", err);
      }
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription?.id) return;

    try {
      await toggleAutoRenew(subscription.id, !subscription.autoRenew);
      await loadData(); // Recargar datos
    } catch (err) {
      console.error("Error toggling auto-renew:", err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando información de suscripciones..." />;
  }

  const plansArray = Array.isArray(plans) ? plans : (plans as any)?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            Suscripción Premium
          </h1>
          <p className="text-theme-light mt-1">
            Gestiona tu plan y accede a funciones exclusivas
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Estado Actual de Suscripción */}
      {subscription && (
        <div className="card-background p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">
              Suscripción Actual
            </h2>
            <StatusChip
              status={subscription.status === "active" ? "active" : "inactive"}
              label={subscription.status === "active" ? "Activa" : "Inactiva"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-theme-light">Plan</p>
              <p className="font-medium text-theme-primary capitalize">
                {subscription.plan}
              </p>
            </div>
            <div>
              <p className="text-sm text-theme-light">Vence</p>
              <p className="font-medium text-theme-primary">
                {new Date(subscription.endDate).toLocaleDateString("es-EC")}
              </p>
            </div>
            <div>
              <p className="text-sm text-theme-light">Renovación</p>
              <p className="font-medium text-theme-primary">
                {subscription.autoRenew ? "Automática" : "Manual"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleToggleAutoRenew}
              className="btn-ghost flex items-center gap-2"
              disabled={loading}
            >
              {subscription.autoRenew ? (
                <ToggleRight className="w-5 h-5 text-green-400" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              )}
              Renovación Automática
            </button>

            <button
              onClick={handleCancel}
              className="btn-danger text-sm"
              disabled={loading}
            >
              Cancelar Suscripción
            </button>
          </div>
        </div>
      )}

      {/* Planes Disponibles */}
      <div className="card-background p-6">
        <h2 className="text-lg font-semibold text-theme-primary mb-4">
          {subscription ? "Cambiar Plan" : "Seleccionar Plan"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plansArray.map((plan) => (
            <div
              key={plan.id}
              className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "border-red-500 bg-red-500/5"
                  : "border-gray-600 hover:border-gray-500"
              } ${plan.recommended ? "ring-2 ring-yellow-400/50" : ""}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                    <Star className="w-3 h-3 inline mr-1" />
                    Recomendado
                  </div>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-theme-primary mb-2">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-theme-primary">
                    ${plan.price}
                  </span>
                  <span className="text-theme-light">
                    /{plan.durationUnit === "hours" ? "día" : "mes"}
                  </span>
                </div>
                <p className="text-sm text-theme-light">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-theme-light">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id !== "free" &&
                (!subscription || subscription.plan !== plan.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan.id);
                    }}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        {subscription ? "Cambiar Plan" : "Suscribirse"}
                      </>
                    )}
                  </button>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Historial (placeholder) */}
      <div className="card-background p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-theme-primary">
            Historial de Pagos
          </h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-ghost text-sm"
          >
            {showHistory ? "Ocultar" : "Ver Historial"}
          </button>
        </div>

        {showHistory && (
          <div className="text-center py-8 text-theme-light">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Historial de pagos disponible próximamente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
