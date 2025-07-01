// frontend/src/components/shared/SubscriptionGuard.tsx
// Protege componentes usando useSubscriptions existente de useApi.ts

import React, { useState, useEffect } from "react";
import { Lock, Crown, Clock, AlertTriangle } from "lucide-react";
import { useSubscriptions } from "../../hooks/useApi";
import SubscriptionModal from "./SubscriptionModal";
import Card from "./Card";
import StatusChip from "./StatusChip";
import LoadingSpinner from "./LoadingSpinner";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature = "streaming",
  fallback,
  showUpgradePrompt = true,
}) => {
  const { subscription, loading, error, checkAccess, fetchCurrent } =
    useSubscriptions();
  const [hasAccess, setHasAccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Check inicial de acceso
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const result = await checkAccess();
        setHasAccess(result.hasAccess);
      } catch (err) {
        setHasAccess(false);
      }
    };

    verifyAccess();
  }, [checkAccess]);

  // Obtener suscripción actual
  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  if (loading) {
    return <LoadingSpinner text="Verificando suscripción..." />;
  }

  if (error) {
    return (
      <Card variant="warning" className="m-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Error verificando suscripción: {error}</span>
        </div>
      </Card>
    );
  }

  if (hasAccess) {
    return (
      <>
        {children}
        {subscription && (
          <div className="fixed bottom-4 right-4 z-50">
            <StatusChip
              status="active"
              label="Suscripción activa"
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        )}
      </>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8">
      <Card variant="info" className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-red-600" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Suscripción Requerida
        </h3>

        <p className="text-gray-600 mb-6">
          Necesitas una suscripción activa para acceder a {feature}.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card variant="default" size="sm" className="text-center">
            <div className="text-lg font-bold text-gray-900">$2.99</div>
            <div className="text-sm text-gray-500">24 horas</div>
          </Card>
          <Card variant="stat" size="sm" className="text-center" highlighted>
            <div className="text-lg font-bold text-red-600">$9.99</div>
            <div className="text-sm text-gray-500">30 días</div>
            <div className="text-xs text-red-600 font-medium">Recomendado</div>
          </Card>
        </div>

        {showUpgradePrompt && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Ver Planes de Suscripción
          </button>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <Lock className="w-4 h-4 inline mr-1" />
          Acceso seguro y renovación automática opcional
        </div>
      </Card>

      {showModal && (
        <SubscriptionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default SubscriptionGuard;
