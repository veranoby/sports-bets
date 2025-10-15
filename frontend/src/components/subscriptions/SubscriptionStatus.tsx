import React from "react";
import type { UserSubscription } from "../../types";
import { format } from "date-fns";
import { Crown, AlertTriangle, CheckCircle } from "lucide-react";

interface SubscriptionStatusProps {
  subscription: UserSubscription | null;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
}) => {
  if (!subscription) {
    return (
      <div className="flex flex-col items-start">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
          FREE
        </span>
        <span className="mt-1 text-xs text-gray-500">
          Sin acceso a contenido premium
        </span>
      </div>
    );
  }

  const isExpired =
    subscription.expiresAt && new Date(subscription.expiresAt) <= new Date();
  const isFree = subscription.type === "free";
  const isPremium = !isFree && subscription.status === "active" && !isExpired;

  let statusText = "FREE";
  let statusClass = "bg-gray-100 text-gray-800 border-gray-200";
  let icon = <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>;
  let description = "Sin acceso a contenido premium";

  if (isPremium) {
    statusText = subscription.type === "daily" ? "24 HORAS" : subscription.type === "monthly" ? "MENSUAL" : "PREMIUM";
    statusClass = "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold border-yellow-600";
    icon = <Crown className="w-3.5 h-3.5 mr-2" />;
    description = "Acceso completo a contenido premium";
  } else if (isExpired) {
    statusText = "EXPIRADA";
    statusClass = "bg-red-100 text-red-800 border-red-200";
    icon = <AlertTriangle className="w-3.5 h-3.5 mr-2 text-red-500" />;
    description = "Renueva tu suscripción para continuar";
  } else if (subscription.status === "pending") {
    statusText = "PENDIENTE";
    statusClass = "bg-blue-100 text-blue-800 border-blue-200";
    icon = <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>;
    description = "Solicitud en proceso";
  } else if (subscription.status === "cancelled") {
    statusText = "CANCELADA";
    statusClass = "bg-purple-100 text-purple-800 border-purple-200";
    icon = <AlertTriangle className="w-3.5 h-3.5 mr-2 text-purple-500" />;
    description = "Suscripción cancelada";
  }

  const daysRemaining = subscription.expiresAt
    ? Math.ceil(
        (new Date(subscription.expiresAt).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const showWarning = isPremium && daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div className="flex flex-col items-start">
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}
      >
        {icon}
        {statusText}
      </span>
      <span className="mt-1 text-xs text-gray-500">
        {description}
      </span>
      {isPremium && subscription.expiresAt && (
        <span className="mt-1 text-xs flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          Expira: {format(new Date(subscription.expiresAt), "MMM dd, yyyy")}
        </span>
      )}
      {showWarning && (
        <span className="mt-1 text-xs flex items-center gap-1 text-red-500">
          <AlertTriangle className="w-3 h-3" />
          ¡Expira en {daysRemaining} día(s)!
        </span>
      )}
    </div>
  );
};

export default SubscriptionStatus;
