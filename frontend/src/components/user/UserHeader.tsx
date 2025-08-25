// frontend/src/components/user/UserHeader.tsx - OPTIMIZADO V5
// ================================================================
// ELIMINADO: Botón refresh, mock data, fetchHeaderData custom
// IMPLEMENTADO: useWallet(), useNotifications(), useBets() hooks
// MEJORADO: Variables CSS globales, degradado elegante, GalloBets logo

import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Wallet,
  Trophy,
  Bell,
  X,
  AlertCircle,
  User,
  Crown,
  Building2,
  Newspaper,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet, useNotifications, useBets } from "../../hooks/useApi";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import { useSubscription } from "../../hooks/useSubscription";
import SubscriptionStatus from "../subscription/SubscriptionStatus";

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
  const { subscription, isPremium, hasAccess } = useSubscription();

  const { isWalletEnabled, isBettingEnabled } = useFeatureFlags();

  // Estados UI
  const [showBets, setShowBets] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ✅ DATOS COMPUTADOS CON HOOKS REALES
  const activeBets = bets?.filter((bet) => bet.status === "active") || [];
  const unreadNotifications =
    notifications?.filter((notif) => notif.status === "unread") || [];

  const activeBetsCount = activeBets.length;
  const unreadNotificationsCount = unreadNotifications.length;
  const walletBalance = Number(wallet?.balance || 0);

  // 🔔 WALLET UPDATES - Para balance en header
  useWebSocketListener(
    "wallet_updated",
    useCallback(() => {
      fetchWallet();
    }, [fetchWallet])
  );

  // 🎯 BET UPDATES - Para contador apuestas en header
  useWebSocketListener(
    "bet_matched",
    useCallback(() => {
      fetchMyBets();
    }, [fetchMyBets])
  );

  useWebSocketListener(
    "bet_result",
    useCallback(() => {
      fetchMyBets();
    }, [fetchMyBets])
  );

  // 🔔 NOTIFICATIONS - Para contador notificaciones en header
  useWebSocketListener(
    "new_notification",
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

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
    <header className="sticky top-0 z-40 bg-theme-header backdrop-blur-lg shadow-lg text-theme-primary">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* LEFT SIDE - LOGO Y TITLE */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Oculta en móvil, muestra en desktop */}
            <img
              src="/src/assets/logo.png"
              alt="Logo GalloBets"
              className="h-10 w-10 object-contain hidden md:block"
            />
            <h1 className="text-xl md:text-2xl font-bold">
              <span className="text-red-400">Gallo</span>
              <span>Bets</span>
            </h1>
            <div className="w-px h-6 bg-theme-primary opacity-30"></div>
            <span className="hidden md:text-lg font-medium">
              {getPageTitle()}
            </span>
          </div>
        </div>

        {/* CENTER - USER GREETING */}
        <div className="hidden md:flex items-center gap-2 text-theme-text-secondary">
          <User className="w-4 h-4" />
          <span className="text-md">
            Hola,{" "}
            <span className="font-medium text-theme-text-primary">
              {user.username}
            </span>
          </span>
          <span
            onClick={() => navigate("/profile")}
            className="text-xs px-2 py-1 bg-theme-accent rounded-full text-theme-text-primary flex items-center gap-1"
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
          {user.role === "venue" && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>Venues: 5</span> {/* Placeholder */}
            </span>
          )}
          {user.role === "gallera" && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
              <Newspaper className="w-3 h-3" />
              <span>Articles: 12</span> {/* Placeholder */}
            </span>
          )}
        </div>

        {/* RIGHT SIDE - ACTIONS */}
        {/* WALLET BALANCE */}
        <div className="flex items-center gap-3">
          {isWalletEnabled && (
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 px-3 py-2 h-10 bg-theme-card   hover:bg-theme-accent group border border-theme-primary rounded-lg"
            >
              <Wallet className="w-4 h-4 text-theme-success" />
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
                className="flex items-center gap-2 px-3 py-2 h-10 bg-theme-card border border-theme-primary rounded-lg hover:bg-theme-accent transition-colors"
              >
                <Trophy className="w-4 h-4 text-theme-info" />
                <span className="text-sm font-semibold">
                  {isLoading ? "..." : activeBetsCount}
                </span>
              </button>

              {/* ACTIVE BETS DROPDOWN */}
              {showBets && (
                <div className="absolute right-0 top-full mt-2 w-80 card-background shadow-xl z-50 overflow-hidden">
                  <div className="p-4 bg-theme-header border-b border-theme-primary">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-theme-text-primary">
                        Apuestas Activas
                      </h3>
                      <button
                        onClick={() => setShowBets(false)}
                        className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {activeBets.length === 0 ? (
                      <div className="p-4 text-center text-theme-text-secondary">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tienes apuestas activas</p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="p-2 flex-1 overflow-y-auto">
                          {activeBets.slice(0, 5).map((bet) => (
                            <div
                              key={bet.id}
                              className="p-3 hover:bg-theme-accent rounded-lg transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-theme-text-primary text-sm">
                                    ${bet.amount} -{" "}
                                    {bet.side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                                  </div>
                                  <div className="text-xs text-theme-text-secondary">
                                    {bet.status}
                                  </div>
                                </div>
                                <div className="text-xs text-theme-text-secondary">
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
                        className="w-full p-2 text-center text-theme-primary hover:bg-theme-primary bg-theme-accent rounded-lg transition-colors text-sm"
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
              className="flex items-center justify-center p-2 h-10 bg-theme-card border border-theme-primary rounded-lg hover:bg-theme-accent transition-colors relative"
            >
              <Bell className="w-4 h-4 text-theme-warning" />
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 card-background shadow-xl z-50 overflow-hidden">
                <div className="p-4 bg-theme-header border-b border-theme-primary">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-theme-text-primary">
                      Notificaciones
                    </h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-theme-text-secondary">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-theme-accent rounded-lg transition-colors border-l-2 
                                     ${
                                       notification.status === "unread"
                                         ? "border-theme-info bg-theme-info bg-opacity-10"
                                         : "border-transparent"
                                     }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-theme-text-primary text-sm">
                                {notification.title}
                              </div>
                              <div className="text-xs text-theme-text-secondary mt-1">
                                {notification.message}
                              </div>
                            </div>
                            {notification.status === "unread" && (
                              <div className="w-2 h-2 bg-theme-info rounded-full ml-2 mt-1"></div>
                            )}
                          </div>
                          <div className="text-xs text-theme-text-light mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}

                      {notifications.length > 5 && (
                        <button
                          onClick={() => navigate("/notifications")}
                          className="w-full p-2 text-center text-theme-primary hover:bg-theme-accent rounded-lg transition-colors text-sm"
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
            className="p-2 h-10 bg-theme-card border border-theme-primary rounded-lg hover:bg-theme-error hover:border-theme-error transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-theme-primary bg-opacity-20">
          <div className="h-full bg-theme-primary animate-pulse"></div>
        </div>
      )}
    </header>
  );
});

UserHeader.displayName = "UserHeader";

export default UserHeader;
