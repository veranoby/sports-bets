// frontend/src/hooks/useApi.ts - IMPLEMENTACIÓN DEFINITIVA V4
// ============================================================
// CORREGIDO: Estructura parsing wallet response.data.wallet
// ELIMINADO: Implementaciones duplicadas/fragmentadas
// SOLUCIONADO: Balance $0 con estructura backend real

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient, betsAPI } from "../config/api";

// ====================== TYPES ======================
interface WalletData {
  balance: number;
  frozenAmount: number;
  availableBalance?: number;
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
}

interface BetData {
  id: string;
  fightId: string;
  side: "red" | "blue";
  amount: number;
  status: string;
  createdAt: string;
}

interface EventData {
  id: string;
  name: string;
  status: string;
  scheduledDate: string;
  venue?: any;
  operator?: any;
}

interface FightData {
  id: string;
  eventId: string;
  number: number;
  redCorner: string;
  blueCorner: string;
  status: string;
  result?: string;
}

interface VenueData {
  id: string;
  name: string;
  location: string;
  status: string;
  description?: string;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  profileInfo?: any;
}

interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

// ====================== BASE HOOK ======================
function useAsyncOperation<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async (asyncFunction: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();

      if (mountedRef.current) {
        setData(result.data);
      }
      return result;
    } catch (err: any) {
      if (mountedRef.current) {
        setError(
          err.response?.data?.message || err.message || "An error occurred"
        );
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setLoading,
    setError,
  };
}

