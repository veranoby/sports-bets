/**
 * BetCard Component
 * Muestra información y estado de una apuesta individual con diferentes estilos visuales
 * según su estado (pendiente, activa, liquidada, cancelada) y resultado (ganada, perdida, empate)
 */
"use client";

import React from "react";
import {
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { BetSide, BetStatus, BetResult, Bet } from "../../types";
import StatusChip from "../shared/StatusChip";

export interface BetCardProps {
  bet: Bet;
  onSelect: (bet: Bet) => void;
  className?: string;
}

const BetCard: React.FC<BetCardProps> = ({ bet, onSelect, className }) => {
  // Configuración de colores según el estado y resultado
  const getStatusConfig = () => {
    switch (bet.status) {
      case "pending":
        return {
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
          icon: Clock,
          label: "Pendiente",
        };
      case "settled":
        if (bet.result === "win") {
          return {
            bgColor: "bg-green-50",
            textColor: "text-green-700",
            borderColor: "border-green-200",
            icon: CheckCircle,
            label: "Ganada",
          };
        } else if (bet.result === "loss") {
          return {
            bgColor: "bg-red-50",
            textColor: "text-red-700",
            borderColor: "border-red-200",
            icon: XCircle,
            label: "Perdida",
          };
        } else {
          return {
            bgColor: "bg-gray-50",
            textColor: "text-gray-700",
            borderColor: "border-gray-200",
            icon: AlertCircle,
            label: "Empate",
          };
        }
      case "cancelled":
        return {
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
          icon: AlertCircle,
          label: "Cancelada",
        };
      default:
        return {
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
          icon: AlertCircle,
          label: "Desconocido",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Formatear valores monetarios para consistencia
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer hover:shadow ${className}`}
      onClick={() => onSelect(bet)}
    >
      <div className="flex justify-between">
        <span>
          {bet.fighterNames?.red} vs {bet.fighterNames?.blue}
        </span>
        <span>
          ${bet.amount} ({bet.odds.toFixed(2)})
        </span>
      </div>
      <div className="mt-2 text-sm">
        Status:{" "}
        <StatusChip
          status={
            bet.status === "pending"
              ? "pending"
              : bet.status === "active"
              ? "active"
              : "settled"
          }
          size="sm"
        />{" "}
        | Result: {bet.result || "Pending"}
      </div>
    </div>
  );
};

export default BetCard;
