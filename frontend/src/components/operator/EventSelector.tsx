"use client";

import React from "react";
import { useState } from "react";
import SearchInput from "../../components/shared/SearchInput";
import { StatusFilterDropdown } from "../shared/StatusFilterDropdown";
import type { Event } from "../../types";
import { useEvents } from "../../hooks/useApi";
import EmptyState from "../shared/EmptyState";
import ErrorMessage from "../shared/ErrorMessage";
import LoadingSpinner from "../shared/LoadingSpinner";

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

  if (loading) return <LoadingSpinner text="Cargando eventos..." />;
  if (error) return <ErrorMessage error={error} />;
  if (events.length === 0) {
    return (
      <EmptyState
        title="No hay eventos disponibles"
        description="No se encontraron eventos para los filtros seleccionados."
      />
    );
  }

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
            <p className="text-sm text-[#cd6263]">
              {event.status} - {event.scheduledDate}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventSelector;
