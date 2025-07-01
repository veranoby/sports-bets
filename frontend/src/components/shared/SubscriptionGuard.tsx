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
  feature = "contenido premium",
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
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
        <Lock className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-700 mb-1">Suscripción Requerida</h3>
      <p className="text-sm text-gray-500 mb-4">
        Necesitas una suscripción para acceder a {feature}.
      </p>
      {showUpgradePrompt && (
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-sm px-4 py-2"
        >
          Ver Planes
        </button>
      )}
    </div>
  );
};

export default SubscriptionGuard;
