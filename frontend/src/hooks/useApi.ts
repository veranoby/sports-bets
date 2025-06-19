// frontend/src/hooks/useApi.ts - VERSIÓN CORREGIDA SIN DUPLICACIONES

import { useState, useCallback, useEffect } from "react";
import {
  authAPI,
  eventsAPI,
  fightsAPI,
  betsAPI,
  walletAPI,
  subscriptionsAPI,
  venuesAPI,
  usersAPI,
} from "../config/api";
import type {
  User,
  Event,
  Fight,
  Bet,
  Wallet,
  Transaction,
  Subscription,
  FightStatus,
  FightResult,
} from "../types";

// Hook base para operaciones asíncronas
function useAsyncOperation<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      setData(result.data);
      return result.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, setData };
}

// Hook para autenticación
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login({ email, password });
      const { user: userData, token } = response.data;

      localStorage.setItem("token", token);
      setUser(userData);
      return userData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al iniciar sesión";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (userData: { username: string; email: string; password: string }) => {
      try {
        setLoading(true);
        setError(null);
        const response = await authAPI.register(userData);
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Error al registrar usuario";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setError(null);
  }, []);

  const getCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authAPI.me();
      setUser(response.data);
      return response.data;
    } catch (err) {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    isAuthenticated: !!user,
  };
}

// Hook para eventos
export function useEvents() {
  const { data, loading, error, execute, setData } = useAsyncOperation<{
    events: Event[];
    total: number;
  }>();

  const fetchEvents = useCallback(
    (params?: {
      status?: string;
      venueId?: string;
      limit?: number;
      offset?: number;
    }) => execute(() => eventsAPI.getAll(params)),
    [execute]
  );

  const createEvent = useCallback(
    (eventData: Omit<Event, "id" | "createdAt" | "updatedAt">) =>
      execute(() => eventsAPI.create(eventData)),
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

  const fetchOperatorEvents = useCallback(
    () => execute(() => eventsAPI.getOperatorEvents()),
    [execute]
  );

  const getEventStats = useCallback(
    (eventId: string) => execute(() => eventsAPI.getEventStats(eventId)),
    [execute]
  );

  const updateEventStatus = useCallback(
    async (eventId: string, action: "activate" | "complete") => {
      const result = await execute(async () => {
        switch (action) {
          case "activate":
            return await eventsAPI.activate(eventId);
          case "complete":
            return await eventsAPI.complete(eventId);
          default:
            throw new Error("Invalid action");
        }
      });

      // Update local event in list
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          events: prev.events.map((event) =>
            event.id === eventId ? { ...event, ...result } : event
          ),
        };
      });

      return result;
    },
    [execute, setData]
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
    fetchOperatorEvents,
    getEventStats,
    updateEventStatus,
  };
}

