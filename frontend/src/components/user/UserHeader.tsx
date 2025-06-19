// frontend/src/components/user/UserHeader.tsx
// 🎨 HEADER ATRACTIVO - Con datos reales y diseño mejorado

import React, { useState, useEffect } from "react";
import { LogOut, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useWallet, useBets } from "../../hooks/useApi";
import {
  getUserThemeClasses,
  useUserTheme,
} from "../../contexts/UserThemeContext";
import { useNavigate } from "react-router-dom";
import NotificationBadge from "../shared/NotificationBadge";
import { Wallet, Dices } from "lucide-react";
import NotificationCenter from "../shared/NotificationCenter";
import ProposalNotifications from "./ProposalNotifications";

interface UserHeaderProps {
  title: string;
  customActions?: React.ReactNode;
}

const UserHeader: React.FC<UserHeaderProps> = ({ title, customActions }) => {
  const { user, logout } = useAuth();
  const { wallet } = useWallet();
  const { bets } = useBets();
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();
  const theme = getUserThemeClasses();
  const { updateColors } = useUserTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProposals, setShowProposals] = useState(false);

  // ✅ REAL DATA - Notificaciones basadas en apuestas activas
  const unreadCount =
    bets?.filter(
      (bet) =>
        bet.status === "active" ||
        (bet.status === "settled" && bet.result === "win")
    ).length || 0;

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const handleUserClick = () => navigate("/profile");
  const handleLogout = () => logout();

  return (
    <header
      className={`${theme.gradientHeader} border-b border-theme-primary sticky top-0 z-50 backdrop-blur-sm`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Title & Greeting */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {title}
                {customActions}
              </h1>
              {title === "Dashboard" && (
                <p className="text-bold text-gray-300">{getGreeting()}</p>
              )}
            </div>
            {/* User Chip - Mejorado */}

            {title !== "Mi Perfil" && (
              <button
                onClick={handleUserClick}
                className={`flex items-center gap-3 ${theme.gradientUserButton} px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl`}
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-sm font-bold">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-sm font-medium leading-tight">
                    {user?.username || "Usuario"}
                  </p>
                  <div className="flex items-center gap-1">
                    {/* Connection Status - Chip Mejorado */}

                    <div
                      className={`w-3 h-3 rounded-full  ${
                        isConnected
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isConnected ? (
                        <Wifi className="w-3 h-3" />
                      ) : (
                        <WifiOff className="w-3 h-3" />
                      )}
                    </div>

                    <span className="text-white/80 text-xs">
                      {getRoleLabel().label}
                    </span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Right Side - User Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowProposals(!showProposals)}
                className="p-2 relative"
                aria-label="Propuestas PAGO"
              >
                <Dices className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
              {showProposals && (
                <div className="absolute right-0 mt-2 w-72 bg-[#2a325c] rounded-lg shadow-lg z-50">
                  <ProposalNotifications />
                </div>
              )}
            </div>

            {/* Balance Quick View */}
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-1 text-white hover:text-theme-primary p-2"
              aria-label="Wallet"
            >
              <Wallet className="w-6 h-6" />
              <span className="font-medium text-sm hidden sm:inline">
                ${Number(wallet?.balance || 0).toFixed(0)}
              </span>
            </button>

            {/* Notifications Bell */}
            <button>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <NotificationCenter />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300 text-red-400 hover:text-red-300"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
