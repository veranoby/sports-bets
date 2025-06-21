// frontend/src/components/user/UserHeader.tsx
// NUEVO COMPONENTE OPTIMIZADO DESDE CERO

import React, { memo, useState, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Wallet,
  Trophy,
  Bell,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useHeaderData } from "../../hooks/useHeaderData";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { apiClient } from "../../config/api";

// Tipos locales
interface HeaderNotification {
  id: string;
  type: "bet_win" | "bet_loss" | "wallet" | "news" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface ActiveBet {
  id: string;
  eventName: string;
  fighters: { red: string; blue: string };
  side: "red" | "blue";
  amount: number;
  status: "active" | "pending";
  createdAt: string;
}

// Componente de Dropdown de Apuestas
const BetsDropdown = memo<{
  activeBets: ActiveBet[];
  onClose: () => void;
}>(({ activeBets, onClose }) => {
  const navigate = useNavigate();

  const handleNavigateToBets = useCallback(() => {
    navigate("/bets");
    onClose();
  }, [navigate, onClose]);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Apuestas Activas</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {activeBets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tienes apuestas activas
          </div>
        ) : (
          <div className="p-2">
            {activeBets.slice(0, 5).map((bet) => (
              <div
                key={bet.id}
                className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer mb-1"
                onClick={handleNavigateToBets}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {bet.fighters.red} vs {bet.fighters.blue}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {bet.eventName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${bet.amount}
                    </p>
                    <p
                      className={`text-xs ${
                        bet.side === "red" ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {bet.side === "red" ? "Rojo" : "Azul"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeBets.length > 0 && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleNavigateToBets}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todas las apuestas →
          </button>
        </div>
      )}
    </div>
  );
});

BetsDropdown.displayName = "BetsDropdown";

// Componente de Panel de Notificaciones
const NotificationsPanel = memo<{
  notifications: HeaderNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}>(({ notifications, onClose, onMarkAsRead }) => {
  const getNotificationIcon = (type: HeaderNotification["type"]) => {
    switch (type) {
      case "bet_win":
        return <Trophy className="text-green-500" size={20} />;
      case "bet_loss":
        return <X className="text-red-500" size={20} />;
      case "wallet":
        return <Wallet className="text-blue-500" size={20} />;
      case "news":
        return <TrendingUp className="text-purple-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay notificaciones nuevas
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(notification.timestamp, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

NotificationsPanel.displayName = "NotificationsPanel";

// COMPONENTE PRINCIPAL
const UserHeader = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Usar hook optimizado para datos
  const {
    walletBalance,
    activeBets,
    activeBetsCount,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    loading,
  } = useHeaderData();

  // Estados locales solo para UI
  const [showBets, setShowBets] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Título de página memoizado
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      "/": "Dashboard",
      "/events": "Eventos",
      "/wallet": "Billetera",
      "/bets": "Mis Apuestas",
      "/profile": "Mi Perfil",
      "/venues": "Galleras",
      "/news": "Noticias",
    };
    return titles[path] || "GalloBets";
  }, [location.pathname]);

  // Handlers optimizados
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, [logout, navigate]);

  const handleWalletClick = useCallback(() => {
    navigate("/wallet");
  }, [navigate]);

  const toggleBets = useCallback(() => {
    setShowBets((prev) => !prev);
    setShowNotifications(false);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((prev) => !prev);
    setShowBets(false);
  }, []);

  const handleMarkAsRead = useCallback(
    (id: string) => {
      markNotificationAsRead(id);
    },
    [markNotificationAsRead]
  );

  // Datos mock para demostración (reemplazar con API real)
  const mockActiveBets: ActiveBet[] = useMemo(
    () => [
      {
        id: "1",
        eventName: "Clásico de Verano",
        fighters: { red: "Gallo Rojo", blue: "Gallo Azul" },
        side: "red",
        amount: 50,
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ],
    []
  );

  // Fetch de datos con polling controlado (cada 30 segundos)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Aquí irían las llamadas reales a la API
        // const walletResponse = await api.get('/wallets/my-wallet');
        // setWalletBalance(walletResponse.data.balance);

        // Mock data
        setWalletBalance(500.5);
        setActiveBetsCount(mockActiveBets.length);
      } catch (error) {
        console.error("Error fetching header data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [mockActiveBets.length]);

  // Contar notificaciones no leídas
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Click outside para cerrar dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setShowBets(false);
        setShowNotifications(false);
      }
    };

    if (showBets || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showBets, showNotifications]);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Lado izquierdo - Título y usuario */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <span>Hola,</span>
            <span className="font-medium">{user.username}</span>
          </div>
        </div>

        {/* Lado derecho - Acciones */}
        <div className="flex items-center gap-2">
          {/* Apuestas */}
          <div className="relative dropdown-container">
            <button
              onClick={toggleBets}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Mis Apuestas"
            >
              <Trophy className="w-5 h-5 text-gray-600" />
              {activeBetsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeBetsCount}
                </span>
              )}
            </button>
            {showBets && (
              <BetsDropdown
                activeBets={activeBets}
                onClose={() => setShowBets(false)}
              />
            )}
          </div>

          {/* Billetera */}
          <button
            onClick={handleWalletClick}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Mi Billetera"
          >
            <Wallet className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">
              ${loading ? "..." : walletBalance.toFixed(2)}
            </span>
          </button>

          {/* Notificaciones */}
          <div className="relative dropdown-container">
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotificationsCount > 9
                    ? "9+"
                    : unreadNotificationsCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationsPanel
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkAsRead={handleMarkAsRead}
              />
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-2"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
});

UserHeader.displayName = "UserHeader";

export default UserHeader;
