// frontend/src/pages/user/Dashboard.tsx - CORREGIDO V11
// ========================================================
// ✅ SOLUCIONADO: ReferenceError LiveEventsWidget
// ✅ AGREGADO: Import correcto del componente premium

import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Calendar,
  Activity,
  Wallet,
  Play,
  Trophy,
  Webcam,
  Zap,
  Dices,
  Crown,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEvents, useBets, useWallet } from "../../hooks/useApi";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import SubscriptionGuard from "../../components/shared/SubscriptionGuard";

// Componentes compartidos
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import NewsBanner from "../../components/shared/NewsBanner";

// Componentes del usuario
import WalletSummary from "../../components/user/WalletSummary";
// ✅ AGREGADO: Import del componente premium
import LiveEventsWidget from "../../components/user/LiveEventsWidget";

// Componentes memoizados para features premium
const AdvancedStats = memo(() => (
  <div className="card-background p-4">
    <h3 className="font-semibold">Estadísticas Avanzadas</h3>
    {/* Contenido del componente */}
  </div>
));

const ProfitAnalytics = memo(() => (
  <div className="card-background p-4">
    <h3 className="font-semibold">Análisis de Ganancias</h3>
    {/* Contenido del componente */}
  </div>
));

const BettingTrends = memo(() => (
  <div className="card-background p-4">
    <h3 className="font-semibold">Tendencias de Apuestas</h3>
    {/* Contenido del componente */}
  </div>
));

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // API Hooks - Simplificado
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    fetchEvents,
  } = useEvents();
  const { bets, loading: betsLoading, error: betsError } = useBets();

  // ✅ LISTENERS ESPECÍFICOS DE EVENTOS
  useWebSocketListener(
    "new_event",
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  useWebSocketListener(
    "event_started",
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  useWebSocketListener(
    "event_ended",
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  // ✅ Datos computados simplificados (solo eventos)
  const { liveEvents, upcomingEvents } = useMemo(() => {
    const liveEvents = events?.filter((e) => e.status === "in-progress") || [];
    const upcomingEvents =
      events?.filter((e) => e.status === "scheduled").slice(0, 3) || [];
    return { liveEvents, upcomingEvents };
  }, [events]);

  // Estados de carga
  const isLoading = eventsLoading || betsLoading;
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

        {/* Features premium (protegidos) */}
        <SubscriptionGuard
          feature="estadísticas avanzadas"
          showUpgradePrompt={true}
          fallback={
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm text-gray-600">
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              <span>Actualiza a Premium para estadísticas avanzadas</span>
            </div>
          }
        >
          <div className="premium-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <AdvancedStats />
              <ProfitAnalytics />
              <BettingTrends />
            </div>
          </div>
        </SubscriptionGuard>

        {/* ⚡ EVENTOS EN VIVO BÁSICOS (Versión gratuita) */}
        {liveEvents.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda: Eventos en Vivo Básicos */}
            <div className="card-background p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-400" />
                  Eventos en Vivo
                </h2>
                <button
                  onClick={() => navigate("/events")}
                  className="btn-ghost text-sm"
                >
                  Ver todos
                </button>
              </div>

              <div className="space-y-4">
                {liveEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/live-event/${event.id}`)}
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

            {/* Columna Derecha: Widget Premium - Eventos en vivo premium (solo si hay eventos) */}

            <SubscriptionGuard
              feature="eventos en vivo"
              showUpgradePrompt={false}
              fallback={
                <div className="card-background p-6 flex items-center justify-center h-full">
                  <div className="text-center">
                    <Lock className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Actualiza a Premium para ver el widget avanzado
                    </p>
                  </div>
                </div>
              }
            >
              <LiveEventsWidget />
            </SubscriptionGuard>
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
                onClick={() => navigate("/events")}
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

        {/* 🚫 ESTADOS VACÍOS */}
        {!isLoading && liveEvents?.length === 0 && (
          <EmptyState
            title="No hay Eventos en Vivo"
            description="Parece que no hay eventos en vivo en este momento. ¡Vuelve pronto!"
            icon={<Webcam className="w-12 h-12" />}
          />
        )}
        {!isLoading && upcomingEvents?.length === 0 && (
          <EmptyState
            title="No hay eventos disponibles"
            description="Parece que no hay eventos programados en este momento. ¡Vuelve pronto!"
            icon={<Calendar className="w-12 h-12" />}
          />
        )}

        {/* ⚠️ MANEJO DE ERRORES */}
        {eventsError && (
          <div className="card-background p-4">
            <ErrorMessage
              error={eventsError}
              onRetry={() => window.location.reload()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
