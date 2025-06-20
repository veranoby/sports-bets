// frontend/src/pages/user/Dashboard.tsx
// 📊 DASHBOARD USER OPTIMIZADO - TODAS LAS HERRAMIENTAS

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
import {
  getUserThemeClasses,
  useUserTheme,
} from "../../contexts/UserThemeContext";

// Componentes optimizados
import EventCard from "../../components/user/EventCard";
//import WalletSummary from "../../components/user/WalletSummary";
import Navigation from "../../components/user/Navigation";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import StreamingPanel from "../../components/user/StreamingPanel";

import UserHeader from "../../components/user/UserHeader";
import NewsBanner from "../../components/shared/NewsBanner";
import WebSocketDiagnostics from "../../components/shared/WebSocketDiagnostics";

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

  // ✅ WebSocket consolidado
  const {
    addListener,
    removeListener,
    joinRoom,
    leaveRoom,
    isConnected,
    activeEvent,
  } = useWebSocketContext();

  // Función para agregar notificaciones (ya memoizada)
  const addNotification = useCallback(
    (message: string, type: "info" | "success" | "error") => {
      const newNotification = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);
    },
    []
  );

  // Handlers memoizados con dependencias mínimas
  const handleNewBet = useCallback(
    (data: any) => {
      fetchEvents(); // Llamada directa sin ref
      fetchMyBets(); // Llamada directa sin ref
      addNotification("Nueva apuesta disponible", "info");
      setLastUpdated(new Date());
    },
    [addNotification, fetchEvents, fetchMyBets] // Dependencias estables
  );

  const handleBetMatched = useCallback(
    (data: any) => {
      fetchMyBets(); // Llamada directa sin ref
      addNotification("¡Tu apuesta fue emparejada!", "success");
      setLastUpdated(new Date());
    },
    [addNotification, fetchMyBets] // Dependencias estables
  );

  const handleEventActivated = useCallback(
    (data: any) => {
      fetchEvents(); // Llamada directa sin ref
      addNotification(`Evento iniciado: ${data.eventName}`, "info");
    },
    [addNotification, fetchEvents] // Dependencias estables
  );

  const handleFightUpdated = useCallback(() => {
    fetchEvents(); // Llamada directa sin ref
    setLastUpdated(new Date());
  }, [fetchEvents]); // Dependencias estables

  const handleBetResult = useCallback(
    (data: any) => {
      fetchMyBets(); // Llamada directa sin ref
      fetchWallet(); // Llamada directa sin ref
      const isWin = data.result === "win";
      addNotification(
        isWin ? "¡Ganaste una apuesta!" : "Apuesta perdida",
        isWin ? "success" : "error"
      );
    },
    [addNotification, fetchMyBets, fetchWallet] // Dependencias estables
  );

  // Efecto para manejar rooms (solo depende de isConnected y activeEvent.id)
  useEffect(() => {
    if (!isConnected || !activeEvent?.id) return;
    joinRoom(activeEvent.id);
    return () => leaveRoom(activeEvent.id);
  }, [isConnected, activeEvent?.id, joinRoom, leaveRoom]);

  // Efecto principal para listeners (solo depende de isConnected y handlers memoizados)
  useEffect(() => {
    if (!isConnected) return;

    addListener("new_bet", handleNewBet);
    addListener("bet_matched", handleBetMatched);
    addListener("event_activated", handleEventActivated);
    addListener("fight_updated", handleFightUpdated);
    addListener("bet_result", handleBetResult);
    addListener("notification:new", addNotification);

    return () => {
      removeListener("new_bet", handleNewBet);
      removeListener("bet_matched", handleBetMatched);
      removeListener("event_activated", handleEventActivated);
      removeListener("fight_updated", handleFightUpdated);
      removeListener("bet_result", handleBetResult);
      removeListener("notification:new", addNotification);
    };
  }, [
    isConnected,
    handleNewBet,
    handleBetMatched,
    handleEventActivated,
    handleFightUpdated,
    handleBetResult,
    addNotification,
    addListener,
    removeListener,
  ]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchEvents({ status: "in-progress" });
    fetchMyBets({ status: "active" });
    fetchWallet();
  }, []);

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
      <div className="p-4 grid grid-cols-1 ">
        {/* Eventos En Vivo - Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evento en Vivo */}

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
              />
            )}
          </section>
        </div>
      </div>

      {/* Navigation móvil */}
      <Navigation currentPage="home" />

      {/* Monitor de WebSocket - Solo en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <WebSocketDiagnostics position="fixed" showDetails={false} />
      )}
    </div>
  );
};

export default Dashboard;
