import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

interface MembershipStatus {
  membership_valid: boolean;
  current_status: 'free' | 'active';
  expires_at: string | null;
  membership_type: 'free' | '24h' | 'monthly';
}

export const useMembershipCheck = () => {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const checkMembership = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Skip if checked within last 5 minutes and not forced
    if (!force && (now - lastCheck) < fiveMinutes && membershipStatus) {
      return membershipStatus;
    }

    // Check localStorage cache first
    const cachedExpiration = localStorage.getItem('membership_expires_at');
    const cachedType = localStorage.getItem('membership_type');

    if (cachedExpiration && !force) {
      const expirationTime = new Date(cachedExpiration).getTime();
      const hasExpired = now > expirationTime;

      if (!hasExpired) {
        const cachedStatus: MembershipStatus = {
          membership_valid: true,
          current_status: 'active',
          expires_at: cachedExpiration,
          membership_type: (cachedType as any) || '24h'
        };
        setMembershipStatus(cachedStatus);
        setLastCheck(now);
        return cachedStatus;
      }
    }

    // API verification needed
    setLoading(true);
    try {
      const response = await authAPI.checkMembershipStatus();
      const status: MembershipStatus = response.data;

      // Update localStorage
      if (status.expires_at) {
        localStorage.setItem('membership_expires_at', status.expires_at);
        localStorage.setItem('membership_type', status.membership_type);
      } else {
        localStorage.removeItem('membership_expires_at');
        localStorage.removeItem('membership_type');
      }

      localStorage.setItem('last_membership_check', now.toString());

      setMembershipStatus(status);
      setLastCheck(now);
      return status;

    } catch (error) {
      console.error('Membership check failed:', error);
      // Fallback to free status
      const fallbackStatus: MembershipStatus = {
        membership_valid: false,
        current_status: 'free',
        expires_at: null,
        membership_type: 'free'
      };
      setMembershipStatus(fallbackStatus);
      return fallbackStatus;
    } finally {
      setLoading(false);
    }
  }, [membershipStatus, lastCheck]);

  // Auto-check on mount
  useEffect(() => {
    checkMembership();
  }, []);

  return {
    membershipStatus,
    loading,
    checkMembership,
    refreshMembership: () => checkMembership(true)
  };
};

export default useMembershipCheck;