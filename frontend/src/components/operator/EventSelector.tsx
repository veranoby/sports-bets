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
import { SearchInput } from "../shared/SearchInput";
import { StatusFilterDropdown } from "../shared/StatusFilterDropdown";
import type { Event } from "../../types";
import { useEvents } from "../../hooks/useApi";

// Definición de tipos
interface EventSelectorProps {
  onActivateEvent: (eventId: string) => void;
  onSearch: (term: string) => void;
  onStatusFilter: (status: string) => void;
}

type StatusFilter = "all" | "scheduled" | "in-progress" | "completed";

export const EventSelector = ({
  onActivateEvent,
  onSearch,
  onStatusFilter,
}: EventSelectorProps) => {
  const { events, loading, error } = useEvents();
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status as StatusFilter);
    onStatusFilter(status);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header con filtros */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <SearchInput
          placeholder="Buscar eventos..."
          onSearch={onSearch}
          className="border border-[#596c95] focus:ring-[#cd6263]"
        />
        <StatusFilterDropdown
          options={["Activo", "Finalizado", "Cancelado"]}
          onSelect={onStatusFilter}
          className="border border-[#596c95]"
        />
      </div>

      {/* Grid de eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event: Event) => (
          <div
            key={event.id}
            onClick={() => onActivateEvent(event.id)}
            className="p-4 border border-[#596c95] rounded-lg hover:bg-[#596c95]/10 cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-[#596c95]">
              {event.name}
            </h3>
            <p className="text-sm text-[#cd6263]">{event.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventSelector;
