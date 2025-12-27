import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Square,
  Plus,
  Settings,
  DollarSign,
  Activity,
  XCircle,
  Clock,
  User,
  Building2,
  Video,
  Target,
  Trash2,
} from "lucide-react";
import Card from "../../shared/Card";
import LoadingSpinner from "../../shared/LoadingSpinner";
import ErrorMessage from "../../shared/ErrorMessage";
import EmptyState from "../../shared/EmptyState";
import StatusChanger from "../StatusChanger";
import { eventsAPI } from "../../../config/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdminSSE, AdminChannel, SSEEventType } from "../../../hooks/useSSE";
import type { Event } from "../../../types";

interface EventListProps {
  onEventAction: (eventId: string, action: string) => Promise<Event | void>;
  onPermanentDelete?: (eventId: string) => Promise<void>;
}

const EventList: React.FC<EventListProps> = ({
  onEventAction,
  onPermanentDelete,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [todayEventsLoading, setTodayEventsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local wrapper to update state after status change
  const handleStatusChange = async (eventId: string, action: string) => {
    try {
      const updatedEvent = await onEventAction(eventId, action);

      if (!updatedEvent) {
        // ✅ Trust SSE to update instead of re-fetching
        return;
      }

      // ✅ Validate that updatedEvent has critical fields
      if (!updatedEvent.id || updatedEvent.id !== eventId) {
        setError("Error en respuesta del servidor");
        return;
      }

      // ✅ OPTIMISTIC UPDATE: Immediately update local state
      const updateEvent = (event: Event) => {
        if (event.id !== eventId) return event;

        return {
          ...event,
          ...updatedEvent,
          venue: updatedEvent.venue || event.venue,
          operator: updatedEvent.operator || event.operator,
        } as Event;
      };

      setEvents((prev) => prev.map(updateEvent));
      setTodayEvents((prev) => prev.map(updateEvent));
    } catch (err) {
      console.error("❌ Error changing status:", err);
      setError(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "");

  // ✅ SSE listener for real-time event updates
  const adminSSE = useAdminSSE(AdminChannel.GLOBAL);

  useEffect(() => {
    if (adminSSE.status !== "connected") {
      console.log(`📡 EventList: SSE status = ${adminSSE.status}`);
      return;
    }

    console.log("📡 EventList: SSE connected - subscribing to events");

    const unsubscribe = adminSSE.subscribeToEvents({
      // Event status changes
      EVENT_ACTIVATED: (data) => {
        console.log("📥 EventList: EVENT_ACTIVATED received");
        const eventData = data.data;
        if (!eventData?.id) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== eventData.id) return event;
          return {
            ...event,
            ...eventData,
            venue: eventData.venue || event.venue,
            operator: eventData.operator || event.operator,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      EVENT_COMPLETED: (data) => {
        console.log("📥 EventList: EVENT_COMPLETED received");
        const eventData = data.data;
        if (!eventData?.id) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== eventData.id) return event;
          return {
            ...event,
            ...eventData,
            venue: eventData.venue || event.venue,
            operator: eventData.operator || event.operator,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      EVENT_CANCELLED: (data) => {
        console.log("📥 EventList: EVENT_CANCELLED received");
        const eventData = data.data;
        if (!eventData?.id) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== eventData.id) return event;
          return {
            ...event,
            ...eventData,
            venue: eventData.venue || event.venue,
            operator: eventData.operator || event.operator,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      EVENT_SCHEDULED: (data) => {
        console.log("📥 EventList: EVENT_SCHEDULED received");
        const eventData = data.data;
        if (!eventData?.id) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== eventData.id) return event;
          return {
            ...event,
            ...eventData,
            venue: eventData.venue || event.venue,
            operator: eventData.operator || event.operator,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      STREAM_STARTED: (data) => {
        console.log("📥 EventList: STREAM_STARTED received");
        const eventData = data.data;
        if (!eventData?.id) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== eventData.id) return event;
          return {
            ...event,
            ...eventData,
            streamStatus: "connected",
            streamUrl: eventData.streamUrl || event.streamUrl,
            venue: eventData.venue || event.venue,
            operator: eventData.operator || event.operator,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      STREAM_STOPPED: (data) => {
        console.log("📥 EventList: STREAM_STOPPED received");
        const eventData = data.data;
        if (!eventData?.id) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== eventData.id) return event;
          return {
            ...event,
            ...eventData,
            streamStatus: "disconnected",
            venue: eventData.venue || event.venue,
            operator: eventData.operator || event.operator,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      // Handle streaming status update events (deprecated legacy format - to be removed after client update)
      // NOTE: This handles the old format where backend sends STREAM_STATUS_UPDATE with inner type
      // New format uses direct event types (STREAM_PAUSED, STREAM_RESUMED) - see above handlers
      STREAM_STATUS_UPDATE: (data) => {
        // Check the inner type to determine stream status
        const {
          id,
          eventId,
          streamStatus,
          status,
          type: innerType,
        } = data.data;
        const targetId = eventId || id; // Support both eventId and id fields

        if (!targetId) return;

        // Determine the new stream status based on the inner type and status
        let newStreamStatus = null;
        if (innerType === "STREAM_PAUSED") {
          newStreamStatus = "paused";
        } else if (innerType === "STREAM_RESUMED") {
          newStreamStatus = "connected";
        } else if (status === "live") {
          newStreamStatus = "connected";
        } else if (status === "ended") {
          newStreamStatus = "disconnected";
        }

        if (newStreamStatus) {
          // Update both events and todayEvents with the new stream status
          const reconcileEvent = (event: Event) => {
            if (event.id !== targetId) return event;

            // Debug log removed for production - use logger.debug() if needed
            // console.log("🔄 SSE reconciliation for stream status update:", targetId, "to", newStreamStatus)
            return {
              ...event,
              streamStatus: newStreamStatus,
              ...data.data, // Merge any other data from SSE
            } as Event;
          };

          setEvents((prev) => prev.map(reconcileEvent));
          setTodayEvents((prev) => prev.map(reconcileEvent));
        }
      },
      // RTMP connection events
      RTMP_CONNECTED: (data) => {
        const targetId = data.data?.eventId || data.data?.id;
        if (!targetId) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== targetId) return event;

          return {
            ...event,
            streamStatus: "connected",
            ...data.data,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      RTMP_DISCONNECTED: (data) => {
        const targetId = data.data?.eventId || data.data?.id;
        if (!targetId) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== targetId) return event;

          return {
            ...event,
            streamStatus: "disconnected",
            ...data.data,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      // HLS distribution events
      HLS_READY: (data) => {
        const targetId = data.data?.eventId || data.data?.id;
        if (!targetId) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== targetId) return event;

          return {
            ...event,
            hlsStatus: "ready",
            streamUrl: data.data?.streamUrl || event.streamUrl,
            ...data.data,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      HLS_UNAVAILABLE: (data) => {
        const targetId = data.data?.eventId || data.data?.id;
        if (!targetId) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== targetId) return event;

          return {
            ...event,
            hlsStatus: "offline",
            ...data.data,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
      HLS_PROCESSING: (data) => {
        const targetId = data.data?.eventId || data.data?.id;
        if (!targetId) return;

        const reconcileEvent = (event: Event) => {
          if (event.id !== targetId) return event;

          return {
            ...event,
            hlsStatus: "processing",
            ...data.data,
          } as Event;
        };

        setEvents((prev) => prev.map(reconcileEvent));
        setTodayEvents((prev) => prev.map(reconcileEvent));
      },
    });

    return () => {
      unsubscribe();
    };
  }, [adminSSE]);

  // Fetch all events with filters
  const fetchEvents = useCallback(
    async (status: string, date: string) => {
      try {
        setLoading(true);
        setError(null);

        const params: {
          limit: number;
          includeVenue: boolean;
          includeOperator: boolean;
          includeStats: boolean;
          dateRange?: string;
          status?: string;
        } = {
          limit: 500,
          includeVenue: true,
          includeOperator: true,
          includeStats: true,
        };

        if (date) {
          params.dateRange = date;
        }
        if (status) {
          params.status = status;
        }

        const eventsRes = await eventsAPI.getAll(params);
        let eventData = eventsRes.data?.events || [];
        if (user?.role === "operator") {
          eventData = eventData.filter((event) => event.operatorId === user.id);
        }
        setEvents(eventData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading events");
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchEvents(statusFilter, dateFilter);
  }, [fetchEvents, statusFilter, dateFilter]);

  // Fetch today's events separately to ensure they're not affected by filters
  useEffect(() => {
    const fetchTodayEvents = async () => {
      try {
        setTodayEventsLoading(true);
        const params: {
          limit: number;
          includeVenue: boolean;
          includeOperator: boolean;
          includeStats: boolean;
          dateRange?: string;
        } = {
          limit: 500,
          includeVenue: true,
          includeOperator: true,
          includeStats: true,
          dateRange: "today",
        };

        const eventsRes = await eventsAPI.getAll(params);
        let eventData = eventsRes.data?.events || [];
        if (user?.role === "operator") {
          eventData = eventData.filter((event) => event.operatorId === user.id);
        }
        setTodayEvents(eventData);
      } catch (err) {
        console.error("Error fetching today's events:", err);
      } finally {
        setTodayEventsLoading(false);
      }
    };

    fetchTodayEvents();
  }, [user]);

  // Split and sort events: upcoming (future) and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming: typeof events = [];
    const past: typeof events = [];

    events.forEach((event) => {
      const eventDateTime = new Date(event.scheduledDate);
      if (event.scheduledTime) {
        const [hours, minutes] = event.scheduledTime.split(":");
        eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      if (eventDateTime >= now) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    // Sort upcoming: soonest first (ascending)
    upcoming.sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      if (a.scheduledTime) {
        const [h, m] = a.scheduledTime.split(":");
        dateA.setHours(parseInt(h), parseInt(m));
      }
      if (b.scheduledTime) {
        const [h, m] = b.scheduledTime.split(":");
        dateB.setHours(parseInt(h), parseInt(m));
      }
      return dateA.getTime() - dateB.getTime();
    });

    // Sort past: most recent first (descending)
    past.sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      if (a.scheduledTime) {
        const [h, m] = a.scheduledTime.split(":");
        dateA.setHours(parseInt(h), parseInt(m));
      }
      if (b.scheduledTime) {
        const [h, m] = b.scheduledTime.split(":");
        dateB.setHours(parseInt(h), parseInt(m));
      }
      return dateB.getTime() - dateA.getTime();
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  const StreamStatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      connected: {
        text: "Conectado",
        color: "bg-red-100 text-red-800",
        icon: <Video className="w-3 h-3 mr-1" />,
        pulse: true,
      },
      disconnected: {
        text: "Desconectado",
        color: "bg-gray-100 text-gray-800",
        icon: <Square className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      offline: {
        text: "Offline",
        color: "bg-gray-200 text-gray-700",
        icon: <XCircle className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      paused: {
        text: "Pausado",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Activity className="w-3 h-3 mr-1" />,
        pulse: true,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${config.color} ${config.pulse ? "animate-pulse" : ""}`}
        title={`Estado del streaming: ${config.text}`}
      >
        {config.icon}
        {config.text}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Cargando eventos..." />;
  }

  return (
    <div className="min-h-screen bg-theme-card p-6">
      {/* Header con Acciones */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Eventos
            </h1>
            <p className="text-gray-600">
              {events.length} eventos totales •{" "}
              {todayEvents.filter((e) => e.status === "live").length} en vivo
              ahora
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
              <Activity className="w-4 h-4" />
              <span>Sistema Online</span>
            </div>

            <button
              onClick={() => navigate("/admin/events/create")}
              className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Evento
            </button>
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter("today")}
              className={`px-3 py-1 rounded text-sm ${
                dateFilter === "today"
                  ? "bg-blue-400 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`px-3 py-1 rounded text-sm ${
                dateFilter === "week"
                  ? "bg-blue-400 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setDateFilter("")}
              className={`px-3 py-1 rounded text-sm ${
                !dateFilter
                  ? "bg-blue-400 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Todos
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="scheduled">Programados</option>
            <option value="active">Activos</option>
            <option value="live">En Vivo</option>
            <option value="completed">Completados</option>
          </select>
        </div>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchEvents} className="mb-6" />
      )}

      {/* Sección 1: Eventos de Hoy */}
      {todayEventsLoading ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📅 Eventos de Hoy
          </h2>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          </div>
        </div>
      ) : todayEvents.length > 0 ? (
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📅 Eventos de Hoy ({todayEvents.length})
          </h2>

          <div className="space-y-4">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {event.name}
                      </h3>
                      <StatusChanger
                        event={event}
                        onStatusChange={handleStatusChange}
                      />
                      <StreamStatusBadge
                        status={event.streamStatus || "offline"}
                      />
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{event.venue?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>
                          {typeof event.operator === "object" &&
                          event.operator?.username
                            ? event.operator.username
                            : typeof event.operator === "string"
                              ? event.operator
                              : "Sin asignar"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(event.scheduledDate).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>
                          {event.completedFights}/{event.totalFights} peleas
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${event.totalPrizePool.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Controles rápidos según estado */}

                    {event.status === "scheduled" && (
                      <>
                        {event.streamStatus !== "connected" ? (
                          <div className="relative group inline-block">
                            <button
                              onClick={() =>
                                onEventAction(event.id, "start-stream")
                              }
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                            >
                              <Video className="w-4 h-4" />
                              Iniciar Stream
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                              Iniciar la transmisión del evento en vivo
                            </div>
                          </div>
                        ) : (
                          <div className="relative group inline-block">
                            <button
                              onClick={() =>
                                onEventAction(event.id, "stop-stream")
                              }
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                            >
                              <Square className="w-4 h-4" />
                              Detener Stream
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                              Detener la transmisión del evento en vivo
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="relative group inline-block">
                      <button
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                      >
                        <Settings className="w-4 h-4" />
                        Gestionar
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                        Abrir panel de gestión detallada del evento
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        // Empty state for today's events
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📅 Eventos de Hoy (0)
          </h2>
          <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500">
            No hay eventos programados para hoy
          </div>
        </div>
      )}

      {/* Sección 2: Historial de Eventos - Two Column Layout */}
      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No hay eventos disponibles"
            description="No se encontraron eventos con los filtros aplicados. Prueba cambiar los filtros o crear un nuevo evento."
            icon={<Calendar className="w-12 h-12" />}
            action={
              <button
                onClick={() => navigate("/admin/events/create")}
                className="btn-primary"
              >
                Crear Primer Evento
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Upcoming Events */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📅 Eventos Próximos ({upcomingEvents.length})
            </h2>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay eventos próximos
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {event.venue?.name} •{" "}
                          {new Date(event.scheduledDate).toLocaleString([], {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {event.totalFights} peleas • $
                        {event.totalPrizePool.toLocaleString()}
                      </div>
                      <StatusChanger
                        event={event}
                        onStatusChange={handleStatusChange}
                      />
                      <div className="relative group inline-block">
                        <button
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver detalle
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                          Ver detalles completos del evento
                        </div>
                      </div>
                      {onPermanentDelete && (
                        <div className="relative group inline-block">
                          <button
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "⚠️ ¿ELIMINAR PERMANENTEMENTE este evento? NO se puede deshacer.",
                                )
                              ) {
                                try {
                                  await onPermanentDelete(event.id);
                                  setTodayEvents((prev) =>
                                    prev.filter((e) => e.id !== event.id),
                                  );
                                  setEvents((prev) =>
                                    prev.filter((e) => e.id !== event.id),
                                  );
                                } catch (err) {
                                  console.error("Error deleting event:", err);
                                  setError(
                                    err instanceof Error
                                      ? err.message
                                      : "Error al eliminar evento",
                                  );
                                }
                              }
                            }}
                            className="p-1 text-red-700 hover:text-red-900"
                            title="Eliminar Permanentemente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                            ⚠️ ELIMINAR PERMANENTEMENTE
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Right Column: Past Events */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🕒 Eventos Pasados ({pastEvents.length})
            </h2>
            <div className="space-y-3">
              {pastEvents.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay eventos pasados
                </div>
              ) : (
                pastEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {event.venue?.name} •{" "}
                          {new Date(event.scheduledDate).toLocaleString([], {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {event.totalFights} peleas • $
                        {event.totalPrizePool.toLocaleString()}
                      </div>
                      <StatusChanger
                        event={event}
                        onStatusChange={handleStatusChange}
                      />
                      <div className="relative group inline-block">
                        <button
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver detalle
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                          Ver detalles completos del evento
                        </div>
                      </div>
                      {onPermanentDelete && (
                        <div className="relative group inline-block">
                          <button
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "⚠️ ¿ELIMINAR PERMANENTEMENTE este evento? NO se puede deshacer.",
                                )
                              ) {
                                try {
                                  await onPermanentDelete(event.id);
                                  setTodayEvents((prev) =>
                                    prev.filter((e) => e.id !== event.id),
                                  );
                                  setEvents((prev) =>
                                    prev.filter((e) => e.id !== event.id),
                                  );
                                } catch (err) {
                                  console.error("Error deleting event:", err);
                                  setError(
                                    err instanceof Error
                                      ? err.message
                                      : "Error al eliminar evento",
                                  );
                                }
                              }
                            }}
                            className="p-1 text-red-700 hover:text-red-900"
                            title="Eliminar Permanentemente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                            ⚠️ ELIMINAR PERMANENTEMENTE
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EventList;
