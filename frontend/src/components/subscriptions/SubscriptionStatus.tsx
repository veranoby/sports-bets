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
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Columna 1 */}
        <div className="flex flex-col gap-1">
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 cursor-help"
            title="Sin acceso a contenido premium"
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
            FREE
          </span>
        </div>

        {/* Columna 2 */}
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
    statusText =
      subscription.type === "daily"
        ? "24 HORAS"
        : subscription.type === "monthly"
          ? "MENSUAL"
          : "PREMIUM";
    statusClass =
      "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold border-yellow-600";
    icon = <Crown className="w-3.5 h-3.5 mr-2" />;
    description = "Acceso a contenido premium";
  } else if (isExpired) {
    statusText = "EXPIRADA";
    statusClass = "bg-red-100 text-red-800 border-red-200";
    icon = <AlertTriangle className="w-3.5 h-3.5 mr-2 text-red-500" />;
    description = "Renueva tu suscripción para continuar";
  } else if (subscription.status === "pending") {
    statusText = "PENDIENTE";
    statusClass = "bg-blue-100 text-blue-800 border-blue-200";
    icon = (
      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
    );
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
    <div className="inline-flex flex-wrap items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs w-fit">
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] sm:text-xs font-medium border cursor-help ${statusClass}`}
        title={description}
      >
        {icon}
        {statusText}
      </span>

      {isPremium && subscription.expiresAt && (
        <span className="inline-flex items-center gap-1 text-green-600">
          <CheckCircle className="w-3 h-3" />
          {format(new Date(subscription.expiresAt), "MMM dd")}
        </span>
      )}
      {showWarning && (
        <span className="inline-flex items-center gap-1 text-red-500">
          <AlertTriangle className="w-3 h-3" />
          {daysRemaining}d restantes
        </span>
      )}
    </div>
  );
};

export default SubscriptionStatus;
