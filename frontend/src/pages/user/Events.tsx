// frontend/src/pages/user/Events.tsx - Updated with filters
// =========================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Play,
  Clock,
  MapPin,
  Users,
  Zap,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Hooks y contextos
import { useEvents } from "../../hooks/useApi";
import { eventsAPI } from "../../services/api";
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
        onClick={() => navigate(`/live-event/${event.id}`)}
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
            <span className="truncate">
              {event.venue?.profileInfo?.venueName || "Venue TBD"}
            </span>
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

  // API Hooks
  const {
    events: initialEvents,
    loading: initialLoading,
    fetchEvents,
  } = useEvents();

  // Estados para las dos secciones
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);

  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [loadingPast, setLoadingPast] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [searchPast, setSearchPast] = useState("");
  const [venueFilterUpcoming, setVenueFilterUpcoming] = useState("all");
  const [venueFilterPast, setVenueFilterPast] = useState("all");

  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // Cargar eventos al montar
  useEffect(() => {
    const loadEvents = async () => {
      setLoadingUpcoming(true);
      setLoadingPast(true);
      try {
        // Cargar próximos y en vivo (podemos asumir que default/all trae estos o pedir explícitamente)
        // Para "próximos incluyendo hoy y en vivo", solemos pedir 'upcoming' y 'live' o 'active'
        // Simplificación: Pedimos 'all' y filtramos en cliente si no son muchos,
        // o hacemos llamadas paralelas si la API lo requiere.
        // Basado en el código anterior, la API soporta 'category'.

        const [upcomingRes, liveRes, pastRes] = await Promise.all([
          eventsAPI.getAll({ category: "upcoming", limit: 50 }),
          eventsAPI.getAll({ category: "live", limit: 20 }),
          eventsAPI.getAll({ category: "past", limit: 20 }),
        ]);

        const upcomingList = extractEvents(upcomingRes.data);
        const liveList = extractEvents(liveRes.data);
        const pastList = extractEvents(pastRes.data);

        // Combinar live + upcoming para la primera sección, eliminando duplicados por ID
        const combinedUpcoming = [...liveList, ...upcomingList];
        const uniqueUpcoming = Array.from(
          new Map(combinedUpcoming.map((item) => [item.id, item])).values(),
        );

        // Ordenar: En vivo primero, luego por fecha más cercana
        uniqueUpcoming.sort((a, b) => {
          if (a.status === "in-progress" && b.status !== "in-progress")
            return -1;
          if (a.status !== "in-progress" && b.status === "in-progress")
            return 1;
          return (
            new Date(a.scheduledDate).getTime() -
            new Date(b.scheduledDate).getTime()
          );
        });

        setUpcomingEvents(uniqueUpcoming);
        setPastEvents(pastList);
      } catch (error) {
        console.error("Error loading separated events:", error);
      } finally {
        setLoadingUpcoming(false);
        setLoadingPast(false);
      }
    };

    loadEvents();
  }, [fetchEvents]);

  // Obtener lista única de venues para los filtros
  const getUniqueVenues = (eventsList: EventData[]) => {
    const venues = eventsList
      .map((e) => e.venue?.profileInfo?.venueName)
      .filter((v): v is string => !!v);
    return Array.from(new Set(venues)).sort();
  };

  const upcomingVenues = React.useMemo(
    () => getUniqueVenues(upcomingEvents),
    [upcomingEvents],
  );
  const pastVenues = React.useMemo(
    () => getUniqueVenues(pastEvents),
    [pastEvents],
  );

  const handleJoinEvent = (eventId: string) => {
    navigate(`/live-event/${eventId}`);
  };

  // Lógica de filtrado
  const filteredUpcoming = upcomingEvents.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue?.profileInfo?.venueName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesVenue =
      venueFilterUpcoming === "all" ||
      event.venue?.profileInfo?.venueName === venueFilterUpcoming;
    return matchesSearch && matchesVenue;
  });

  const filteredPast = pastEvents.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchPast.toLowerCase()) ||
      event.venue?.profileInfo?.venueName
        ?.toLowerCase()
        .includes(searchPast.toLowerCase());
    const matchesVenue =
      venueFilterPast === "all" ||
      event.venue?.profileInfo?.venueName === venueFilterPast;
    return matchesSearch && matchesVenue;
  });

  if (loadingUpcoming && loadingPast) {
    return (
      <div className="page-background">
        <LoadingSpinner text="Cargando eventos..." className="mt-20" />
      </div>
    );
  }

  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-8">
        {/* Titulo General */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Eventos
          </h1>
        </div>

        {/* SECCION 1: PRÓXIMOS Y EN VIVO */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#596c95]/20 pb-2">
            <h2 className="text-xl font-bold text-theme-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Próximos y En Vivo
            </h2>

            {/* Controles para Próximos: Buscar y Venue */}
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="w-full md:w-64">
                <SearchInput
                  placeholder="Buscar evento o venue..."
                  onSearch={setSearchTerm}
                  value={searchTerm}
                  showClearButton
                  className="w-full"
                />
              </div>

              <select
                value={venueFilterUpcoming}
                onChange={(e) => setVenueFilterUpcoming(e.target.value)}
                className="bg-primary text-theme-primary border border-[#596c95]/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-[#1a1f3d] [&>option]:text-white"
              >
                <option value="all">Todas las Sedes</option>
                {upcomingVenues.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingUpcoming ? (
            <div className="py-8 text-center text-theme-light">
              Cargando próximos eventos...
            </div>
          ) : filteredUpcoming.length === 0 ? (
            <EmptyState
              title="No hay próximos eventos"
              description={
                searchTerm || venueFilterUpcoming !== "all"
                  ? "No se encontraron eventos con los filtros actuales"
                  : "No hay eventos programados"
              }
              icon={<Calendar className="w-10 h-10" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUpcoming.map((event) => (
                <EventCard key={event.id} event={event} variant="upcoming" />
              ))}
            </div>
          )}
        </section>

        {/* SECCION 2: EVENTOS PASADOS */}
        <section className="space-y-4 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#596c95]/20 pb-2">
            <h2 className="text-xl font-bold text-theme-dark flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Eventos Pasados
            </h2>

            {/* Controles para Pasados: Buscar y Venue */}
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="w-full md:w-64">
                <SearchInput
                  placeholder="Buscar historial..."
                  onSearch={setSearchPast}
                  value={searchPast}
                  showClearButton
                  className="w-full"
                />
              </div>

              <select
                value={venueFilterPast}
                onChange={(e) => setVenueFilterPast(e.target.value)}
                className="bg-primary text-theme-primary border border-[#596c95]/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full md:w-64 [&>option]:bg-[#1a1f3d] [&>option]:text-white"
              >
                <option value="all">Todas las Sedes</option>
                {pastVenues.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingPast ? (
            <div className="py-8 text-center text-theme-light">
              Cargando historial...
            </div>
          ) : filteredPast.length === 0 ? (
            <EmptyState
              title="Historial vacío"
              description={
                searchPast || venueFilterPast !== "all"
                  ? "No se encontraron eventos pasados con los filtros actuales"
                  : "No hay eventos pasados para mostrar"
              }
              icon={<Clock className="w-10 h-10" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPast.map((event) => (
                <EventCard key={event.id} event={event} variant="archived" />
              ))}
            </div>
          )}
        </section>
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
                  {selectedEvent.venue?.profileInfo?.venueName}
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
