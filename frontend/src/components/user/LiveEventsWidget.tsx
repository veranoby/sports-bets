// frontend/src/components/user/LiveEventsWidget.tsx
// ================================================================
// LIVE EVENTS WIDGET - Connected to Real Data
// ================================================================

import React, { useCallback, useMemo, memo } from "react";
import { Zap, Play, Users, MapPin, Activity, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../../hooks/useApi";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import LoadingSpinner from "../shared/LoadingSpinner";

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
      className="group relative overflow-hidden bg-[#1e293b]/80 backdrop-blur-sm p-0 rounded-2xl cursor-pointer border border-white/5 hover:border-white/10 hover:bg-[#1e293b] transition-all duration-300 shadow-xl shadow-black/20"
    >
      <div className="p-5 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="text-base font-medium text-gray-200 mb-1 group-hover:text-white transition-colors truncate leading-tight">
              {event.name.toUpperCase()}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-200 text-xs">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{venueName}</span>
            </div>
          </div>

          {/* Live Badge - Subtle & Modern */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/5 border border-red-200/10 group-hover:bg-red-500/10 transition-colors">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-medium text-red-200/80 tracking-wider">
              LIVE
            </span>
          </div>
        </div>

        {/* Stats Row - Minimalist & Clean */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/20 border border-white/5 group-hover:border-white/10 transition-colors">
            <span className="text-[10px] text-gray-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Users className="w-3 h-3 opacity-70" /> Espectadores
            </span>
            <span className="text-base font-semibold text-gray-300 font-mono">
              {event.currentViewers?.toLocaleString() || "0"}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-black/20 border border-white/5 group-hover:border-white/10 transition-colors">
            <span className="text-[10px] text-gray-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Activity className="w-3 h-3 opacity-70" /> Apuestas
            </span>
            <span className="text-base font-semibold text-gray-300 font-mono">
              {event.activeBets?.toLocaleString() || "0"}
            </span>
          </div>
        </div>

        {/* Footer / CTA - Subtle */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-gray-200">
            <div className="p-1 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <Play className="w-3 h-3 text-gray-400" />
            </div>
            <span className="text-[10px] text-gray-200 uppercase tracking-wider">
              Ir al evento
            </span>
          </div>
          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/5 text-gray-200 group-hover:text-gray-300 group-hover:border-white/20 transition-all">
            <ArrowRight className="w-3 h-3" />
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
    <div className="space-y-6 animate-in fade-in duration-500 w-full">
      {/* Header Centrado y Mejorado */}
      <div className="flex flex-col items-center justify-center space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray text-center">
            Eventos en Vivo
          </h2>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a325c] text-xs font-bold text-white shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
            {liveEvents.length}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {liveEvents.map((event) => (
          <div
            key={event.id}
            className="w-full max-w-sm animate-in zoom-in duration-300"
          >
            <PremiumEventCard event={event as EventData} />
          </div>
        ))}
      </div>
    </div>
  );
};

LiveEventsWidget.displayName = "LiveEventsWidget";
PremiumEventCard.displayName = "PremiumEventCard";

export default memo(LiveEventsWidget);
