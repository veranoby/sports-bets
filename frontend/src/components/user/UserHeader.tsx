// frontend/src/components/user/UserHeader.tsx - FIXED V10
// ===============================================================
// FIXED: Remove WebSocket listeners (let Dashboard handle them)
// FIXED: Add default values for arrays to prevent .map errors
// OPTIMIZED: Simplified data fetching without polling

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
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
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

interface HeaderData {
  walletBalance: number;
  activeBets: ActiveBet[];
  notifications: HeaderNotification[];
}

// ✅ FIXED: Add default values to prevent array errors
const initialData: HeaderData = {
  walletBalance: 0,
  activeBets: [],
  notifications: [],
};

const UserHeader = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ✅ FIXED: Use state with proper defaults
  const [headerData, setHeaderData] = useState<HeaderData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBets, setShowBets] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isMountedRef = useRef(true);

  // ✅ SIMPLIFIED: Single fetch function with error handling
  const fetchHeaderData = useCallback(async () => {
    try {
      setError(null);
      const [walletRes, betsRes, notificationsRes] = await Promise.all([
        apiClient
          .get("/wallets/my-wallet")
          .catch(() => ({ data: { balance: 0 } })),
        apiClient
          .get("/bets/my-bets", { params: { status: "active", limit: 5 } })
          .catch(() => ({ data: [] })),
        apiClient
          .get("/notifications", { params: { limit: 20 } })
          .catch(() => ({ data: [] })),
      ]);

      if (isMountedRef.current) {
        setHeaderData({
          walletBalance: walletRes.data?.balance || 0,
          activeBets: Array.isArray(betsRes.data) ? betsRes.data : [],
          notifications: Array.isArray(notificationsRes.data)
            ? notificationsRes.data
            : [],
        });
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || "Error loading data");
        setHeaderData(initialData);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ INITIALIZATION: Only initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchHeaderData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchHeaderData]);

  // ✅ SAFE: Computed values with fallbacks
  const activeBetsCount = headerData.activeBets?.length || 0;
  const unreadNotificationsCount =
    headerData.notifications?.filter((n) => !n.read)?.length || 0;

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

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, [logout, navigate]);

  // ✅ CLICK OUTSIDE HANDLER
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
        {/* LEFT SIDE - TITLE */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {getPageTitle}
          </h1>
          <button
            onClick={fetchHeaderData}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT SIDE - ACTIONS */}
        <div className="flex items-center gap-4">
          {/* WALLET */}
          <button
            onClick={() => navigate("/wallet")}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            <span className="font-medium text-sm">
              ${headerData.walletBalance.toFixed(2)}
            </span>
          </button>

          {/* ACTIVE BETS */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowBets(!showBets)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span className="font-medium text-sm">{activeBetsCount}</span>
            </button>

            {/* ✅ FIXED: Safe array rendering */}
            {showBets && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Apuestas Activas
                    </h3>
                    <button
                      onClick={() => setShowBets(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {headerData.activeBets?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No tienes apuestas activas
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {(headerData.activeBets || []).map((bet) => (
                        <div key={bet.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {bet.eventName}
                              </p>
                              <p className="text-gray-600 text-xs mt-1">
                                {bet.fighters?.red} vs {bet.fighters?.blue}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              ${bet.amount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      navigate("/bets");
                      setShowBets(false);
                    }}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                  >
                    Ver Todas las Apuestas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* NOTIFICATIONS */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
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
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Notificaciones
                    </h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {!headerData.notifications ||
                  headerData.notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No hay notificaciones nuevas
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {headerData.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-50"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PROFILE + LOGOUT */}
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

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Error cargando datos: {error}</span>
            <button
              onClick={fetchHeaderData}
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
