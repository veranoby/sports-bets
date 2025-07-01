// frontend/src/components/shared/SubscriptionGuard.tsx - SIMPLIFICADO V2
// ================================================================
// OPTIMIZADO: Diseño más limpio, menos componentes dependientes
// MEJORAS: UI minimalista, mejor UX, menos código

import React, { useState, useEffect } from "react";
import { AlertTriangle, Crown } from "lucide-react";
import { useSubscriptions } from "../../hooks/useApi";
import SubscriptionModal from "./SubscriptionModal";

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

  // ✅ Verificación de acceso simplificada
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const result = await checkAccess();
        setHasAccess(result.hasAccess);
      } catch (err) {
        setHasAccess(false);
      }
    };

    if (!loading) {
      verifyAccess();
      fetchCurrent();
    }
  }, [checkAccess, fetchCurrent, loading]);

  // ✅ Estados de carga y error simplificados
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 text-theme-light">
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
        Verificando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-sm">Error verificando suscripción</span>
      </div>
    );
  }

  // ✅ Si tiene acceso, mostrar contenido
  if (hasAccess) {
    return <>{children}</>;
  }

  // ✅ Si hay fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // ✅ UI de bloqueo elegante y minimalista
  return (
    <>
      <div className="p-6 bg-gradient-to-br from-gray-800/10 to-gray-900/20 border border-gray-600/20 rounded-xl text-center backdrop-blur-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center border border-yellow-500/30">
          <Crown className="w-8 h-8 text-yellow-400" />
        </div>

        <h3 className="text-lg font-semibold text-theme-primary mb-2">
          Contenido Premium
        </h3>

        <p className="text-sm text-theme-light mb-6 max-w-sm mx-auto">
          Desbloquea {feature} y muchas más funciones exclusivas con tu
          suscripción premium.
        </p>

        {showUpgradePrompt && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-medium px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto shadow-lg"
          >
            <Crown className="w-5 h-5" />
            Actualizar a Premium
          </button>
        )}
      </div>

      {/* Modal de suscripción */}
      {showModal && (
        <SubscriptionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default SubscriptionGuard;
