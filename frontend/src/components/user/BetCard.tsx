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
  onSelect: (bet: Bet) => void;
  className?: string;
}

const BetCard: React.FC<BetCardProps> = ({ bet, onSelect, className }) => {
  // Configuración de colores según el estado y resultado

  // Formatear valores monetarios para consistencia
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

export default memo(BetCard, (prevProps, nextProps) => {
  return (
    prevProps.bet.id === nextProps.bet.id &&
    prevProps.bet.status === nextProps.bet.status &&
    prevProps.bet.result === nextProps.bet.result &&
    prevProps.className === nextProps.className &&
    prevProps.onSelect.toString() === nextProps.onSelect.toString()
  );
});
