// frontend/src/pages/user/Dashboard.tsx - MIGRADO V9
// ======================================================
// ELIMINADO: getUserThemeClasses() y useUserTheme() imports
// ELIMINADO: updateColors() functionality (no necesario con CSS estático)
// APLICADO: Clases CSS estáticas directas

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Calendar,
  Activity,
  Wallet,
  Play,
  Clock,
  Zap,
  Dices,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEvents, useBets, useWallet } from "../../hooks/useApi";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
// ❌ ELIMINADO: import { getUserThemeClasses, useUserTheme } from "../../contexts/UserThemeContext";
import {
  useWebSocketListener,
  useWebSocketRoom,
} from "../../hooks/useWebSocket";

// Componentes optimizados
import EventCard from "../../components/user/EventCard";
//import WalletSummary from "../../components/user/WalletSummary";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import StreamingPanel from "../../components/user/StreamingPanel";

import NewsBanner from "../../components/shared/NewsBanner";
import WebSocketDiagnostics from "../../components/shared/WebSocketDiagnostics";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // ❌ ELIMINADO: const theme = getUserThemeClasses();
  // ❌ ELIMINADO: const { updateColors } = useUserTheme();

  // API Hooks
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    fetchEvents,
  } = useEvents();

  const {
    bets,
    loading: betsLoading,
    error: betsError,
    fetchMyBets,
  } = useBets();

  const { wallet, loading: walletLoading, fetchWallet } = useWallet();

  // Estados locales
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({
    activeBets: 0,
    totalWinnings: 0,
    liveEvents: 0,
    winRate: 0,
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // ✅ WebSocket Room Management (simplificado)
  const activeEvent = events?.find((e) => e.status === "in-progress");
  const { isConnected: isRoomConnected } = useWebSocketRoom(
    activeEvent?.id || ""
  );

  // ✅ Notifications (ya memoizado)
  const addNotification = useCallback(
    (message: string, type: "info" | "success" | "error") => {
      setNotifications((prev) => [
        { id: Date.now(), message, type, timestamp: new Date(), read: false },
        ...prev.slice(0, 4),
      ]);
    },
    []
  );

  // ✅ Listeners optimizados con useWebSocketListener
  useWebSocketListener("new_bet", () => {
    fetchEvents();
    fetchMyBets();
    addNotification("Nueva apuesta disponible", "info");
    setLastUpdated(new Date());
  });

  useWebSocketListener("bet_matched", () => {
    fetchMyBets();
    addNotification("¡Tu apuesta fue emparejada!", "success");
    setLastUpdated(new Date());
  });

  useWebSocketListener("fight_result", () => {
    fetchMyBets();
    fetchWallet();
    addNotification("Resultado de pelea actualizado", "info");
    setLastUpdated(new Date());
  });

  useWebSocketListener("wallet_updated", () => {
    fetchWallet();
    addNotification("Balance actualizado", "success");
    setLastUpdated(new Date());
  });

  // ✅ Calcular estadísticas cuando cambien los datos
  useEffect(() => {
    if (bets && events && wallet) {
      const activeBetsCount = bets.filter((b) => b.status === "active").length;
      const winningBets = bets.filter((b) => b.result === "win");
      const totalWinnings = winningBets.reduce(
        (sum, bet) => sum + bet.potentialWin,
        0
      );
      const liveEventsCount = events.filter(
        (e) => e.status === "in-progress"
      ).length;
      const winRate =
        bets.length > 0 ? (winningBets.length / bets.length) * 100 : 0;

      setQuickStats({
        activeBets: activeBetsCount,
        totalWinnings,
        liveEvents: liveEventsCount,
        winRate,
      });
    }
  }, [bets, events, wallet]);

  // ✅ Cargar datos inicial
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([fetchEvents(), fetchMyBets(), fetchWallet()]);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        addNotification("Error cargando datos", "error");
      }
    };

    loadInitialData();
  }, [fetchEvents, fetchMyBets, fetchWallet]);

  // Handlers
  const handleNavigateToWallet = useCallback(() => {
    navigate("/wallet");
  }, [navigate]);

  const handleNavigateToBets = useCallback(() => {
    navigate("/bets");
  }, [navigate]);

  const handleNavigateToEvents = useCallback(() => {
    navigate("/events");
  }, [navigate]);

  const handleJoinEvent = useCallback(
    (eventId: string) => {
      navigate(`/live-event/${eventId}`);
    },
    [navigate]
  );

  // Eventos filtrados
  const liveEvents = events?.filter((e) => e.status === "in-progress") || [];
  const upcomingEvents =
    events?.filter((e) => e.status === "scheduled").slice(0, 3) || [];
  const activeBets =
    bets?.filter((b) => b.status === "active").slice(0, 3) || [];

  // Estados de carga
  const isLoading = eventsLoading || betsLoading || walletLoading;
  const hasErrors = eventsError || betsError;

  if (isLoading) {
    return (
      /* ✅ MIGRADO: theme.pageBackground → page-background */
      <div className="page-background">
        <LoadingSpinner text="Cargando dashboard..." className="mt-20" />
      </div>
    );
  }

  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-6">
        {/* 📰 BANNER DE NOTICIAS */}
        <NewsBanner />

        {/* 📊 ESTADÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Balance */}
          <div
            onClick={handleNavigateToWallet}
            /* ✅ MIGRADO: theme.cardBackground → card-background */
            className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                {/* ✅ MIGRADO: theme.primaryText → text-theme-primary */}
                <p className="text-lg font-bold text-theme-primary">
                  ${Number(wallet?.balance || 0).toFixed(2)}
                </p>
                {/* ✅ MIGRADO: theme.lightText → text-theme-light */}
                <p className="text-xs text-theme-light">Balance</p>
              </div>
            </div>
          </div>

          {/* Apuestas Activas */}
          <div
            onClick={handleNavigateToBets}
            className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-theme-primary">
                  {quickStats.activeBets}
                </p>
                <p className="text-xs text-theme-light">Apuestas</p>
              </div>
            </div>
          </div>

          {/* Eventos en Vivo */}
          <div
            onClick={handleNavigateToEvents}
            className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-theme-primary">
                  {quickStats.liveEvents}
                </p>
                <p className="text-xs text-theme-light">En Vivo</p>
              </div>
            </div>
          </div>

          {/* Tasa de Acierto */}
          <div className="card-background p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center">
                <Dices className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-theme-primary">
                  {quickStats.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-theme-light">Aciertos</p>
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ EVENTOS EN VIVO */}
        {liveEvents.length > 0 && (
          <div className="card-background p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                <Zap className="w-5 h-5 text-red-400" />
                Eventos en Vivo
              </h2>
              <button
                onClick={handleNavigateToEvents}
                className="btn-ghost text-sm"
              >
                Ver todos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleJoinEvent(event.id)}
                  className="bg-[#1a1f37]/50 border border-red-500/30 rounded-lg p-4 cursor-pointer hover:bg-[#1a1f37]/70 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 text-xs font-medium">
                        EN VIVO
                      </span>
                    </div>
                    <Play className="w-4 h-4 text-theme-light" />
                  </div>

                  <h3 className="font-medium text-theme-primary mb-1">
                    {event.name}
                  </h3>
                  <p className="text-sm text-theme-light">
                    {event.venue?.name}
                  </p>

                  {event.currentViewers && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-400">
                        {event.currentViewers} espectadores
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📅 PRÓXIMOS EVENTOS */}
        {upcomingEvents.length > 0 && (
          <div className="card-background p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Próximos Eventos
              </h2>
              <button
                onClick={handleNavigateToEvents}
                className="btn-ghost text-sm"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-[#1a1f37]/30 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-theme-primary">
                      {event.name}
                    </h3>
                    <p className="text-sm text-theme-light">
                      {event.venue?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-theme-primary">
                      {new Date(event.scheduledDate).toLocaleDateString(
                        "es-ES",
                        {
                          day: "2-digit",
                          month: "short",
                        }
                      )}
                    </p>
                    <p className="text-xs text-theme-light">
                      {new Date(event.scheduledDate).toLocaleTimeString(
                        "es-ES",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🎯 APUESTAS ACTIVAS */}
        {activeBets.length > 0 && (
          <div className="card-background p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Mis Apuestas Activas
              </h2>
              <button
                onClick={handleNavigateToBets}
                className="btn-ghost text-sm"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-3">
              {activeBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-3 bg-[#1a1f37]/30 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-theme-primary">
                      {bet.eventName || "Evento TBD"}
                    </h3>
                    <p className="text-sm text-theme-light">
                      {bet.side === "red" ? "Gallo Rojo" : "Gallo Azul"} - $
                      {bet.amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-400">
                      Pot. ${bet.potentialWin?.toFixed(2) || "0.00"}
                    </p>
                    <span className="chip-active">
                      {bet.status === "active" ? "Activa" : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📊 PANEL DE STREAMING (si hay evento activo) */}
        {activeEvent && (
          <div className="card-background p-6">
            <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-red-400" />
              Transmisión en Vivo
            </h2>
            <StreamingPanel event={activeEvent} />
          </div>
        )}

        {/* 🚫 ESTADOS VACÍOS */}
        {!isLoading && events?.length === 0 && (
          <EmptyState
            title="No hay eventos disponibles"
            description="Parece que no hay eventos programados en este momento. ¡Vuelve pronto!"
            icon={<Calendar className="w-12 h-12" />}
            action={{
              label: "Actualizar",
              onClick: () => {
                fetchEvents();
                fetchMyBets();
                fetchWallet();
              },
            }}
          />
        )}

        {/* ⚠️ MANEJO DE ERRORES */}
        {hasErrors && (
          <div className="card-background p-4">
            <ErrorMessage
              error={eventsError || betsError || "Error desconocido"}
              onRetry={() => {
                fetchEvents();
                fetchMyBets();
                fetchWallet();
              }}
            />
          </div>
        )}

        {/* 🕒 ÚLTIMA ACTUALIZACIÓN */}
        {lastUpdated && (
          <div className="text-center">
            <p className="text-xs text-theme-light">
              Última actualización: {lastUpdated.toLocaleTimeString("es-ES")}
            </p>
          </div>
        )}

        {/* 🔧 WEBSOCKET DIAGNOSTICS (solo en desarrollo) */}
        {process.env.NODE_ENV === "development" && (
          <WebSocketDiagnostics showDetails={false} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
