// frontend/src/components/debug/DebugPanel.tsx
// ================================================================
// 🛠️ DEBUG TOOL: Panel de información para desarrollo

import React, { useState, useEffect } from "react";
import { 
  Bug, 
  Info, 
  User, 
  Wifi, 
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
  Zap
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";

interface DebugInfo {
  user: any;
  environment: string;
  buildTime: string;
  wsConnected: boolean;
  currentPath: string;
  userAgent: string;
  localStorageItems: number;
  apiBaseUrl: string;
}

const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { isConnected: wsConnected } = useWebSocket("debug_room", {});

  // Solo mostrar en modo desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  useEffect(() => {
    if (isVisible) {
      const info: DebugInfo = {
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        } : null,
        environment: import.meta.env.MODE || 'development',
        buildTime: new Date().toLocaleString(),
        wsConnected,
        currentPath: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 60) + '...',
        localStorageItems: Object.keys(localStorage).length,
        apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      };
      
      setDebugInfo(info);
    }
  }, [isVisible, user, wsConnected]);

  const clearDebugData = () => {
    if (confirm('¿Limpiar datos de debug del localStorage?')) {
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('debug_')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  const refreshDebugInfo = () => {
    setDebugInfo(null);
    setTimeout(() => {
      if (isVisible) {
        const info: DebugInfo = {
          user: user ? {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
          } : null,
          environment: import.meta.env.MODE || 'development',
          buildTime: new Date().toLocaleString(),
          wsConnected,
          currentPath: window.location.pathname,
          userAgent: navigator.userAgent.substring(0, 60) + '...',
          localStorageItems: Object.keys(localStorage).length,
          apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        };
        
        setDebugInfo(info);
      }
    }, 100);
  };

  return (
    <>
      {/* Botón toggle */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-4 right-4 z-[9998] bg-gray-800 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle Debug Panel"
      >
        {isVisible ? <EyeOff className="w-5 h-5" /> : <Bug className="w-5 h-5" />}
      </button>

      {/* Panel de debug */}
      {isVisible && (
        <div className="fixed top-16 right-4 z-[9998] bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-md w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Debug Panel</h3>
            </div>
            <button
              onClick={refreshDebugInfo}
              className="text-gray-400 hover:text-gray-600"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {debugInfo ? (
            <div className="space-y-4">
              {/* Usuario */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Usuario</span>
                </div>
                {debugInfo.user ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">ID:</span> {debugInfo.user.id}</p>
                    <p><span className="font-medium">Username:</span> {debugInfo.user.username}</p>
                    <p><span className="font-medium">Role:</span> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        debugInfo.user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        debugInfo.user.role === 'operator' ? 'bg-green-100 text-green-800' :
                        debugInfo.user.role === 'venue' ? 'bg-purple-100 text-purple-800' :
                        debugInfo.user.role === 'gallera' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {debugInfo.user.role.toUpperCase()}
                      </span>
                    </p>
                    <p><span className="font-medium">Email:</span> {debugInfo.user.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">No autenticado</p>
                )}
              </div>

              {/* Conexión */}
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">Conexión</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">WebSocket:</span>
                    <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>{wsConnected ? 'Conectado' : 'Desconectado'}</span>
                  </p>
                  <p><span className="font-medium">API:</span> {debugInfo.apiBaseUrl}</p>
                </div>
              </div>

              {/* Sistema */}
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Sistema</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Ambiente:</span> {debugInfo.environment}</p>
                  <p><span className="font-medium">Ruta:</span> {debugInfo.currentPath}</p>
                  <p><span className="font-medium">LocalStorage:</span> {debugInfo.localStorageItems} items</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-2">
                <button
                  onClick={clearDebugData}
                  className="w-full bg-red-100 text-red-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Limpiar Datos Debug
                </button>
                
                <button
                  onClick={() => {
                    console.log('Debug Info:', debugInfo);
                    console.log('User:', user);
                    console.log('LocalStorage:', {...localStorage});
                  }}
                  className="w-full bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  Log to Console
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          <div className="mt-4 pt-2 border-t border-gray-200 text-xs text-gray-500">
            ⚠️ Panel de desarrollo - No visible en producción
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;