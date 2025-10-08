// frontend/src/pages/user/Events.tsx - MIGRADO V9
// ===================================================
// ELIMINADO: getUserThemeClasses() import y usage
// APLICADO: Clases CSS estáticas directas

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Play,
  Clock,
  MapPin,
  Users,
  Zap,
  Star,
  ChevronRight,
  Lock,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Hooks y contextos
import { useEvents } from "../../hooks/useApi";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
// ❌ ELIMINADO: import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import SubscriptionGuard from "../../components/shared/SubscriptionGuard";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";

// Componentes
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import StatusChip from "../../components/shared/StatusChip";
import SearchInput from "../../components/shared/SearchInput";

// Tipos
import type { EventData } from "../../types";

// Memoizar EventCard para evitar re-renders innecesarios
const EventCard = React.memo(
  ({
    event,
    variant = "upcoming",
  }: {
    event: EventData;
    variant?: "upcoming" | "archived";
  }) => {
    const navigate = useNavigate(); // Add navigate hook here
    const isLive = event.status === "in-progress";
    const { isBettingEnabled } = useFeatureFlags();

    return (
      <div
        className={`bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-[#2a325c33] p-4 rounded-xl cursor-pointer hover:bg-[#2a325c17]/80 transition-all duration-200 transform hover:scale-[1.02] ${
          variant === "archived" ? "opacity-80 hover:opacity-100" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-xs font-medium">
                  EN VIVO
                </span>
              </div>
            )}
            <StatusChip status={event.status} size="sm" />
          </div>
          <ChevronRight className="w-4 h-4 text-theme-dark" />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-theme-primary truncate">
            {event.name}
          </h3>

          <div className="flex items-center gap-2 text-sm text-theme-dark">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{event.venue?.name || "Venue TBD"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-theme-dark">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(event.scheduledDate).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {event.currentViewers && (
            <div className="flex items-center gap-2 text-sm text-theme-dark">
              <Users className="w-4 h-4" />
              <span>{event.currentViewers} espectadores</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#596c95]/20">
          <div className="flex items-center gap-2">
            {isBettingEnabled && event.activeBets && event.activeBets > 0 && (
              <span className="text-xs text-green-600 bg-green-500/20 px-2 py-1 rounded-full">
                {event.activeBets} apuestas activas
              </span>
            )}
          </div>

          {isLive && (
            <SubscriptionGuard
              feature="streaming"
              showUpgradePrompt={false}
              fallback={
                <div className="flex items-center text-gray-500">
                  <Lock className="w-4 h-4 mr-1" />
                  <span className="text-sm">Premium</span>
                </div>
              }
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/live-event/${event.id}`);
                }}
                className="bg-[#cd6263] text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1 hover:bg-[#cd6263]/90 transition-colors"
              >
                <Play className="w-3 h-3" />
                Unirse
              </button>
            </SubscriptionGuard>
          )}
        </div>
      </div>
    );
  },
);

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  // ❌ ELIMINADO: const theme = getUserThemeClasses();

  // API Hooks
  const { events, loading, error, fetchEvents } = useEvents();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "upcoming">(
    "all",
  );
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // ✅ Referencia estable para fetchEvents
  const fetchEventsRef = useRef(fetchEvents);
  useEffect(() => {
    fetchEventsRef.current = fetchEvents;
  }, [fetchEvents]);

  // WebSocket para actualizaciones en tiempo real
  const { isConnected } = useWebSocketContext();

  // Cargar eventos al montar
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filtrar eventos
  const upcomingEvents =
    events?.filter((event) => {
      const matchesSearch = event.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || statusFilter === "upcoming";
      const isUpcoming = event.status === "scheduled";
      return matchesSearch && matchesStatus && isUpcoming;
    }) || [];

  const archivedEvents =
    events?.filter((event) => {
      const matchesSearch = event.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all";
      const isCompleted = event.status === "completed";
      return matchesSearch && matchesStatus && isCompleted;
    }) || [];

  // Handlers
  const handleSearchChange = (
    value: string | React.ChangeEvent<HTMLInputElement>,
  ) => {
    const searchValue = typeof value === "string" ? value : value.target.value;
    setSearchTerm(searchValue);
  };

  const handleJoinEvent = (eventId: string) => {
    navigate(`/live-event/${eventId}`);
  };

  // ✅ Detectar evento en vivo (agregar al inicio del componente)
  const liveEvent = events?.find((e) => e.status === "in-progress");

  if (loading) {
    return (
      /* ✅ MIGRADO: theme.pageBackground → page-background */
      <div className="page-background">
        <LoadingSpinner text="Cargando eventos..." className="mt-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-background">
        <div className="p-4">
          <ErrorMessage error={error} onRetry={fetchEvents} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-6">


           {/* Title and Stat Chips */}
           <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
             <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
               <Calendar className="w-6 h-6 text-blue-600" />
               Listado de Eventos
             </h1>
             
             {/* Chips estadísticos compactos */}
             <div className="flex flex-wrap gap-3">
               <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-full border border-green-500/30">
                 <Zap className="w-4 h-4 text-green-600" />
                 <span className="text-xs text-green-600 font-bold">
                   En Vivo
                 </span>
                 <span className="text-sm text-green-600 font-bold">
                   {events?.filter((e) => e.status === "in-progress").length ||
                     0}
                 </span>
               </div>

               <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 rounded-full border border-amber-500/30">
                 <Clock className="w-4 h-4 text-amber-600" />
                 <span className="text-xs text-amber-600 font-bold">
                   Próximos
                 </span>
                 <span className="text-sm font-bold text-amber-600">
                   {events?.filter((e) => e.status === "scheduled").length || 0}
                 </span>
               </div>

               <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                 <Users className="w-4 h-4 text-blue-600" />
                 <span className="text-xs text-blue-600 font-bold">
                   Apuestas
                 </span>
                 <span className="text-sm font-bold text-blue-600">
                   {events?.reduce((sum, e) => sum + (e.activeBets || 0), 0) ||
                     0}
                 </span>
               </div>
             </div>
           </div>



        {/* Header con búsqueda y filtros */}
        <div className="card-background p-4">
          <div className="flex flex-col md:flex-row gap-4">
       

            {/* Barra de búsqueda - Reducido el ancho */}
            <div className="flex-1 relative w-full md:w-2/5">
              <SearchInput
                placeholder="Buscar eventos..."
                onSearch={handleSearchChange}
                value={searchTerm}
                showClearButton
                debounceMs={300}
                className="w-full"
              />
            </div>

            {/* Filtros de estado - Mejorados los estilos */}
            <div className="flex gap-2 w-full md:w-1/5">
              {[
                { key: "all", label: "Todos", icon: Calendar },
                { key: "live", label: "En Vivo", icon: Zap },
                { key: "upcoming", label: "Próximos", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() =>
                    setStatusFilter(key as "all" | "live" | "upcoming")
                  }
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                    statusFilter === key
                      ? "bg-gradient-to-r from-blue-300 to-blue-400 text-white shadow-md"
                      : "text-theme-primary  border border-[#596c95]/50 shadow-sm"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de eventos */}
        {upcomingEvents.length === 0 && archivedEvents.length === 0 ? (
          <EmptyState
            title="No hay eventos disponibles"
            description={
              searchTerm
                ? "No se encontraron eventos que coincidan con tu búsqueda"
                : statusFilter !== "all"
                  ? `No hay eventos ${
                      statusFilter === "live" ? "en vivo" : "próximos"
                    } en este momento`
                  : "No hay eventos programados actualmente"
            }
            icon={<Calendar className="w-12 h-12" />}
            action={
              searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="btn-ghost text-sm"
                >
                  Limpiar búsqueda
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Eventos en vivo (prioridad) */}
            {/* Evento en vivo (agregar al inicio del componente) */}
            {liveEvent && (
              <div
                onClick={() => navigate(`/live-event/${liveEvent.id}`)}
                className="bg-gradient-to-r from-red-600/20 to-red-800/20 border border-red-500/50 rounded-xl p-4 cursor-pointer hover:from-red-600/30 hover:to-red-800/30 transition-all duration-300 transform hover:scale-[1.02] mx-4 mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                    </div>

                    <div>
                      <h3 className="font-bold text-red-300 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        ¡Evento en Vivo Ahora!
                      </h3>
                      <p className="text-sm text-theme-light">
                        {liveEvent.name}
                      </p>
                      <p className="text-xs text-theme-light">
                        {liveEvent.venue?.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {liveEvent.currentViewers && (
                      <div className="flex items-center gap-1 text-green-600 text-sm mb-2">
                        <Eye className="w-4 h-4" />
                        <span>{liveEvent.currentViewers} viendo</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-red-300 font-medium">
                      <Play className="w-5 h-5" />
                      <span>Ver Evento</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Eventos próximos */}
            {upcomingEvents.length > 0 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents
                    .sort(
                      (a, b) =>
                        new Date(a.scheduledDate).getTime() -
                        new Date(b.scheduledDate).getTime(),
                    )
                    .map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        variant="upcoming"
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Eventos finalizados */}
            {archivedEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Eventos Pasados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedEvents
                    .slice(0, 6) // Mostrar solo los últimos 6
                    .map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        variant="archived"
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado de conexión WebSocket */}
        <div className="fixed bottom-20 right-4 z-30">
          <StatusChip
            variant="indicator"
            status={isConnected ? "connected" : "disconnected"}
            label="Tiempo Real"
          />
        </div>
      </div>

      {/* Modal de detalles del evento (si está seleccionado) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-background p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-theme-primary">
                Detalles del Evento
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-theme-light hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-theme-light text-sm">Nombre:</span>
                <p className="text-theme-primary font-medium">
                  {selectedEvent.name}
                </p>
              </div>

              <div>
                <span className="text-theme-light text-sm">Venue:</span>
                <p className="text-theme-primary">
                  {selectedEvent.venue?.name}
                </p>
              </div>

              <div>
                <span className="text-theme-light text-sm">Fecha:</span>
                <p className="text-theme-primary">
                  {new Date(selectedEvent.scheduledDate).toLocaleString(
                    "es-ES",
                  )}
                </p>
              </div>

              <div>
                <span className="text-theme-light text-sm">Estado:</span>
                <StatusChip status={selectedEvent.status} />
              </div>

              {selectedEvent.description && (
                <div>
                  <span className="text-theme-light text-sm">Descripción:</span>
                  <p className="text-theme-primary text-sm">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-ghost flex-1"
              >
                Cerrar
              </button>
              {selectedEvent.status === "in-progress" && (
                <button
                  onClick={() => {
                    handleJoinEvent(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                  className="btn-primary flex-1"
                >
                  Unirse al Evento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
