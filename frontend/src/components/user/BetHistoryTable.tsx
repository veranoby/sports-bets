import React from "react";
import type { Bet } from "../../types"; // 1. Import type correcto
import { useBets } from "../../hooks/useApi"; // 4. Import desde useApi
import LoadingSpinner from "../shared/LoadingSpinner";

// 2. Interface local mantenida
interface BetHistoryTableProps {
  bets: Bet[]; // 3. Array tipado como Bet[]
  onBetClick?: (bet: Bet) => void;
}

const BetHistoryTable = ({ bets, onBetClick }: BetHistoryTableProps) => {
  const { loading } = useBets();

  if (loading) return <LoadingSpinner size="sm" />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th>Evento</th>
            <th>Apuesta</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((bet) => (
            <tr
              key={bet.id}
              onClick={() => onBetClick?.(bet)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td>{bet.eventName}</td>
              <td>{bet.side === "red" ? "Rojo" : "Azul"}</td>
              <td>${bet.amount}</td>
              <td>{bet.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 5. Export default correcto
export default BetHistoryTable;
