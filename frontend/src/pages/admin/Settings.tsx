import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';


const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Categories for organizing settings
  const categories = {
    system: { name: 'Sistema', icon: Database, color: 'bg-blue-500' },
    features: { name: 'Características', icon: Activity, color: 'bg-green-500' },
    business: { name: 'Negocio', icon: DollarSign, color: 'bg-yellow-500' },
    streaming: { name: 'Streaming', icon: Users, color: 'bg-purple-500' }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Handle authentication error
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Error al cargar configuraciones');
      }

      const data = await response.json();
      console.log('🔍 Raw API response:', data);
      
      const settingsData = data.data || data || {};
      console.log('🔍 Extracted settings data:', settingsData);
      
      // If no data, use defaults
      if (Object.keys(settingsData).length === 0) {
        const defaultSettings = {
          maintenance_mode: false,
          enable_streaming: true,
          enable_wallets: true,
          enable_betting: true,
          enable_push_notifications: true
        };
        console.log('🔧 Using default settings:', defaultSettings);
        setSettings(defaultSettings);
      } else {
        console.log('🔧 Using API settings:', settingsData);
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pendingChanges)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar configuraciones');
      }

      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data.settings || data.data);
        setPendingChanges({});
        setSuccess(`Configuraciones actualizadas exitosamente`);
        
        // Auto-clear success message
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setPendingChanges({});
    setError(null);
    setSuccess(null);
  };

  const getCurrentValue = (key: string) => {
    const value = key in pendingChanges ? pendingChanges[key] : settings[key];
    console.log(`🔍 getCurrentValue(${key}):`, value, 'from', key in pendingChanges ? 'pendingChanges' : 'settings');
    return value;
  };

  const renderSettingInput = (key: string, value: any, type: string) => {
    const currentValue = getCurrentValue(key);

    switch (type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(currentValue)}
              onChange={(e) => handleSettingChange(key, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {currentValue ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </label>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={currentValue || 0}
            onChange={(e) => handleSettingChange(key, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      
      case 'string':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      
      case 'json':
        return (
          <textarea
            value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue || '{}'}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(key, parsed);
              } catch {
                // Keep invalid JSON in input but don't update state
              }
            }}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        );
      
      default:
        return (
          <span className="text-gray-500 text-sm">Tipo no soportado: {type}</span>
        );
    }
  };

  const groupSettingsByCategory = () => {
    const grouped: Record<string, Array<{key: string, value: any}>> = {};
    
    // Define settings structure based on categories
    const settingsStructure = {
      system: ['maintenance_mode', 'api_rate_limit', 'max_concurrent_streams'],
      features: ['enable_wallets', 'enable_betting', 'enable_streaming', 'enable_push_notifications'],
      business: ['commission_percentage', 'min_bet_amount', 'max_bet_amount', 'auto_approval_threshold', 'withdrawal_daily_limit'],
      streaming: ['default_stream_quality', 'max_viewers_per_stream', 'stream_buffer_seconds']
    };

    Object.entries(settingsStructure).forEach(([category, keys]) => {
      grouped[category] = keys
        .filter(key => key in settings)
        .map(key => ({ key, value: settings[key] }));
    });

    return grouped;
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      maintenance_mode: 'Habilita el modo de mantenimiento, bloqueando el acceso a la plataforma',
      api_rate_limit: 'Número máximo de peticiones por minuto por usuario',
      max_concurrent_streams: 'Número máximo de streams simultáneos permitidos',
      enable_wallets: 'Habilita/deshabilita el sistema de billeteras',
      enable_betting: 'Habilita/deshabilita el sistema de apuestas',
      enable_streaming: 'Habilita/deshabilita las funciones de streaming',
      enable_push_notifications: 'Habilita/deshabilita las notificaciones push de la PWA',
      commission_percentage: 'Porcentaje de comisión de la plataforma sobre las apuestas',
      min_bet_amount: 'Monto mínimo permitido para una apuesta',
      max_bet_amount: 'Monto máximo permitido para una apuesta',
      auto_approval_threshold: 'Monto bajo el cual los depósitos se aprueban automáticamente',
      withdrawal_daily_limit: 'Límite diario de retiros por usuario',
      default_stream_quality: 'Calidad de streaming por defecto (720p, 1080p)',
      max_viewers_per_stream: 'Número máximo de espectadores por stream',
      stream_buffer_seconds: 'Tiempo de buffer del stream en segundos'
    };
    
    return descriptions[key] || 'Configuración del sistema';
  };

  const getSettingType = (key: string): string => {
    const types: Record<string, string> = {
      maintenance_mode: 'boolean',
      enable_wallets: 'boolean',
      enable_betting: 'boolean',
      enable_streaming: 'boolean',
      enable_push_notifications: 'boolean',
      api_rate_limit: 'number',
      max_concurrent_streams: 'number',
      commission_percentage: 'number',
      min_bet_amount: 'number',
      max_bet_amount: 'number',
      auto_approval_threshold: 'number',
      withdrawal_daily_limit: 'number',
      max_viewers_per_stream: 'number',
      stream_buffer_seconds: 'number',
      default_stream_quality: 'string'
    };
    
    return types[key] || 'string';
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Cargando configuraciones...</span>
      </div>
    );
  }

  const groupedSettings = groupSettingsByCategory();
  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SettingsIcon className="w-8 h-8 text-gray-700 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={resetChanges}
            disabled={!hasChanges}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Resetear
          </button>
          
          <button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {hasChanges && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
          <span className="text-yellow-700">
            Tienes {Object.keys(pendingChanges).length} cambio(s) sin guardar
          </span>
        </div>
      )}

      {/* Settings by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
          const categorySettings = groupedSettings[categoryKey] || [];
          const Icon = categoryInfo.icon;

          if (categorySettings.length === 0) return null;

          return (
            <div key={categoryKey} className="bg-white rounded-lg shadow-md">
              <div className={`${categoryInfo.color} text-white p-4 rounded-t-lg`}>
                <div className="flex items-center">
                  <Icon className="w-6 h-6 mr-3" />
                  <h2 className="text-xl font-semibold">{categoryInfo.name}</h2>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {categorySettings.map(({ key, value }) => (
                  <div key={key} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <h3 className="font-medium text-gray-900 capitalize">
                          {key.replace(/_/g, ' ').replace(/^enable /, '')}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getSettingDescription(key)}
                        </p>
                      </div>
                      
                      <div className="w-48">
                        {renderSettingInput(key, value, getSettingType(key))}
                        {key in pendingChanges && (
                          <div className="mt-1 text-xs text-blue-600">
                            ● Modificado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Referencia al Dashboard */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <SettingsIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Estado de Características</h3>
            <p className="text-sm text-blue-700 mt-1">
              El resumen del estado de características del sistema ahora se muestra en el{' '}
              <a 
                href="/admin/dashboard" 
                className="font-medium underline hover:text-blue-800"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/admin/dashboard';
                }}
              >
                Panel Principal
              </a>
              {' '}para acceso rápido y mejor visibilidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;