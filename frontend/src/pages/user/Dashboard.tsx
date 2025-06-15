// frontend/src/pages/user/Dashboard.tsx - VERSIÓN CORREGIDA
import React, { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Activity,
  Wallet,
  Award,
  AlertCircle,
} from "lucide-react";
import EventCard from "../../components/user/EventCard";
import BettingPanel from "../../components/user/BettingPanel";
import WalletSummary from "../../components/user/WalletSummary";
import Navigation from "../../components/user/Navigation";
import WebSocketDiagnostics from "../../components/shared/WebSocketDiagnostics";
import { useEvents, useBets, useWallet } from "../../hooks/useApi";
import { useWebSocket } from "../../hooks/useWebSocket";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import NotificationBadge from "../../components/shared/NotificationBadge";
import PageContainer from "../../components/shared/PageContainer";
import StatusIndicator from "../../components/shared/StatusIndicator";

const Dashboard: React.FC = () => {
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

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // WebSocket listeners para actualizaciones en tiempo real
  const wsListeners = {
    // Evento: Nueva apuesta disponible
    new_bet: (data: any) => {
      console.log("🎯 Nueva apuesta disponible:", data);
      fetchEvents(); // Refrescar eventos para mostrar nueva actividad
      fetchMyBets(); // Refrescar mis apuestas
      setLastUpdated(new Date());
    },

    // Evento: Apuesta emparejada
    bet_matched: (data: any) => {
      console.log("🤝 Apuesta emparejada:", data);
      fetchMyBets(); // Refrescar mis apuestas
      fetchWallet(); // Refrescar wallet (fondos congelados)
      setLastUpdated(new Date());
    },

    // Evento: Evento activado/iniciado
    event_activated: (data: any) => {
      console.log("🚀 Evento activado:", data);
      fetchEvents(); // Refrescar lista de eventos
      setLastUpdated(new Date());
    },

    // Evento: Pelea actualizada
    fight_updated: (data: any) => {
      console.log("🥊 Pelea actualizada:", data);
      fetchEvents(); // Refrescar eventos para mostrar cambios
      setLastUpdated(new Date());
    },

    // Evento: Apuestas abiertas para una pelea
    betting_opened: (data: any) => {
      console.log("💰 Apuestas abiertas:", data);
      fetchEvents(); // Refrescar para mostrar que se pueden hacer apuestas
      setLastUpdated(new Date());
    },

    // Evento: Apuestas cerradas
    betting_closed: (data: any) => {
      console.log("🚫 Apuestas cerradas:", data);
      fetchEvents(); // Refrescar estado de eventos
      setLastUpdated(new Date());
    },

    // Evento: Pelea completada con resultado
    fight_completed: (data: any) => {
      console.log("🏆 Pelea completada:", data);
      fetchMyBets(); // Refrescar para mostrar resultados
      fetchWallet(); // Refrescar wallet (ganancia/pérdida)
      fetchEvents(); // Refrescar eventos
      setLastUpdated(new Date());
    },
  };

  const { isConnected, connectionError, reconnect } = useWebSocket(
    undefined,
    wsListeners
  );

  // Función para refrescar todos los datos
  const refreshAllData = () => {
    fetchEvents({ status: "in-progress" });
    fetchMyBets({ status: "active" });
    fetchWallet();
    setLastUpdated(new Date());
  };

  // Cargar datos iniciales
  useEffect(() => {
    refreshAllData();
  }, []);

  // Auto-refresh cada 5 minutos como respaldo
  useEffect(() => {
    const interval = setInterval(refreshAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Stats calculados
  const userStats = {
    activeBets: bets?.filter((bet) => bet.status === "active").length || 0,
    balance: wallet?.balance || 0,
    frozenAmount: wallet?.frozenAmount || 0,
    winningStreak: 3, // TODO: Calcular de las últimas apuestas ganadas
    streakTrend: "up" as "up" | "down" | "neutral",
  };

  // Filtrar eventos por estado
  const liveEvents = events.filter((event) => event.status === "in-progress");
  const upcomingEvents = events.filter((event) => event.status === "scheduled");
  const activeBets = bets.filter((bet) => bet.status === "active");

  // Mostrar loading si estamos cargando datos críticos
  if (eventsLoading || betsLoading || walletLoading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Cargando dashboard..." />
      </PageContainer>
    );
  }

  // Mostrar errores críticos
  if (eventsError && !events.length) {
    return (
      <PageContainer>
        <ErrorMessage
          error={eventsError}
          onRetry={refreshAllData}
          title="Error al cargar eventos"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header con estado de conexión */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {lastUpdated && (
            <p className="text-gray-400 text-sm">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle diagnósticos */}
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-gray-400 hover:text-white"
            title="Ver diagnósticos de conexión"
          >
            <StatusIndicator
              status={isConnected ? "connected" : "disconnected"}
              size="sm"
            />
          </button>

          {/* Notificaciones */}
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-400" />
            <NotificationBadge count={0} />
          </div>
        </div>
      </div>

      {/* Diagnósticos WebSocket (condicional) */}
      {(showDiagnostics || !isConnected) && (
        <div className="mb-4">
          <WebSocketDiagnostics
            showDetails={showDiagnostics}
            onConnectionRestore={refreshAllData}
          />
        </div>
      )}

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card variant="stat" className="bg-[#2a325c] border-[#596c95]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Apuestas Activas</p>
              <p className="text-2xl font-bold text-white">
                {userStats.activeBets}
              </p>
            </div>
            <Activity className="w-8 h-8 text-[#596c95]" />
          </div>
        </Card>

        <Card variant="stat" className="bg-[#2a325c] border-[#596c95]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Balance Disponible</p>
              <p className="text-2xl font-bold text-[#cd6263]">
                ${userStats.balance.toFixed(2)}
              </p>
              {userStats.frozenAmount > 0 && (
                <p className="text-xs text-yellow-400">
                  ${userStats.frozenAmount.toFixed(2)} congelado
                </p>
              )}
            </div>
            <Wallet className="w-8 h-8 text-[#cd6263]" />
          </div>
        </Card>

        <Card variant="stat" className="bg-[#2a325c] border-[#596c95]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Racha Ganadora</p>
              <p className="text-2xl font-bold text-white">
                {userStats.winningStreak}
              </p>
            </div>
            <Award className="w-8 h-8 text-[#596c95]" />
          </div>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Eventos en vivo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Eventos en vivo */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Eventos en Vivo
            </h2>

            {liveEvents.length > 0 ? (
              <div className="space-y-4">
                {liveEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay eventos en vivo"
                description="Los eventos aparecerán aquí cuando estén transmitiendo"
                icon={<Calendar className="w-12 h-12" />}
              />
            )}
          </div>

          {/* Próximos eventos */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Próximos Eventos
              </h2>
              <div className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} variant="upcoming" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Sidebar */}
        <div className="space-y-6">
          {/* Resumen de billetera */}
          <WalletSummary />

          {/* Panel de apuestas activas */}
          {activeBets.length > 0 && (
            <Card className="bg-[#2a325c] border-[#596c95]">
              <h3 className="text-lg font-semibold text-white mb-4">
                Mis Apuestas Activas
              </h3>
              <div className="space-y-3">
                {activeBets.slice(0, 3).map((bet) => (
                  <div
                    key={bet.id}
                    className="p-3 bg-[#1a1f37] rounded-lg border border-[#596c95]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-300">
                        {bet.eventName || "Evento"}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          bet.side === "red"
                            ? "bg-red-900 text-red-200"
                            : "bg-blue-900 text-blue-200"
                        }`}
                      >
                        {bet.side === "red" ? "Rojo" : "Azul"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Apostado:</span>
                      <span className="text-white">${bet.amount}</span>
                    </div>
                    {bet.potentialPayout && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Posible ganancia:</span>
                        <span className="text-green-400">
                          ${bet.potentialPayout}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Panel de apuestas disponibles (si hay un evento seleccionado) */}
          {liveEvents.length > 0 && (
            <BettingPanel
              fightId={liveEvents[0].fights?.[0]?.id || ""}
              eventName={liveEvents[0].name}
            />
          )}
        </div>
      </div>

      {/* Navegación móvil */}
      <Navigation currentPage="home" />
    </PageContainer>
  );
};

export default Dashboard;
