// frontend/src/components/user/UserHeader.tsx - OPTIMIZADO V9
// =================================================================
// ELIMINADO: useHeaderData hook redundante
// IMPLEMENTADO: WebSocket + fetch inicial directo
// OPTIMIZADO: Memory leaks prevention, performance mejorada

import React, {
  memo,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
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
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { apiClient } from "../../config/api";

// 📝 TIPOS LOCALES - DEFINIDOS AQUÍ PARA EVITAR IMPORTS EXTRA
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

interface HeaderData {
  walletBalance: number;
  activeBets: ActiveBet[];
  notifications: HeaderNotification[];
}

// 🎯 COMPONENTE DE DROPDOWN DE APUESTAS - MEMOIZADO
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
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
          <div className="divide-y divide-gray-100">
            {activeBets.map((bet) => (
              <div
                key={bet.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {bet.eventName}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {bet.fighters.red} vs {bet.fighters.blue}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bet.side === "red"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {bet.side === "red" ? "Rojo" : "Azul"}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        ${bet.amount}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bet.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {bet.status === "active" ? "Activa" : "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleNavigateToBets}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Ver Todas las Apuestas
        </button>
      </div>
    </div>
  );
});

BetsDropdown.displayName = "BetsDropdown";

// 🔔 COMPONENTE DE DROPDOWN DE NOTIFICACIONES - MEMOIZADO
const NotificationsPanel = memo<{
  notifications: HeaderNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}>(({ notifications, onClose, onMarkAsRead, onMarkAllAsRead }) => {
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "bet_win":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "bet_loss":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "wallet":
        return <Wallet className="w-4 h-4 text-blue-500" />;
      case "news":
        return <Bell className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  }, []);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          <div className="flex gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={onMarkAllAsRead}
                className="text-blue-500 hover:text-blue-600 text-sm transition-colors"
              >
                Marcar todas
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay notificaciones nuevas
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
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

// 🏠 COMPONENTE PRINCIPAL - USERHEADER OPTIMIZADO
const UserHeader = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // 📊 ESTADO LOCAL PARA DATOS DEL HEADER - REEMPLAZA useHeaderData
  const [headerData, setHeaderData] = useState<HeaderData>({
    walletBalance: 0,
    activeBets: [],
    notifications: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [showBets, setShowBets] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Referencias para prevenir re-fetches
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  // 📥 FETCH INICIAL - REEMPLAZA POLLING DE useHeaderData
  const fetchInitialData = useCallback(async () => {
    try {
      setError(null);

      const [walletRes, betsRes, notificationsRes] = await Promise.all([
        apiClient.get("/wallets/my-wallet"),
        apiClient.get("/bets/my-bets", {
          params: { status: "active", limit: 5 },
        }),
        apiClient.get("/notifications", {
          params: { limit: 20 },
        }),
      ]);

      if (isMountedRef.current) {
        setHeaderData({
          walletBalance: walletRes.data.data?.balance || 0,
          activeBets: betsRes.data.data || [],
          notifications: notificationsRes.data.data || [],
        });
        lastFetchRef.current = Date.now();
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error("Error fetching header data:", err);
        setError(err.message || "Error loading data");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // 🎧 WEBSOCKET LISTENERS - REEMPLAZA POLLING
  useWebSocketListener<{ balance: number; frozenAmount: number }>(
    "wallet_updated",
    useCallback((data) => {
      if (!isMountedRef.current) return;
      setHeaderData((prev) => ({
        ...prev,
        walletBalance: data.balance,
      }));
    }, [])
  );

  useWebSocketListener<{ bet: ActiveBet }>(
    "bet_created",
    useCallback((data) => {
      if (!isMountedRef.current) return;
      setHeaderData((prev) => ({
        ...prev,
        activeBets: [data.bet, ...prev.activeBets.slice(0, 4)],
      }));
    }, [])
  );

  useWebSocketListener<{ betId: string }>(
    "bet_completed",
    useCallback((data) => {
      if (!isMountedRef.current) return;
      setHeaderData((prev) => ({
        ...prev,
        activeBets: prev.activeBets.filter((bet) => bet.id !== data.betId),
      }));
    }, [])
  );

  useWebSocketListener<{ notification: HeaderNotification }>(
    "new_notification",
    useCallback((data) => {
      if (!isMountedRef.current) return;
      setHeaderData((prev) => ({
        ...prev,
        notifications: [data.notification, ...prev.notifications.slice(0, 19)],
      }));
    }, [])
  );

  // 🏗️ INICIALIZACIÓN - SOLO FETCH INICIAL
  useEffect(() => {
    isMountedRef.current = true;
    fetchInitialData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchInitialData]);

  // 📝 FUNCIONES DE NOTIFICACIONES
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);

      setHeaderData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await apiClient.put("/notifications/read-all");

      setHeaderData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      }));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  // 🔄 REFRESH MANUAL
  const handleRefresh = useCallback(() => {
    if (Date.now() - lastFetchRef.current < 5000) {
      console.log("⏳ Refresh muy reciente, omitiendo...");
      return;
    }
    fetchInitialData();
  }, [fetchInitialData]);

  // 📊 VALORES COMPUTADOS
  const activeBetsCount = headerData.activeBets.length;
  const unreadNotificationsCount = headerData.notifications.filter(
    (n) => !n.read
  ).length;

  // 🎯 HANDLERS DE UI
  const toggleBets = useCallback(() => {
    setShowBets((prev) => !prev);
    setShowNotifications(false);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((prev) => !prev);
    setShowBets(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, [logout, navigate]);

  // 🖱️ CLICK OUTSIDE HANDLER
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

  // 📱 MEMOIZAR TÍTULO DE PÁGINA
  const getPageTitle = useMemo(() => {
    const pathToTitle: Record<string, string> = {
      "/dashboard": "Inicio",
      "/events": "Eventos",
      "/wallet": "Billetera",
      "/profile": "Perfil",
      "/bets": "Apuestas",
    };
    return pathToTitle[location.pathname] || "GalloBets";
  }, [location.pathname]);

  if (!user) return null;

  if (loading) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 h-16 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* 👈 LADO IZQUIERDO - TÍTULO */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {getPageTitle}
          </h1>
          <button
            onClick={handleRefresh}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 👉 LADO DERECHO - ACCIONES */}
        <div className="flex items-center gap-4">
          {/* 💰 BILLETERA */}
          <button
            onClick={() => navigate("/wallet")}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            <span className="font-medium text-sm">
              ${headerData.walletBalance.toFixed(2)}
            </span>
          </button>

          {/* 🎯 APUESTAS ACTIVAS */}
          <div className="relative dropdown-container">
            <button
              onClick={toggleBets}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span className="font-medium text-sm">{activeBetsCount}</span>
            </button>

            {showBets && (
              <BetsDropdown
                activeBets={headerData.activeBets}
                onClose={() => setShowBets(false)}
              />
            )}
          </div>

          {/* 🔔 NOTIFICACIONES */}
          <div className="relative dropdown-container">
            <button
              onClick={toggleNotifications}
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotificationsCount > 9
                    ? "9+"
                    : unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationsPanel
                notifications={headerData.notifications}
                onClose={() => setShowNotifications(false)}
                onMarkAsRead={markNotificationAsRead}
                onMarkAllAsRead={markAllNotificationsAsRead}
              />
            )}
          </div>

          {/* 👤 PERFIL + LOGOUT */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <span className="text-sm text-gray-600">
              Hola,{" "}
              <span className="font-medium text-gray-900">{user.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ⚠️ ERROR BANNER */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Error cargando datos: {error}</span>
            <button
              onClick={handleRefresh}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </header>
  );
});

UserHeader.displayName = "UserHeader";

export default UserHeader;
