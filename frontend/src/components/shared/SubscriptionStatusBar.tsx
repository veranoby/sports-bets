// frontend/src/components/shared/SubscriptionStatusBar.tsx
import React from "react";
import { Crown, Clock, AlertTriangle } from "lucide-react";
import { useSubscriptions } from "../../hooks/useApi";

const SubscriptionStatusBar: React.FC = () => {
  const { subscription, loading } = useSubscriptions();

  if (loading || !subscription) return null;

  const endDate = new Date(subscription.endDate);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const isExpiringSoon = hoursLeft < 24;

  if (subscription.status !== "active") return null;

  return (
    <div
      className={`px-4 py-2 text-sm flex items-center justify-between ${
        isExpiringSoon
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      <div className="flex items-center">
        {isExpiringSoon ? (
          <AlertTriangle className="w-4 h-4 mr-2" />
        ) : (
          <Crown className="w-4 h-4 mr-2" />
        )}
        <span>
          {isExpiringSoon
            ? `Plan expira en ${hoursLeft}h`
            : `Plan ${subscription.plan} activo`}
        </span>
      </div>
      <div className="flex items-center">
        <Clock className="w-4 h-4 mr-1" />
        <span>Hasta {endDate.toLocaleDateString("es-EC")}</span>
      </div>
    </div>
  );
};

export default SubscriptionStatusBar;
