/**
 * BetCard Component
 * Muestra información y estado de una apuesta individual con diferentes estilos visuales
 * según su estado (pendiente, activa, liquidada, cancelada) y resultado (ganada, perdida, empate)
 */
"use client";

import React, { memo } from "react";
import type { Bet } from "../../types";
import StatusChip, { StatusType } from "../shared/StatusChip";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface BetCardProps {
  bet: Bet;
  eventName?: string; // Add this
  fightNumber?: number; // Add this
  onSelect?: (bet: Bet) => void;
  onCancel?: (betId: string) => void;
  onViewEvent?: (eventId: string) => void; // Renamed from onAccept
  mode?: string;
  className?: string;
}

const BetCard: React.FC<BetCardProps> = ({
  bet,
  eventName,
  fightNumber,
  onSelect,
  onCancel,
  onViewEvent, // Renamed from onAccept
  mode,
  className,
}) => {
  const navigate = useNavigate();

  // Formatear valores monetarios para consistencia
  const handleClick = () => {
    if (onSelect) {
      onSelect(bet);
    }
  };

  const statusMap: { [key: string]: StatusType } = {
    pending: "pending",
    active: "betting_open", // Using the new status
    matched: "matched",
    won: "success",
    lost: "failed",
    cancelled: "cancelled",
    settled: "completed", // Assuming settled means completed
  };

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer hover:shadow ${className}`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div>
          {eventName && fightNumber && (
            <p className="text-sm font-medium text-gray-400 mb-1">
              {eventName} - Pelea #{fightNumber}
            </p>
          )}
          <span className="font-semibold text-white">
            {bet.fighterNames?.red} vs {bet.fighterNames?.blue}
          </span>
        </div>
        <span className="text-xl font-bold text-green-500">${bet.amount}</span>
      </div>

      <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
        <StatusChip status={statusMap[bet.status] || "inactive"} size="sm" />
        <span>Resultado: {bet.result || "Pendiente"}</span>
      </div>

      {/* Action buttons */}
      {(onCancel || onViewEvent) && (
        <div className="mt-3 flex gap-2 justify-end">
          {onCancel &&
            bet.status === "pending" && ( // Only allow cancel if pending
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(bet.id);
                }}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Cancelar
              </button>
            )}
          {bet.eventId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onViewEvent) {
                  onViewEvent(bet.eventId);
                } else {
                  navigate(`/live-event/${bet.eventId}`);
                }
              }}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Ver Evento
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(BetCard);
