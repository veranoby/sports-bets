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

export interface BetCardProps {
  id: string;
  amount: number;
  potentialWin?: number;
  side: BetSide;
  status: BetStatus;
  result?: "win" | "loss";
  venueName: string;
  fightNumber: number;
  onViewDetails: (id: string) => void;
  onCancel?: () => void;
  statusColor?: string;
}

const BetCard: React.FC<BetCardProps> = ({
  id,
  amount,
  potentialWin,
  side,
  status,
  result,
  venueName,
  fightNumber,
  onViewDetails,
  onCancel,
  statusColor = "bg-gray-600",
}) => {
  // Configuración de colores según el estado y resultado
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          borderColor: "border-amber-200",
          icon: Clock,
          label: "Pendiente",
        };
      case "settled":
        if (result === "win") {
          return {
            bgColor: "bg-green-50",
            textColor: "text-green-700",
            borderColor: "border-green-200",
            icon: CheckCircle,
            label: "Ganada",
          };
        } else if (result === "loss") {
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
    <div className={`p-4 rounded-lg border border-[#596c95] ${statusColor}`}>
      <div className="flex justify-between">
        <div>
          <p className="font-bold">{side === "red" ? "Rojo" : "Azul"}</p>
          <p>Monto: {formatCurrency(amount)}</p>
          {potentialWin && <p>Ganancia: {formatCurrency(potentialWin)}</p>}
        </div>
        {status === "active" && onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 text-sm bg-[#cd6263] text-white px-3 py-1 rounded"
          >
            Cancelar
          </button>
        )}
      </div>
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          status === "active"
            ? "bg-[#596c95] text-white"
            : result === "win"
            ? "bg-green-600 text-white"
            : "bg-[#cd6263] text-white"
        }`}
      >
        {status.toUpperCase()}
      </span>
    </div>
  );
};

export default BetCard;