// Hook para peleas
export function useFights() {
  const { data, loading, error, execute, setData } =
    useAsyncOperation<Fight[]>();

  const fetchFights = useCallback(
    (params?: { eventId?: string; status?: FightStatus }) =>
      execute(() => fightsAPI.getAll(params)),
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

  const updateFightStatus = useCallback(
    async (
      fightId: string,
      action: "open" | "close" | "record",
      result?: FightResult
    ) => {
      const res = await execute(async () => {
        switch (action) {
          case "open":
            return await fightsAPI.openBetting(fightId);
          case "close":
            return await fightsAPI.closeBetting(fightId);
          case "record":
            if (!result) throw new Error("Result is required for recording.");
            return await fightsAPI.recordResult(fightId, result);
          default:
            throw new Error("Invalid action");
        }
      });

      // Update local fight in list
      setData((prev) => {
        if (!prev) return null;
        return prev.map((fight) =>
          fight.id === fightId ? { ...fight, ...res } : fight
        );
      });
      return res;
    },
    [execute, setData]
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
    updateFightStatus,
  };
}

// Hook para apuestas
export function useBets() {
  const { data, loading, error, execute, setData } = useAsyncOperation<{
    bets: Bet[];
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
      side: "red" | "blue";
      amount: number;
      ratio?: number;
    }) => execute(() => betsAPI.create(betData)),
    [execute]
  );

  const acceptBet = useCallback(
    async (betId: string) => {
      const response = await execute(() => betsAPI.accept(betId));
      // Refresh bets after accepting
      await fetchMyBets();
      return response;
    },
    [execute, fetchMyBets]
  );

  const cancelBet = useCallback(
    async (betId: string) => {
      const response = await execute(() => betsAPI.cancel(betId));
      // Remove bet from local state
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

  const getPendingProposals = useCallback(
    () => execute(() => betsAPI.get("/pending-proposals")),
    [execute]
  );

  const acceptProposal = useCallback(
    (proposalId: string) =>
      execute(() => betsAPI.put(`/${proposalId}/accept-proposal`)),
    [execute]
  );

  const rejectProposal = useCallback(
    (proposalId: string) =>
      execute(() => betsAPI.put(`/${proposalId}/reject-proposal`)),
    [execute]
  );

  const proposePago = useCallback(
    (betId: string, pagoAmount: number) =>
      execute(() => betsAPI.post(`/${betId}/propose-pago`, { pagoAmount })),
    [execute]
  );

  const getCompatibleBets = useCallback(
    (params: {
      fightId: string;
      side: string;
      minAmount: number;
      maxAmount: number;
    }) =>
      execute(() => betsAPI.get("/available/" + params.fightId, { params })),
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
    getPendingProposals,
    acceptProposal,
    rejectProposal,
    proposePago,
    getCompatibleBets,
  };
}

// Hook para billetera - VERSIÓN ÚNICA CONSOLIDADA
export function useWallet() {
  const { data, loading, error, execute } = useAsyncOperation<{
    wallet: Wallet;
    recentTransactions: Transaction[];
  }>();

  const fetchWallet = useCallback(
    () => execute(() => walletAPI.getWallet()),
    [execute]
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

  const deposit = useCallback(
    (amount: number, paymentMethod: string, paymentData?: any) =>
      execute(() => walletAPI.deposit({ amount, paymentMethod, paymentData })),
    [execute]
  );

  const withdraw = useCallback(
    (
      amount: number,
      accountNumber: string,
      accountType?: string,
      bankName?: string
    ) =>
      execute(() =>
        walletAPI.withdraw({ amount, accountNumber, accountType, bankName })
      ),
    [execute]
  );

  const getBalance = useCallback(
    () => execute(() => walletAPI.getBalance()),
    [execute]
  );

  const getWalletStats = useCallback(
    () => execute(() => walletAPI.getStats()),
    [execute]
  );

  // Auto-fetch wallet on mount
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return {
    wallet: data?.wallet || null,
    recentTransactions: data?.recentTransactions || [],
    loading,
    error,
    fetchWallet,
    fetchTransactions,
    deposit,
    withdraw,
    getBalance,
    getWalletStats,
  };
}

// Hook para suscripciones
export function useSubscriptions() {
  const { data, loading, error, execute } = useAsyncOperation<any>();

  const fetchMySubscriptions = useCallback(
    () => execute(() => subscriptionsAPI.getMy()),
    [execute]
  );

  const fetchCurrentSubscription = useCallback(
    () => execute(() => subscriptionsAPI.getCurrent()),
    [execute]
  );

  const createSubscription = useCallback(
    (plan: string, autoRenew?: boolean, paymentData?: any) =>
      execute(() => subscriptionsAPI.create({ plan, autoRenew, paymentData })),
    [execute]
  );

  const cancelSubscription = useCallback(
    (id: string) => execute(() => subscriptionsAPI.cancel(id)),
    [execute]
  );

  const toggleAutoRenew = useCallback(
    (id: string, autoRenew: boolean) =>
      execute(() => subscriptionsAPI.toggleAutoRenew(id, autoRenew)),
    [execute]
  );

  const getSubscriptionPlans = useCallback(
    () => execute(() => subscriptionsAPI.getPlans()),
    [execute]
  );

  const checkSubscriptionAccess = useCallback(
    () => execute(() => subscriptionsAPI.checkAccess()),
    [execute]
  );

  const extendSubscription = useCallback(
    (id: string) => execute(() => subscriptionsAPI.extend(id)),
    [execute]
  );

  return {
    subscriptions: data || [],
    loading,
    error,
    fetchMySubscriptions,
    fetchCurrentSubscription,
    createSubscription,
    cancelSubscription,
    toggleAutoRenew,
    getSubscriptionPlans,
    checkSubscriptionAccess,
    extendSubscription,
  };
}

// Hook para venues
export function useVenues() {
  const { data, loading, error, execute } = useAsyncOperation<{
    venues: any[];
    total: number;
  }>();

  const fetchVenues = useCallback(
    (params?: any) => execute(() => venuesAPI.getAll(params)),
    [execute]
  );

  const createVenue = useCallback(
    (venueData: any) => execute(() => venuesAPI.create(venueData)),
    [execute]
  );

  const updateVenue = useCallback(
    (venueId: string, venueData: any) =>
      execute(() => venuesAPI.update(venueId, venueData)),
    [execute]
  );

  const updateVenueStatus = useCallback(
    (venueId: string, status: string, reason?: string) =>
      execute(() =>
        venuesAPI.updateStatus(
          venueId,
          status as "approved" | "rejected",
          reason
        )
      ),
    [execute]
  );

  const getVenueEvents = useCallback(
    (venueId: string) => execute(() => venuesAPI.getVenueEvents(venueId)),
    [execute]
  );

  const deleteVenue = useCallback(
    (venueId: string) => execute(() => venuesAPI.delete(venueId)),
    [execute]
  );

  const fetchMyVenues = useCallback(
    () => execute(() => (venuesAPI as any).getMyVenues()),
    [execute]
  );

  return {
    venues: data?.venues || [],
    total: data?.total || 0,
    loading,
    error,
    fetchVenues,
    createVenue,
    updateVenue,
    updateVenueStatus,
    getVenueEvents,
    deleteVenue,
    fetchMyVenues,
  };
}

// Hook para usuarios
export function useUsers() {
  const { data, loading, error, execute } = useAsyncOperation<{
    users: User[];
    total: number;
  }>();

  const fetchUsers = useCallback(
    (params?: any) => execute(() => usersAPI.getAll(params)),
    [execute]
  );

  const fetchUserById = useCallback(
    (userId: string) => execute(() => usersAPI.getById(userId)),
    [execute]
  );

  const createUser = useCallback(
    (userData: any) => execute(() => usersAPI.create(userData)),
    [execute]
  );

  const updateUserStatus = useCallback(
    (userId: string, isActive: boolean) =>
      execute(() => usersAPI.updateStatus(userId, isActive)),
    [execute]
  );

  const updateUserRole = useCallback(
    (userId: string, role: string) =>
      execute(() => usersAPI.updateRole(userId, role)),
    [execute]
  );

  const updateUserProfile = useCallback(
    (userId: string, profileData: Partial<User["profileInfo"]>) =>
      execute(() => usersAPI.updateProfile(userId, profileData)),
    [execute]
  );

  const deleteUser = useCallback(
    (userId: string) => execute(() => usersAPI.delete(userId)),
    [execute]
  );

  return {
    users: data?.users || [],
    total: data?.total || 0,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    createUser,
    updateUserStatus,
    updateUserRole,
    updateUserProfile,
    deleteUser,
  };
}

// Exportar hook principal
export const useApi = () => {
  return {
    useAuth,
    useEvents,
    useFights,
    useBets,
    useWallet,
    useSubscriptions,
    useVenues,
    useUsers,
  };
};
