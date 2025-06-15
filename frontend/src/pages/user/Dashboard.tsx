// frontend/src/pages/user/Dashboard.tsx - VERSIÓN COMPLETAMENTE CORREGIDA

import React, { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Activity,
  Wallet,
  Award,
  AlertCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

  const {
    wallet,
    loading: walletLoading,
    error: walletError,
    fetchWallet,
  } = useWallet();

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // WebSocket listeners para actualizaciones en tiempo real
  const wsListeners = {
    new_bet: (data: any) => {
      console.log("🎯 Nueva apuesta disponible:", data);
      fetchEvents();
      fetchMyBets();
      setLastUpdated(new Date());
    },
    bet_matched: (data: any) => {
      console.log("💰 Apuesta emparejada:", data);
      fetchMyBets();
      fetchWallet(); // Actualizar balance
      setLastUpdated(new Date());
    },
    event_activated: (data: any) => {
      console.log("🏁 Evento activado:", data);
      fetchEvents();
      setLastUpdated(new Date());
    },
    fight_updated: (data: any) => {
      console.log("🥊 Pelea actualizada:", data);
      fetchEvents();
      setLastUpdated(new Date());
    },
    betting_opened: (data: any) => {
      console.log("🔓 Apuestas abiertas:", data);
      fetchEvents();
      setLastUpdated(new Date());
    },
    betting_closed: (data: any) => {
      console.log("🔒 Apuestas cerradas:", data);
      fetchEvents();
      setLastUpdated(new Date());
    },
  };

  const { isConnected, connectionError } = useWebSocket(undefined, wsListeners);

  // Calcular estadísticas del usuario con validaciones
  const userStats = {
    activeBets: Array.isArray(bets)
      ? bets.filter((bet) => bet.status === "active").length
      : 0,
    balance: wallet?.balance ? Number(wallet.balance) : 0,
    availableBalance: wallet?.availableBalance
      ? Number(wallet.availableBalance)
      : 0,
    frozenAmount: wallet?.frozenAmount ? Number(wallet.frozenAmount) : 0,
    winningStreak: 3, // Placeholder - implementar lógica real
    totalBets: Array.isArray(bets) ? bets.length : 0,
  };

  // Notificaciones (placeholder - implementar endpoint real)
  const unreadNotificationsCount = 0;

  // Función para refrescar todos los datos
  const refreshAllData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchEvents({ status: "in-progress" }),
        fetchMyBets({ status: "active" }),
        fetchWallet(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    refreshAllData();
  }, []);

  // Handlers
  const handleViewWallet = () => {
    navigate("/wallet");
  };

  const handleEnterEvent = (eventId: string) => {
    navigate(`/live-event/${eventId}`);
  };

  const handleViewAllEvents = () => {
    navigate("/events");
  };

  const handleViewAllBets = () => {
    navigate("/bets");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Estados de carga
  const isLoading = eventsLoading || betsLoading || walletLoading;
  const hasError = eventsError || betsError || walletError;

  // Filtrar eventos
  const liveEvents = Array.isArray(events)
    ? events.filter((event) => event.status === "in-progress")
    : [];
  const upcomingEvents = Array.isArray(events)
    ? events.filter((event) => event.status === "scheduled")
    : [];
  const activeBets = Array.isArray(bets)
    ? bets.filter((bet) => bet.status === "active")
    : [];

  // Loading state
  if (isLoading && !events.length && !bets.length) {
    return (
      <PageContainer>
        <LoadingSpinner text="Cargando dashboard..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header with user info and logout */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#596c95] rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                ¡Hola, {user?.username || "Usuario"}!
              </h1>
              <p className="text-sm text-gray-600">
                {lastUpdated
                  ? `Última actualización: ${lastUpdated.toLocaleTimeString()}`
                  : "Bienvenido a SportsBets"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* WebSocket Status */}
            <StatusIndicator
              status={isConnected ? "connected" : "disconnected"}
              label={isConnected ? "En línea" : "Desconectado"}
            />

            {/* Refresh Button */}
            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <NotificationBadge count={unreadNotificationsCount} />
                )}
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error handling */}
      {hasError && (
        <div className="mb-6">
          <ErrorMessage
            error={eventsError || betsError || walletError}
            onRetry={refreshAllData}
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card
          variant="stat"
          title="Apuestas Activas"
          value={userStats.activeBets.toString()}
          icon={Activity}
          color="blue"
        />
        <Card
          variant="stat"
          title="Balance Disponible"
          value={`$${userStats.availableBalance.toFixed(2)}`}
          icon={Wallet}
          color="green"
          onClick={handleViewWallet}
          className="cursor-pointer hover:shadow-md transition-shadow"
        />
        <Card
          variant="stat"
          title="Balance Total"
          value={`$${userStats.balance.toFixed(2)}`}
          icon={Wallet}
          color="gray"
        />
        <Card
          variant="stat"
          title="Racha Ganadora"
          value={userStats.winningStreak.toString()}
          icon={Award}
          color="red"
          trend={{ value: 0, direction: "neutral", period: "última semana" }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Wallet Summary */}
        <div className="lg:col-span-1">
          <WalletSummary />
        </div>

        {/* Live Events */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Eventos en Vivo
              </h2>
              <button
                onClick={handleViewAllEvents}
                className="text-[#596c95] hover:text-[#4a5a85] text-sm font-medium"
              >
                Ver todos
              </button>
            </div>

            {liveEvents.length > 0 ? (
              <div className="grid gap-4">
                {liveEvents.slice(0, 2).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEnter={() => handleEnterEvent(event.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No hay eventos en vivo"
                description="Los eventos aparecerán aquí cuando estén activos"
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Bets */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Mis Apuestas Activas
            </h2>
            <button
              onClick={handleViewAllBets}
              className="text-[#596c95] hover:text-[#4a5a85] text-sm font-medium"
            >
              Ver todas
            </button>
          </div>

          {activeBets.length > 0 ? (
            <div className="space-y-3">
              {activeBets.slice(0, 3).map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {bet.eventName || "Evento"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Lado: {bet.side === "red" ? "Rojo" : "Azul"} • $
                      {bet.amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#596c95]">
                      {bet.status === "active" ? "Activa" : bet.status}
                    </p>
                    {bet.potentialPayout && (
                      <p className="text-xs text-gray-500">
                        Ganancia: ${bet.potentialPayout.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No tienes apuestas activas"
              description="Tus apuestas aparecerán aquí cuando participes en eventos"
            />
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Próximos Eventos
            </h2>
            <button
              onClick={handleViewAllEvents}
              className="text-[#596c95] hover:text-[#4a5a85] text-sm font-medium"
            >
              Ver calendario
            </button>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.scheduledDate).toLocaleDateString()} •{" "}
                      {event.venue?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#596c95]">Programado</p>
                    <p className="text-xs text-gray-500">
                      {event.totalFights || 0} peleas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No hay eventos programados"
              description="Los próximos eventos aparecerán aquí"
            />
          )}
        </div>
      </div>

      {/* Navigation Component */}
      <Navigation currentPage="home" />

      {/* Debug Info (solo en desarrollo) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showDiagnostics ? "Ocultar" : "Mostrar"} información de debug
          </button>

          {showDiagnostics && (
            <div className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg text-xs font-mono">
              <p>🔌 WebSocket: {isConnected ? "Conectado" : "Desconectado"}</p>
              <p>
                📊 Eventos: {events.length} total, {liveEvents.length} en vivo
              </p>
              <p>
                🎯 Apuestas: {bets.length} total, {activeBets.length} activas
              </p>
              <p>
                💰 Wallet: ${userStats.balance.toFixed(2)} ($
                {userStats.availableBalance.toFixed(2)} disponible)
              </p>
              {connectionError && <p>❌ Error WS: {connectionError}</p>}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default Dashboard;
