import { useState, useEffect } from "react";
import { settingsAPI } from "../config/api";

type FeatureFlags = {
  isBettingEnabled: boolean;
  isWalletEnabled: boolean;
  isArticlesEnabled: boolean;
  isAdsEnabled: boolean;
  isStreamingEnabled: boolean;
  isLoading: boolean;
};

/**
 * ✅ SINGLE SOURCE OF TRUTH: Database
 *
 * Feature flags are managed dynamically via Admin Panel → System Settings.
 * This hook fetches the current state from /api/settings/features/public.
 *
 * Architecture:
 * - Database (system_settings table) = source of truth
 * - Admin changes flags → immediate effect (no deployment needed)
 * - No .env dependency for dynamic features
 *
 * Loading State:
 * - isLoading: true initially, false after fetch completes
 * - Components should check isLoading before rendering feature-gated content
 *
 * Static Features:
 * - Articles and Ads remain hardcoded (not in DB yet)
 * - These can be moved to DB in future if needed
 */
export const useFeatureFlags = (): FeatureFlags => {
  const [flags, setFlags] = useState<FeatureFlags>({
    // Initialize as false (conservative default)
    isBettingEnabled: false,
    isWalletEnabled: false,
    isStreamingEnabled: false,
    // Static features (not managed by admin panel yet)
    isArticlesEnabled: true,
    isAdsEnabled: true,
    // Loading state
    isLoading: true,
  });

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const response = await settingsAPI.getFeatureFlags();
        console.log("🔍 Raw API response:", response);
        console.log("🔍 response.data:", response.data);
        if (response.data?.success && response.data?.data) {
          const data = response.data.data;
          setFlags({
            // Dynamic flags from database
            isBettingEnabled: data.betting_enabled === true,
            isWalletEnabled: data.wallets_enabled === true,
            isStreamingEnabled: data.streaming_enabled === true,
            // Static features (hardcoded for now)
            isArticlesEnabled: true,
            isAdsEnabled: true,
            // Mark as loaded
            isLoading: false,
          });
          console.log("✅ Feature flags loaded from database:", {
            betting: data.betting_enabled,
            wallets: data.wallets_enabled,
            streaming: data.streaming_enabled,
          });
        } else {
          console.error("❌ Invalid response format from feature flags API");
          setFlags((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("❌ Failed to fetch feature flags from database:", error);
        // Conservative fallback: disable features on error
        setFlags({
          isBettingEnabled: false,
          isWalletEnabled: false,
          isStreamingEnabled: false,
          isArticlesEnabled: true,
          isAdsEnabled: true,
          isLoading: false,
        });
      }
    };

    fetchFeatureFlags();
  }, []);

  return flags;
};
