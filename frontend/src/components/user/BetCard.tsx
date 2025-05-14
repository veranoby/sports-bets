"use client";

import type React from "react";
import { ChevronRight } from "lucide-react";

// Define all possible bet statuses and results
type BetStatus = "pending" | "active" | "settled" | "cancelled";
type BetResult = "win" | "loss" | "draw";
type BetSide = "red" | "blue";

// Component interface with complete typing
interface BetCardProps {
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
  // Function to get background color based on status and result
  const getStatusBg = (): string => {
    if (status === "settled" && result) {
      if (result === "win") return "bg-green-100 dark:bg-green-900/30";
      if (result === "loss") return "bg-red-100 dark:bg-red-900/30";
      return "bg-gray-100 dark:bg-gray-700/30"; // draw
    }
    if (status === "active") return "bg-amber-100 dark:bg-amber-900/30";
    if (status === "cancelled") return "bg-gray-100 dark:bg-gray-700/30";
    return "bg-blue-100 dark:bg-blue-900/30"; // pending
  };

  // Function to get appropriate status text
  const getStatusText = (): string => {
    if (status === "settled" && result) {
      if (result === "win") return "Ganada";
      if (result === "loss") return "Perdida";
      return "Empate";
    }
    if (status === "active") return "En progreso";
    if (status === "cancelled") return "Cancelada";
    return "Pendiente";
  };

  // Function to get status text color
  const getStatusColor = (): string => {
    if (status === "settled" && result) {
      if (result === "win") return "text-green-700 dark:text-green-400";
      if (result === "loss") return "text-red-700 dark:text-red-400";
      return "text-gray-700 dark:text-gray-400"; // draw
    }
    if (status === "active") return "text-amber-700 dark:text-amber-400";
    if (status === "cancelled") return "text-gray-700 dark:text-gray-400";
    return "text-blue-700 dark:text-blue-400"; // pending
  };

  // Determine side color for better visibility
  const sideColor =
    side === "red"
      ? "bg-red-600 dark:bg-red-500"
      : "bg-blue-600 dark:bg-blue-500";

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-sm border mb-3 ${getStatusBg()}`}
    >
      <div className="p-4">
        {/* Header with venue name and status */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              {venueName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pelea #{fightNumber}
            </p>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
          >
            {getStatusText()}
          </div>
        </div>

        {/* Bet side indicator */}
        <div className="flex items-center mb-3">
          <div
            className={`w-4 h-4 rounded-full ${sideColor} mr-2`}
            aria-label={`Lado ${side === "red" ? "Rojo" : "Azul"}`}
          ></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Lado {side === "red" ? "Rojo" : "Azul"}
          </span>
        </div>

        {/* Amount and potential win information */}
        <div className="flex justify-between text-sm mb-3">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Monto apostado</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              ${amount.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 dark:text-gray-400">
              Ganancia potencial
            </p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              ${potentialWin.toFixed(2)}
            </p>
          </div>
        </div>

        {/* View details button */}
        <button
          onClick={() => onViewDetails(id)}
          className="w-full py-2 flex justify-center items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
        >
          Ver detalles
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default BetCard;
