// frontend/src/components/user/UserHeader.tsx - OPTIMIZADO V6 CON TAILWIND
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg text-gray-900 border-b border-gray-200">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* LEFT SIDE - LOGO Y TITLE */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Logo visible en móvil y desktop */}
            <img
              src="/src/assets/logo.png"
              alt="Logo Galleros.Net"
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">
                Galleros<span className="text-[#cd6263]">.Net</span>
              </h1>
              <span className="hidden md:block text-xs text-gray-500">
                {getPageTitle()}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER - USER GREETING */}
        <div className="hidden lg:flex items-center gap-4 text-gray-700">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#596c95]" />
            <span className="text-base font-medium">
              Hola,{" "}
              <span className="text-[#2a325c]">
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
          </div>

          {/* Role badge with premium indicator */}
          <span
            onClick={() => navigate("/profile")}
            className="text-xs px-3 py-1.5 bg-[#f0f9ff] rounded-full text-[#2a325c] flex items-center gap-1.5 cursor-pointer hover:bg-[#8ba3bc7e]/30 transition-all duration-200 border border-[#bdd5ef75]"
          >
            <span className="font-medium uppercase tracking-wide">
              {user.role}
            </span>
            {isPremium && (
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {subscription?.type === 'daily' ? '24 HORAS' : subscription?.type === 'monthly' ? 'MENSUAL' : 'PREMIUM'}
              </span>
            )}
          </span>

          {/* Role-specific info chips */}
          {user.role === "user" && isBettingEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1.5 font-medium">
                <Trophy className="w-3.5 h-3.5" />
                <span>Apuestas Activas: {activeBetsCount}</span>
              </span>
            </div>
          )}

          {(user.role === "gallera" || user.role === "venue") && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded-full flex items-center gap-1.5 font-medium">
                <Newspaper className="w-3.5 h-3.5" />
                <span>Artículos: {publishedArticles}</span>
              </span>
            </div>
          )}

          {user.role === "admin" && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full flex items-center gap-1.5 font-medium">
                <Settings className="w-3.5 h-3.5" />
                <span>Estado: OK</span>
              </span>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - ACTIONS */}
        <div className="flex items-center gap-2">
          {/* WALLET BALANCE */}
          {isWalletEnabled && (
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 px-3 py-2 h-10 bg-white hover:bg-[#f0f9ff] group border border-[#bdd5ef75] rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-800">
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-full bg-gray-300 animate-pulse"></span>
                    ...
                  </span>
                ) : (
                  `${walletBalance.toFixed(2)}`
                )}
              </span>
            </button>
          )}

          <SubscriptionStatus subscription={subscription} />

          {/* ACTIVE BETS */}
          {isBettingEnabled && (
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowBets(!showBets)}
                className="flex items-center gap-2 px-3 py-2 h-10 bg-white border border-[#bdd5ef75] rounded-lg hover:bg-[#f0f9ff] transition-all duration-200 shadow-sm hover:shadow-md relative"
              >
                <Trophy className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">
                  {isLoading ? "..." : activeBetsCount}
                </span>
                {activeBetsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-white text-[0.6rem] items-center justify-center">
                      {activeBetsCount > 9 ? "9+" : activeBetsCount}
                    </span>
                  </span>
                )}
              </button>

              {/* ACTIVE BETS DROPDOWN */}
              {showBets && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-2xl z-50 overflow-hidden border border-gray-200 rounded-xl">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-blue-600" />
                        Apuestas Activas
                      </h3>
                      <button
                        onClick={() => setShowBets(false)}
                        className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-200"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {activeBets.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50 text-blue-600" />
                        <p className="text-sm font-medium">
                          No tienes apuestas activas
                        </p>
                        <p className="text-xs mt-1">
                          Las apuestas aparecerán aquí cuando las crees
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="p-3 space-y-2">
                          {activeBets.slice(0, 5).map((bet) => (
                            <div
                              key={bet.id}
                              className="p-3 hover:bg-blue-50 rounded-lg transition-all duration-150 border border-transparent hover:border-blue-200"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bet.side === "red" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}
                                    >
                                      {bet.side === "red" ? "🔴" : "🔵"}
                                    </span>
                                    <span>${bet.amount}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 capitalize">
                                    {bet.status}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(bet.createdAt).toLocaleDateString(
                                    "es-ES",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3">
                      <button
                        onClick={() => {
                          navigate("/bets");
                          setShowBets(false);
                        }}
                        className="w-full p-2.5 text-center text-[#596c95] hover:bg-[#596c95] bg-white hover:text-white rounded-lg transition-all duration-200 text-sm font-medium border border-[#596c95] hover:border-[#596c95]"
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
              className="flex items-center justify-center p-2.5 h-10 bg-white border border-[#bdd5ef75] rounded-lg hover:bg-[#f0f9ff] transition-all duration-200 shadow-sm hover:shadow-md relative"
            >
              <Bell className="w-4 h-4 text-yellow-600" />
              {notifications.some((n) => n.status === "unread") && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
              )}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-2xl z-50 overflow-hidden border border-gray-200 rounded-xl">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-yellow-600" />
                      Notificaciones
                    </h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-200"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50 text-yellow-400" />
                      <p className="text-sm font-medium">
                        No hay notificaciones
                      </p>
                      <p className="text-xs mt-1">
                        Las notificaciones importantes aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg transition-all duration-150 border-l-4 ${
                            notification.status === "unread"
                              ? "border-blue-500 bg-blue-50 hover:bg-blue-100"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </div>
                            </div>
                            {notification.status === "unread" && (
                              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(
                              notification.createdAt,
                            ).toLocaleDateString("es-ES", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      ))}

                      {notifications.length > 5 && (
                        <button
                          onClick={() => {
                            navigate("/notifications");
                            setShowNotifications(false);
                          }}
                          className="w-full p-2.5 text-center text-[#596c95] hover:bg-[#596c95] bg-white hover:text-white rounded-lg transition-all duration-200 text-sm font-medium border border-[#596c95] hover:border-[#596c95] mt-2"
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
            className="p-2.5 h-10 bg-white border border-[#bdd5ef75] rounded-lg hover:bg-red-500 hover:border-red-500 transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#8ba3bc7e] bg-opacity-30">
          <div className="h-full bg-[#8ba3bc7e] animate-pulse"></div>
        </div>
      )}
    </header>
  );
});

UserHeader.displayName = "UserHeader";

export default UserHeader;
