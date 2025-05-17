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

export type BetStatus = "pending" | "active" | "settled" | "cancelled";
export type BetResult = "win" | "loss" | "draw";
export type BetSide = "red" | "blue";

export interface BetCardProps {
  id: string;
  amount: number;
  potentialWin: number;
  side: BetSide;
  venueName: string;
  fightNumber: number;
  status: BetStatus;
  result?: BetResult;
  onViewDetails: (id: string) => void;
}

const BetCard: React.FC<BetCardProps> = ({
  id,
  amount,
  potentialWin,
  side,
  venueName,
  fightNumber,
  status,
  result,
  onViewDetails,
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
      case "active":
        return {
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
          icon: Clock,
          label: "Activa",
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
          icon: XCircle,
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
      className={`bg-white rounded-xl overflow-hidden shadow-sm border ${statusConfig.borderColor} mb-4 transition-all hover:shadow-md`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-900 truncate max-w-[180px]">
              {venueName}
            </h3>
            <p className="text-sm text-gray-500">Pelea #{fightNumber}</p>
          </div>
          <div
            className={`flex items-center ${statusConfig.bgColor} ${statusConfig.textColor} text-xs font-medium px-2.5 py-1 rounded-full`}
            aria-label={`Estado: ${statusConfig.label}`}
          >
            <StatusIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            {statusConfig.label}
          </div>
        </div>

        <div className="flex items-center mb-3">
          <div
            className={`w-4 h-4 rounded-full mr-2 flex-shrink-0 ${
              side === "red" ? "bg-red-500" : "bg-blue-500"
            }`}
            aria-hidden="true"
          ></div>
          <span className="text-sm font-medium">
            Lado {side === "red" ? "Rojo" : "Azul"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Monto apostado</p>
            <p className="font-bold text-gray-900">{formatCurrency(amount)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Ganancia potencial</p>
            <p
              className={`font-bold ${
                result === "win" ? "text-green-600" : "text-gray-900"
              }`}
            >
              {formatCurrency(potentialWin)}
            </p>
          </div>
        </div>

        <button
          onClick={() => onViewDetails(id)}
          className="w-full flex items-center justify-center text-sm font-medium py-2.5 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors !border-0"
          aria-label={`Ver detalles de apuesta en ${venueName}, pelea ${fightNumber}`}
          style={{
            backgroundColor: "rgb(243 244 246)",
            color: "rgb(31 41 55)",
          }}
        >
          Ver detalles
          <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
};

export default BetCard;
