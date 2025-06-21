// frontend/src/hooks/useApi.ts - CORRECCIÓN URLS DEFINITIVA
// ====================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import {
  eventsAPI,
  fightsAPI,
  betsAPI,
  walletAPI,
  subscriptionsAPI,
  venuesAPI,
  apiClient, // ✅ IMPORTAR apiClient para métodos PAGO/DOY
} from "../config/api";
import type {
  APIResponse,
  Fight,
  FightStatus,
  FightResult,
  Bet,
  Wallet,
  Transaction,
} from "../types";
import { useAuth } from "../contexts/AuthContext";

// Hook genérico para APIs - MANTENER IGUAL
function useAsyncOperation<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (operation: () => Promise<APIResponse<T>>) => {
      try {
        setLoading(true);
        setError(null);
        const response = await operation();
        setData(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage = err.message || "An error occurred";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, execute, setData };
}

// Hook para eventos - MANTENER IGUAL
export function useEvents() {
  const { data, loading, error, execute } = useAsyncOperation<{
    events: any[];
    total: number;
    limit: number;
    offset: number;
  }>();

  const fetchEvents = useCallback(
    (params?: { venueId?: string; status?: string }) =>
      execute(() => eventsAPI.getAll(params)),
    [execute]
  );

  const fetchEventById = useCallback(
    (id: string) => execute(() => eventsAPI.getById(id)),
    [execute]
  );

  const createEvent = useCallback(
    (eventData: any) => execute(() => eventsAPI.create(eventData)),
    [execute]
  );

  const updateEvent = useCallback(
    (id: string, eventData: any) =>
      execute(() => eventsAPI.update(id, eventData)),
    [execute]
  );

  const activateEvent = useCallback(
    (id: string) => execute(() => eventsAPI.activate(id)),
    [execute]
  );

  return {
    events: data?.events || [],
    total: data?.total || 0,
    loading,
    error,
    fetchEvents,
    fetchEventById,
    createEvent,
    updateEvent,
    activateEvent,
  };
}

// Hook para peleas - MANTENER IGUAL
export function useFights() {
  const { data, loading, error, execute, setData } =
    useAsyncOperation<Fight[]>();

  const fetchFights = useCallback(
    (params?: { eventId?: string; status?: FightStatus }) =>
      execute(() => fightsAPI.getAll(params)),
    [execute]
  );

  const fetchFightById = useCallback(
    (id: string) => execute(() => fightsAPI.getById(id)),
    [execute]
  );

  const createFight = useCallback(
    (fightData: Omit<Fight, "id">) =>
      execute(() => fightsAPI.create(fightData)),
    [execute]
  );

  const updateFight = useCallback(
    (fightId: string, fightData: Partial<Fight>) =>
      execute(() => fightsAPI.update(fightId, fightData)),
    [execute]
  );

  const openBetting = useCallback(
    (fightId: string) => execute(() => fightsAPI.openBetting(fightId)),
    [execute]
  );

  const closeBetting = useCallback(
    (fightId: string) => execute(() => fightsAPI.closeBetting(fightId)),
    [execute]
  );

  const recordResult = useCallback(
    (fightId: string, result: FightResult) =>
      execute(() => fightsAPI.recordResult(fightId, result)),
    [execute]
  );

  return {
    fights: data || [],
    loading,
    error,
    fetchFights,
    fetchFightById,
    createFight,
    updateFight,
    openBetting,
    closeBetting,
    recordResult,
  };
}

// Hook para apuestas - CORREGIDO CON URLs FIJAS
export function useBets() {
  const { data, loading, error, execute, setData } = useAsyncOperation<{
    bets: Bet[];
    total: number;
  }>();

  const fetchMyBets = useCallback(
    (params?: {
      status?: string;
      fightId?: string;
      limit?: number;
      offset?: number;
    }) => execute(() => betsAPI.getMyBets(params)),
    [execute]
  );

  const fetchAvailableBets = useCallback(
    (fightId: string) => execute(() => betsAPI.getAvailable(fightId)),
    [execute]
  );

  const createBet = useCallback(
    (betData: {
      fightId: string;
      side: "red" | "blue";
      amount: number;
      ratio?: number;
      isOffer?: boolean;
    }) => execute(() => betsAPI.create(betData)),
    [execute]
  );

  const acceptBet = useCallback(
    async (betId: string) => {
      const response = await execute(() => betsAPI.accept(betId));
      await fetchMyBets();
      return response;
    },
    [execute, fetchMyBets]
  );

  const cancelBet = useCallback(
    async (betId: string) => {
      const response = await execute(() => betsAPI.cancel(betId));
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          bets: prev.bets.filter((bet) => bet.id !== betId),
        };
      });
      return response;
    },
    [execute, setData]
  );

  const getBetsStats = useCallback(
    () => execute(() => betsAPI.getStats()),
    [execute]
  );

  // 🔧 MÉTODOS PAGO/DOY CORREGIDOS - SIN DOBLE /api
  const proposePago = useCallback(
    (betId: string, pagoAmount: number) =>
      execute(() =>
        apiClient.post(`/bets/${betId}/propose-pago`, { pagoAmount })
      ),
    [execute]
  );

  const acceptProposal = useCallback(
    (betId: string) =>
      execute(() => apiClient.put(`/bets/${betId}/accept-proposal`)),
    [execute]
  );

  const rejectProposal = useCallback(
    (betId: string) =>
      execute(() => apiClient.put(`/bets/${betId}/reject-proposal`)),
    [execute]
  );

  const getPendingProposals = useCallback(
    () => execute(() => apiClient.get("/bets/pending-proposals")),
    [execute]
  );

  const getCompatibleBets = useCallback(
    (params: {
      fightId: string;
      side: "red" | "blue";
      minAmount: number;
      maxAmount: number;
    }) =>
      execute(() =>
        apiClient.get(`/bets/available/${params.fightId}`, { params })
      ),
    [execute]
  );

  return {
    bets: data?.bets || [],
    total: data?.total || 0,
    loading,
    error,
    fetchMyBets,
    fetchAvailableBets,
    createBet,
    acceptBet,
    cancelBet,
    getBetsStats,
    // Métodos PAGO/DOY corregidos
    proposePago,
    acceptProposal,
    rejectProposal,
    getPendingProposals,
    getCompatibleBets,
  };
}

