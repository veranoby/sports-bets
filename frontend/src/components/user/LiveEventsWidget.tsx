// frontend/src/components/user/LiveEventsWidget.tsx
// ================================================================
// LIVE EVENTS WIDGET - Connected to Real Data
// ================================================================

import React, { useState, useCallback, useMemo, memo } from "react";
import {
  Zap,
  Play,
  Users,
  MapPin,
  Activity,
  ArrowRight,
  Wifi,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../../hooks/useApi";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import LoadingSpinner from "../shared/LoadingSpinner";
import EmptyState from "../shared/EmptyState";
import { Tag, Typography } from "antd";

// Assuming EventData from useApi matches what we need, otherwise defining partial here for safety
interface EventData {
  id: string;
  name: string;
  status: string;
  scheduledDate: string;
  venue?: { name?: string; location?: string } | Record<string, any>;
  currentViewers?: number;
  activeBets?: number;
}

const { Text } = Typography;

// ✅ COMPONENTE MEMOIZADO - EventCard Premium
const PremiumEventCard = memo(({ event }: { event: EventData }) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/live-event/${event.id}`);
  }, [navigate, event.id]);

  // Extract venue name safely
  const venueName =
    (event.venue as any)?.name ||
    (event.venue as any)?.profileInfo?.venueName ||
    "Gallera Desconocida";

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 p-0 rounded-xl cursor-pointer border border-white hover:border-red-500/50 transition-all duration-300 shadow-lg shadow-white hover:shadow-red-500/10"
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-red-200/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="p-5">
        {/* Title & Venue */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight group-hover:text-red-400 transition-colors flex items-center justify-between gap-2">
            <span className="truncate">{event.name}</span>
            <span className="flex items-center gap-1 text-xs font-mono text-green-100 whitespace-nowrap bg-green-400 px-2 py-0.5 rounded border border-green-400/20">
              <Wifi className="w-3 h-3" />
              ON AIR
            </span>
          </h3>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{venueName}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-gray-200  to-gray-300 rounded-lg p-2.5 ">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray">Espectadores</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">
              {event.currentViewers?.toLocaleString() || "0"}
            </span>
          </div>

          <div className="bg-gradient-to-br from-gray-200  to-gray-300 rounded-lg p-2.5 ">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray">Apuestas</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">
              {event.activeBets?.toLocaleString() || "0"}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2a325c]/30">
          <span className="text-xs text-gray-500">
            {new Date(event.scheduledDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <div className="flex items-center gap-1 text-xs font-bold text-red-500 group-hover:translate-x-1 transition-transform">
            VER EVENTO <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
});

// ✅ COMPONENTE PRINCIPAL - LiveEventsWidget
const LiveEventsWidget: React.FC = () => {
  const { events, loading, error, fetchEvents } = useEvents();

  // ✅ WEBSOCKET LISTENERS
  useWebSocketListener(
    "event_started",
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  // Filters: Only In-Progress Events
  const liveEvents = useMemo(() => {
    return (events || []).filter((e) => e.status === "in-progress");
  }, [events]);

  // Loading State
  if (loading && !events?.length) {
    return (
      <div className="card-background p-8 flex justify-center">
        <LoadingSpinner text="Buscando eventos en vivo..." />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
        <p className="text-red-400 mb-2">No se pudieron cargar los eventos</p>
        <button
          onClick={() => fetchEvents()}
          className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1 rounded transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Empty State
  if (liveEvents.length === 0) {
    return (
      <div className="bg-[#1a1f37]/50 border border-dashed border-[#2a325c] p-8 rounded-xl flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-[#2a325c]/50 rounded-full flex items-center justify-center mb-3">
          <Zap className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-gray-300 font-medium mb-1">
          No hay eventos en vivo
        </h3>
        <p className="text-sm text-gray-500">
          Los eventos aparecerán aquí cuando comiencen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Eventos en Vivo
          </h2>
          <span className="bg-[#2a325c] text-xs text-white px-2 py-0.5 rounded-full">
            {liveEvents.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveEvents.map((event) => (
          <PremiumEventCard key={event.id} event={event as EventData} />
        ))}
      </div>
    </div>
  );
};

LiveEventsWidget.displayName = "LiveEventsWidget";
PremiumEventCard.displayName = "PremiumEventCard";

export default memo(LiveEventsWidget);
