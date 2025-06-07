import { useState, useEffect } from "react";
import { apiClient } from "../config/api";

interface Bet {
  id: string;
  amount: number;
  potentialWin: number;
  side: "red" | "blue";
  status: "active" | "pending" | "completed";
  result?: "win" | "loss" | "draw";
  // ... otras propiedades según tu implementación de BetCard
}

export const useBets = () => {
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [availableBets, setAvailableBets] = useState<Bet[]>([]);
  const [betHistory, setBetHistory] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setLoading(true);
        // Ejemplo de llamadas a API - ajustar según tu backend
        const [activeRes, availableRes, historyRes] = await Promise.all([
          apiClient.get("/bets/active"),
          apiClient.get("/bets/available"),
          apiClient.get("/bets/history"),
        ]);

        setActiveBets(activeRes.data);
        setAvailableBets(availableRes.data);
        setBetHistory(historyRes.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, []);

  const createBet = async (betData: {
    fightId: string;
    amount: number;
    side: "red" | "blue";
  }) => {
    try {
      const response = await apiClient.post("/bets", betData);
      setActiveBets([...activeBets, response.data]);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const cancelBet = async (betId: string) => {
    try {
      await apiClient.put(`/bets/${betId}/cancel`);
      setActiveBets(activeBets.filter((bet) => bet.id !== betId));
      return { success: true, message: "Apuesta cancelada" };
    } catch (err) {
      return {
        success: false,
        message: (err as Error).message || "Error al cancelar",
      };
    }
  };

  const fetchBets = async (params: { eventId?: string }) => {
    const res = await apiClient.get("/bets", { params });
    return res.data;
  };

  return {
    activeBets,
    availableBets,
    betHistory,
    loading,
    error,
    createBet,
    cancelBet,
    fetchBets,
  };
};