// Hook para billetera - IMPLEMENTACIÓN ÚNICA Y OPTIMIZADA
export function useWallet() {
  const { data, loading, error, execute, setData } = useAsyncOperation<{
    wallet: Wallet;
    recentTransactions: Transaction[];
  }>();

  // Cache para evitar llamadas duplicadas
  const lastFetchRef = useRef<number>(0);
  const CACHE_DURATION = 5000; // 5 segundos

  const fetchWallet = useCallback(
    async (forceRefresh = false) => {
      // Usar cache si no se fuerza refresh
      if (!forceRefresh && Date.now() - lastFetchRef.current < CACHE_DURATION) {
        return data;
      }
      lastFetchRef.current = Date.now();
      return execute(() => walletAPI.getWallet());
    },
    [execute, data]
  );

  const fetchTransactions = useCallback(
    (params?: {
      type?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }) => execute(() => walletAPI.getTransactions(params)),
    [execute]
  );

  const processDeposit = useCallback(
    async (depositData: {
      amount: number;
      paymentMethod: "card" | "transfer";
      paymentData?: any;
    }) => {
      const response = await execute(() => walletAPI.deposit(depositData));
      await fetchWallet(true); // Force refresh
      return response;
    },
    [execute, fetchWallet]
  );

  const processWithdraw = useCallback(
    async (withdrawData: {
      amount: number;
      accountNumber: string;
      accountType?: string;
      bankName?: string;
    }) => {
      const response = await execute(() => walletAPI.withdraw(withdrawData));
      await fetchWallet(true); // Force refresh
      return response;
    },
    [execute, fetchWallet]
  );

  // Fetch inicial con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWallet();
    }, 100);

    return () => clearTimeout(timer);
  }, []); // Solo en mount

  return {
    wallet: data?.wallet || null,
    transactions: data?.recentTransactions || [],
    loading,
    error,
    fetchWallet,
    fetchTransactions,
    processDeposit,
    processWithdraw,
  };
}

// Hook para suscripciones - MANTENER IGUAL
export function useSubscriptions() {
  const { data, loading, error, execute } = useAsyncOperation<any>();

  const fetchPlans = useCallback(
    () => execute(() => subscriptionsAPI.getPlans()),
    [execute]
  );

  const fetchCurrent = useCallback(
    () => execute(() => subscriptionsAPI.getCurrent()),
    [execute]
  );

  const createSubscription = useCallback(
    (data: {
      plan: "daily" | "monthly";
      autoRenew?: boolean;
      paymentData?: any;
    }) => execute(() => subscriptionsAPI.create(data)),
    [execute]
  );

  const cancelSubscription = useCallback(
    (id: string) => execute(() => subscriptionsAPI.cancel(id)),
    [execute]
  );

  const checkAccess = useCallback(
    () => execute(() => subscriptionsAPI.checkAccess()),
    [execute]
  );

  return {
    data,
    loading,
    error,
    fetchPlans,
    fetchCurrent,
    createSubscription,
    cancelSubscription,
    checkAccess,
  };
}

// Hook para venues - MANTENER IGUAL
export function useVenues() {
  const { data, loading, error, execute } = useAsyncOperation<{
    venues: any[];
    total: number;
  }>();

  const fetchVenues = useCallback(
    () => execute(() => venuesAPI.getAll()),
    [execute]
  );

  return {
    venues: data?.venues || [],
    total: data?.total || 0,
    loading,
    error,
    fetchVenues,
  };
}
