import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Calendar, Webcam, Zap, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEvents, useBets } from "../../hooks/useApi";
import { eventsAPI } from "../../services/api";
import SubscriptionGuard from "../../components/shared/SubscriptionGuard";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import type { EventData } from "../../types";

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isEventData = (value: unknown): value is EventData =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  typeof value.status === "string";

const extractEvents = (payload: unknown): EventData[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isEventData);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const events = payload.events;
  if (Array.isArray(events)) {
    return events.filter(isEventData);
  }

  if (isEventData(payload)) {
    return [payload];
  }

  return [];
};

const UserDashboard: React.FC = () => {
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
  const [todayEvents, setTodayEvents] = useState<EventData[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [todayEventsLoading, setTodayEventsLoading] = useState(false);
  const [upcomingEventsLoading, setUpcomingEventsLoading] = useState(false);

  useEffect(() => {
    const loadTodayEvents = async () => {
      setTodayEventsLoading(true);
      try {
        const response = await eventsAPI.getAll({ dateRange: "today" });
        if (response.success && response.data) {
          setTodayEvents(extractEvents(response.data));
        }
      } catch (error) {
        console.error("Error loading today's events:", error);
      } finally {
        setTodayEventsLoading(false);
      }
    };

    const loadUpcomingEvents = async () => {
      setUpcomingEventsLoading(true);
      try {
        const response = await eventsAPI.getAll({ category: "upcoming" });
        if (response.success && response.data) {
          const eventsArray = extractEvents(response.data);
          const today = new Date();
          const filtered = eventsArray.filter((event) => {
            if (!event?.scheduledDate) return true;
            const eventDate = new Date(event.scheduledDate);
            return !isSameDay(eventDate, today);
          });
          setUpcomingEvents(filtered);
        }
      } catch (error) {
        console.error("Error loading upcoming events:", error);
      } finally {
        setUpcomingEventsLoading(false);
      }
    };

    loadTodayEvents();
    loadUpcomingEvents();
  }, []);


  // ✅ Datos computados simplificados (solo eventos)
  const { liveEvents } = useMemo(() => {
    const liveEvents =
      (allEvents as EventData[] | undefined)?.filter(
        (e) => e.status === "in-progress",
      ) || [];
    return { liveEvents };
  }, [allEvents]);

  // 3. Formateo reutilizable
  const isSameDay = (dateA: Date, dateB: Date) =>
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatWeekday = (date: Date) =>
    date.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase();

  const formatMonth = (date: Date) =>
    date.toLocaleDateString("es-ES", { month: "short" }).toUpperCase();

  const formatDayNumber = (date: Date) =>
    date.toLocaleDateString("es-ES", { day: "2-digit" });

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

        {/* ⚡ EVENTOS EN VIVO BÁSICOS (Versión gratuita) */}
        {liveEvents.length > 0 && (
          <div className="grid grid-cols-1">
            {/* ROW SUPERIOR: Eventos en Vivo Básicos */}
            <div className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30">
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
        {/* ArticleManagement component moved to News.tsx for venue and gallera roles */}

        <div className="grid grid-cols-2 gap-6">
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
                {[...todayEvents]
                  .sort((a, b) => {
                    const dateA = new Date(
                      (a as EventData).scheduledDate,
                    ).getTime();
                    const dateB = new Date(
                      (b as EventData).scheduledDate,
                    ).getTime();
                    return dateA - dateB;
                  })
                  .map((event) => {
                    const typedEvent = event as EventData;
                    const eventDate = new Date(typedEvent.scheduledDate);
                    const isLive = typedEvent.status === "in-progress";
                    return (
                      <button
                        key={typedEvent.id}
                        onClick={() => navigate(`/live-event/${typedEvent.id}`)}
                        className="w-full text-left group"
                      >
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur transition-all group-hover:border-theme-primary/40 group-hover:bg-white/10">
                          <div className="flex flex-col items-center min-w-[68px]">
                            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-theme-light">
                              {formatWeekday(eventDate)}
                            </span>
                            <span className="text-lg font-semibold text-theme-primary">
                              {formatTime(eventDate)}
                            </span>
                            <span className="w-px h-6 bg-white/10 mt-2 hidden sm:block"></span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-semibold text-theme-primary truncate">
                                {typedEvent.name}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.65rem] uppercase tracking-wide border ${
                                  isLive
                                    ? "border-red-500/40 bg-red-500/10 text-red-300"
                                    : "border-white/10 bg-white/5 text-theme-light"
                                }`}
                              >
                                {isLive ? "En vivo" : "Programado"}
                              </span>
                            </div>
                            <p className="text-sm text-theme-light flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10">
                                {typedEvent.venue?.name ||
                                  "Gallera por confirmar"}
                              </span>
                              {typedEvent.totalFights && (
                                <span className="text-xs text-theme-light/80">
                                  {typedEvent.totalFights} peleas
                                </span>
                              )}
                            </p>
                            {typedEvent.description && (
                              <p className="text-xs text-theme-light/70 mt-2 line-clamp-1">
                                {typedEvent.description}
                              </p>
                            )}
                          </div>
                          <div className="text-theme-primary text-sm font-semibold hidden lg:block">
                            Ver evento →
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
                {upcomingEvents.slice(0, 6).map((event) => {
                  const typedEvent = event as EventData;
                  const eventDate = new Date(typedEvent.scheduledDate);
                  return (
                    <button
                      key={typedEvent.id}
                      onClick={() => navigate(`/live-event/${typedEvent.id}`)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 hover:border-theme-primary/40 hover:shadow-lg transition-all">
                        <div className="text-center px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-theme-light">
                            {formatWeekday(eventDate)}
                          </p>
                          <p className="text-2xl font-bold text-theme-primary">
                            {formatDayNumber(eventDate)}
                          </p>
                          <p className="text-xs text-theme-light">
                            {formatMonth(eventDate)}
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="font-semibold text-theme-primary truncate">
                              {typedEvent.name}
                            </h4>
                            <span className="text-xs text-theme-light flex items-center gap-1">
                              {new Date(
                                typedEvent.scheduledDate,
                              ).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-theme-light mt-1">
                            {typedEvent.venue?.name || "Gallera por confirmar"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-theme-light/80">
                            {typedEvent.totalFights && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                                {typedEvent.totalFights} peleas
                              </span>
                            )}
                            {typedEvent.operator && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                                Operado por{" "}
                                {typeof typedEvent.operator === "string"
                                  ? typedEvent.operator
                                  : typedEvent.operator?.username}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-theme-primary text-sm font-semibold hidden md:block">
                          Ver detalles →
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-theme-light">
                No hay próximos eventos programados
              </div>
            )}
          </div>
        </div>

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

export default UserDashboard;
