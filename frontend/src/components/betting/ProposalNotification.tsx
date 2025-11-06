// frontend/src/components/betting/ProposalNotification.tsx
// Toast notification for incoming PAGO/DOY proposals

import React, { useEffect } from "react";
import { ShieldCheck, ShieldAlert, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { User } from "../../types";

interface ProposalNotificationProps {
  id: string;
  type: "PAGO" | "DOY";
  fightId: string;
  fightName: string;
  proposer: User;
  amount: number;
  expiresAt: Date;
  onAccept?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  onTimeout?: (proposalId: string) => void;
  showActions?: boolean;
}

const ProposalNotification: React.FC<ProposalNotificationProps> = ({
  id,
  type,
  fightId,
  fightName,
  proposer,
  amount,
  expiresAt,
  onAccept,
  onReject,
  onTimeout,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);

  useEffect(() => {
    // Calculate time left until expiration
    const calculateTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff > 0) {
        return Math.ceil(diff / 1000 / 60); // Minutes left
      }
      return 0;
    };

    const minutesLeft = calculateTimeLeft();
    setTimeLeft(minutesLeft);

    // Check timeout every 30 seconds
    const timeoutInterval = setInterval(() => {
      const minutesRemaining = calculateTimeLeft();
      setTimeLeft(minutesRemaining);

      if (minutesRemaining <= 0 && onTimeout) {
        onTimeout(id);
        clearInterval(timeoutInterval);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(timeoutInterval);
  }, [id, expiresAt, onTimeout]);

  const handleAccept = () => {
    if (onAccept) {
      onAccept(id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(id);
    }
  };

  const handleNavigateToFight = () => {
    navigate(`/events/${fightId}`);
  };

  const isExpired = timeLeft && timeLeft <= 0;

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${
        type === "PAGO"
          ? "border-l-blue-500 bg-blue-50/50"
          : "border-l-purple-500 bg-purple-50/50"
      } shadow-sm transition-all duration-200 ${
        isExpired ? "opacity-60" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-full ${
              type === "PAGO"
                ? "bg-blue-500/20 text-blue-600"
                : "bg-purple-500/20 text-purple-600"
            }`}
          >
            {type === "PAGO" ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={`font-semibold ${
                  type === "PAGO" ? "text-blue-800" : "text-purple-800"
                }`}
              >
                {type} Proposal
              </h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  type === "PAGO"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {type}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-1">
              From: <span className="font-medium">{proposer.username}</span>
            </p>

            <p className="text-sm text-gray-700 mb-2">
              {fightName} - ${amount.toFixed(2)}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              <span>
                {isExpired
                  ? "Proposal expired"
                  : timeLeft
                    ? `Expires in ${timeLeft} min`
                    : "Processing..."}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onReject?.(id)}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showActions && !isExpired && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleNavigateToFight}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${
              type === "PAGO"
                ? "border-blue-500 text-blue-600 hover:bg-blue-50"
                : "border-purple-500 text-purple-600 hover:bg-purple-50"
            } transition-colors`}
          >
            View Fight
          </button>

          <button
            onClick={handleAccept}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
              type === "PAGO"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            } transition-colors`}
          >
            Accept
          </button>

          <button
            onClick={handleReject}
            className="py-2 px-3 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {isExpired && showActions && (
        <div className="mt-3 text-sm text-gray-600 italic">
          This proposal has expired and is no longer available
        </div>
      )}
    </div>
  );
};

export default ProposalNotification;
