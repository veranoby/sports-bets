import { useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { UserSubscription } from "../types";

interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  hasAccess: boolean;
  isPremium: boolean;
  loading: boolean;
  error: string | null;
  fetchSubscription: () => Promise<void>;
  refreshAccess: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user, isLoading, refreshUser } = useAuth();

  const subscription = user?.subscription ?? null;

  const hasAccess = useMemo(() => {
    if (!subscription) return false;
    if (subscription.status !== "active") return false;
    if (
      subscription.expiresAt &&
      new Date(subscription.expiresAt) <= new Date()
    )
      return false;
    return true;
  }, [subscription]);

  const isPremium = useMemo(() => {
    if (!subscription) return false;
    if (subscription.type === "free") return false;
    return hasAccess;
  }, [subscription, hasAccess]);

  const fetchSubscription = useCallback(async () => {
    // Reutilizamos refreshUser para traer el perfil con subscription
    await refreshUser();
  }, [refreshUser]);

  const refreshAccess = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    hasAccess,
    isPremium,
    loading: isLoading,
    error: null,
    fetchSubscription,
    refreshAccess,
  };
};
