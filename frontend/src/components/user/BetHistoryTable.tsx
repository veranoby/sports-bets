import { Bet } from "../../types"; // Asegurar que el tipo Bet esté definido
import { useState } from "react";
import { BetCard } from "./BetCard";
import { useBets } from "../../hooks/useApi";
import { RefreshCw } from "lucide-react";

interface BetHistoryTableProps {
  bets: Bet[];
  onFilter: (filters: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

const BetHistoryTable = () => {
  const { betHistory, loading, error } = useBets();

  return (
    <div className="bg-[#1a1f37] rounded-lg p-4 shadow-md">
      <h3 className="text-white font-bold mb-4">Historial de Apuestas</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="animate-spin text-[#596c95]" />
        </div>
      ) : error ? (
        <div className="bg-[#cd6263] text-white p-3 rounded-lg">
          Error al cargar historial
        </div>
      ) : (
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-[#596c95]">
              <th className="py-2 text-left">Evento</th>
              <th className="py-2 text-right">Monto</th>
              <th className="py-2 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {betHistory.map((bet) => (
              <tr key={bet.id} className="border-b border-[#2a325c]">
                <td className="py-3">{bet.eventName || "N/A"}</td>
                <td className="py-3 text-right">${bet.amount}</td>
                <td className="py-3 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      bet.status === "completed"
                        ? "bg-[#596c95]"
                        : "bg-[#cd6263]"
                    }`}
                  >
                    {bet.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BetHistoryTable;
