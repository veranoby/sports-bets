import { useState, useEffect, useCallback } from "react";
import {
  eventsAPI,
  fightsAPI,
  betsAPI,
  walletAPI,
  subscriptionsAPI,
  venuesAPI,
} from "../config/api";
import type { APIResponse, Fight, FightStatus, FightResult } from "../types";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

// Hook genérico para APIs
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

  const getOperatorEvents = useCallback(async (operatorId: string) => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll({ operatorId });
      setData(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEventStatus = useCallback(
    async (
      eventId: string,
      action: "activate" | "complete" | "start-stream" | "stop-stream"
    ) => {
      try {
        setLoading(true);
        let response;

        switch (action) {
          case "activate":
            response = await eventsAPI.activate(eventId);
            break;
          case "complete":
            response = await eventsAPI.complete(eventId);
            break;
          case "start-stream":
            response = await eventsAPI.startStream(eventId);
            break;
          case "stop-stream":
            response = await eventsAPI.stopStream(eventId);
            break;
        }

        // Update local event in list
        setData((prev) => ({
          ...prev,
          events:
            prev?.events.map((event) =>
              event.id === eventId ? { ...event, ...response.data } : event
            ) || [],
        }));

        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
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
    getOperatorEvents,
    updateEventStatus,
  };
}

// Hook para peleas
export function useFights() {
  const { data, loading, error, execute } = useAsyncOperation<Fight[]>();

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
      status: "upcoming" | "betting" | "live" | "completed"
    ) => {
      try {
        setLoading(true);
        let response;

        switch (status) {
          case "betting":
            response = await fightsAPI.openBetting(fightId);
            break;
          case "live":
            response = await fightsAPI.closeBetting(fightId);
            break;
          case "completed":
            throw new Error("Use recordResult for completing fights");
          default:
            response = await fightsAPI.update(fightId, { status });
        }

        // Update local fights list
        setData(
          (prev) =>
            prev?.map((fight) =>
              fight.id === fightId ? { ...fight, status } : fight
            ) || []
        );

        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const bulkUpdateFights = useCallback(
    async (
      eventId: string,
      updates: Array<{ fightId: string; updates: Partial<Fight> }>
    ) => {
      try {
        setLoading(true);
        const responses = await Promise.all(
          updates.map(({ fightId, updates }) =>
            fightsAPI.update(fightId, updates)
          )
        );

        await fetchFights({ eventId }); // Refresh fights list
        return responses;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchFights]
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
    bulkUpdateFights,
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
      side: "red" | "blue";
      amount: number;
      ratio?: number;
    }) => execute(() => betsAPI.create(betData)),
    [execute]
  );

  const acceptBet = useCallback(
    async (betId: string) => {
      try {
        setLoading(true);
        const response = await betsAPI.accept(betId);
        await fetchMyBets(); // Refresh my bets after accepting
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMyBets]
  );

  const cancelBet = useCallback(
    async (betId: string) => {
      try {
        setLoading(true);
        const response = await betsAPI.cancel(betId);
        // Update local state - remove bet from my bets
        setData((prev) => ({
          ...prev,
          bets: prev?.bets.filter((bet) => bet.id !== betId) || [],
        }));
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
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
      setError(err.message || "Error loading wallet");
    } finally {
      setLoading(false);
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
        const response = await walletAPI.getTransactions(params);
        setTransactions(response.data.transactions);
        return response.data;
      } catch (err: any) {
        setError(err.message || "Error loading transactions");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const processDeposit = useCallback(
    async (depositData: {
      amount: number;
      paymentMethod: "card" | "transfer";
      paymentData?: any;
    }) => {
      try {
        setLoading(true);
        const response = await walletAPI.deposit(depositData);
        await fetchWallet(); // Refresh wallet after deposit
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWallet]
  );

  const processWithdraw = useCallback(
    async (withdrawData: {
      amount: number;
      accountNumber: string;
      accountType?: string;
      bankName?: string;
    }) => {
      try {
        setLoading(true);
        const response = await walletAPI.withdraw(withdrawData);
        await fetchWallet(); // Refresh wallet after withdrawal request
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchWallet]
  );

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
    processDeposit,
    processWithdraw,
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

export const useApi = () => {
  const { user } = useAuth();

  // ====================== Bet Operations ======================
  const useBets = () => {
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBets = useCallback(async () => {
      try {
        const response = await axios.get(`/api/users/${user?.id}/bets`);
        setBets(response.data);
      } catch (err) {
        setError("Failed to fetch bets");
      } finally {
        setLoading(false);
      }
    }, [user?.id]);

    const cancelBet = useCallback(async (betId: string) => {
      try {
        setLoading(true);
        const response = await axios.delete(`/api/bets/${betId}`);
        setBets((prev) => prev.filter((bet) => bet.id !== betId));
        return response.data;
      } catch (err) {
        setError("Failed to cancel bet");
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

    const acceptBet = useCallback(
      async (betId: string) => {
        try {
          setLoading(true);
          const response = await axios.post(`/api/bets/${betId}/accept`);
          await fetchBets(); // Refresh bets list
          return response.data;
        } catch (err) {
          setError("Failed to accept bet");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [fetchBets]
    );

    useEffect(() => {
      fetchBets();
    }, [fetchBets]);

    return { bets, loading, error, fetchBets, cancelBet, acceptBet };
  };

  // ====================== Wallet Operations ======================
  const useWallet = () => {
    const [balance, setBalance] = useState<WalletBalance>({
      available: 0,
      frozen: 0,
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWallet = useCallback(async () => {
      try {
        const [balanceRes, transactionsRes] = await Promise.all([
          axios.get(`/api/users/${user?.id}/wallet`),
          axios.get(`/api/users/${user?.id}/transactions`),
        ]);
        setBalance(balanceRes.data);
        setTransactions(transactionsRes.data);
      } catch (err) {
        setError("Failed to fetch wallet data");
      } finally {
        setLoading(false);
      }
    }, [user?.id]);

    const processDeposit = useCallback(
      async (depositData: {
        amount: number;
        paymentMethod: "card" | "transfer";
        paymentData?: any;
      }) => {
        try {
          setLoading(true);
          const response = await walletAPI.deposit(depositData);
          await fetchWallet(); // Refresh wallet after deposit
          return response.data;
        } catch (err: any) {
          setError(err.message);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [fetchWallet]
    );

    const processWithdraw = useCallback(
      async (withdrawData: {
        amount: number;
        accountNumber: string;
        accountType?: string;
        bankName?: string;
      }) => {
        try {
          setLoading(true);
          const response = await walletAPI.withdraw(withdrawData);
          await fetchWallet(); // Refresh wallet after withdrawal request
          return response.data;
        } catch (err: any) {
          setError(err.message);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [fetchWallet]
    );

    useEffect(() => {
      fetchWallet();
    }, [fetchWallet]);

    return {
      balance,
      transactions,
      loading,
      error,
      processDeposit,
      processWithdraw,
    };
  };

  // ====================== Fight Management (Operator) ======================
  const useFights = (eventId?: string) => {
    const [fights, setFights] = useState<Fight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFights = useCallback(async () => {
      try {
        const url = eventId ? `/api/events/${eventId}/fights` : `/api/fights`;
        const response = await axios.get(url);
        setFights(response.data);
      } catch (err) {
        setError("Failed to fetch fights");
      } finally {
        setLoading(false);
      }
    }, [eventId]);

    const updateFightStatus = useCallback(
      async (
        fightId: string,
        status: "upcoming" | "betting" | "live" | "completed"
      ) => {
        try {
          setLoading(true);
          const response = await axios.patch(`/api/fights/${fightId}`, {
            status,
          });
          setFights((prev) =>
            prev.map((fight) =>
              fight.id === fightId ? { ...fight, status } : fight
            )
          );
          return response.data;
        } catch (err) {
          setError("Failed to update fight status");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      []
    );

    const bulkUpdateFights = useCallback(
      async (updates: Array<{ fightId: string; status: string }>) => {
        try {
          setLoading(true);
          const response = await axios.patch(`/api/fights/bulk-update`, {
            updates,
          });
          await fetchFights(); // Refresh fights list
          return response.data;
        } catch (err) {
          setError("Failed to bulk update fights");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [fetchFights]
    );

    useEffect(() => {
      fetchFights();
    }, [fetchFights]);

    return { fights, loading, error, updateFightStatus, bulkUpdateFights };
  };

  // ====================== Event Management (Operator) ======================
  const useEvents = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
      try {
        const response = await axios.get("/api/events");
        setEvents(response.data);
      } catch (err) {
        setError("Failed to fetch events");
      } finally {
        setLoading(false);
      }
    }, []);

    const getOperatorEvents = useCallback(async (operatorId: string) => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/events?operatorId=${operatorId}`
        );
        setEvents(response.data);
        return response.data;
      } catch (err) {
        setError("Failed to fetch operator events");
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

    const updateEventStatus = useCallback(
      async (
        eventId: string,
        action: "activate" | "complete" | "start-stream" | "stop-stream"
      ) => {
        try {
          setLoading(true);
          const response = await axios.patch(`/api/events/${eventId}/status`, {
            action,
          });
          setEvents((prev) =>
            prev.map((event) =>
              event.id === eventId
                ? { ...event, status: response.data.status }
                : event
            )
          );
          return response.data;
        } catch (err) {
          setError("Failed to update event status");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      []
    );

    useEffect(() => {
      fetchEvents();
    }, [fetchEvents]);

    return { events, loading, error, getOperatorEvents, updateEventStatus };
  };

  return { useEvents, useBets, useWallet, useFights };
};
