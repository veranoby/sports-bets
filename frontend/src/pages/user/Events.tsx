"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Calendar } from "lucide-react";
import EventCard from "../../components/user/EventCard";
import { useEvents } from "../../hooks/useApi";

const EventsPage: React.FC = () => {
  const { events, loading, error } = useEvents();

  const liveEvents = events.filter((event) => event.isLive);
  const upcomingEvents = events.filter(
    (event) => !event.isLive && new Date(event.dateTime) > new Date()
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
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
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
        {liveEvents.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full mr-2 flex-shrink-0">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <h2 className="text-xl font-bold text-gray-900">En Vivo</h2>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {liveEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  venueName={event.venueName}
                  isLive={event.isLive}
                  dateTime={event.dateTime}
                  activeBettors={event.activeBettors}
                  imageUrl={event.imageUrl}
                />
              ))}
            </div>
          </section>
        )}

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

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                venueName={event.venueName}
                isLive={event.isLive}
                dateTime={event.dateTime}
                activeBettors={event.activeBettors}
                imageUrl={event.imageUrl}
              />
            ))}
          </div>
        </section>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando eventos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 text-center">
            Error al cargar los eventos: {error.message}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;