// ====================== WALLET HOOK - CORREGIDO ======================
export function useWallet() {
  const [wallet, setWallet] = useState<WalletData>({
    balance: 0,
    frozenAmount: 0,
  });
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching wallet from /wallet endpoint...");
      const response = await apiClient.get("/wallet");

      console.log("📦 Raw wallet response:", response.data);

      // ✅ ESTRUCTURA REAL BACKEND: response.data.wallet (NO response.data.data.wallet)
      const walletData = response.data?.wallet;
      const transactionsData = response.data?.recentTransactions || [];

      console.log("💰 Parsed wallet data:", walletData);

      if (mountedRef.current && walletData) {
        const newWallet = {
          balance: Number(walletData.balance || 0),
          frozenAmount: Number(walletData.frozenAmount || 0),
          availableBalance: Number(
            walletData.availableBalance || walletData.balance || 0
          ),
        };

        console.log("✅ Setting wallet state:", newWallet);
        setWallet(newWallet);
        setTransactions(transactionsData);
      }

      return response.data;
    } catch (err: any) {
      console.error("❌ Error fetching wallet:", err);
      if (mountedRef.current) {
        setError(
          err.response?.data?.message || err.message || "Error loading wallet"
        );
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const fetchTransactions = useCallback(
    async (params?: {
      type?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }) => {
      try {
        setLoading(true);
        const response = await apiClient.get("/wallet/transactions", {
          params,
        });

        // ✅ ESTRUCTURA: response.data.data.transactions (para este endpoint específico)
        const transactionsData = response.data?.data?.transactions || [];
        if (mountedRef.current) {
          setTransactions(transactionsData);
        }

        return response.data;
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err.response?.data?.message || "Error loading transactions");
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const deposit = useCallback(
    async (amount: number, paymentMethod: string, paymentData?: any) => {
      try {
        setLoading(true);
        const response = await apiClient.post("/wallet/deposit", {
          amount,
          paymentMethod,
          paymentData,
        });

        await fetchWallet();
        return response.data;
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err.response?.data?.message || "Error processing deposit");
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchWallet]
  );

  const withdraw = useCallback(
    async (
      amount: number,
      accountNumber: string,
      accountType?: string,
      bankName?: string
    ) => {
      try {
        setLoading(true);
        const response = await apiClient.post("/wallet/withdraw", {
          amount,
          accountNumber,
          accountType,
          bankName,
        });

        await fetchWallet();
        return response.data;
      } catch (err: any) {
        if (mountedRef.current) {
          setError(
            err.response?.data?.message || "Error processing withdrawal"
          );
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchWallet]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchWallet();

    return () => {
      mountedRef.current = false;
    };
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

// ====================== BETS HOOK ======================
export function useBets() {
  const { data, loading, error, execute, setData, setLoading, setError } =
    useAsyncOperation<{
      bets: BetData[];
      total: number;
    }>();

  const fetchMyBets = useCallback(
    async (params?: {
      status?: string;
      fightId?: string;
      limit?: number;
      offset?: number;
    }) => {
      return execute(() => apiClient.get("/bets", { params }));
    },
    [execute]
  );

  const fetchAvailableBets = useCallback(
    (fightId: string) => {
      return execute(() => apiClient.get(`/bets/available/${fightId}`));
    },
    [execute]
  );

  const createBet = useCallback(
    (betData: {
      fightId: string;
      side: "red" | "blue";
      amount: number;
      ratio?: number;
      isOffer?: boolean;
    }) => {
      return execute(() => apiClient.post("/bets", betData));
    },
    [execute]
  );

  const acceptBet = useCallback(
    async (betId: string) => {
      const response = await execute(() =>
        apiClient.post(`/bets/${betId}/accept`)
      );
      await fetchMyBets();
      return response;
    },
    [execute, fetchMyBets]
  );

  const cancelBet = useCallback(
    async (betId: string) => {
      const response = await execute(() =>
        apiClient.put(`/bets/${betId}/cancel`)
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              bets: prev.bets.filter((bet) => bet.id !== betId),
            }
          : null
      );
      return response;
    },
    [execute, setData]
  );

  const getBetsStats = useCallback(() => {
    return execute(() => apiClient.get("/bets/stats"));
  }, [execute]);

  const getPendingProposals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await betsAPI.getPendingProposals();
      return response.data?.proposals || [];
    } catch (err) {
      setError((err as Error).message || "Error loading proposals");
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

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
  };
}

// ====================== EVENTS HOOK ======================
export function useEvents() {
  const { data, loading, error, execute } = useAsyncOperation<{
    events: EventData[];
    total: number;
  }>();

  const fetchEvents = useCallback(
    async (params?: {
      venueId?: string;
      status?: string;
      upcoming?: boolean;
      limit?: number;
      offset?: number;
    }) => {
      return execute(() => apiClient.get("/events", { params }));
    },
    [execute]
  );

  const fetchEventById = useCallback(
    (eventId: string) => {
      return execute(() => apiClient.get(`/events/${eventId}`));
    },
    [execute]
  );

  const createEvent = useCallback(
    (eventData: {
      name: string;
      description?: string;
      scheduledDate: string;
      venueId: string;
    }) => {
      return execute(() => apiClient.post("/events", eventData));
    },
    [execute]
  );

  const updateEvent = useCallback(
    (eventId: string, eventData: any) => {
      return execute(() => apiClient.put(`/events/${eventId}`, eventData));
    },
    [execute]
  );

  const activateEvent = useCallback(
    (eventId: string) => {
      return execute(() => apiClient.post(`/events/${eventId}/activate`));
    },
    [execute]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

// ====================== FIGHTS HOOK ======================
export function useFights(eventId?: string) {
  const { data, loading, error, execute } = useAsyncOperation<FightData[]>();

  const fetchFights = useCallback(
    async (params?: { eventId?: string; status?: string }) => {
      const queryParams = params || (eventId ? { eventId } : {});
      return execute(() => apiClient.get("/fights", { params: queryParams }));
    },
    [execute, eventId]
  );

  const fetchFightById = useCallback(
    (fightId: string) => {
      return execute(() => apiClient.get(`/fights/${fightId}`));
    },
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
    }) => {
      return execute(() => apiClient.post("/fights", fightData));
    },
    [execute]
  );

  const updateFight = useCallback(
    (fightId: string, fightData: any) => {
      return execute(() => apiClient.put(`/fights/${fightId}`, fightData));
    },
    [execute]
  );

  const openBetting = useCallback(
    (fightId: string) => {
      return execute(() => apiClient.post(`/fights/${fightId}/open-betting`));
    },
    [execute]
  );

  const closeBetting = useCallback(
    (fightId: string) => {
      return execute(() => apiClient.post(`/fights/${fightId}/close-betting`));
    },
    [execute]
  );

  const recordResult = useCallback(
    (fightId: string, result: "red" | "blue" | "draw" | "cancelled") => {
      return execute(() =>
        apiClient.post(`/fights/${fightId}/result`, { result })
      );
    },
    [execute]
  );

  useEffect(() => {
    fetchFights();
  }, [fetchFights]);

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

// ====================== VENUES HOOK ======================
export function useVenues() {
  const { data, loading, error, execute } = useAsyncOperation<{
    venues: VenueData[];
    total: number;
  }>();

  const fetchVenues = useCallback(
    async (params?: { status?: string; limit?: number; offset?: number }) => {
      return execute(() => apiClient.get("/venues", { params }));
    },
    [execute]
  );

  const fetchVenueById = useCallback(
    (venueId: string) => {
      return execute(() => apiClient.get(`/venues/${venueId}`));
    },
    [execute]
  );

  const createVenue = useCallback(
    (venueData: {
      name: string;
      location: string;
      description?: string;
      contactInfo?: any;
    }) => {
      return execute(() => apiClient.post("/venues", venueData));
    },
    [execute]
  );

  const updateVenue = useCallback(
    (venueId: string, venueData: any) => {
      return execute(() => apiClient.put(`/venues/${venueId}`, venueData));
    },
    [execute]
  );

  const updateVenueStatus = useCallback(
    (venueId: string, status: string, reason?: string) => {
      return execute(() =>
        apiClient.put(`/venues/${venueId}/status`, { status, reason })
      );
    },
    [execute]
  );

  const getMyVenues = useCallback(() => {
    return execute(() => apiClient.get("/venues/my/venues"));
  }, [execute]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

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
    getMyVenues,
  };
}

// ====================== NOTIFICATIONS HOOK ======================
export function useNotifications() {
  const { data, loading, error, execute, setData } = useAsyncOperation<{
    notifications: NotificationData[];
    total: number;
  }>();

  const fetchNotifications = useCallback(
    async (params?: {
      status?: string;
      type?: string;
      limit?: number;
      offset?: number;
    }) => {
      return execute(() => apiClient.get("/notifications", { params }));
    },
    [execute]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const response = await execute(() =>
        apiClient.put(`/notifications/${notificationId}/read`)
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((notif) =>
                notif.id === notificationId
                  ? { ...notif, status: "read" }
                  : notif
              ),
            }
          : null
      );
      return response;
    },
    [execute, setData]
  );

  const markAllAsRead = useCallback(async () => {
    const response = await execute(() =>
      apiClient.post("/notifications/mark-all-read")
    );
    setData((prev) =>
      prev
        ? {
            ...prev,
            notifications: prev.notifications.map((notif) => ({
              ...notif,
              status: "read",
            })),
          }
        : null
    );
    return response;
  }, [execute, setData]);

  const archiveNotification = useCallback(
    async (notificationId: string) => {
      const response = await execute(() =>
        apiClient.put(`/notifications/${notificationId}/archive`)
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.filter(
                (notif) => notif.id !== notificationId
              ),
            }
          : null
      );
      return response;
    },
    [execute, setData]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
  };
}

// ====================== SUBSCRIPTIONS HOOK ======================
export function useSubscriptions() {
  const { data, loading, error, execute } = useAsyncOperation<any>();

  const fetchPlans = useCallback(() => {
    return execute(() => apiClient.get("/subscriptions/plans/info"));
  }, [execute]);

  const fetchCurrent = useCallback(() => {
    return execute(() => apiClient.get("/subscriptions/current"));
  }, [execute]);

  const fetchMy = useCallback(() => {
    return execute(() => apiClient.get("/subscriptions"));
  }, [execute]);

  const createSubscription = useCallback(
    (subscriptionData: {
      plan: "daily" | "monthly";
      autoRenew?: boolean;
      paymentData?: any;
    }) => {
      return execute(() => apiClient.post("/subscriptions", subscriptionData));
    },
    [execute]
  );

  const cancelSubscription = useCallback(
    (subscriptionId: string) => {
      return execute(() =>
        apiClient.put(`/subscriptions/${subscriptionId}/cancel`)
      );
    },
    [execute]
  );

  const toggleAutoRenew = useCallback(
    (subscriptionId: string, autoRenew: boolean) => {
      return execute(() =>
        apiClient.put(`/subscriptions/${subscriptionId}/auto-renew`, {
          autoRenew,
        })
      );
    },
    [execute]
  );

  const checkAccess = useCallback(() => {
    return execute(() => apiClient.post("/subscriptions/check-access"));
  }, [execute]);

  return {
    subscription: data,
    loading,
    error,
    fetchPlans,
    fetchCurrent,
    fetchMy,
    createSubscription,
    cancelSubscription,
    toggleAutoRenew,
    checkAccess,
  };
}

// ====================== USERS HOOK (ADMIN) ======================
export function useUsers() {
  const { data, loading, error, execute } = useAsyncOperation<{
    users: UserData[];
    total: number;
  }>();

  const fetchUsers = useCallback(
    async (params?: {
      role?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }) => {
      return execute(() => apiClient.get("/users", { params }));
    },
    [execute]
  );

  const fetchUserById = useCallback(
    (userId: string) => {
      return execute(() => apiClient.get(`/users/${userId}`));
    },
    [execute]
  );

  const updateUserStatus = useCallback(
    async (userId: string, isActive: boolean, reason?: string) => {
      return execute(() =>
        apiClient.put(`/users/${userId}/status`, { isActive, reason })
      );
    },
    [execute]
  );

  const updateUserRole = useCallback(
    async (userId: string, role: string, reason?: string) => {
      return execute(() =>
        apiClient.put(`/users/${userId}/role`, { role, reason })
      );
    },
    [execute]
  );

  const getProfile = useCallback(() => {
    return execute(() => apiClient.get("/users/profile"));
  }, [execute]);

  const updateProfile = useCallback(
    (profileData: any) => {
      return execute(() => apiClient.put("/users/profile", profileData));
    },
    [execute]
  );

  const getAvailableOperators = useCallback(() => {
    return execute(() => apiClient.get("/users/operators/available"));
  }, [execute]);

  return {
    users: data?.users || [],
    total: data?.total || 0,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    updateUserStatus,
    updateUserRole,
    getProfile,
    updateProfile,
    getAvailableOperators,
  };
}

// ====================== AUTH UTILITIES ======================
export function useAuthOperations() {
  const { loading, error, execute } = useAsyncOperation();

  const changePassword = useCallback(
    async (passwordData: { currentPassword: string; newPassword: string }) => {
      return execute(() =>
        apiClient.post("/auth/change-password", passwordData)
      );
    },
    [execute]
  );

  const refreshToken = useCallback(() => {
    return execute(() => apiClient.post("/auth/refresh"));
  }, [execute]);

  return {
    loading,
    error,
    changePassword,
    refreshToken,
  };
}
