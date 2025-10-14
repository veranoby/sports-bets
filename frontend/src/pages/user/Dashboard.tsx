import React, { useCallback, useMemo } from "react";
import {
  Calendar,
  Activity,
  Webcam,
  Zap,
  Dices,
  Lock,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEvents, useBets } from "../../hooks/useApi";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import SubscriptionGuard from "../../components/shared/SubscriptionGuard";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";

// Componentes compartidos
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import NewsBanner from "../../components/shared/NewsBanner";
import Card from "../../components/shared/Card";
import Badge from "../../components/shared/Badge";

// Componentes del usuario
// ✅ AGREGADO: Import del componente premium
import LiveEventsWidget from "../../components/user/LiveEventsWidget";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isBettingEnabled } = useFeatureFlags();

  // API Hooks - Updated to use new API parameters
  const {
    events: allEvents,
    loading: eventsLoading,
    error: eventsError,
    fetchEvents,
  } = useEvents();

  // Fetch today's events and upcoming events using new API parameters
  const { data: todayEventsData, loading: todayEventsLoading } = useEvents({
    dateRange: "today",
  });
  const { data: upcomingEventsData, loading: upcomingEventsLoading } =
    useEvents({ category: "upcoming" });

  const todayEvents = todayEventsData?.events || [];
  const upcomingEvents = upcomingEventsData?.events || [];

  // ✅ LISTENERS ESPECÍFICOS DE EVENTOS
  useWebSocketListener(
    "new_event",
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  useWebSocketListener(
    "event_started",
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  useWebSocketListener(
    "event_ended",
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  // ✅ Datos computados simplificados (solo eventos)
  const { liveEvents } = useMemo(() => {
    const liveEvents =
      allEvents?.filter((e) => e.status === "in-progress") || [];
    return { liveEvents };
  }, [allEvents]);

  // 3. Formateo reutilizable
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Estados de carga
  const { loading: betsLoading } = useBets();
  const isLoading =
    eventsLoading || todayEventsLoading || upcomingEventsLoading || betsLoading;

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

        {/* ROLE-SPECIFIC SECTIONS */}
        {user?.role === "user" && isBettingEnabled && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-theme-primary">
              Mis Apuestas
            </h2>
            <div className="card-background p-6">
              <p>
                Aquí irán las secciones de Mis Apuestas y Historial de Apuestas
                (BettingSection).
              </p>
              {/* <BettingSection /> */}{" "}
              {/* Placeholder for actual component */}
            </div>
          </div>
        )}

        {/* ArticleManagement component moved to News.tsx for venue and gallera roles */}

        <div className="grid grid-cols-1 gap-6">
          {/* ⚡ EVENTOS PARA HOY */}
          <div className="card-background p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-theme-primary flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Eventos de Hoy
              </h3>
              {todayEvents.length > 0 && (
                <Badge value={todayEvents.length} variant="primary" size="sm" />
              )}
            </div>

            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/live-event/${event.id}`)}
                    className="flex items-center justify-between p-3 bg-[#1a1f37]/30 rounded-lg cursor-pointer hover:bg-[#1a1f37]/50 transition-colors"
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
                        {formatTime(new Date(event.scheduledDate))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-theme-light">
                No hay eventos programados para hoy
              </div>
            )}
          </div>

          {/* 📅 PRÓXIMOS EVENTOS */}
          <div className="card-background p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-theme-primary flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximos Eventos
              </h3>
              {upcomingEvents.length > 0 && (
                <button
                  onClick={() => navigate("/events")}
                  className="btn-ghost text-sm"
                >
                  Ver todos
                </button>
              )}
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 6).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="flex items-center justify-between p-3 bg-[#1a1f37]/30 rounded-lg cursor-pointer hover:bg-[#1a1f37]/50 transition-colors"
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
                          },
                        )}
                      </p>
                      <p className="text-xs text-theme-light">
                        {new Date(event.scheduledDate).toLocaleTimeString(
                          "es-ES",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-theme-light">
                No hay próximos eventos programados
              </div>
            )}
          </div>
        </div>

        {/* ⚡ EVENTOS EN VIVO BÁSICOS (Versión gratuita) */}
        {liveEvents.length > 0 && (
          <div className="grid grid-cols-1">
            {/* ROW SUPERIOR: Eventos en Vivo Básicos */}
            <div className="card-background p-6">
              <div className="space-y-4"></div>

              {/* Columna PREMIUM: Widget Premium - Eventos en vivo premium (solo si hay eventos) */}

              <SubscriptionGuard
                feature="eventos en vivo"
                showUpgradePrompt={false}
                fallback={
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                        <Zap className="w-5 h-5 text-red-400" />
                        Hay Eventos en Vivo!
                      </h2>

                      {liveEvents.map((event) => (
                        <div key={event.id}>
                          <h3 className="font-medium text-theme-primary mb-1 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            {event.name}
                          </h3>
                          <p className="text-sm text-theme-light">
                            {event.venue?.name}
                          </p>

                          {/* Removed currentViewers display due to missing type on EventData */}
                        </div>
                      ))}

                      <button
                        onClick={() => navigate("/events")}
                        className="btn-ghost text-sm"
                      >
                        Ver todos
                      </button>
                    </div>

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
