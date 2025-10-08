// frontend/src/components/user/UserHeader.tsx - OPTIMIZADO V5 CON TAILWIND
// ================================================================
// ELIMINADO: Botón refresh, mock data, fetchHeaderData custom
// IMPLEMENTADO: useWallet(), useNotifications(), useBets() hooks
// MEJORADO: Utilidades de Tailwind CSS como prioridad, degradado elegante, Galleros.Net logo

import React, { memo, useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Wallet,
  Trophy,
  Bell,
  X,
  User,
  Crown,
  Newspaper,
  Settings,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet, useNotifications, useBets } from "../../hooks/useApi";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import { useSubscription } from "../../hooks/useSubscription";
import SubscriptionStatus from "../subscriptions/SubscriptionStatus";
import { articlesAPI } from "../../config/api";

const UserHeader = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ✅ HOOKS REALES (No mock data)
  const { wallet, loading: walletLoading, fetchWallet } = useWallet();
  const {
    notifications,
    loading: notificationsLoading,
    fetchNotifications,
  } = useNotifications();
  const { bets, loading: betsLoading, fetchMyBets } = useBets();
  const { subscription, isPremium } = useSubscription();

  const { isWalletEnabled, isBettingEnabled } = useFeatureFlags();

  // Estados UI
  const [showBets, setShowBets] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [publishedArticles, setPublishedArticles] = useState(0);

  // ✅ DATOS COMPUTADOS CON HOOKS REALES
  const activeBets = bets?.filter((bet) => bet.status === "active") || [];

  const activeBetsCount = activeBets.length;
  // const unreadNotificationsCount = unreadNotifications.length; // reserved for future UI
  const walletBalance = Number(wallet?.balance || 0);

  // 🔔 WALLET UPDATES - Para balance en header
  useWebSocketListener(
    "wallet_updated",
    useCallback(() => {
      fetchWallet();
    }, [fetchWallet]),
  );

  // 🎯 BET UPDATES - Para contador apuestas en header
  useWebSocketListener(
    "bet_matched",
    useCallback(() => {
      fetchMyBets();
    }, [fetchMyBets]),
  );

  useWebSocketListener(
    "bet_result",
    useCallback(() => {
      fetchMyBets();
    }, [fetchMyBets]),
  );

  // 🔔 NOTIFICATIONS - Para contador notificaciones en header
  useWebSocketListener(
    "new_notification",
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  // 📄 Published articles count for venue/gallera
  useEffect(() => {
    const fetchPublished = async () => {
      if (!user || (user.role !== "venue" && user.role !== "gallera")) return;
      try {
        const res = await articlesAPI.getAll({
          author_id: user.id,
          status: "published",
          limit: 10,
        });
        const count = Array.isArray(res.data?.articles)
          ? res.data.articles.length
          : 0;
        setPublishedArticles(count);
      } catch {
        setPublishedArticles(0);
      }
    };
    fetchPublished();
  }, [user]);

  // Page title mapping
  const getPageTitle = useCallback(() => {
    const pathToTitle: Record<string, string> = {
      "/dashboard": "Inicio",
      "/events": "Eventos",
      "/wallet": "Billetera",
      "/profile": "Perfil",
      "/bets": "Apuestas",
    };
    return pathToTitle[location.pathname] || "Dashboard";
  }, [location.pathname]);

  // Handlers
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, [logout, navigate]);

  // Click outside handler para cerrar dropdowns
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

  const isLoading = walletLoading || notificationsLoading || betsLoading;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg shadow-lg text-gray-900">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* LEFT SIDE - LOGO Y TITLE */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Oculta en móvil, muestra en desktop */}
            <img
              src="/src/assets/logo.png"
              alt="Logo Galleros.Net"
              className="h-10 w-10 object-contain hidden md:block"
            />
            <h1 className="text-xl md:text-2xl font-bold">
              Galleros<span className="text-[#cd6263]">.Net</span>
            </h1>
            <div className="w-px h-6 bg-gray-900 opacity-30"></div>
            <span className="hidden md:text-lg font-medium">
              {getPageTitle()}
            </span>
          </div>
        </div>

        {/* CENTER - USER GREETING */}
        <div className="hidden md:flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span className="text-md">
            Hola,{" "}
            <span className="font-medium text-gray-900">
              {user.role === "venue"
                ? user.profileInfo?.venueName ||
                  user.profileInfo?.businessName ||
                  user.username
                : user.role === "gallera"
                  ? user.profileInfo?.galleraName ||
                    user.profileInfo?.businessName ||
                    user.username
                  : user.username}
            </span>
          </span>
          <span
            onClick={() => navigate("/profile")}
            className="text-xs px-2 py-1 bg-[#f0f9ff] rounded-full text-gray-900 flex items-center gap-1 cursor-pointer hover:bg-[#8ba3bc7e]/20"
          >
            {user.role}
            {isPremium && (
              <>
                <Crown className="w-3 h-3" />
                <span>PREMIUM</span>
              </>
            )}
          </span>
          {/* Role-specific info */}
          {user.role === "user" && isBettingEnabled && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>Apuestas Activas: {activeBetsCount}</span>
            </span>
          )}

          {(user.role === "gallera" || user.role === "venue") && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
              <Newspaper className="w-3 h-3" />
              <span>Artículos publicados: {publishedArticles}</span>
            </span>
          )}
          {user.role === "admin" && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Estado del Sistema: OK</span>{" "}
              {/* Placeholder for system status */}
              {/* <span>Aprobaciones Pendientes: P</span> Placeholder for pending approvals */}
            </span>
          )}
        </div>

        {/* RIGHT SIDE - ACTIONS */}
        {/* WALLET BALANCE */}
        <div className="flex items-center gap-3">
          {isWalletEnabled && (
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 px-3 py-2 h-10 bg-white hover:bg-[#f0f9ff] group border border-[#bdd5ef75] rounded-lg"
            >
              <Wallet className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold">
                {isLoading ? "..." : `${walletBalance.toFixed(2)}`}
              </span>
            </button>
          )}

          <SubscriptionStatus subscription={subscription} />

          {/* ACTIVE BETS */}
          {isBettingEnabled && (
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowBets(!showBets)}
                className="flex items-center gap-2 px-3 py-2 h-10 bg-white border border-[#bdd5ef75] rounded-lg hover:bg-[#f0f9ff] transition-colors"
              >
                <Trophy className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold">
                  {isLoading ? "..." : activeBetsCount}
                </span>
              </button>

              {/* ACTIVE BETS DROPDOWN */}
              {showBets && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-xl z-50 overflow-hidden border border-[#bdd5ef75] rounded-lg">
                  <div className="p-4 bg-white border-b border-[#bdd5ef75]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Apuestas Activas
                      </h3>
                      <button
                        onClick={() => setShowBets(false)}
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {activeBets.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tienes apuestas activas</p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="p-2 flex-1 overflow-y-auto">
                          {activeBets.slice(0, 5).map((bet) => (
                            <div
                              key={bet.id}
                              className="p-3 hover:bg-[#f0f9ff] rounded-lg transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    ${bet.amount} -{" "}
                                    {bet.side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {bet.status}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(bet.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="sticky bottom-0   p-2">
                      <button
                        onClick={() => navigate("/bets")}
                        className="w-full p-2 text-center text-[#8ba3bc7e] hover:bg-[#8ba3bc7e] bg-[#f0f9ff] rounded-lg transition-colors text-sm"
                      >
                        Ver todas las apuestas ({activeBets.length})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center justify-center p-2 h-10 bg-white border border-[#bdd5ef75] rounded-lg hover:bg-[#f0f9ff] transition-colors relative"
            >
              <Bell className="w-4 h-4 text-yellow-500" />
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-xl z-50 overflow-hidden border border-[#bdd5ef75] rounded-lg">
                <div className="p-4 bg-white border-b border-[#bdd5ef75]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Notificaciones
                    </h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-[#f0f9ff] rounded-lg transition-colors border-l-2 
                                     ${
                                       notification.status === "unread"
                                         ? "border-blue-500 bg-blue-500 bg-opacity-10"
                                         : "border-transparent"
                                     }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {notification.message}
                              </div>
                            </div>
                            {notification.status === "unread" && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}

                      {notifications.length > 5 && (
                        <button
                          onClick={() => navigate("/notifications")}
                          className="w-full p-2 text-center text-[#8ba3bc7e] hover:bg-[#f0f9ff] rounded-lg transition-colors text-sm"
                        >
                          Ver todas las notificaciones
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="p-2 h-10 bg-white border border-[#bdd5ef75] rounded-lg hover:bg-red-500 hover:border-red-500 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#8ba3bc7e] bg-opacity-20">
          <div className="h-full bg-[#8ba3bc7e] animate-pulse"></div>
        </div>
      )}
    </header>
  );
});

UserHeader.displayName = "UserHeader";

export default UserHeader;
