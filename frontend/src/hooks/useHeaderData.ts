// frontend/src/hooks/useHeaderData.ts
// Hook especializado para datos del header con polling optimizado

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../config/api";

interface HeaderData {
  walletBalance: number;
  activeBets: Array<{
    id: string;
    eventName: string;
    fighters: { red: string; blue: string };
    side: "red" | "blue";
    amount: number;
    status: "active" | "pending";
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    type: "bet_win" | "bet_loss" | "wallet" | "news" | "system";
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
}

export const useHeaderData = (pollingInterval = 30000) => {
  const [data, setData] = useState<HeaderData>({
    walletBalance: 0,
    activeBets: [],
    notifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referencias para evitar re-fetches innecesarios
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const fetchHeaderData = useCallback(async (force = false) => {
    // Evitar fetches muy seguidos (mínimo 5 segundos)
    if (!force && Date.now() - lastFetchRef.current < 5000) {
      return;
    }

    // Cancelar fetch anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setError(null);
      lastFetchRef.current = Date.now();

      // Fetch paralelo de todos los datos necesarios
      const [walletRes, betsRes, notificationsRes] = await Promise.all([
        apiClient.get("/wallets/my-wallet", {
          signal: abortControllerRef.current.signal,
        }),
        apiClient.get("/bets/my-bets", {
          params: { status: "active", limit: 5 },
          signal: abortControllerRef.current.signal,
        }),
        apiClient.get("/notifications", {
          params: { limit: 20 },
          signal: abortControllerRef.current.signal,
        }),
      ]);

      if (isMountedRef.current) {
        setData({
          walletBalance: walletRes.data.data?.balance || 0,
          activeBets: betsRes.data.data || [],
          notifications: notificationsRes.data.data || [],
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && isMountedRef.current) {
        console.error("Error fetching header data:", err);
        setError(err.message || "Error loading data");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Marcar notificación como leída
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);

      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Marcar todas las notificaciones como leídas
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await apiClient.put("/notifications/read-all");

      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      }));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  // Refrescar datos manualmente
  const refresh = useCallback(() => {
    fetchHeaderData(true);
  }, [fetchHeaderData]);

  // Polling inicial y periódico
  useEffect(() => {
    isMountedRef.current = true;

    // Fetch inicial
    fetchHeaderData();

    // Configurar polling
    const interval = setInterval(() => {
      fetchHeaderData();
    }, pollingInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchHeaderData, pollingInterval]);

  return {
    walletBalance: data.walletBalance,
    activeBets: data.activeBets,
    activeBetsCount: data.activeBets.length,
    notifications: data.notifications,
    unreadNotificationsCount: data.notifications.filter((n) => !n.read).length,
    loading,
    error,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refresh,
  };
};
