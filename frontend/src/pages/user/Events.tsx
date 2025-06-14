"use client";

import React, { useState } from "react";
import { Filter, Calendar } from "lucide-react";
import EventCard from "../../components/user/EventCard";
import { useEvents } from "../../hooks/useApi";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import FilterBar from "../../components/shared/FilterBar";
import EmptyState from "../../components/shared/EmptyState";
import EventDetailModal from "../../components/user/EventDetailModal";

const EventsPage: React.FC = () => {
  const { events, loading, error, fetchEvents } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const liveEvents = events.filter((event) => event.status === "in-progress");
  const upcomingEvents = events.filter(
    (event) =>
      event.status === "scheduled" && new Date(event.scheduledDate) > new Date()
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  if (loading)
    return <LoadingSpinner text="Cargando eventos..." className="mt-12" />;
  if (error) return <ErrorMessage error={error} onRetry={fetchEvents} />;

  const renderEmptyState = (message: string) => (
    <div className="py-12 text-center">
      <EmptyState
        title="No hay eventos"
        description={message}
        icon={<Calendar className="w-8 h-8 mx-auto text-gray-400" />}
      />
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header simplificado sin botón de volver */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            Eventos
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <FilterBar
            searchPlaceholder="Buscar eventos..."
            filters={[
              {
                key: "status",
                label: "Filtrar por estado",
                type: "select",
                options: [
                  { value: "active", label: "Activos" },
                  { value: "upcoming", label: "Próximos" },
                ],
              },
            ]}
            onFilterChange={(key, value) =>
              setFilters({ ...filters, [key]: value })
            }
            onReset={() => {
              setFilters({});
            }}
          />
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-1.5" />
              Filtros
            </button>
            <button className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Calendar className="w-4 h-4 mr-1.5" />
              Fecha
            </button>
          </div>
        </div>

        {/* Live Events Section */}
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full mr-2 flex-shrink-0">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">En Vivo</h2>
          </div>

          {liveEvents.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {liveEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  venueName={event.venue?.name || ""}
                  isLive={event.status === "in-progress"}
                  dateTime={event.scheduledDate}
                  activeBettors={event.totalBets || 0}
                  imageUrl={event.venue?.images?.[0]}
                  onSelect={setSelectedEventId}
                />
              ))}
            </div>
          ) : (
            renderEmptyState("Actualmente no hay eventos en vivo")
          )}
        </section>

        {/* Upcoming Events Section */}
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-2 flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Próximos Eventos
            </h2>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  venueName={event.venue?.name || ""}
                  isLive={event.status === "in-progress"}
                  dateTime={event.scheduledDate}
                  activeBettors={event.totalBets || 0}
                  imageUrl={event.venue?.images?.[0]}
                  onSelect={setSelectedEventId}
                />
              ))}
            </div>
          ) : (
            renderEmptyState("No hay eventos programados próximamente")
          )}
        </section>

        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEventId(null)}
          />
        )}
      </main>
    </div>
  );
};

export default EventsPage;
