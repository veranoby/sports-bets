import { useState, useEffect } from 'react';

interface Setting {
  key: string;
  value: any;
  type: 'boolean' | 'string' | 'number' | 'json';
  category: string;
  description?: string;
  is_public: boolean;
}

interface UseSettingsReturn {
  settings: Record<string, any>;
  publicSettings: Record<string, any>;
  featureStatus: {
    wallets_enabled: boolean;
    betting_enabled: boolean;
    streaming_enabled: boolean;
    maintenance_mode: boolean;
  };
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSetting: (key: string, value: any) => Promise<boolean>;
  bulkUpdateSettings: (updates: Record<string, any>) => Promise<boolean>;
  getSetting: (key: string, defaultValue?: any) => any;
  isFeatureEnabled: (featureKey: string) => boolean;
}

const useSettings = (adminMode: boolean = false): UseSettingsReturn => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [publicSettings, setPublicSettings] = useState<Record<string, any>>({});
  const [featureStatus, setFeatureStatus] = useState({
    wallets_enabled: false,
    betting_enabled: false,
    streaming_enabled: false,
    maintenance_mode: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch public settings (always available)
      const publicResponse = await fetch('/api/settings/public', {
        headers: getAuthHeaders()
      });

      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        setPublicSettings(publicData.data || {});
      }

      // Fetch admin settings if in admin mode
      if (adminMode) {
        const adminResponse = await fetch('/api/settings', {
          headers: getAuthHeaders()
        });

        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          setSettings(adminData.data || {});
        }
      }

      // Fetch feature status
      await fetchFeatureStatus();

    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureStatus = async () => {
    try {
      const response = await fetch('/api/settings/features/status', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setFeatureStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching feature status:', error);
    }
  };

  const updateSetting = async (key: string, value: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ value })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setSettings(prev => ({
            ...prev,
            [key]: value
          }));

          // Refresh feature status if it's a feature toggle
          if (key.startsWith('enable_') || key === 'maintenance_mode') {
            await fetchFeatureStatus();
          }

          return true;
        }
      }

      throw new Error('Error updating setting');
    } catch (error) {
      console.error('Error updating setting:', error);
      setError(error instanceof Error ? error.message : 'Error updating setting');
      return false;
    }
  };

  const bulkUpdateSettings = async (updates: Record<string, any>): Promise<boolean> => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setSettings(prev => ({
            ...prev,
            ...updates
          }));

          // Refresh feature status if any feature toggles were updated
          const hasFeatureUpdates = Object.keys(updates).some(key => 
            key.startsWith('enable_') || key === 'maintenance_mode'
          );

          if (hasFeatureUpdates) {
            await fetchFeatureStatus();
          }

          return true;
        }
      }

      throw new Error('Error updating settings');
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      setError(error instanceof Error ? error.message : 'Error updating settings');
      return false;
    }
  };

  const getSetting = (key: string, defaultValue: any = null): any => {
    // Try admin settings first, then public settings
    if (key in settings) {
      return settings[key];
    }
    
    if (key in publicSettings) {
      return publicSettings[key];
    }

    return defaultValue;
  };

  const isFeatureEnabled = (featureKey: string): boolean => {
    // Check feature status first
    if (featureKey in featureStatus) {
      return featureStatus[featureKey as keyof typeof featureStatus];
    }

    // Fallback to settings check
    const value = getSetting(featureKey, false);
    return Boolean(value);
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  // Initial load
  useEffect(() => {
    fetchSettings();
  }, [adminMode]);

  return {
    settings,
    publicSettings,
    featureStatus,
    loading,
    error,
    refreshSettings,
    updateSetting,
    bulkUpdateSettings,
    getSetting,
    isFeatureEnabled
  };
};

export default useSettings;