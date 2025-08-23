import { useState, useEffect, useCallback } from 'react';
import { subscriptionAPI } from '../config/api';

interface Subscription {
  id: string;
  type: 'daily' | 'monthly';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  expiresAt: string;
  features: string[];
  isActive: boolean;
  formattedAmount: string;
  remainingDays: number;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  hasAccess: boolean;
  isPremium: boolean;
  loading: boolean;
  error: string | null;
  fetchSubscription: () => Promise<void>;
  refreshAccess: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await subscriptionAPI.getCurrentSubscription();
      
      if (response?.data?.subscription) {
        setSubscription(response.data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      // If 404 or no subscription, that's okay - user just doesn't have one
      if (err.message?.includes('404') || err.message?.includes('No subscription found')) {
        setSubscription(null);
        setError(null);
      } else {
        setError(err.message || 'Failed to fetch subscription');
        console.error('Subscription fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user has active premium access
  const hasAccess = useCallback((): boolean => {
    if (!subscription) return false;
    
    // Check if subscription is active and not expired
    if (subscription.status !== 'active') return false;
    if (new Date(subscription.expiresAt) <= new Date()) return false;
    
    return true;
  }, [subscription]);

  // Check if user is premium (has active subscription)
  const isPremium = hasAccess();

  const refreshAccess = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  // Fetch on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    hasAccess: isPremium,
    isPremium,
    loading,
    error,
    fetchSubscription,
    refreshAccess
  };
};