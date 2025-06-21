// frontend/src/components/user/UserHeader.tsx - RESTAURADO ATRACTIVO MOBILE-FIRST
// ===============================================================================

import React, { useState, useEffect } from "react";
import { LogOut, Wifi, WifiOff, Bell, Menu, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { useWallet, useBets } from "../../hooks/useApi";
import {
  getUserThemeClasses,
  useUserTheme,
} from "../../contexts/UserThemeContext";
import { useNavigate } from "react-router-dom";
import { Wallet, Dices, Calendar, User } from "lucide-react";
import { useWebSocketListener } from "../../hooks/useWebSocket";

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

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ REAL DATA calculado
  const unreadCount =
    bets?.filter(
      (bet) =>
        bet.status === "active" ||
        (bet.status === "settled" && bet.result === "win")
    ).length || 0;

  const activeBetsCount =
    bets?.filter((bet) => bet.status === "active").length || 0;

  // Display balance con fallback seguro
  const displayBalance = wallet?.balance ? wallet.balance.toFixed(2) : "0.00";

  // Update time cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket listeners para updates
  useWebSocketListener("wallet_updated", () => {
    fetchWallet();
  });

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getRoleInfo = () => {
    switch (user?.role) {
      case "admin":
        return {
          label: "Administrador",
          color: "from-purple-500 to-indigo-600",
        };
      case "operator":
        return { label: "Operador", color: "from-blue-500 to-cyan-600" };
      case "venue":
        return { label: "Gallera", color: "from-orange-500 to-red-600" };
      default:
        return { label: "Aficionado", color: "from-green-500 to-emerald-600" };
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotificationClick = () => {
    // Marcar notificaciones como leídas
    console.log("Notificaciones marcadas como leídas");
  };

  const roleInfo = getRoleInfo();

  return (
    <>
      {/* 🎨 HEADER PRINCIPAL - GRADIENTE ATRACTIVO */}
      <header className="fixed bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 shadow-2xl border-b border-blue-800/50 sticky top-0 z-40 backdrop-blur-md">
        <div className="px-4 py-3">
          {/* 📱 FILA SUPERIOR - USER INFO + ACTIONS */}
          <div className="flex items-center justify-between mb-3">
            {/* 👤 USER AVATAR + INFO */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                {/* Avatar con gradiente */}
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${roleInfo.color} p-1 shadow-lg`}
                >
                  <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </div>

                {/* WebSocket Status Badge */}
                <div className="absolute -bottom-1 -right-1 p-1 bg-slate-800 rounded-full">
                  {isConnected ? (
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-white font-semibold text-lg">
                    {user?.username || "Usuario"}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${roleInfo.color} text-white font-medium`}
                  >
                    {roleInfo.label}
                  </span>
                </div>
                <p className="text-blue-200 text-sm flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {getGreeting()}, {currentTime.toLocaleDateString("es-ES")}
                  </span>
                </p>
              </div>
            </div>

            {/* 🎯 ACTIONS - TODAS LAS PANTALLAS */}
            <div className="flex items-center space-x-2">
              {/* Notificaciones - siempre visible */}

              {/* Logout - siempre visible */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-all duration-200 backdrop-blur-sm group"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 text-red-300 group-hover:text-red-200" />
              </button>
            </div>
          </div>

          {/* 🎯 FILA INFERIOR - TITLE + WALLET/BETS */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{title}</h1>

            {/* 💰 WALLET + BETS - SIEMPRE VISIBLES */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate("/wallet")}
                className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Wallet className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm sm:text-base">
                  ${displayBalance}
                </span>
              </button>

              <button
                onClick={() => navigate("/bets")}
                className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Dices className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm sm:text-base">
                  {activeBetsCount}
                </span>
              </button>

              {customActions}
            </div>
          </div>
        </div>
      </header>

      {/* 📱 MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-b from-slate-900 to-blue-900 shadow-2xl">
            <div className="p-6">
              {/* Mobile User Info */}
              <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-blue-800/50">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleInfo.color} p-1`}
                >
                  <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-white font-semibold text-lg block">
                    {user?.username || "Usuario"}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${roleInfo.color} text-white`}
                  >
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    navigate("/wallet");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-6 h-6 text-white" />
                    <span className="text-white font-semibold">
                      Mi Billetera
                    </span>
                  </div>
                  <span className="text-white font-bold text-lg">
                    ${displayBalance}
                  </span>
                </button>

                <button
                  onClick={() => {
                    navigate("/bets");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <Dices className="w-6 h-6 text-white" />
                    <span className="text-white font-semibold">
                      Mis Apuestas
                    </span>
                  </div>
                  <span className="text-white font-bold text-lg">
                    {activeBetsCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    handleNotificationClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="w-6 h-6 text-white" />
                    <span className="text-white font-semibold">
                      Notificaciones
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white font-bold text-sm px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-red-500/20 hover:bg-red-500/30 rounded-2xl border border-red-500/30"
                >
                  <LogOut className="w-6 h-6 text-red-300" />
                  <span className="text-red-300 font-semibold">
                    Cerrar Sesión
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserHeader;
