// frontend/src/pages/user/Dashboard.tsx - VERSIÓN COMPLETAMENTE CORREGIDA
import React, { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Activity,
  Wallet,
  Award,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import EventCard from "../../components/user/EventCard";
import BettingPanel from "../../components/user/BettingPanel";
import WalletSummary from "../../components/user/WalletSummary";
import Navigation from "../../components/user/Navigation";
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

  // 🔧 FIX: Manejo defensivo del wallet - compatible con ambas estructuras
  const walletHook = useWallet();
  const wallet =
    walletHook.wallet || walletHook.balance
      ? {
          balance:
            walletHook.wallet?.balance || walletHook.balance?.available || 0,
          frozenAmount:
            walletHook.wallet?.frozenAmount || walletHook.balance?.frozen || 0,
          availableBalance:
            walletHook.wallet?.availableBalance ||
            walletHook.balance?.available ||
            0,
        }
      : null;

  const walletLoading = walletHook.loading;
  const walletError = walletHook.error;

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);

  // WebSocket listeners para actualizaciones en tiempo real
  const wsListeners = {
    new_bet: (data: any) => {
      console.log("🎯 Nueva apuesta disponible:", data);
      fetchEvents?.();
      fetchMyBets?.();
      setLastUpdated(new Date());
    },
    bet_matched: (data: any) => {
      console.log("🤝 Apuesta emparejada:", data);
      fetchMyBets?.();
      setLastUpdated(new Date());
    },
    event_activated: (data: any) => {
      console.log("🎪 Evento activado:", data);
      fetchEvents?.();
      setLastUpdated(new Date());
    },
    fight_updated: (data: any) => {
      console.log("🥊 Pelea actualizada:", data);
      fetchEvents?.();
      setLastUpdated(new Date());
    },
  };

  // 🔧 FIX: WebSocket con manejo de errores mejorado
  const { isConnected, connectionError, emit } = useWebSocket(
    undefined,
    wsListeners
  );

  // Función para refrescar todos los datos
  const refreshAllData = async () => {
    try {
      await Promise.all([
        fetchEvents?.(),
        fetchMyBets?.(),
        walletHook.fetchWallet?.(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(refreshAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Retry connection si falla
  useEffect(() => {
    if (!isConnected && connectionRetries < 3) {
      const timeout = setTimeout(() => {
        setConnectionRetries((prev) => prev + 1);
        refreshAllData();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isConnected, connectionRetries]);

  // 🔧 FIX: Stats calculados con validación defensiva
  const userStats = {
    activeBets: Array.isArray(bets)
      ? bets.filter((bet) => bet.status === "active").length
      : 0,
    balance: typeof wallet?.balance === "number" ? wallet.balance : 0,
    frozenAmount:
      typeof wallet?.frozenAmount === "number" ? wallet.frozenAmount : 0,
    winningStreak: 3, // TODO: Calcular de las últimas apuestas ganadas
    streakTrend: "up" as "up" | "down" | "neutral",
  };

  // Filtrar eventos por estado con validación
  const liveEvents = Array.isArray(events)
    ? events.filter((event) => event.status === "in-progress")
    : [];
  const upcomingEvents = Array.isArray(events)
    ? events.filter((event) => event.status === "scheduled")
    : [];
  const activeBets = Array.isArray(bets)
    ? bets.filter((bet) => bet.status === "active")
    : [];

  // Mostrar loading si estamos cargando datos críticos
  if (eventsLoading && betsLoading && walletLoading) {
    return (
      <PageContainer>
        <LoadingSpinner text="Cargando dashboard..." />
      </PageContainer>
    );
  }

  // Mostrar errores críticos solo si no hay datos
  if (eventsError && !Array.isArray(events)) {
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
          {/* Estado de conexión */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm text-gray-400">
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>

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
      {(showDiagnostics || (!isConnected && connectionError)) && (
        <div className="mb-4 p-4 bg-[#2a325c] border border-[#596c95] rounded-lg">
          <h3 className="text-white font-semibold mb-2">
            Diagnóstico de Conexión
          </h3>
          <div className="space-y-2 text-sm">
            <div
              className={`flex items-center gap-2 ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                }`}
              ></div>
              WebSocket: {isConnected ? "Conectado" : "Desconectado"}
            </div>
            {connectionError && (
              <div className="text-yellow-400">Error: {connectionError}</div>
            )}
            <div className="text-gray-400">
              Intentos de reconexión: {connectionRetries}/3
            </div>
            <button
              onClick={refreshAllData}
              className="mt-2 px-3 py-1 bg-[#596c95] text-white rounded text-xs hover:bg-[#4a5a85]"
            >
              Reintentar Conexión
            </button>
          </div>
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
                ${Number(userStats.balance).toFixed(2)}
              </p>
              {userStats.frozenAmount > 0 && (
                <p className="text-xs text-yellow-400">
                  ${Number(userStats.frozenAmount).toFixed(2)} congelado
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

            {eventsLoading ? (
              <LoadingSpinner size="sm" />
            ) : liveEvents.length > 0 ? (
              <div className="space-y-4">
                {liveEvents.slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar />}
                title="No hay eventos en vivo"
                description="Los eventos aparecerán aquí cuando estén transmitiendo"
              />
            )}
          </div>

          {/* Próximos eventos */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Próximos Eventos
            </h2>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar />}
                title="No hay eventos programados"
                description="Los próximos eventos aparecerán aquí"
              />
            )}
          </div>
        </div>

        {/* Columna derecha: Panel de apuestas y wallet */}
        <div className="space-y-6">
          {/* Resumen de wallet */}
          <WalletSummary />

          {/* Panel de apuestas rápidas */}
          {liveEvents.length > 0 && <BettingPanel fightId="current-fight-id" />}

          {/* Mis apuestas activas */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Mis Apuestas Activas
            </h3>

            {betsLoading ? (
              <LoadingSpinner size="sm" />
            ) : activeBets.length > 0 ? (
              <div className="space-y-2">
                {activeBets.slice(0, 5).map((bet) => (
                  <div
                    key={bet.id}
                    className="bg-[#2a325c] border border-[#596c95] p-3 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {bet.eventName || "Evento"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {bet.side === "red" ? "Rojo" : "Azul"} - ${bet.amount}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#cd6263] text-sm font-bold">
                          ${bet.potentialPayout?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-gray-400 text-xs">Potencial</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Activity />}
                title="No tienes apuestas activas"
                description="Tus apuestas aparecerán aquí"
                size="sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Navegación móvil */}
      <Navigation currentPage="home" />
    </PageContainer>
  );
};

export default Dashboard;
