// frontend/src/components/operator/OperatorHeader.tsx
import React, { memo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, Activity, Wifi } from "lucide-react";
import { useWebSocketContext } from "../../contexts/WebSocketContext";

const OperatorHeader = memo(() => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocketContext();

  return (
    <header className="bg-gray-900 text-white px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Panel de Operador</h1>
          <div
            className={`flex items-center gap-2 text-sm ${
              isConnected ? "text-green-400" : "text-red-400"
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
          <span className="text-sm">{user?.username}</span>
          <button onClick={logout} className="p-2 hover:bg-gray-800 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
});

export default OperatorHeader;
