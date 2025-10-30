// frontend/src/components/user/PremiumHeaderBadge.tsx
// Componente para mostrar el estado de membresía premium en el header

import React from "react";
import { Crown, AlertTriangle, CheckCircle } from "lucide-react";
import type { UserSubscription } from "../../types";

interface PremiumHeaderBadgeProps {
  subscription: UserSubscription | null;
}

const PremiumHeaderBadge: React.FC<PremiumHeaderBadgeProps> = ({
  subscription,
}) => {
  // Si no hay suscripción, mostrar estado free
  if (!subscription) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 cursor-help"
        title="Sin acceso a contenido premium"
      >
        <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
        FREE
      </span>
    );
  }

  // Determinar estado y clase según el tipo de suscripción
  const isExpired =
    subscription.expiresAt && new Date(subscription.expiresAt) <= new Date();
  const isFree = subscription.type === "free";
  const isPremium = !isFree && subscription.status === "active" && !isExpired;

  // Configuración visual según el estado
  const config = {
    free: {
      icon: <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>,
      label: "FREE",
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
      borderColor: "border-gray-200",
      title: "Sin acceso a contenido premium",
    },
    premium: {
      icon: <Crown className="w-3.5 h-3.5 mr-2 text-amber-500" />,
      label:
        subscription.type === "daily"
          ? "24 HORAS"
          : subscription.type === "monthly"
            ? "MENSUAL"
            : "PREMIUM",
      bgColor: "bg-gradient-to-r from-yellow-400 to-yellow-500",
      textColor: "text-black",
      borderColor: "border-yellow-600",
      title: "Acceso completo a contenido premium",
    },
    expired: {
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-2 text-red-500" />,
      label: "EXPIRADA",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-200",
      title: "Suscripción expirada - Renueva para continuar",
    },
    pending: {
      icon: (
        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
      ),
      label: "PENDIENTE",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
      title: "Solicitud de membresía en proceso",
    },
    cancelled: {
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-2 text-purple-500" />,
      label: "CANCELADA",
      bgColor: "bg-purple-100",
      textColor: "text-purple-800",
      borderColor: "border-purple-200",
      title: "Suscripción cancelada",
    },
  };

  // Seleccionar configuración según estado
  let statusConfig = config.free;
  if (isPremium) {
    statusConfig = config.premium;
  } else if (isExpired) {
    statusConfig = config.expired;
  } else if (subscription.status === "pending") {
    statusConfig = config.pending;
  } else if (subscription.status === "cancelled") {
    statusConfig = config.cancelled;
  }

  // Calcular días restantes si es premium
  const daysRemaining = subscription.expiresAt
    ? Math.ceil(
        (new Date(subscription.expiresAt).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // Mostrar advertencia si está cerca de expirar
  const showExpirationWarning =
    isPremium && daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div className="flex flex-col items-start">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border cursor-help`}
        title={statusConfig.title}
      >
        {statusConfig.icon}
        {statusConfig.label}
      </span>

      {showExpirationWarning && (
        <span className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          Expira en {daysRemaining} día(s)!
        </span>
      )}
    </div>
  );
};

export default PremiumHeaderBadge;
