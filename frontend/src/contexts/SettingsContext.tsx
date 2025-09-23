import React, { createContext, useContext, type ReactNode } from "react";
import useSettings from "../hooks/useSettings";

interface SettingsContextType {
  settings: Record<string, unknown>;
  publicSettings: Record<string, unknown>;
  featureStatus: {
    wallets_enabled: boolean;
    betting_enabled: boolean;
    streaming_enabled: boolean;
    maintenance_mode: boolean;
  };
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSetting: (key: string, value: unknown) => Promise<boolean>;
  bulkUpdateSettings: (updates: Record<string, unknown>) => Promise<boolean>;
  getSetting: (key: string, defaultValue?: unknown) => unknown;
  isFeatureEnabled: (featureKey: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
  adminMode?: boolean;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  adminMode = false,
}) => {
  const settingsData = useSettings(adminMode);

  return (
    <SettingsContext.Provider value={settingsData}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider",
    );
  }

  return context;
};

// Convenience hooks for specific features
export const useFeatureFlag = (featureKey: string): boolean => {
  const { isFeatureEnabled } = useSettingsContext();
  return isFeatureEnabled(featureKey);
};

export const useWalletsEnabled = (): boolean => {
  return useFeatureFlag("enable_wallets");
};

export const useBettingEnabled = (): boolean => {
  return useFeatureFlag("enable_betting");
};

export const useStreamingEnabled = (): boolean => {
  return useFeatureFlag("enable_streaming");
};

export const useMaintenanceMode = (): boolean => {
  return useFeatureFlag("maintenance_mode");
};

// Business settings hooks
export const useBusinessSettings = () => {
  const { getSetting } = useSettingsContext();

  return {
    commissionPercentage: getSetting("commission_percentage", 5),
    minBetAmount: getSetting("min_bet_amount", 1),
    maxBetAmount: getSetting("max_bet_amount", 10000),
    autoApprovalThreshold: getSetting("auto_approval_threshold", 100),
    withdrawalDailyLimit: getSetting("withdrawal_daily_limit", 1000),
  };
};

// Streaming settings hooks
export const useStreamingSettings = () => {
  const { getSetting } = useSettingsContext();

  return {
    defaultStreamQuality: getSetting("default_stream_quality", "720p"),
    maxViewersPerStream: getSetting("max_viewers_per_stream", 1000),
    streamBufferSeconds: getSetting("stream_buffer_seconds", 30),
    maxConcurrentStreams: getSetting("max_concurrent_streams", 10),
  };
};

export default SettingsContext;
