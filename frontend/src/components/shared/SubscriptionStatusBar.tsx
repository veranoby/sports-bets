// frontend/src/components/shared/SubscriptionStatusBar.tsx - SIMPLIFICADO V2
// ================================================================
// OPTIMIZADO: Diseño más limpio, menos elementos visuales
// MEJORAS: Mayor legibilidad, menos ruido visual, más móvil-friendly

import React from "react";
import { Crown, AlertTriangle } from "lucide-react";
import { useSubscriptions } from "../../hooks/useApi";
import type { UserSubscription as Subscription } from "../../types";

const SubscriptionStatusBar: React.FC = () => {
  const { subscription, loading } = useSubscriptions();

  if (
    loading ||
    !subscription ||
    (subscription as Subscription).status !== "active"
  )
    return null;

  const typedSubscription = subscription as Subscription;

  if (!typedSubscription.expiresAt) return null;

  const endDate = new Date(typedSubscription.expiresAt);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const isExpiringSoon = hoursLeft < 24;

  return (
    <div
      className={`px-4 py-2 text-sm flex items-center justify-center gap-2 ${
        isExpiringSoon
          ? "bg-yellow-500/10 text-yellow-300 border-b border-yellow-500/20"
          : "bg-green-500/10 text-green-300 border-b border-green-500/20"
      }`}
    >
      {isExpiringSoon ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <Crown className="w-4 h-4" />
      )}
      <span className="font-medium">
        {isExpiringSoon
          ? `Plan expira en ${hoursLeft}h`
          : `Plan ${typedSubscription.plan} activo`}
      </span>
      <span className="text-xs opacity-75">
        hasta{" "}
        {endDate.toLocaleDateString("es-EC", {
          day: "2-digit",
          month: "short",
        })}
      </span>
    </div>
  );
};

export default SubscriptionStatusBar;
