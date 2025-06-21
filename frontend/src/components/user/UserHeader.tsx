// frontend/src/components/user/UserHeader.tsx - CORREGIR MOUNTING CYCLES
// =========================================================================

import React, { useState, useEffect } from "react";
import { LogOut, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useWallet, useBets } from "../../hooks/useApi";
import {
  getUserThemeClasses,
  useUserTheme,
} from "../../contexts/UserThemeContext";
import { useNavigate } from "react-router-dom";
import NotificationBadge from "../shared/NotificationBadge";
import { Wallet, Dices } from "lucide-react";
// ❌ REMOVER ESTOS IMPORTS QUE CAUSAN RE-MOUNTING:
// import NotificationCenter from "../shared/NotificationCenter";
// import WebSocketDiagnostics from "../shared/WebSocketDiagnostics";
import ProposalNotifications from "./ProposalNotifications";
import BetCard from "./BetCard";

interface UserHeaderProps {
  title: string;
  customActions?: React.ReactNode;
}

const UserHeader: React.FC<UserHeaderProps> = ({ title, customActions }) => {
  const { user, logout } = useAuth();
  const { wallet, fetchWallet } = useWallet();
  const { bets } = useBets();
  const { isConnected } = useWebSocketContext();
  const navigate = useNavigate();
  const theme = getUserThemeClasses();
  const { updateColors } = useUserTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProposals, setShowProposals] = useState(false);
  const [showBetsMenu, setShowBetsMenu] = useState(false);

  // ✅ REAL DATA - Notificaciones basadas en apuestas activas
  const unreadCount =
    bets?.filter(
      (bet) =>
        bet.status === "active" ||
        (bet.status === "settled" && bet.result === "win")
    ).length || 0;

  // Datos para el dropdown
  const activeBetsCount =
    bets?.filter((bet) => bet.status === "active").length || 0;
  const recentActiveBets =
    bets
      ?.filter((bet) => bet.status === "active")
      ?.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      ?.slice(0, 3) || [];

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Llamar a fetchWallet al montar el componente
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // ✅ Debug: verificar datos del wallet
  console.log("Wallet data:", wallet);

  // ✅ Fallback seguro para el balance
  const displayBalance = wallet?.balance?.toFixed(2) ?? "0.00";

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case "admin":
        return { label: "Administrador", color: "bg-purple-500" };
      case "operator":
        return { label: "Operador", color: "bg-blue-500" };
      case "venue":
        return { label: "Gallera", color: "bg-orange-500" };
      default:
        return { label: "Aficionado", color: "bg-green-500" };
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleInfo = getRoleLabel();

  return (
    <header
      className={`${theme.headerBackground} shadow-sm border-b border-gray-700`}
    >
      <div className="px-4 py-3">
        {/* Fila superior - Información del usuario */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            {/* Avatar del usuario */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              {/* Indicador de conexión WebSocket */}
              <div className="absolute -bottom-1 -right-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>

            {/* Información del usuario */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">
                  {user?.username || "Usuario"}
                </span>
                <span
                  className={`${roleInfo.color} text-white text-xs px-2 py-0.5 rounded-full`}
                >
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                {getGreeting()}, {currentTime.toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-2">
            {/* 🔔 BOTÓN SIMPLE SIN COMPONENTE INTERNO */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg transition-colors hover:bg-gray-600"
              title="Notificaciones"
            >
              <span className="text-gray-300 text-sm">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Botón de logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors hover:bg-gray-600"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Fila inferior - Título y acciones */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <div className="flex items-center space-x-4">
            {/* Billetera */}
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Wallet className="w-4 h-4 text-white" />
              <span className="text-white font-medium">${displayBalance}</span>
            </button>

            {/* Mis Apuestas */}
            <button
              onClick={() => navigate("/bets")}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Dices className="w-4 h-4 text-white" />
              <span className="text-white font-medium">{activeBetsCount}</span>
            </button>

            {customActions}
          </div>
        </div>

        {/* Panel de notificaciones simple (sin componente complejo) */}
        {showNotifications && (
          <div className="absolute right-4 top-16 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto p-4">
              <p className="text-center text-gray-500">
                Sistema de notificaciones básico
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default UserHeader;
