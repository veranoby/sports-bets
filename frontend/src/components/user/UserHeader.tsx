// frontend/src/components/user/UserHeader.tsx
// 🎨 HEADER ATRACTIVO - Con datos reales y diseño mejorado

import React, { useState, useEffect } from "react";
import { Bell, LogOut, Wifi, WifiOff, Sun, Moon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useWallet, useBets } from "../../hooks/useApi";
import {
  getUserThemeClasses,
  useUserTheme,
} from "../../contexts/UserThemeContext";
import { useNavigate } from "react-router-dom";

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
    <header className="bg-gradient-theme-header border-b border-theme-primary sticky top-0 z-50 backdrop-blur-sm">
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
                <p className="text-bold text-gray-300">{getGreeting()} !</p>
              )}
            </div>
            {/* User Chip - Mejorado */}

            {title !== "Mi Perfil" && (
              <button
                onClick={handleUserClick}
                className="flex items-center gap-3 bg-gradient-theme-user-button px-4 py-2 rounded-xl hover:bg-gradient-theme-user-button-hover transition-all duration-300 shadow-lg hover:shadow-xl"
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
                    <div
                      className={`w-2 h-2 rounded-full ${getRoleLabel().color}`}
                    ></div>
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
            {/* Balance Quick View */}
            {wallet && (
              <div className="hidden sm:flex items-center gap-2 bg-[#1a1f37]/50 px-3 py-1.5 rounded-lg border border-[#596c95]/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-400">
                  ${Number(wallet.balance || 0).toFixed(0)}
                </span>
              </div>
            )}

            {/* Connection Status - Chip Mejorado */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
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

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-[#1a1f37]/50 border border-[#596c95]/30 hover:bg-[#596c95]/20 transition-all duration-300 text-gray-400 hover:text-white"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#cd6263] text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#2a325c] border border-[#596c95]/30 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm">
                  <div className="p-4 bg-gradient-to-r from-[#596c95]/10 to-[#cd6263]/10">
                    <h3 className="text-sm font-medium text-white mb-3">
                      Notificaciones
                    </h3>

                    {unreadCount > 0 ? (
                      <div className="space-y-3">
                        {bets
                          ?.filter((bet) => bet.status === "active")
                          .slice(0, 3)
                          .map((bet) => (
                            <div
                              key={bet.id}
                              className="flex items-start gap-3 p-3 bg-[#1a1f37]/50 rounded-lg"
                            >
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">
                                  Apuesta activa:{" "}
                                  {bet.eventName || "Evento sin nombre"}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  ${bet.amount} -{" "}
                                  {bet.side === "red" ? "Rojo" : "Azul"}
                                </p>
                              </div>
                            </div>
                          ))}

                        {bets
                          ?.filter((bet) => bet.result === "win")
                          .slice(0, 2)
                          .map((bet) => (
                            <div
                              key={bet.id}
                              className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg"
                            >
                              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">
                                  ¡Ganaste!{" "}
                                  {bet.eventName || "Evento sin nombre"}
                                </p>
                                <p className="text-green-400 text-xs">
                                  +${bet.payout?.toFixed(2) || bet.amount}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">
                          No hay notificaciones nuevas
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
