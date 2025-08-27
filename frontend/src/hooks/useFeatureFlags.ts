import { useMemo } from 'react';

type FeatureFlags = {
  isBettingEnabled: boolean;
  isWalletEnabled: boolean;
  isArticlesEnabled: boolean;
  isAdsEnabled: boolean;
};

export const useFeatureFlags = (): FeatureFlags => {
  return useMemo(() => ({
    isBettingEnabled: import.meta.env.VITE_FEATURES_BETTING === "true",
    isWalletEnabled: import.meta.env.VITE_FEATURES_WALLET === "true",
    isArticlesEnabled: import.meta.env.VITE_FEATURES_ARTICLES === "true",
    isAdsEnabled: import.meta.env.VITE_FEATURES_ADS === "true",
  }), []);
};
