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
  Loader2,
  AlertTriangle,
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

type StatusFilter = "all" | "scheduled" | "in-progress" | "completed";

const EventSelector: React.FC<EventSelectorProps> = ({
  events,
  onActivateEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [confirmEventId, setConfirmEventId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

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

  // Validar datos mínimos del evento
  const validateEvent = (event: Event) => {
    if (!event.name || !event.venue || !event.dateTime) {
      return "El evento no tiene todos los datos requeridos.";
    }
    if (event.totalFights < 1) {
      return "El evento debe tener al menos una pelea programada.";
    }
    return null;
  };

  // Handler para confirmar activación
  const handleConfirmActivate = (eventId: string) => {
    setConfirmEventId(eventId);
    setErrorMsg("");
  };

  // Handler para activar evento tras confirmación
  const handleActivate = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const validation = validateEvent(event);
    if (validation) {
      setErrorMsg(validation);
      return;
    }
    setLoadingEventId(eventId);
    setErrorMsg("");
    setTimeout(() => {
      setLoadingEventId(null);
      setConfirmEventId(null);
      onActivateEvent(eventId);
    }, 1200); // Simula loading
  };

  // Handler para cancelar confirmación
  const handleCancelConfirm = () => {
    setConfirmEventId(null);
    setErrorMsg("");
  };

  // Handler para resetear filtros
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("");
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
              <select
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
              >
                <option value="all">Todos los estados</option>
                <option value="scheduled">Programados</option>
                <option value="in-progress">En progreso</option>
                <option value="completed">Completados</option>
              </select>
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
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sm text-gray-500 hover:text-red-500 underline"
            >
              Limpiar filtros
            </button>
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
              const isCompleted = event.status === "completed";
              const isLoading = loadingEventId === event.id;
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
                      onClick={() =>
                        !isCompleted && handleConfirmActivate(event.id)
                      }
                      disabled={isCompleted || isLoading}
                      className={`w-full py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center
                        ${
                          isCompleted
                            ? "bg-gray-300 cursor-not-allowed"
                            : isLoading
                            ? "bg-blue-400 cursor-wait"
                            : event.status === "in-progress"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      aria-disabled={isCompleted || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                      ) : null}
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

        {/* Modal de confirmación */}
        {confirmEventId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 mr-2" />
                <h2 className="text-lg font-bold text-gray-900">
                  Confirmar Activación
                </h2>
              </div>
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que deseas activar este evento? Una vez
                activado, no podrás cambiar de evento sin perder el progreso
                actual.
              </p>
              {errorMsg && (
                <div className="bg-red-50 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {errorMsg}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelConfirm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleActivate(confirmEventId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Activar Evento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSelector;
