/**
 * Dashboard Component
 * Página principal para usuarios que muestra eventos en vivo, próximos, apuestas activas
 * y establecimientos destacados
 */
"use client";

import React, { useEffect } from "react";
import { Bell, Calendar, Activity, Wallet, Award } from "lucide-react";
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
  const { wallet } = useWallet();

  // WebSocket listeners
  const wsListeners = {
    new_bet: (data: any) => {
      console.log("Nueva apuesta disponible:", data);
      fetchEvents();
      fetchMyBets();
    },
    bet_matched: (data: any) => {
      console.log("Apuesta emparejada:", data);
      fetchMyBets();
    },
    event_activated: (data: any) => {
      console.log("Evento activado:", data);
      fetchEvents();
    },
    fight_updated: (data: any) => {
      console.log("Pelea actualizada:", data);
      fetchEvents();
    },
  };
  const { isConnected, connectionError } = useWebSocket(undefined, wsListeners);

  // Stats
  const userStats = {
    activeBets: bets?.filter((bet) => bet.status === "active").length || 0,
    balance: wallet?.balance || 0,
    winningStreak: 3, // Placeholder
    streakTrend: "up" as "up" | "down" | "neutral",
  };

  // Notificaciones reales: si hay endpoint, usar hook; si no, dejar badge en 0
  const unreadNotificationsCount = 0;

  useEffect(() => {
    fetchEvents({ status: "in-progress" });
    fetchMyBets({ status: "active" });
  }, []);

  if (eventsLoading || betsLoading)
    return <LoadingSpinner text="Cargando dashboard..." />;
  if (eventsError)
    return <ErrorMessage error={eventsError} onRetry={fetchEvents} />;
  if (betsError)
    return <ErrorMessage error={betsError} onRetry={fetchMyBets} />;

  const liveEvents = events.filter((event) => event.status === "in-progress");
  const activeBets = bets.filter((bet) => bet.status === "active");

  // Selección de evento para EventCard (ejemplo: primero en la lista)
  const firstEvent = events.length > 0 ? events[0] : null;

  return (
    <PageContainer
      title="Mi Dashboard"
      subtitle="Resumen de tus actividades"
      actions={
        <div className="flex items-center gap-3">
          <StatusIndicator
            status={isConnected ? "connected" : "disconnected"}
            label={isConnected ? "Conectado" : "Sin conexión"}
          />
          <NotificationBadge
            count={unreadNotificationsCount}
            onClick={() => {}}
          />
        </div>
      }
      loading={eventsLoading || betsLoading}
      error={connectionError}
      onRetry={() => {
        if (eventsError) fetchEvents();
        if (betsError) fetchMyBets();
      }}
    >
      {connectionError && !isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800 text-sm">⚠️ {connectionError}</p>
        </div>
      )}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            variant="stat"
            title="Apuestas Activas"
            value={userStats.activeBets}
            trend={{ value: 12.5, direction: "up", period: "semana pasada" }}
            icon={Activity}
            color="blue"
          />
          <Card
            variant="data"
            title="Wallet Balance"
            value={`$${userStats.balance.toFixed(2)}`}
            icon={Wallet}
            color="green"
          />
          <Card
            variant="data"
            title="Winning Streak"
            value={userStats.winningStreak}
            icon={Award}
            trend={{ value: 0, direction: userStats.streakTrend }}
            color="red"
          />
        </div>
        <div className="user-dashboard">
          <Navigation />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WalletSummary
              balance={wallet?.balance || 0}
              frozenAmount={wallet?.frozenAmount || 0}
            />
            {firstEvent && (
              <EventCard
                id={firstEvent.id}
                venueName={firstEvent.venue?.name || ""}
                isLive={firstEvent.status === "in-progress"}
                dateTime={firstEvent.scheduledDate}
                activeBettors={firstEvent.totalBets || 0}
                imageUrl={firstEvent.venue?.images?.[0]}
                onSelect={() => {}}
              />
            )}
            <BettingPanel />
          </div>
        </div>
        {/* Empty state */}
        {events.length === 0 && (
          <EmptyState
            title="No hay eventos"
            description="Prueba ajustando los filtros"
            icon={<Calendar className="w-8 h-8 text-gray-400" />}
          />
        )}
        <div className="relative">
          <Bell className="w-5 h-5" />
          <NotificationBadge count={unreadNotificationsCount} size="lg" />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
