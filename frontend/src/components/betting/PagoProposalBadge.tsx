// frontend/src/components/betting/PagoProposalBadge.tsx

import React from "react";
import { DollarSign, Clock, Check, X } from "lucide-react";
import { BetData } from "../../types";

interface PagoProposalBadgeProps {
  bet: BetData;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

const PagoProposalBadge: React.FC<PagoProposalBadgeProps> = ({
  bet,
  onAccept,
  onReject,
  showActions = false,
}) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Determine badge appearance based on proposal status
  let statusColor = "";
  let statusIcon = null;
  let statusLabel = "";

  switch (bet.proposalStatus) {
    case "pending":
      statusColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
      statusIcon = <Clock className="w-4 h-4 mr-1" />;
      statusLabel = "PAGO propuesto";
      break;
    case "accepted":
      statusColor = "bg-green-100 text-green-800 border-green-200";
      statusIcon = <Check className="w-4 h-4 mr-1" />;
      statusLabel = "PAGO aceptado";
      break;
    case "rejected":
      statusColor = "bg-red-100 text-red-800 border-red-200";
      statusIcon = <X className="w-4 h-4 mr-1" />;
      statusLabel = "PAGO rechazado";
      break;
    default:
      statusColor = "bg-blue-100 text-blue-800 border-blue-200";
      statusIcon = <DollarSign className="w-4 h-4 mr-1" />;
      statusLabel = "PAGO";
  }

  // Extract PAGO amount from terms
  const pagoAmount = bet.terms?.pagoAmount;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusColor} text-sm font-medium`}
    >
      {statusIcon}
      <span>
        {statusLabel}
        {pagoAmount !== undefined && ` (${formatCurrency(pagoAmount)})`}
      </span>

      {showActions && bet.proposalStatus === "pending" && (
        <div className="ml-2 flex gap-1">
          <button
            onClick={onAccept}
            className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors"
            title="Aceptar PAGO"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={onReject}
            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            title="Rechazar PAGO"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PagoProposalBadge;
