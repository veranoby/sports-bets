"use client";

import React from "react";
import { useState } from "react";
import {
  Calendar,
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";

// Definición de tipos
interface Event {
  id: string;
  name: string;
  venue: string;
  dateTime: string;
  status: "scheduled" | "in-progress" | "completed";
  totalFights: number;
  completedFights: number;
  currentFightNumber?: number;
}

interface EventSelectorProps {
  events: Event[];
  onActivateEvent: (eventId: string) => void;
}

const EventSelector: React.FC<EventSelectorProps> = ({
  events,
  onActivateEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "scheduled" | "in-progress" | "completed"
  >("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Filtrar eventos según los criterios
  const filteredEvents = events.filter((event) => {
    // Filtro por búsqueda
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por estado
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;

    // Filtro por fecha
    const matchesDate =
      !dateFilter ||
      new Date(event.dateTime).toISOString().split("T")[0] === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Formatear hora para mostrar
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener etiqueta de estado
  const getStatusLabel = (status: Event["status"]) => {
    switch (status) {
      case "scheduled":
        return { label: "Programado", color: "bg-blue-100 text-blue-700" };
      case "in-progress":
        return { label: "En Progreso", color: "bg-red-100 text-red-700" };
      case "completed":
        return { label: "Completado", color: "bg-green-100 text-green-700" };
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sports<span className="text-red-500">Bets</span>
            <span className="ml-2 text-lg font-normal">Panel de Operador</span>
          </h1>
          <p className="text-gray-600">
            Selecciona un evento para comenzar a operar
          </p>
        </header>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o gallera..."
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro por estado */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === "all"
                    ? "bg-gray-100 text-gray-700"
                    : statusFilter === "scheduled"
                    ? "bg-red-500 text-white"
                    : statusFilter === "in-progress"
                    ? "bg-yellow-500 text-white"
                    : "bg-green-500 text-white"
                }`}
                onClick={() => setStatusFilter("all")}
              >
                Todos los estados
              </button>
            </div>

            {/* Filtro por fecha */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Lista de eventos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="flex flex-col items-center">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No se encontraron eventos
                </h3>
                <p className="text-gray-500">
                  Intenta ajustar los filtros o busca con otros términos
                </p>
              </div>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const statusConfig = getStatusLabel(event.status);
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {event.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>
                          {formatDate(event.dateTime)} -{" "}
                          {formatTime(event.dateTime)}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>
                          {event.completedFights} de {event.totalFights} peleas
                          completadas
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onActivateEvent(event.id)}
                      disabled={event.status === "completed"}
                      className={`w-full py-2 px-4 rounded-lg font-medium text-white 
                        ${
                          event.status === "completed"
                            ? "bg-gray-300 cursor-not-allowed"
                            : event.status === "in-progress"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                    >
                      {event.status === "completed"
                        ? "EVENTO COMPLETADO"
                        : event.status === "in-progress"
                        ? "CONTINUAR EVENTO"
                        : "ACTIVAR EVENTO"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EventSelector;
