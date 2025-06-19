// frontend/src/hooks/useApi.ts - VERSIÓN CORREGIDA COMPLETA
// MANTIENE TODA LA FUNCIONALIDAD EXISTENTE + MEJORAS PAGO/DOY

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
  apiClient,
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

// Hook para autenticación - MANTENER COMPLETO
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (login: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login({ login, password });
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
          err.response?.data?.message || "Error al registrarse";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  const getCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authAPI.me();
      setUser(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al obtener usuario";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (profileData: Partial<User["profileInfo"]>) => {
      try {
        setLoading(true);
        const response = await authAPI.updateProfile({
          profileInfo: profileData,
        });
        setUser(response.data);
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Error al actualizar perfil";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        setLoading(true);
        await authAPI.changePassword({ currentPassword, newPassword });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Error al cambiar contraseña";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      await authAPI.forgotPassword({ email });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al solicitar recuperación";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      try {
        setLoading(true);
        await authAPI.resetPassword({ token, newPassword });
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Error al restablecer contraseña";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
  };
}

// Hook para eventos - MANTENER COMPLETO
export function useEvents() {
  const { data, loading, error, execute, setData } = useAsyncOperation<{
    events: Event[];
    total: number;
  }>();

  const fetchEvents = useCallback(
    (params?: {
      venueId?: string;
      status?: string;
      upcoming?: boolean;
      limit?: number;
      offset?: number;
    }) => execute(() => eventsAPI.getAll(params)),
    [execute]
  );

  const fetchEventById = useCallback(
    (eventId: string) => execute(() => eventsAPI.getById(eventId)),
    [execute]
  );

  const createEvent = useCallback(
    (eventData: {
      name: string;
      venueId: string;
      scheduledDate: string;
      operatorId?: string;
    }) => execute(() => eventsAPI.create(eventData)),
    [execute]
  );

  const updateEvent = useCallback(
    (eventId: string, eventData: any) =>
      execute(() => eventsAPI.update(eventId, eventData)),
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

  const getStreamStatus = useCallback(
    (eventId: string) => execute(() => eventsAPI.getStreamStatus(eventId)),
    [execute]
  );

  const completeEvent = useCallback(
    (eventId: string) => execute(() => eventsAPI.complete(eventId)),
    [execute]
  );

  const getEventStats = useCallback(
    (eventId: string) => execute(() => eventsAPI.getStats(eventId)),
    [execute]
  );

  const deleteEvent = useCallback(
    (eventId: string) => execute(() => eventsAPI.delete(eventId)),
    [execute]
  );

  const fetchOperatorEvents = useCallback(
    (operatorId: string) => execute(() => eventsAPI.getAll({ operatorId })),
    [execute]
  );

  const updateEventStatus = useCallback(
    async (
      eventId: string,
      action: "activate" | "complete" | "start-stream" | "stop-stream"
    ) => {
      const result = await execute(async () => {
        switch (action) {
          case "activate":
            return await eventsAPI.activate(eventId);
          case "complete":
            return await eventsAPI.complete(eventId);
          case "start-stream":
            return await eventsAPI.startStream(eventId);
          case "stop-stream":
            return await eventsAPI.stopStream(eventId);
          default:
            throw new Error("Invalid action");
        }
      });

      // Update local events list
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
    fetchEventById,
    createEvent,
    updateEvent,
    activateEvent,
    startStream,
    stopStream,
    getStreamStatus,
    completeEvent,
    getEventStats,
    deleteEvent,
    fetchOperatorEvents,
    updateEventStatus,
  };
}

// Hook para peleas - MANTENER COMPLETO
export function useFights() {
  const { data, loading, error, execute, setData } =
    useAsyncOperation<Fight[]>();

  const fetchFights = useCallback(
    (params?: { eventId?: string; status?: FightStatus }) =>
      execute(() => fightsAPI.getAll(params)),
    [execute]
  );

  const fetchFightById = useCallback(
    (fightId: string) => execute(() => fightsAPI.getById(fightId)),
    [execute]
  );

  const createFight = useCallback(
    (fightData: {
      eventId: string;
      number: number;
      redCorner: string;
      blueCorner: string;
      weight: number;
      notes?: string;
      initialOdds?: { red: number; blue: number };
    }) => execute(() => fightsAPI.create(fightData)),
    [execute]
  );

  const updateFight = useCallback(
    (
      fightId: string,
      fightData: {
        redCorner?: string;
        blueCorner?: string;
        weight?: number;
        notes?: string;
        status?: string;
      }
    ) => execute(() => fightsAPI.update(fightId, fightData)),
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
    (fightId: string, result: "red" | "blue" | "draw" | "cancelled") =>
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
    fetchFightById,
    createFight,
    updateFight,
    openBetting,
    closeBetting,
    recordResult,
    updateFightStatus,
  };
}

// Hook para apuestas - VERSION COMPLETA CON PAGO/DOY
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

  // MÉTODOS PARA SISTEMA PAGO/DOY
  const proposePago = useCallback(
    (betId: string, pagoAmount: number) =>
      execute(() =>
        apiClient.post(`/api/bets/${betId}/propose-pago`, { pagoAmount })
      ),
    [execute]
  );

  const acceptProposal = useCallback(
    (betId: string) =>
      execute(() => apiClient.put(`/api/bets/${betId}/accept-proposal`)),
    [execute]
  );

  const rejectProposal = useCallback(
    (betId: string) =>
      execute(() => apiClient.put(`/api/bets/${betId}/reject-proposal`)),
    [execute]
  );

  const getPendingProposals = useCallback(
    () => execute(() => apiClient.get("/api/bets/pending-proposals")),
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
        apiClient.get(`/api/bets/available/${params.fightId}`, { params })
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
    // Métodos PAGO/DOY
    proposePago,
    acceptProposal,
    rejectProposal,
    getPendingProposals,
    getCompatibleBets,
  };
}

// Hook para billetera - MANTENER COMPLETO
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
      dateFrom?: string;
      dateTo?: string;
    }) => execute(() => walletAPI.getTransactions(params)),
    [execute]
  );

  const deposit = useCallback(
    (amount: number, paymentMethod: "card" | "transfer", paymentData?: any) =>
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

// Hook para suscripciones - MANTENER COMPLETO
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

// Hook para venues - MANTENER COMPLETO
export function useVenues() {
  const { data, loading, error, execute } = useAsyncOperation<{
    venues: any[];
    total: number;
  }>();

  const fetchVenues = useCallback(
    (params?: { status?: string; limit?: number; offset?: number }) =>
      execute(() => venuesAPI.getAll(params)),
    [execute]
  );

  const fetchVenueById = useCallback(
    (venueId: string) => execute(() => venuesAPI.getById(venueId)),
    [execute]
  );

  const createVenue = useCallback(
    (venueData: {
      name: string;
      location: string;
      description?: string;
      contactInfo?: any;
      ownerId?: string;
    }) => execute(() => venuesAPI.create(venueData)),
    [execute]
  );

  const updateVenue = useCallback(
    (
      venueId: string,
      venueData: {
        name?: string;
        location?: string;
        description?: string;
        contactInfo?: any;
        status?: string;
      }
    ) => execute(() => venuesAPI.update(venueId, venueData)),
    [execute]
  );

  const updateVenueStatus = useCallback(
    (venueId: string, status: string, reason?: string) =>
      execute(() => venuesAPI.updateStatus(venueId, status, reason)),
    [execute]
  );

  const deleteVenue = useCallback(
    (venueId: string) => execute(() => venuesAPI.delete(venueId)),
    [execute]
  );

  const fetchMyVenues = useCallback(
    () => execute(() => venuesAPI.getMyVenues()),
    [execute]
  );

  return {
    venues: data?.venues || [],
    total: data?.total || 0,
    loading,
    error,
    fetchVenues,
    fetchVenueById,
    createVenue,
    updateVenue,
    updateVenueStatus,
    deleteVenue,
    fetchMyVenues,
  };
}

// Hook para usuarios - MANTENER COMPLETO
export function useUsers() {
  const { data, loading, error, execute } = useAsyncOperation<{
    users: User[];
    total: number;
  }>();

  const fetchUsers = useCallback(
    (params?: {
      role?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }) => execute(() => usersAPI.getAll(params)),
    [execute]
  );

  const fetchUserById = useCallback(
    (userId: string) => execute(() => usersAPI.getById(userId)),
    [execute]
  );

  const updateUserStatus = useCallback(
    (userId: string, isActive: boolean, reason?: string) =>
      execute(() => usersAPI.updateStatus(userId, isActive, reason)),
    [execute]
  );

  const updateUserRole = useCallback(
    (userId: string, role: string, reason?: string) =>
      execute(() => usersAPI.updateRole(userId, role, reason)),
    [execute]
  );

  const getAvailableOperators = useCallback(
    () => execute(() => usersAPI.getAvailableOperators()),
    [execute]
  );

  const updateUserProfile = useCallback(
    (profileData: {
      profileInfo?: {
        fullName?: string;
        phoneNumber?: string;
        address?: string;
        identificationNumber?: string;
      };
    }) => execute(() => usersAPI.updateProfile(profileData)),
    [execute]
  );

  return {
    users: data?.users || [],
    total: data?.total || 0,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    updateUserStatus,
    updateUserRole,
    getAvailableOperators,
    updateUserProfile,
  };
}

//"TERMINANDO REFACTORING  del sistema por nueva logica de apuestas - ACTUALIZACION 1"
