// frontend/src/components/user/UserHeader.tsx - OPTIMIZADO V6 CON TAILWIND
// ================================================================
// ELIMINADO: Botón refresh, mock data, fetchHeaderData custom
// IMPLEMENTADO: useWallet(), useNotifications(), useBets() hooks
// MEJORADO: Utilidades de Tailwind CSS como prioridad, degradado elegante, Galleros.Net logo

import React, { memo, useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Wallet,
  Trophy,
  Bell,
  X,
  Newspaper,
  Settings,
  ChevronDown,
  Loader2,
  User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet, useNotifications, useBets } from "../../hooks/useApi";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import { useSubscription } from "../../hooks/useSubscription";
import SubscriptionStatus from "../subscriptions/SubscriptionStatus";
import { articlesAPI } from "../../config/api";

interface InfoChipConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  accent: string;
}

const UserHeader = memo(() => {
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

  const {
    isWalletEnabled,
    isBettingEnabled,
    isLoading: featureFlagsLoading,
  } = useFeatureFlags();

  // Estados UI
  const [showBets, setShowBets] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showMoreChips, setShowMoreChips] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [publishedArticles, setPublishedArticles] = useState(0);

  // ✅ DATOS COMPUTADOS CON HOOKS REALES
  const activeBets = bets?.filter((bet) => bet.status === "active") || [];

  const activeBetsCount = activeBets.length;
  // const unreadNotificationsCount = unreadNotifications.length; // reserved for future UI
  const walletBalance = Number(wallet?.balance || 0);

  const role = user?.role;

  const infoChips = useMemo<InfoChipConfig[]>(() => {
    if (!role) return [];
    const chips: InfoChipConfig[] = [];

    if ((role === "gallera" || role === "venue") && publishedArticles >= 0) {
      chips.push({
        id: "articles",
        icon: <Newspaper className="w-3.5 h-3.5 text-green-600" />,
        label: `Artículos: ${publishedArticles}`,
        accent: "bg-green-50/80 border border-green-100 text-green-900",
      });
    }

    if (role === "admin") {
      chips.push({
        id: "admin",
        icon: <Settings className="w-3.5 h-3.5 text-purple-600" />,
        label: "Panel administrativo",
        accent: "bg-purple-50/80 border border-purple-100 text-purple-900",
      });
    }

    return chips;
  }, [role, publishedArticles]);

  const primaryChips = infoChips.slice(0, 2);
  const extraChips = infoChips.slice(2);

  const profileImage = user?.profileInfo?.imageUrl;
  const fallbackName =
    user?.profileInfo?.fullName ||
    user?.profileInfo?.businessName ||
    user?.profileInfo?.venueName ||
    user?.profileInfo?.galleraName ||
    user?.username ||
    "Usuario";
  const avatarInitial = fallbackName.charAt(0)?.toUpperCase() || "U";

  const renderChip = (chip: InfoChipConfig) => (
    <span
      key={chip.id}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${chip.accent}`}
    >
      {chip.icon}
      <span className="whitespace-nowrap">{chip.label}</span>
    </span>
  );

  const renderWalletControls = (layout: "desktop" | "mobile") => {
    const isMobile = layout === "mobile";

    if (featureFlagsLoading) {
      return isMobile ? (
        <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
      ) : (
        <div className="h-10 w-36 rounded-lg bg-gray-100 animate-pulse" />
      );
    }

    if (!isWalletEnabled || role === "venue" || !isPremium) return null;

    const buttonClass = isMobile
      ? "flex items-center justify-center w-11 h-11 bg-white border border-[#bdd5ef75] rounded-xl shadow-sm"
      : "flex items-center justify-between gap-3 px-3 py-2 h-10 bg-white hover:bg-[#f0f9ff] border border-[#bdd5ef75] rounded-lg shadow-sm hover:shadow-md transition-all duration-200";

    return (
      <div className={`relative dropdown-container ${isMobile ? "" : "z-50"}`}>
        <button
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
            setShowWalletDropdown((prev) => !prev);
          }}
          className={buttonClass}
          aria-haspopup="menu"
          aria-expanded={showWalletDropdown}
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-600" />
            {!isMobile && (
              <>
                <span className="text-sm font-semibold text-gray-800">
                  Saldo disponible
                </span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    walletBalance.toFixed(2)
                  )}
                </span>
              </>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>

        {showWalletDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-2xl z-50 overflow-hidden border border-gray-200 rounded-xl">
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  navigate("/wallet");
                  setShowWalletDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-medium text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Wallet className="w-4 h-4 text-green-600" /> Ver Billetera
              </button>
              <button
                onClick={() => {
                  navigate("/wallet");
                  setShowWalletDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-medium text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Wallet className="w-4 h-4 text-green-600" /> Historial
              </button>
              <button
                onClick={() => {
                  navigate("/wallet");
                  setShowWalletDropdown(false);
                  window.location.hash = "deposit";
                }}
                className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm font-medium text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Wallet className="w-4 h-4 text-green-600" /> Depositar
              </button>
              <button
                onClick={() => {
                  navigate("/wallet");
                  setShowWalletDropdown(false);
                  window.location.hash = "withdraw";
                }}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm font-medium text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Wallet className="w-4 h-4 text-red-600" /> Retirar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBetsControl = (layout: "desktop" | "mobile") => {
    const isMobile = layout === "mobile";

    if (featureFlagsLoading) {
      return isMobile ? (
        <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
      ) : (
        <div className="h-10 w-32 rounded-lg bg-gray-100 animate-pulse" />
      );
    }

    if (!isBettingEnabled || role === "venue" || !isPremium) return null;

    const buttonClass = isMobile
      ? "relative flex items-center justify-center w-11 h-11 bg-white border border-[#bdd5ef75] rounded-xl shadow-sm"
      : "relative flex items-center gap-2 px-3 py-2 h-10 bg-white border border-[#bdd5ef75] rounded-lg hover:bg-[#f0f9ff] transition-all duration-200 shadow-sm hover:shadow-md";
    const showBadge = !isLoading && activeBetsCount > 0;

    return (
      <div
        className={`relative dropdown-container overflow-visible ${isMobile ? "" : "z-40"}`}
      >
        <button
          onClick={() => {
            setShowNotifications(false);
            setShowWalletDropdown(false);
            setShowUserMenu(false);
            setShowBets((prev) => !prev);
          }}
          className={buttonClass}
          aria-haspopup="menu"
          aria-expanded={showBets}
        >
          <Trophy className="w-4 h-4 text-blue-600" />
          {!isMobile && (
            <span className="text-sm font-semibold text-gray-900">
              {isLoading ? "…" : activeBetsCount}
            </span>
          )}
          {showBadge && (
            <span
              className={`absolute -top-1 -right-1 flex ${isMobile ? "h-3 w-3" : "h-4 w-4"}`}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span
                className={`relative inline-flex rounded-full ${isMobile ? "h-3 w-3 text-[0.5rem]" : "h-4 w-4 text-[0.6rem]"} bg-blue-500 text-white items-center justify-center`}
              >
                {activeBetsCount > 9 ? "9+" : activeBetsCount}
              </span>
            </span>
          )}
        </button>

        {showBets && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-2xl z-50 overflow-hidden border border-gray-200 rounded-xl">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-600" /> Apuestas Activas
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
    );
  };

  const renderNotificationsControl = (layout: "desktop" | "mobile") => {
    const isMobile = layout === "mobile";
    const buttonClass = isMobile
      ? "relative flex items-center justify-center w-11 h-11 bg-white border border-[#bdd5ef75] rounded-xl shadow-sm"
      : "relative flex items-center justify-center p-2.5 h-10 bg-white border border-[#bdd5ef75] rounded-lg hover:bg-[#f0f9ff] transition-all duration-200 shadow-sm hover:shadow-md";

    const hasUnread = notifications.some((n) => n.status === "unread");

    return (
      <div className="relative dropdown-container">
        <button
          onClick={() => {
            setShowBets(false);
            setShowWalletDropdown(false);
            setShowUserMenu(false);
            setShowNotifications((prev) => !prev);
          }}
          className={buttonClass}
          aria-haspopup="menu"
          aria-expanded={showNotifications}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Bell className="w-4 h-4 text-yellow-600" />
            {!isMobile && <span>Alertas</span>}
          </div>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-2xl z-50 overflow-hidden border border-gray-200 rounded-xl">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-600" /> Notificaciones
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
                  <p className="text-sm font-medium">No hay notificaciones</p>
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
                        {new Date(notification.createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
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
    );
  };

  const renderUserMenu = (layout: "desktop" | "mobile") => {
    const isMobile = layout === "mobile";
    const buttonClass = isMobile
      ? "w-11 h-11 rounded-xl border border-[#d9e3f5] bg-white flex items-center justify-center shadow-sm"
      : "flex items-center gap-3 pl-1.5 pr-3 py-1.5 bg-white border border-[#d9e3f5] rounded-2xl shadow-sm hover:bg-[#f0f6ff] transition-all duration-200";

    const AvatarVisual = () => (
      <div className="relative">
        {profileImage ? (
          <img
            src={profileImage}
            alt={fallbackName}
            className={`rounded-full object-cover ring-2 ring-white shadow ${isMobile ? "w-9 h-9" : "w-10 h-10"}`}
          />
        ) : (
          <div
            className={`rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white font-semibold flex items-center justify-center ring-2 ring-white shadow ${isMobile ? "w-9 h-9" : "w-10 h-10"}`}
          >
            {avatarInitial}
          </div>
        )}
        {subscription?.status === "active" && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></span>
        )}
      </div>
    );

    return (
      <div className={`relative dropdown-container ${isMobile ? "" : "z-50"}`}>
        <button
          onClick={() => {
            setShowWalletDropdown(false);
            setShowNotifications(false);
            setShowBets(false);
            setShowUserMenu((prev) => !prev);
          }}
          className={buttonClass}
          aria-haspopup="menu"
          aria-expanded={showUserMenu}
        >
          <AvatarVisual />
          {!isMobile && (
            <div className="text-left min-w-[140px]">
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {displayName}
              </p>
            </div>
          )}
          {!isMobile && <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <AvatarVisual />
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-gray-900 leading-tight truncate">
                    {displayName}

                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue/100 border border-white/60 text-gray-600 lg:hidden">
                      @{user.username}
                    </span>
                    <RoleBadge className="mt-2 bg-blue-50 border-blue-100" />
                    {(role === "gallera" || role === "venue") && (
                      <span className="inline-block m-2">
                        {renderChip({
                          id: "articles",
                          icon: (
                            <Newspaper className="w-3.5 h-3.5 text-green-600" />
                          ),
                          label: `Artículos: ${publishedArticles}`,
                          accent:
                            "bg-green-50/80 border border-green-100 text-green-900",
                        })}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-300 bg-gray-50/70 p-2">
                <SubscriptionStatus subscription={subscription} />
              </div>

              <button
                onClick={() => {
                  navigate("/profile");
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#d9e3f5] text-[#2a325c] font-semibold hover:bg-[#f0f6ff] transition"
              >
                <User className="w-4 h-4" /> Ver perfil
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderActionCluster = (layout: "desktop" | "mobile") => (
    <div className="flex items-center gap-2 flex-wrap">
      {renderWalletControls(layout)}
      {renderBetsControl(layout)}
      {renderNotificationsControl(layout)}
    </div>
  );

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

  // 📄 Author's articles count (all statuses: draft, pending, published)
  useEffect(() => {
    const fetchPublished = async () => {
      if (!user || (user.role !== "venue" && user.role !== "gallera")) return;
      try {
        const res = await articlesAPI.getAll({
          author_id: user.id,
          limit: 100,
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
  const translateRole = (role: string) =>
    role === "venue"
      ? "Gallera"
      : role === "gallera"
        ? "Criadero"
        : role.charAt(0).toUpperCase() + role.slice(1);

  const RoleBadge: React.FC<{ className?: string }> = ({ className = "" }) => (
    <span
      className={`text-xs px-3 py-1.5 bg-[#f0f9ff] rounded-full text-[#2a325c] flex items-center gap-1.5 border border-[#bdd5ef75] ${className}`}
    >
      <span className="font-medium uppercase tracking-wide">
        {translateRole(user.role)}
      </span>
    </span>
  );

  // Handlers
  const handleLogout = useCallback(async () => {
    try {
      setShowUserMenu(false);
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
        setShowWalletDropdown(false);
        setShowUserMenu(false);
      }
    };

    if (showBets || showNotifications || showWalletDropdown || showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showBets, showNotifications, showWalletDropdown, showUserMenu]);

  if (!user) return null;

  const displayName =
    user.role === "venue"
      ? user.profileInfo?.venueName ||
        user.profileInfo?.businessName ||
        user.username
      : user.role === "gallera"
        ? user.profileInfo?.galleraName ||
          user.profileInfo?.businessName ||
          user.username
        : user.username;

  const isLoading =
    walletLoading || notificationsLoading || betsLoading || featureFlagsLoading;

  return (
    <header className="sticky top-0 z-50 text-gray-900">
      <div className="px-1 pt0 pb-2 lg:p1-2 relative">
        <div className="relative rounded-b-3xl border border-black/10 bg-gradient-to-r from-[#887e7e4f] via-[#f0f0f2] to-[#887e7e4f] shadow-xl backdrop-blur">
          <div className="relative flex flex-col gap-4 p-3 lg:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/src/assets/logo.png"
                  alt="Logo Galleros.Net"
                  className="h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 object-contain rounded-2xl bg-white/80 p-1 shadow"
                />
                <span className="font-semibold lg:text-lg text-[#1b2a4a]">
                  GALLEROS
                </span>
                <span className="font-semibold lg:text-lg text-red-600">
                  .NET
                </span>{" "}
                <div className="flex lg:hidden items-center gap-2 justify-end flex-wrap">
                  {renderActionCluster("mobile")}
                  {renderUserMenu("mobile")}
                </div>
              </div>

              {infoChips.filter((chip) => chip.id !== "articles").length >
                0 && (
                <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-center">
                  {(showMoreChips
                    ? infoChips.filter((chip) => chip.id !== "articles")
                    : primaryChips.filter((chip) => chip.id !== "articles")
                  ).map(renderChip)}
                  {extraChips.filter((chip) => chip.id !== "articles").length >
                    0 && (
                    <button
                      onClick={() => setShowMoreChips((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 border border-gray-200 bg-white/70"
                    >
                      {showMoreChips
                        ? "Ver menos"
                        : `+${extraChips.filter((chip) => chip.id !== "articles").length} info`}
                    </button>
                  )}
                </div>
              )}

              <div className="hidden lg:flex items-center justify-end gap-3">
                {renderActionCluster("desktop")}
                {renderUserMenu("desktop")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#8ba3bc7e]/30">
          <div className="h-full bg-[#8ba3bc] animate-pulse"></div>
        </div>
      )}
    </header>
  );
});

UserHeader.displayName = "UserHeader";

export default UserHeader;
