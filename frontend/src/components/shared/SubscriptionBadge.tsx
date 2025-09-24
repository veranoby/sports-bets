// frontend/src/components/shared/SubscriptionBadge.tsx
// Componente unificado para mostrar badges de suscripción

import React from "react";
import type { UserSubscription } from "../../types";

interface SubscriptionBadgeProps {
  subscription?: UserSubscription | null;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  subscription,
  size = "sm",
  showStatus = true,
}) => {
  // Si no hay suscripción
  if (!subscription) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${
          size === "lg"
            ? "px-3 py-1 text-sm"
            : size === "md"
              ? "px-2.5 py-0.5 text-xs"
              : "px-2 py-0.5 text-xs"
        }`}
      >
        Sin suscripción
      </span>
    );
  }

  // Determinar colores según el estado
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Obtener ícono y texto del tipo de plan
  const getPlanDisplay = (type?: string) => {
    switch (type) {
      case "daily":
        return { icon: "📅", text: "Diario" };
      case "monthly":
        return { icon: "📆", text: "Mensual" };
      default:
        return { icon: "📋", text: "Plan" };
    }
  };

  const planDisplay = getPlanDisplay(subscription.type);
  const statusColor = getStatusColor(subscription.status);

  // Verificar si la suscripción está expirada
  const isExpired =
    subscription.expiresAt && new Date(subscription.expiresAt) < new Date();
  const finalColor = isExpired ? "bg-red-100 text-red-800" : statusColor;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${finalColor} ${
          size === "lg"
            ? "px-3 py-1 text-sm"
            : size === "md"
              ? "px-2.5 py-0.5 text-xs"
              : "px-2 py-0.5 text-xs"
        }`}
      >
        {planDisplay.icon} {planDisplay.text}
      </span>
      {showStatus && subscription.status && (
        <span
          className={`text-xs text-gray-500 ${
            size === "lg" ? "text-sm" : "text-xs"
          }`}
        >
          {isExpired ? "Expirado" : subscription.status}
        </span>
      )}
    </div>
  );
};

export default SubscriptionBadge;
