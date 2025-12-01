import { useState, useEffect } from "react";
import { settingsAPI } from "../config/api";

type FeatureFlags = {
  isBettingEnabled: boolean;
  isWalletEnabled: boolean;
  isArticlesEnabled: boolean;
  isAdsEnabled: boolean;
  isStreamingEnabled: boolean;
};

// ✅ Now reads DYNAMIC feature flags from DB via /api/settings/features/public
// Instead of static .env variables
export const useFeatureFlags = (): FeatureFlags => {
  const [flags, setFlags] = useState<FeatureFlags>({
    // Fallback to .env while loading
    isBettingEnabled: import.meta.env.VITE_FEATURES_BETTING === "true",
    isWalletEnabled: import.meta.env.VITE_FEATURES_WALLET === "true",
    isArticlesEnabled: import.meta.env.VITE_FEATURES_ARTICLES === "true",
    isAdsEnabled: import.meta.env.VITE_FEATURES_ADS === "true",
    isStreamingEnabled: import.meta.env.VITE_FEATURES_STREAMING === "true",
  });

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const response = await settingsAPI.getFeatureFlags();
        if (response.data?.success && response.data?.data) {
          const data = response.data.data;
          setFlags({
            isBettingEnabled: data.betting_enabled === true,
            isWalletEnabled: data.wallets_enabled === true,
            isStreamingEnabled: data.streaming_enabled === true,
            // These remain from .env as they're not in DB yet
            isArticlesEnabled:
              import.meta.env.VITE_FEATURES_ARTICLES === "true",
            isAdsEnabled: import.meta.env.VITE_FEATURES_ADS === "true",
          });
        }
      } catch (error) {
        console.error(
          "Failed to fetch feature flags, using .env defaults:",
          error,
        );
        // Keep .env defaults on error
      }
    };

    fetchFeatureFlags();
  }, []);

  return flags;
};
