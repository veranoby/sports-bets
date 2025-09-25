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
import Badge from "../../components/shared/Badge"; // Added Badge import

// Componentes del usuario
// ✅ AGREGADO: Import del componente premium
import LiveEventsWidget from "../../components/user/LiveEventsWidget";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isBettingEnabled } = useFeatureFlags();

  // API Hooks - Simplificado
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    fetchEvents,
  } = useEvents();
  const { loading: betsLoading } = useBets();

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
  const { liveEvents, upcomingEvents } = useMemo(() => {
    const liveEvents = events?.filter((e) => e.status === "in-progress") || [];
    const upcomingEvents =
      events?.filter((e) => e.status === "scheduled").slice(0, 3) || [];
    return { liveEvents, upcomingEvents };
  }, [events]);

  // 1. Debug con console.log
  console.log("All upcoming events:", upcomingEvents);

  // 2. Filtrado memoizado
  const todayEvents = useMemo(() => {
    const filtered = upcomingEvents.filter((event) => {
      if (!event.scheduledDate) return false; // Validación

      const eventDate = new Date(event.scheduledDate);
      if (isNaN(eventDate.getTime())) return false; // Fecha inválida

      const today = new Date();
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    });

    console.log("Today's valid events:", filtered);
    return filtered;
  }, [upcomingEvents]);

  // 3. Formateo reutilizable
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Estados de carga
  const isLoading = eventsLoading || betsLoading;

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

        <div className="grid grid-cols-2 ">
          <div>
            {" "}
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
                  <Card
                    variant="stat"
                    title="Estadísticas Avanzadas"
                    value="+12%"
                    icon={<Activity className="w-5 h-5" />}
                    trend={{ value: 12, direction: "up" }}
                    description="Rendimiento mensual"
                    color="blue"
                  />
                  <Card
                    variant="stat"
                    title="Análisis de Ganancias"
                    value="$1,240"
                    icon={<TrendingUp className="w-5 h-5" />}
                    trend={{ value: 8, direction: "up" }}
                    description="Últimos 7 días"
                    color="green"
                  />
                  <Card
                    variant="stat"
                    title="Tendencias de Apuestas"
                    value="3.2x"
                    icon={<Dices className="w-5 h-5" />}
                    trend={{ value: 3.2, direction: "neutral" }}
                    description="Ratio de apuestas"
                    color="purple"
                  />
                </div>
              </div>
            </SubscriptionGuard>
          </div>
          <div>
            {" "}
            {/* ⚡ EVENTOS PARA HOY */}
            {todayEvents.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-left mb-3">
                  <h3 className="text-2xl font-bold  text-theme-primary">
                    Eventos de hoy!{" "}
                    <Badge
                      value={todayEvents.length}
                      variant="primary"
                      size="sm"
                    />{" "}
                  </h3>
                  {todayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => navigate(`/live-event/${event.id}`)}
                      className="m-2"
                    >
                      <Badge
                        value={formatTime(new Date(event.scheduledDate))} // Solo hora
                        variant="success"
                        size="md"
                        icon={<Calendar className="w-3 h-3" />}
                        className="hover:bg-[#596c95] transition-colors cursor-pointer"
                      >
                        {event.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ⚡ EVENTOS EN VIVO BÁSICOS (Versión gratuita) */}
        {liveEvents.length > 0 && (
          <div className="grid grid-cols-1 ">
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
                      <Badge
                        key={event.id}
                        value={event.name}
                        variant="primary"
                        size="md"
                        icon={<Calendar className="w-3 h-3" />}
                        className="hover:bg-[#596c95] transition-colors cursor-pointer mx-2"
                      ></Badge>{" "}
                      {event.venue?.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-theme-primary">
                      <Badge
                        key={event.id}
                        value={new Date(event.scheduledDate).toLocaleDateString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "short",
                          },
                        )}
                        variant="secondary"
                        size="md"
                        icon={<Calendar className="w-3 h-3" />}
                        className="hover:bg-[#596c95] transition-colors cursor-pointer mx-2"
                      ></Badge>

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
