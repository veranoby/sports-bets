// frontend/src/components/operator/OperatorHeader.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Activity, Wifi } from "lucide-react";
import { useWebSocketContext } from "../../contexts/WebSocketContext";

const OperatorHeader = memo(() => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocketContext();

  return (
    <header className="bg-theme-header px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-theme-primary">Panel de Operador</h1>
          <div
            className={`flex items-center gap-2 text-sm ${
              isConnected ? "text-green-600" : "text-red-600"
            }`}
          >
            {isConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            {isConnected ? "Conectado" : "Desconectado"}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-theme-secondary">{user?.username}</span>
          <button 
            onClick={logout} 
            className="flex items-center gap-2 px-3 py-2 text-theme-secondary hover:text-theme-primary hover:bg-theme-accent rounded-lg transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
});

export default OperatorHeader;
