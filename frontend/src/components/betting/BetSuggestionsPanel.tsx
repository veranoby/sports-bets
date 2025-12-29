// frontend/src/components/betting/BetSuggestionsPanel.tsx

import React, { useState, useEffect } from "react";
import { useBets } from "../../hooks/useApi";
import { Bet, BetData } from "../../types";

interface BetSuggestionsPanelProps {
  fightId: string;
  side: "red" | "blue";
  amount: number;
  onSuggestionSelect: (bet: BetData) => void;
}

const BetSuggestionsPanel: React.FC<BetSuggestionsPanelProps> = ({
  fightId,
  side,
  amount,
  onSuggestionSelect,
}) => {
  const { getCompatibleBets } = useBets();
  const [suggestions, setSuggestions] = useState<BetData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (amount && Number(amount) > 0) {
      fetchSuggestions();
    }
  }, [amount, side, fightId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Calculate range (±20% of entered amount)
      const range = Number(amount) * 0.2;
      const minAmount = Number(amount) - range;
      const maxAmount = Number(amount) + range;

      const response = await getCompatibleBets({
        fightId,
        side: side === "red" ? "blue" : "red", // Opposite side
        minAmount,
        maxAmount,
      });

      if (response.success && Array.isArray(response.data?.bets)) {
        setSuggestions(response.data.bets);
      }
    } catch (error) {
      console.error("Error fetching bet suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBet = (bet: BetData) => {
    onSuggestionSelect(bet);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="text-gray-700 font-medium mb-3 flex items-center gap-2">
        <span className="bg-blue-100 p-1 rounded">🔍</span>
        Apuestas Similares Disponibles
      </h3>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-600">
            Buscando apuestas compatibles...
          </p>
        </div>
      )}

      {suggestions.length === 0 && !loading && (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay apuestas similares disponibles</p>
        </div>
      )}

      {suggestions.length > 0 && !loading && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {suggestions.map((bet) => (
            <div
              key={bet.id}
              className="flex flex-wrap items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-1 min-w-[150px]">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${bet.side === "red" ? "bg-red-500" : "bg-blue-500"}`}
                  ></div>
                  <span className="font-medium text-gray-900">
                    ${bet.amount} · {bet.side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                  </span>
                  {bet.status === "pending" && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      Pendiente
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  de {bet.userId?.substring(0, 8)}...
                </div>
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => handleAcceptBet(bet)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors flex items-center gap-1"
                >
                  <span>✅</span>
                  Aceptar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BetSuggestionsPanel;
