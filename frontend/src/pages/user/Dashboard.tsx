// frontend/src/pages/user/Dashboard.tsx
// 📊 DASHBOARD USER OPTIMIZADO - TODAS LAS HERRAMIENTAS

import React, { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Activity,
  Wallet,
  Award,
  Play,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEvents, useBets, useWallet } from "../../hooks/useApi";
import { useWebSocket } from "../../hooks/useWebSocket";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

// Componentes optimizados
import EventCard from "../../components/user/EventCard";
import BettingPanel from "../../components/user/BettingPanel";
import WalletSummary from "../../components/user/WalletSummary";
import Navigation from "../../components/user/Navigation";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import StatusIndicator from "../../components/shared/StatusIndicator";
import NotificationBadge from "../../components/shared/NotificationBadge";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = getUserThemeClasses();

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

  // WebSocket para actualizaciones en tiempo real
  const wsListeners = {
    new_bet: (data: any) => {
      console.log("🎯 Nueva apuesta disponible:", data);
      fetchEvents();
      fetchMyBets();
      addNotification("Nueva apuesta disponible", "info");
      setLastUpdated(new Date());
    },
    bet_matched: (data: any) => {
      console.log("🤝 Apuesta emparejada:", data);
      fetchMyBets();
      addNotification("¡Tu apuesta fue emparejada!", "success");
      setLastUpdated(new Date());
    },
    event_activated: (data: any) => {
      console.log("🔥 Evento activado:", data);
      fetchEvents();
      addNotification(`Evento iniciado: ${data.eventName}`, "info");
    },
    fight_updated: (data: any) => {
      console.log("🥊 Pelea actualizada:", data);
      fetchEvents();
      setLastUpdated(new Date());
    },
    bet_result: (data: any) => {
      console.log("🏆 Resultado de apuesta:", data);
      fetchMyBets();
      fetchWallet();
      const isWin = data.result === "win";
      addNotification(
        isWin ? "¡Ganaste una apuesta!" : "Apuesta perdida",
        isWin ? "success" : "error"
      );
    },
  };

  const { isConnected, connectionError } = useWebSocket(undefined, wsListeners);

  // Función para agregar notificaciones
  const addNotification = (
    message: string,
    type: "info" | "success" | "error"
  ) => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchEvents({ status: "in-progress" }),
        fetchMyBets({ status: "active" }),
        fetchWallet(),
      ]);
    };
    loadInitialData();
  }, []);

  // Calcular estadísticas rápidas
  useEffect(() => {
    const activeBets =
      bets?.filter((bet) => bet.status === "active").length || 0;
    const liveEvents =
      events?.filter((event) => event.status === "in-progress").length || 0;
    const completedBets = bets?.filter((bet) => bet.status === "settled") || [];
    const wins = completedBets.filter((bet) => bet.result === "win").length;
    const winRate =
      completedBets.length > 0 ? (wins / completedBets.length) * 100 : 0;
    const totalWinnings = completedBets.reduce(
      (sum, bet) => (bet.result === "win" ? sum + (bet.payout || 0) : sum),
      0
    );

    setQuickStats({
      activeBets,
      totalWinnings,
      liveEvents,
      winRate,
    });
  }, [bets, events]);

  // Loading state
  if (eventsLoading || betsLoading || walletLoading) {
    return (
      <div className={theme.pageBackground}>
        <LoadingSpinner text="Cargando dashboard..." className="mt-20" />
      </div>
    );
  }

  // Error states
  if (eventsError) {
    return (
      <div className={theme.pageBackground}>
        <ErrorMessage error={eventsError} onRetry={fetchEvents} />
      </div>
    );
  }

  // Datos para el dashboard
  const liveEvents =
    events?.filter((event) => event.status === "in-progress") || [];
  const upcomingEvents =
    events?.filter((event) => event.status === "scheduled") || [];
  const activeBets = bets?.filter((bet) => bet.status === "active") || [];
  const recentBets = bets?.slice(0, 3) || [];

  return (
    <div className={theme.pageBackground}>
      {/* Header con notificaciones */}
      <header className={`${theme.headerBackground} p-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">¡Hola, {user?.username}!</h1>
            <StatusIndicator
              status={isConnected ? "connected" : "disconnected"}
              label={isConnected ? "En línea" : "Desconectado"}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Actualizado: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <NotificationBadge
              count={notifications.filter((n) => !n.read).length}
            >
              <Bell className="w-5 h-5" />
            </NotificationBadge>
          </div>
        </div>
      </header>

      {/* Quick Stats Cards */}
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${theme.cardBackground} p-4`}>
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#cd6263]" />
            <div>
              <p className="text-2xl font-bold">{quickStats.activeBets}</p>
              <p className="text-sm text-gray-400">Apuestas Activas</p>
            </div>
          </div>
        </div>

        <div className={`${theme.cardBackground} p-4`}>
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold">
                ${wallet?.balance.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-gray-400">Saldo Disponible</p>
            </div>
          </div>
        </div>

        <div className={`${theme.cardBackground} p-4`}>
          <div className="flex items-center gap-3">
            <Play className="w-8 h-8 text-[#596c95]" />
            <div>
              <p className="text-2xl font-bold">{quickStats.liveEvents}</p>
              <p className="text-sm text-gray-400">Eventos En Vivo</p>
            </div>
          </div>
        </div>

        <div className={`${theme.cardBackground} p-4`}>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">
                {quickStats.winRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400">Tasa de Acierto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eventos En Vivo - Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Eventos En Vivo */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#cd6263]" />
                Eventos En Vivo
              </h2>
              {liveEvents.length > 2 && (
                <button
                  onClick={() => navigate("/events")}
                  className="text-[#596c95] hover:text-[#4a5b80] text-sm font-medium"
                >
                  Ver todos ({liveEvents.length})
                </button>
              )}
            </div>

            {liveEvents.length > 0 ? (
              <div className="grid gap-4">
                {liveEvents.slice(0, 2).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEnter={() => navigate(`/live-event/${event.id}`)}
                    showStreamingIndicator={true}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay eventos en vivo"
                description="Los eventos en vivo aparecerán aquí cuando estén disponibles"
                icon={<Play />}
                variant="dark"
              />
            )}
          </section>

          {/* Próximos Eventos */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#596c95]" />
                Próximos Eventos
              </h2>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid gap-3">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className={`${theme.cardBackground} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-gray-400">
                          {event.venue?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(event.scheduledDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(event.scheduledDate).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay eventos programados"
                description="Los próximos eventos aparecerán aquí"
                icon={<Calendar />}
                variant="dark"
              />
            )}
          </section>
        </div>

        {/* Sidebar - Panel Lateral */}
        <div className="space-y-6">
          {/* Billetera Rápida */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-400" />
              Mi Billetera
            </h2>
            <WalletSummary
              wallet={wallet}
              onViewWallet={() => navigate("/wallet")}
              showQuickActions={true}
            />
          </section>

          {/* Apuestas Activas */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#cd6263]" />
                Mis Apuestas
              </h2>
              {activeBets.length > 0 && (
                <button
                  onClick={() => navigate("/bets")}
                  className="text-[#596c95] hover:text-[#4a5b80] text-sm font-medium"
                >
                  Ver todas
                </button>
              )}
            </div>

            {activeBets.length > 0 ? (
              <div className="space-y-3">
                {recentBets.map((bet) => (
                  <div key={bet.id} className={`${theme.cardBackground} p-3`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{bet.eventName}</p>
                        <p className="text-xs text-gray-400">
                          {bet.side === "red" ? "Rojo" : "Azul"} - ${bet.amount}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          bet.status === "active"
                            ? theme.activeChip
                            : bet.status === "pending"
                            ? theme.pendingChip
                            : theme.errorChip
                        }`}
                      >
                        {bet.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No tienes apuestas activas"
                description="Explora eventos y realiza tu primera apuesta"
                icon={<Activity />}
                variant="dark"
                action={{
                  label: "Ver Eventos",
                  onClick: () => navigate("/events"),
                }}
              />
            )}
          </section>

          {/* Panel de Apuestas Rápidas */}
          {liveEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Apostar Ahora
              </h2>
              <BettingPanel
                fightId={liveEvents[0]?.fights?.[0]?.id || ""}
                compact={true}
              />
            </section>
          )}
        </div>
      </div>

      {/* Navigation móvil */}
      <Navigation currentPage="home" />
    </div>
  );
};

export default Dashboard;
