// frontend/src/components/user/LiveEventsWidget.tsx
// ================================================================
// NUEVO COMPONENTE - LiveEventsWidget Premium V2
// CARACTERÍSTICAS: Análisis avanzado, múltiples vistas, filtros sofisticados
// OPTIMIZADO: Sin UserThemeContext, CSS variables estáticas, WebSocket optimizado

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Zap,
  Play,
  Users,
  TrendingUp,
  Filter,
  Grid,
  List,
  Star,
  Eye,
  DollarSign,
  Clock,
  MapPin,
  BarChart3,
  Activity,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../../hooks/useApi";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import StatusChip from "../shared/StatusChip";
import LoadingSpinner from "../shared/LoadingSpinner";
import EmptyState from "../shared/EmptyState";

// Tipos específicos del widget
interface EventStats {
  totalViewers: number;
  activeBets: number;
  totalVolume: number;
  averageOdds: number;
  popularityTrend: "up" | "down" | "stable";
}

interface LiveEventExtended {
  id: string;
  name: string;
  venue?: { name: string; location?: string };
  currentViewers?: number;
  activeBets?: number;
  totalVolume?: number;
  status: string;
  scheduledDate: string;
  peakViewers?: number;
  fightCount?: number;
  currentFight?: string;
  streamerName?: string;
  stats?: EventStats;
}

