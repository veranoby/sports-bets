// frontend/src/pages/user/Events.tsx
// 📅 EVENTOS OPTIMIZADO - TEMA CONSISTENTE + STREAMING

import React, { useState, useEffect } from "react";
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
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

// Componentes
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import StatusIndicator from "../../components/shared/StatusIndicator";
import StatusChip from "../../components/shared/StatusChip";
import Navigation from "../../components/user/Navigation";
import UserHeader from "../../components/user/UserHeader";

// Tipos
import type { Event } from "../../types";

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = getUserThemeClasses();

  // API Hooks
  const { events, loading, error, fetchEvents } = useEvents();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "upcoming">(
    "all"
  );
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // WebSocket para actualizaciones en tiempo real
  const { addListener, removeListener, isConnected } = useWebSocketContext();

  // Manejadores de eventos WebSocket
  const handleEventActivated = (data: any) => {
    console.log("🔥 Evento activado:", data);
    fetchEvents();
  };

  const handleEventCompleted = (data: any) => {
    console.log("✅ Evento completado:", data);
    fetchEvents();
  };

  const handleStreamStarted = (data: any) => {
    console.log("📺 Stream iniciado:", data);
    fetchEvents();
  };

  // Configurar listeners en mount y limpiar en unmount
  useEffect(() => {
    if (!isConnected) return;

    // Agregar listeners
    addListener("event_activated", handleEventActivated);
    addListener("event_completed", handleEventCompleted);
    addListener("stream_started", handleStreamStarted);

    // Limpiar listeners al desmontar
    return () => {
      removeListener("event_activated", handleEventActivated);
      removeListener("event_completed", handleEventCompleted);
      removeListener("stream_started", handleStreamStarted);
    };
  }, [isConnected, addListener, removeListener]);

  // Cargar eventos iniciales
  useEffect(() => {
    fetchEvents();
  }, []);

  // Filtrar eventos
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "live" && event.status === "in-progress") ||
      (statusFilter === "upcoming" && event.status === "scheduled");

    return matchesSearch && matchesStatus;
  });

  // Categorizar eventos
  const liveEvents = filteredEvents.filter(
    (event) => event.status === "in-progress"
  );
  const upcomingEvents = filteredEvents.filter(
    (event) => event.status === "scheduled"
  );
  const featuredEvents = events
    .filter((event) => event.totalBets > 100)
    .slice(0, 2); // Mock criterio

  // Handlers
  const handleEventClick = (event: Event) => {
    if (event.status === "in-progress") {
      navigate(`/live-event/${event.id}`);
    } else {
      setSelectedEvent(event);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status: "all" | "live" | "upcoming") => {
    setStatusFilter(status);
  };

  if (loading) {
    return (
      <div className={theme.pageBackground}>
        <LoadingSpinner text="Cargando eventos..." className="mt-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={theme.pageBackground}>
        <ErrorMessage error={error} onRetry={fetchEvents} />
      </div>
    );
  }

  return (
    <div className={`${theme.pageBackground} pb-24`}>
      {/* Reemplazar header existente */}
      <UserHeader title="Eventos" />

      {/* Search and Filters */}
      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Buscar eventos o galleras..."
            className={`${theme.input} pl-10 w-full`}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: "all", label: "Todos", count: filteredEvents.length },
            { id: "live", label: "En Vivo", count: liveEvents.length },
            { id: "upcoming", label: "Próximos", count: upcomingEvents.length },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() =>
                handleStatusFilter(filter.id as "all" | "live" | "upcoming")
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                statusFilter === filter.id
                  ? "bg-[#596c95] text-white"
                  : "bg-[#2a325c] text-gray-300 hover:bg-[#596c95] hover:text-white"
              }`}
            >
              {filter.label}
              <span className="bg-[#1a1f37] px-2 py-0.5 rounded text-xs">
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Events */}
      {featuredEvents.length > 0 && statusFilter === "all" && (
        <section className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold">Eventos Destacados</h2>
          </div>
          <div className="space-y-3">
            {featuredEvents.map((event) => (
              <EventFeaturedCard
                key={event.id}
                event={event}
                onClick={() => handleEventClick(event)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Live Events */}
      {liveEvents.length > 0 &&
        (statusFilter === "all" || statusFilter === "live") && (
          <section className="px-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#cd6263]" />
              <h2 className="text-lg font-bold">En Vivo</h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">LIVE</span>
              </div>
            </div>
            <div className="space-y-3">
              {liveEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                  isLive={true}
                />
              ))}
            </div>
          </section>
        )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 &&
        (statusFilter === "all" || statusFilter === "upcoming") && (
          <section className="px-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#596c95]" />
              <h2 className="text-lg font-bold">Próximos Eventos</h2>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                  isLive={false}
                />
              ))}
            </div>
          </section>
        )}

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="px-4 py-12">
          <EmptyState
            title="No se encontraron eventos"
            description={
              searchTerm
                ? `No hay eventos que coincidan con "${searchTerm}"`
                : "No hay eventos disponibles en este momento"
            }
            icon={<Calendar />}
            variant="dark"
            action={
              searchTerm
                ? {
                    label: "Limpiar búsqueda",
                    onClick: () => setSearchTerm(""),
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* Navigation */}
      <Navigation currentPage="events" />
    </div>
  );
};

// 🎨 Componente EventCard optimizado para esta página
interface EventCardProps {
  event: Event;
  onClick: () => void;
  isLive: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick, isLive }) => {
  const theme = getUserThemeClasses();

  return (
    <div
      onClick={onClick}
      className={`${theme.cardBackground} p-4 cursor-pointer hover:bg-[#3a4273] transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-lg">{event.name}</h3>
            {isLive && (
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4 text-[#cd6263]" />
                <span className="text-xs font-medium text-[#cd6263]">
                  EN VIVO
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{event.venue?.name || "Gallera"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{event.totalBets} apuestas</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(event.scheduledDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusChip
              status={event.status}
              size="sm"
              variant={isLive ? "success" : "info"}
            />
            <span className="text-sm font-medium text-green-400">
              ${event.totalPrizePool.toLocaleString()} en premios
            </span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};

// 🌟 Componente EventFeaturedCard para eventos destacados
interface EventFeaturedCardProps {
  event: Event;
  onClick: () => void;
}

const EventFeaturedCard: React.FC<EventFeaturedCardProps> = ({
  event,
  onClick,
}) => {
  const theme = getUserThemeClasses();

  return (
    <div
      onClick={onClick}
      className={`${theme.cardBackground} p-6 cursor-pointer hover:bg-[#3a4273] transition-colors border-l-4 border-yellow-400`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Star className="w-5 h-5 text-yellow-400" />
        <span className="text-xs font-medium text-yellow-400 uppercase tracking-wide">
          Evento Destacado
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2">{event.name}</h3>
          <p className="text-gray-400 mb-3">{event.venue?.name}</p>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400">Peleas</p>
              <p className="font-bold">{event.totalFights}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Apuestas</p>
              <p className="font-bold">{event.totalBets}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Premio</p>
              <p className="font-bold text-green-400">
                ${event.totalPrizePool.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <StatusChip
              status={event.status}
              size="md"
              variant={event.status === "in-progress" ? "success" : "info"}
            />

            {event.status === "in-progress" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-[#cd6263]">
                  TRANSMITIENDO
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
