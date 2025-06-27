// frontend/src/pages/user/Events.tsx - MIGRADO V9
// ===================================================
// ELIMINADO: getUserThemeClasses() import y usage
// APLICADO: Clases CSS estáticas directas

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Filter,
  Calendar,
  Play,
  Clock,
  MapPin,
  Users,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Hooks y contextos
import { useEvents } from "../../hooks/useApi";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
// ❌ ELIMINADO: import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import { useWebSocketListener } from "../../hooks/useWebSocket";

// Componentes
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import StatusIndicator from "../../components/shared/StatusIndicator";
import StatusChip from "../../components/shared/StatusChip";

// Tipos
import type { Event } from "../../types";

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  // ❌ ELIMINADO: const theme = getUserThemeClasses();

  // API Hooks
  const { events, loading, error, fetchEvents } = useEvents();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "upcoming">(
    "all"
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // ✅ Referencia estable para fetchEvents
  const fetchEventsRef = useRef(fetchEvents);
  useEffect(() => {
    fetchEventsRef.current = fetchEvents;
  }, [fetchEvents]);

  // WebSocket para actualizaciones en tiempo real
  const { addListener, removeListener, isConnected } = useWebSocketContext();

  // ✅ Handlers memoizados
  const addNotification = useCallback(
    (message: string, type: "info" | "success" | "error") => {
      console.log(`Notification: ${message} (${type})`);
      // Implementar sistema de notificaciones si necesario
    },
    []
  );

  // Cargar eventos al montar
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filtrar eventos
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "live" && event.status === "in-progress") ||
      (statusFilter === "upcoming" && event.status === "scheduled");

    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEventClick = (event: Event) => {
    if (event.status === "in-progress") {
      navigate(`/live-event/${event.id}`);
    } else {
      setSelectedEvent(event);
    }
  };

  const handleJoinEvent = (eventId: string) => {
    navigate(`/live-event/${eventId}`);
  };

  // Componente de tarjeta de evento
  const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const isLive = event.status === "in-progress";
    const isUpcoming = event.status === "scheduled";

    return (
      /* ✅ MIGRADO: theme.cardBackground → card-background */
      <div
        onClick={() => handleEventClick(event)}
        className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-all duration-200 transform hover:scale-[1.02]"
      >
        {/* Header de la tarjeta */}
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
            <StatusChip
              status={event.status}
              text={
                isLive ? "En Vivo" : isUpcoming ? "Próximamente" : "Finalizado"
              }
            />
          </div>
          <ChevronRight className="w-4 h-4 text-theme-light" />
        </div>

        {/* Información del evento */}
        <div className="space-y-2">
          {/* ✅ MIGRADO: theme.primaryText → text-theme-primary */}
          <h3 className="font-semibold text-theme-primary truncate">
            {event.name}
          </h3>

          {/* ✅ MIGRADO: theme.lightText → text-theme-light */}
          <div className="flex items-center gap-2 text-sm text-theme-light">
            <MapPin className="w-4 h-4" />
            <span>{event.venue?.name || "Venue TBD"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-theme-light">
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
            <div className="flex items-center gap-2 text-sm text-theme-light">
              <Users className="w-4 h-4" />
              <span>{event.currentViewers} espectadores</span>
            </div>
          )}
        </div>

        {/* Footer de la tarjeta */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#596c95]/20">
          <div className="flex items-center gap-2">
            {event.activeBets && event.activeBets > 0 && (
              <span className="text-xs text-green-400">
                {event.activeBets} apuestas activas
              </span>
            )}
          </div>

          {isLive && (
            /* ✅ MIGRADO: theme.primaryButton → btn-primary */
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleJoinEvent(event.id);
              }}
              className="btn-primary text-xs px-3 py-1 flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              Unirse
            </button>
          )}
        </div>
      </div>
    );
  };

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
        {/* Header con búsqueda y filtros */}
        <div className="card-background p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-light" />
              {/* ✅ MIGRADO: theme.input → input-theme */}
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="input-theme w-full pl-10"
              />
            </div>

            {/* Filtros de estado */}
            <div className="flex gap-2">
              {[
                { key: "all", label: "Todos", icon: Calendar },
                { key: "live", label: "En Vivo", icon: Zap },
                { key: "upcoming", label: "Próximos", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? "bg-[#596c95] text-white"
                      : "text-theme-light hover:bg-[#2a325c]/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#596c95]/20">
            <div className="text-center">
              <p className="text-lg font-bold text-theme-primary">
                {events.filter((e) => e.status === "in-progress").length}
              </p>
              <p className="text-xs text-theme-light">En Vivo</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-theme-primary">
                {events.filter((e) => e.status === "scheduled").length}
              </p>
              <p className="text-xs text-theme-light">Próximos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-theme-primary">
                {events.reduce((sum, e) => sum + (e.activeBets || 0), 0)}
              </p>
              <p className="text-xs text-theme-light">Apuestas</p>
            </div>
          </div>
        </div>

        {/* Lista de eventos */}
        {filteredEvents.length === 0 ? (
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
              searchTerm
                ? {
                    label: "Limpiar búsqueda",
                    onClick: () => setSearchTerm(""),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Eventos en vivo (prioridad) */}
            {filteredEvents.filter((e) => e.status === "in-progress").length >
              0 && (
              <div>
                <h2 className="text-lg font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-400" />
                  Eventos en Vivo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents
                    .filter((e) => e.status === "in-progress")
                    .map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                </div>
              </div>
            )}

            {/* Eventos próximos */}
            {filteredEvents.filter((e) => e.status === "scheduled").length >
              0 && (
              <div>
                <h2 className="text-lg font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Próximos Eventos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents
                    .filter((e) => e.status === "scheduled")
                    .sort(
                      (a, b) =>
                        new Date(a.scheduledDate).getTime() -
                        new Date(b.scheduledDate).getTime()
                    )
                    .map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                </div>
              </div>
            )}

            {/* Eventos finalizados */}
            {filteredEvents.filter((e) => e.status === "completed").length >
              0 && (
              <div>
                <h2 className="text-lg font-semibold text-theme-primary mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Eventos Pasados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents
                    .filter((e) => e.status === "completed")
                    .slice(0, 6) // Mostrar solo los últimos 6
                    .map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado de conexión WebSocket */}
        <div className="fixed bottom-20 right-4 z-30">
          <StatusIndicator isConnected={isConnected} label="Tiempo Real" />
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
                    "es-ES"
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