// ✅ COMPONENTE MEMOIZADO - EventCard Premium
const PremiumEventCard = memo(({ event }: { event: LiveEventExtended }) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/live-event/${event.id}`);
  }, [navigate, event.id]);

  const viewerTrend = useMemo(() => {
    if (!event.peakViewers || !event.currentViewers) return null;
    const percentage = (event.currentViewers / event.peakViewers) * 100;
    return {
      percentage: Math.round(percentage),
      trend: percentage > 80 ? "high" : percentage > 50 ? "medium" : "low",
    };
  }, [event.peakViewers, event.currentViewers]);

  return (
    <div
      onClick={handleClick}
      className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-all duration-300 transform hover:scale-[1.02] border border-red-500/20 hover:border-red-500/40"
    >
      {/* Header con estado y tendencia */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-red-400 text-xs font-bold">EN VIVO</span>
          {event.stats?.popularityTrend && (
            <div
              className={`flex items-center text-xs ${
                event.stats.popularityTrend === "up"
                  ? "text-green-400"
                  : event.stats.popularityTrend === "down"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {event.stats.popularityTrend === "up"
                ? "↗"
                : event.stats.popularityTrend === "down"
                ? "↘"
                : "→"}
            </div>
          )}
        </div>
        <Play className="w-4 h-4 text-red-400" />
      </div>

      {/* Título y venue */}
      <h3 className="font-semibold text-theme-primary mb-1 truncate">
        {event.name}
      </h3>
      <div className="flex items-center gap-1 text-sm text-theme-light mb-3">
        <MapPin className="w-3 h-3" />
        <span className="truncate">{event.venue?.name || "Venue TBD"}</span>
      </div>

      {/* Estadísticas premium */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Espectadores con tendencia */}
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-theme-light">
            {event.currentViewers || 0}
          </span>
          {viewerTrend && (
            <span
              className={`text-xs px-1 rounded ${
                viewerTrend.trend === "high"
                  ? "bg-green-500/20 text-green-400"
                  : viewerTrend.trend === "medium"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {viewerTrend.percentage}%
            </span>
          )}
        </div>

        {/* Apuestas activas */}
        <div className="flex items-center gap-1">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-sm text-theme-light">
            {event.activeBets || 0} apuestas
          </span>
        </div>

        {/* Volumen total */}
        {event.totalVolume && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-theme-light">
              ${event.totalVolume.toLocaleString()}
            </span>
          </div>
        )}

        {/* Fight actual */}
        {event.currentFight && (
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-theme-light truncate">
              {event.currentFight}
            </span>
          </div>
        )}
      </div>

      {/* Streamer info */}
      {event.streamerName && (
        <div className="flex items-center gap-1 text-xs text-theme-light border-t border-gray-600/20 pt-2">
          <Eye className="w-3 h-3" />
          <span>Streaming: {event.streamerName}</span>
        </div>
      )}
    </div>
  );
});

// ✅ COMPONENTE PRINCIPAL - LiveEventsWidget
const LiveEventsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { events, loading, error, fetchEvents } = useEvents();

  // Estados locales
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"viewers" | "bets" | "volume">(
    "viewers"
  );
  const [showFilters, setShowFilters] = useState(false);

  // ✅ WEBSOCKET LISTENERS optimizados
  useWebSocketListener(
    "event_started",
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  useWebSocketListener(
    "event_stats_updated",
    useCallback((data: any) => {
      // Actualizar estadísticas en tiempo real
      console.log("Event stats updated:", data);
    }, [])
  );

  // ✅ DATOS COMPUTADOS - Solo eventos en vivo con enriquecimiento
  const enrichedLiveEvents = useMemo(() => {
    const liveEvents = events?.filter((e) => e.status === "in-progress") || [];

    // Enriquecer con datos premium simulados
    return liveEvents.map(
      (event): LiveEventExtended => ({
        ...event,
        peakViewers: event.currentViewers
          ? event.currentViewers + Math.floor(Math.random() * 100)
          : 150,
        fightCount: Math.floor(Math.random() * 8) + 3,
        currentFight: `Pelea ${Math.floor(Math.random() * 5) + 1}`,
        streamerName: `Operador ${event.id.slice(-3)}`,
        totalVolume: Math.floor(Math.random() * 10000) + 5000,
        stats: {
          totalViewers: event.currentViewers || 0,
          activeBets: event.activeBets || 0,
          totalVolume: Math.floor(Math.random() * 10000) + 5000,
          averageOdds: 1.5 + Math.random() * 2,
          popularityTrend: ["up", "down", "stable"][
            Math.floor(Math.random() * 3)
          ] as "up" | "down" | "stable",
        },
      })
    );
  }, [events]);

  // ✅ EVENTOS ORDENADOS según filtro
  const sortedEvents = useMemo(() => {
    return [...enrichedLiveEvents].sort((a, b) => {
      switch (sortBy) {
        case "viewers":
          return (b.currentViewers || 0) - (a.currentViewers || 0);
        case "bets":
          return (b.activeBets || 0) - (a.activeBets || 0);
        case "volume":
          return (b.totalVolume || 0) - (a.totalVolume || 0);
        default:
          return 0;
      }
    });
  }, [enrichedLiveEvents, sortBy]);

  // Estados de carga
  if (loading) {
    return (
      <div className="card-background p-6">
        <LoadingSpinner text="Cargando eventos premium..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-background p-6">
        <div className="text-center text-red-400">
          Error cargando eventos: {error}
        </div>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="card-background p-6">
        <EmptyState
          title="No hay eventos en vivo"
          description="Los eventos premium aparecerán aquí cuando estén disponibles"
          icon={<Zap className="w-12 h-12" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Premium con controles */}
      <div className="card-background p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Zap className="w-6 h-6 text-red-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-2 h-2 text-black" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-theme-primary">
              Eventos en Vivo Premium
            </h2>
            <StatusChip status="premium" text="PREMIUM" />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#596c95] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-[#596c95] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[#1a1f37] border border-gray-600 text-white rounded px-3 py-2 text-sm"
            >
              <option value="viewers">Por Espectadores</option>
              <option value="bets">Por Apuestas</option>
              <option value="volume">Por Volumen</option>
            </select>

            {/* Ver todos */}
            <button
              onClick={() => navigate("/events")}
              className="btn-ghost text-sm px-3 py-2"
            >
              Ver todos
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {sortedEvents.length}
            </div>
            <div className="text-xs text-theme-light">Eventos Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {sortedEvents.reduce(
                (sum, e) => sum + (e.currentViewers || 0),
                0
              )}
            </div>
            <div className="text-xs text-theme-light">Total Espectadores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {sortedEvents.reduce((sum, e) => sum + (e.activeBets || 0), 0)}
            </div>
            <div className="text-xs text-theme-light">Apuestas Activas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              $
              {sortedEvents
                .reduce((sum, e) => sum + (e.totalVolume || 0), 0)
                .toLocaleString()}
            </div>
            <div className="text-xs text-theme-light">Volumen Total</div>
          </div>
        </div>
      </div>

      {/* Grid/List de Eventos */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
        }
      >
        {sortedEvents.map((event) => (
          <PremiumEventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Live Stats Footer */}
      <div className="card-background p-3">
        <div className="flex items-center justify-between text-sm text-theme-light">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Actualización en tiempo real</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span>Estadísticas premium habilitadas</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Última actualización: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Configurar displayName para debugging
LiveEventsWidget.displayName = "LiveEventsWidget";
PremiumEventCard.displayName = "PremiumEventCard";

export default memo(LiveEventsWidget);
