// frontend/src/pages/user/Dashboard.tsx
// 📊 DASHBOARD USER OPTIMIZADO - TODAS LAS HERRAMIENTAS

import React, { useEffect, useState } from "react";
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
import { useWebSocket } from "../../hooks/useWebSocket";
import {
  getUserThemeClasses,
  useUserTheme,
} from "../../contexts/UserThemeContext";

// Componentes optimizados
import EventCard from "../../components/user/EventCard";
import WalletSummary from "../../components/user/WalletSummary";
import Navigation from "../../components/user/Navigation";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import StreamingPanel from "../../components/user/StreamingPanel";
import QuickBetPanel from "../../components/user/QuickBetPanel";
import UserHeader from "../../components/user/UserHeader";
import NewsBanner from "../../components/shared/NewsBanner";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = getUserThemeClasses();
  const { updateColors } = useUserTheme();

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
    // Solo cargar una vez
    fetchEvents({ status: "in-progress" });
    fetchMyBets({ status: "active" });
    fetchWallet();
  }, []); // 🔧 FIX: Sin dependencias

  // Función para manejar apuestas rápidas
  const handleBetPlaced = (bet: any) => {
    addNotification("Apuesta realizada exitosamente", "success");
    fetchMyBets();
    fetchWallet();
  };

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
      <UserHeader title="Dashboard" />
      <NewsBanner />
      {/* Main Content Grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eventos En Vivo - Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evento en Vivo */}
          {liveEvents.length > 0 && (
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
                />
              )}
              {liveEvents.length > 0 && (
                <StreamingPanel
                  eventId={liveEvents[0]?.id || ""}
                  isLive={liveEvents.length > 0}
                  onEnterStream={() => navigate("/live-event")}
                />
              )}
            </section>
          )}
          {/* Próximos Eventos */}
          {upcomingEvents.length > 0 && (
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
                    <div
                      key={event.id}
                      className={`${theme.cardBackground} p-4`}
                    >
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
                />
              )}
            </section>
          )}
        </div>

        {/* Sidebar - Panel Lateral */}
        <div className="space-y-6">
          {/* Billetera Rápida 
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-400" />
              Mi Billetera
            </h2>
            <WalletSummary
              balance={wallet?.balance || 0}
              frozenAmount={wallet?.frozenAmount || 0}
              onViewWallet={() => navigate("/wallet")}
              showQuickActions={true}
            />
          </section> */}

          {/* Apuestas Activas 
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Dices className="w-5 h-5 text-[#cd6263]" />
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
                action={{
                  label: "Ver Apuestas disponibles",
                  onClick: () => navigate("/bets"),
                }}
              />
            )}
          </section> */}

          {/* Panel de Apuestas Rápidas */}
          {liveEvents.length > 0 && (
            <QuickBetPanel
              fightId={liveEvents[0]?.fights?.[0]?.id || ""}
              compact={true}
              onBetPlaced={handleBetPlaced}
            />
          )}
        </div>
      </div>

      {/* Navigation móvil */}
      <Navigation currentPage="home" />
    </div>
  );
};

export default Dashboard;
