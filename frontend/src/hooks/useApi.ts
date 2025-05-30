import { useState, useEffect, useCallback } from 'react';
import { 
  eventsAPI, 
  fightsAPI, 
  betsAPI, 
  walletAPI, 
  subscriptionsAPI,
  venuesAPI
} from '../config/api';
import type { APIResponse } from '../types';

// Hook genérico para APIs
function useAsyncOperation<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<APIResponse<T>>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await operation();
      setData(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, setData };
}

// Hook para eventos
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

  const createEvent = useCallback(
    (eventData: any) => execute(() => eventsAPI.create(eventData)),
    [execute]
  );

  const activateEvent = useCallback(
    (eventId: string) => execute(() => eventsAPI.activate(eventId)),
    [execute]
  );

  const startStream = useCallback(
    (eventId: string) => execute(() => eventsAPI.startStream(eventId)),
    [execute]
  );

  const stopStream = useCallback(
    (eventId: string) => execute(() => eventsAPI.stopStream(eventId)),
    [execute]
  );

  return {
    events: data?.events || [],
    total: data?.total || 0,
    loading,
    error,
    fetchEvents,
    createEvent,
    activateEvent,
    startStream,
    stopStream,
  };
}

// Hook para peleas
export function useFights() {
  const { data, loading, error, execute } = useAsyncOperation<any[]>();

  const fetchFights = useCallback(
    (params?: { eventId?: string; status?: string }) => 
      execute(() => fightsAPI.getAll(params)),
    [execute]
  );

  const createFight = useCallback(
    (fightData: any) => execute(() => fightsAPI.create(fightData)),
    [execute]
  );

  const updateFight = useCallback(
    (fightId: string, fightData: any) => 
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
    (fightId: string, result: 'red' | 'blue' | 'draw' | 'cancelled') => 
      execute(() => fightsAPI.recordResult(fightId, result)),
    [execute]
  );

  return {
    fights: data || [],
    loading,
    error,
    fetchFights,
    createFight,
    updateFight,
    openBetting,
    closeBetting,
    recordResult,
  };
}

// Hook para apuestas
export function useBets() {
  const { data, loading, error, execute } = useAsyncOperation<{
    bets: any[];
    total: number;
  }>();

  const fetchMyBets = useCallback(
    (params?: { status?: string; fightId?: string }) => 
      execute(() => betsAPI.getMyBets(params)),
    [execute]
  );

  const fetchAvailableBets = useCallback(
    (fightId: string) => execute(() => betsAPI.getAvailable(fightId)),
    [execute]
  );

  const createBet = useCallback(
    (betData: {
      fightId: string;
      side: 'red' | 'blue';
      amount: number;
      ratio?: number;
    }) => execute(() => betsAPI.create(betData)),
    [execute]
  );

  const acceptBet = useCallback(
    (betId: string) => execute(() => betsAPI.accept(betId)),
    [execute]
  );

  const cancelBet = useCallback(
    (betId: string) => execute(() => betsAPI.cancel(betId)),
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
  };
}

// Hook para billetera
export function useWallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletAPI.getWallet();
      setWallet(response.data.wallet);
      setTransactions(response.data.recentTransactions || []);
    } catch (err: any) {
      setError(err.message || 'Error loading wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      setLoading(true);
      const response = await walletAPI.getTransactions(params);
      setTransactions(response.data.transactions);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error loading transactions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deposit = useCallback(async (data: {
    amount: number;
    paymentMethod: 'card' | 'transfer';
    paymentData?: any;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletAPI.deposit(data);
      await fetchWallet(); // Refresh wallet data
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error processing deposit');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWallet]);

  const withdraw = useCallback(async (data: {
    amount: number;
    accountNumber: string;
    accountType?: string;
    bankName?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletAPI.withdraw(data);
      await fetchWallet(); // Refresh wallet data
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error processing withdrawal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWallet]);

  // Auto-fetch wallet on mount
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return {
    wallet,
    transactions,
    loading,
    error,
    fetchWallet,
    fetchTransactions,
    deposit,
    withdraw,
  };
}

// Hook para suscripciones
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
      plan: 'daily' | 'monthly';
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

// Hook para venues
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