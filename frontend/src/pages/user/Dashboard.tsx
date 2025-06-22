// frontend/src/pages/user/Dashboard.tsx - CORREGIDO V10
// ========================================================
// SOLUCIONADO: Bucle infinito en useEffect
// OPTIMIZADO: Fetch inicial sin dependencias problemáticas

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { useWebSocketListener } from "../../hooks/useWebSocket";

// Componentes
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import NewsBanner from "../../components/shared/NewsBanner";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // API Hooks
  const { events, loading: eventsLoading, error: eventsError } = useEvents();
  const { bets, loading: betsLoading, error: betsError } = useBets();
  const { wallet, loading: walletLoading } = useWallet();

  // Estados locales
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ SOLUCIÓN: Handlers estables sin dependencias problemáticas
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

  // ✅ SOLUCIÓN: WebSocket listeners memoizados correctamente
  useWebSocketListener(
    "new_bet",
    useCallback(() => {
      setLastUpdated(new Date());
    }, [])
  );

  useWebSocketListener(
    "bet_matched",
    useCallback(() => {
      setLastUpdated(new Date());
    }, [])
  );

  useWebSocketListener(
    "fight_result",
    useCallback(() => {
      setLastUpdated(new Date());
    }, [])
  );

  useWebSocketListener(
    "wallet_updated",
    useCallback(() => {
      setLastUpdated(new Date());
    }, [])
  );

  // ✅ SOLUCIÓN: Datos computados memoizados
  const { liveEvents, upcomingEvents, activeBets, quickStats } = useMemo(() => {
    const liveEvents = events?.filter((e) => e.status === "in-progress") || [];
    const upcomingEvents =
      events?.filter((e) => e.status === "scheduled").slice(0, 3) || [];
    const activeBets =
      bets?.filter((b) => b.status === "active").slice(0, 3) || [];

    const quickStats = {
      activeBets: activeBets.length,
      totalWinnings:
        bets
          ?.filter((b) => b.result === "win")
          .reduce((sum, bet) => sum + (bet.potentialWin || 0), 0) || 0,
      liveEvents: liveEvents.length,
      winRate:
        bets?.length > 0
          ? (bets.filter((b) => b.result === "win").length / bets.length) * 100
          : 0,
    };

    return { liveEvents, upcomingEvents, activeBets, quickStats };
  }, [events, bets]);

  // Estados de carga
  const isLoading = eventsLoading || betsLoading || walletLoading;
  const hasErrors = eventsError || betsError;

  if (isLoading) {
    return (
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
            className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-theme-primary">
                  ${(wallet?.balance || 0).toFixed(2)}
                </p>
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

        {/* 🚫 ESTADOS VACÍOS */}
        {!isLoading && events?.length === 0 && (
          <EmptyState
            title="No hay eventos disponibles"
            description="Parece que no hay eventos programados en este momento. ¡Vuelve pronto!"
            icon={<Calendar className="w-12 h-12" />}
          />
        )}

        {/* ⚠️ MANEJO DE ERRORES */}
        {hasErrors && (
          <div className="card-background p-4">
            <ErrorMessage
              error={eventsError || betsError || "Error desconocido"}
              onRetry={() => window.location.reload()}
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
      </div>
    </div>
  );
};

export default Dashboard;
