/**
 * BetCard Component
 * Muestra información y estado de una apuesta individual con diferentes estilos visuales
 * según su estado (pendiente, activa, liquidada, cancelada) y resultado (ganada, perdida, empate)
 */
"use client";

import React, { memo } from "react";
import type { Bet } from "../../types";
import StatusChip from "../shared/StatusChip";
export interface BetCardProps {
  bet: Bet;
  onSelect?: (bet: Bet) => void;
  onCancel?: (betId: string) => void;
  onAccept?: (betId: string) => void;
  mode?: string;
  className?: string;
}

const BetCard: React.FC<BetCardProps> = ({
  bet,
  onSelect,
  onCancel,
  onAccept,
  mode,
  className,
}) => {
  // Configuración de colores según el estado y resultado

  // Formatear valores monetarios para consistencia
  const handleClick = () => {
    if (onSelect) {
      onSelect(bet);
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer hover:shadow ${className}`}
      onClick={handleClick}
    >
      <div className="flex justify-between">
        <span>
          {bet.fighterNames?.red} vs {bet.fighterNames?.blue}
        </span>
        <span>
          ${bet.amount} ({(bet.odds || 1).toFixed(2)})
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

      {/* Action buttons */}
      {(onCancel || onAccept) && (
        <div className="mt-3 flex gap-2">
          {onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(bet.id);
              }}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Cancelar
            </button>
          )}
          {onAccept && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(bet.id);
              }}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Aceptar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(BetCard);
