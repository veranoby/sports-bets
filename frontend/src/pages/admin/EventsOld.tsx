// frontend/src/pages/admin/Events.tsx
// 🎥 GESTIÓN EVENTOS ADMIN - EL CORAZÓN DEL SISTEMA ⭐⭐⭐
// Funcionalidad crítica: Unified Event Hub con tabs y sidebar

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Play,
  Square,
  Plus,
  Settings,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Radio,
  Target,
  X,
  User,
  Building2,
  Video,
  Trash2,
} from "lucide-react";

// Components
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import EditEventModal from "../../components/admin/EditEventModal";
import SSEErrorBoundary from "../../components/admin/SSEErrorBoundary";
import EventTabs from "../../components/admin/EventTabs";
import StreamingControlTab from "../../components/admin/StreamingControlTab";
import FightsControlTab from "../../components/admin/FightsControlTab";
import BetsActiveTab from "../../components/admin/BetsActiveTab";
import StatusChanger from "../../components/admin/StatusChanger";

// APIs
import { eventsAPI, fightsAPI, streamingAPI } from "../../config/api";

// Hooks
import { useAuth } from "../../contexts/AuthContext";
import useMultiSSE from "../../hooks/useMultiSSE";
import type { Event, Fight } from "../../types";

const AdminEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: eventIdFromParams } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "");

  const [eventDetailData, setEventDetailData] = useState<{
    event: Event;
    fights: Fight[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("streaming");
  const [isStreamPaused, setIsStreamPaused] = useState(false); // State for stream pause status
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null,
  );

  // SSE Channels
  const sseChannels = useMemo(
    () => ({
      fights: "/api/sse/admin/fights",
      streaming: "/api/sse/admin/streaming",
    }),
    [],
  );
  const sseState = useMultiSSE<any>(sseChannels);

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

  // Handle SSE updates
  useEffect(() => {
    const fightEvent = sseState.fights?.lastEvent;
    if (fightEvent) {
      if (fightEvent.type === "FIGHT_STATUS_UPDATE") {
        const updatedFight = fightEvent.data as Fight;
        setEvents((prevEvents) =>
          prevEvents.map((e) =>
            e.id === updatedFight.eventId
              ? {
                  ...e,
                  fights:
                    e.fights?.map((f) =>
                      f.id === updatedFight.id ? updatedFight : f,
                    ) || [],
                }
              : e,
          ),
        );
        if (
          eventDetailData &&
          eventDetailData.event.id === updatedFight.eventId
        ) {
          setEventDetailData((prev) => ({
            ...prev,
            fights:
              prev.fights?.map((f) =>
                f.id === updatedFight.id ? updatedFight : f,
              ) || [],
          }));
        }
      }
    }

    const streamEvent = sseState.streaming?.lastEvent;
    if (streamEvent) {
      if (streamEvent.type === "STREAM_STATUS_UPDATE") {
        const { eventId, status } = streamEvent.data;
        setEvents((prevEvents) =>
          prevEvents.map((e) =>
            e.id === eventId ? { ...e, streamStatus: status } : e,
          ),
        );
        if (eventDetailData && eventDetailData.event.id === eventId) {
          setEventDetailData((prev) => ({
            ...prev,
            event: { ...prev.event, streamStatus: status },
            fights: prev.fights || [], // Preserve existing fights
          }));
        }
      }
    }
  }, [sseState, eventDetailData]);

  const fetchEventDetail = useCallback(async (eventId: string) => {
    try {
      setDetailLoading(true);
      const [eventRes, fightsRes] = await Promise.all([
        eventsAPI.getById(eventId),
        fightsAPI.getAll({ eventId }),
      ]);
      setEventDetailData({
        event: eventRes.data,
        fights: fightsRes.data?.fights || [],
      });
    } catch (err) {
      console.error("Error loading event detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Fetch event detail when eventIdFromParams changes
  useEffect(() => {
    if (eventIdFromParams) {
      fetchEventDetail(eventIdFromParams);
    }
  }, [eventIdFromParams, fetchEventDetail]);

  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [todayEventsLoading, setTodayEventsLoading] = useState(true);

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

  const filteredEvents = useMemo(() => {
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(b.scheduledDate).getTime() -
        new Date(a.scheduledDate).getTime(),
    );
    return sortedEvents;
  }, [events]);

  const handleEventAction = async (eventId: string, action: string) => {
    let response = null; // Initialize response outside try block
    try {
      setOperationInProgress(`${eventId}-${action}`);
      switch (action) {
        case "activate":
          response = await eventsAPI.activate(eventId);
          break;
        case "start-stream":
          response = await eventsAPI.startStream(eventId);
          break;
        case "stop-stream":
          response = await eventsAPI.stopStream(eventId);
          break;
        case "complete":
          response = await eventsAPI.complete(eventId);
          break;
        case "cancel":
          response = await eventsAPI.updateStatus(eventId, "cancel");
          break;
      }
      if (response) {
        // Check if response is not null
        setEvents(
          events.map((e) =>
            e.id === eventId ? { ...e, ...response.data } : e,
          ),
        );
        if (eventDetailData && eventDetailData.event.id === eventId) {
          setEventDetailData({
            ...eventDetailData,
            event: { ...eventDetailData.event, ...response.data },
            fights: eventDetailData.fights || [], // Preserve existing fights
          });
        }
      }
    } catch (err) {
      setError(
        `Error en ${action}: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  const handleEventUpdated = (updatedEvent: Event) => {
    setEvents(events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (eventDetailData && eventDetailData.event.id === updatedEvent.id) {
      setEventDetailData({
        ...eventDetailData,
        event: updatedEvent,
        fights: eventDetailData.fights || [], // Preserve existing fights
      });
    }
    setIsEditEventModalOpen(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres cancelar este evento? Esta acción cambiará el estado del evento a cancelado.",
      )
    ) {
      try {
        setOperationInProgress(`${eventId}-delete`);
        await eventsAPI.delete(eventId);

        // Refresh list
        await fetchEvents(statusFilter, dateFilter);

        // Navigate back to events list if deleting the current event
        if (eventIdFromParams === eventId) {
          navigate("/admin/events");
        }
      } catch (err) {
        setError(
          `Error al cancelar: ${err instanceof Error ? err.message : "Error desconocido"}`,
        );
      } finally {
        setOperationInProgress(null);
      }
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      scheduled: {
        text: "Programado",
        color: "bg-gray-100 text-gray-800",
        icon: <Calendar className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      active: {
        text: "Activo",
        color: "bg-blue-100 text-blue-800",
        icon: <Play className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      live: {
        text: "En Vivo",
        color: "bg-red-100 text-red-800",
        icon: <Radio className="w-3 h-3 mr-1" />,
        pulse: true,
      },
      completed: {
        text: "Completado",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      cancelled: {
        text: "Cancelado",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      "in-progress": {
        text: "En Progreso",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Activity className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      betting: {
        text: "Apuestas Abiertas",
        color: "bg-purple-100 text-purple-800",
        icon: <DollarSign className="w-3 h-3 mr-1" />,
        pulse: true,
      },
      paused: {
        text: "Pausado",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Activity className="w-3 h-3 mr-1" />,
        pulse: true,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.scheduled;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${config.color} ${config.pulse ? "animate-pulse" : ""}`}
        title={`Estado del evento: ${config.text}`}
      >
        {config.icon}
        {config.text}
      </span>
    );
  };

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

  // Render the full page interface if an event is selected
  if (eventIdFromParams && eventDetailData) {
    const tabs = [
      { id: "streaming", label: "🎬 Transmisión En Vivo", icon: Video },
      { id: "fights", label: "🥊 Peleas", icon: Target },
      { id: "bets", label: "💵 Apuestas Activas", icon: DollarSign },
    ];

    return (
      <SSEErrorBoundary>
        <div className="min-h-screen bg-theme-card p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate("/admin/events")}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Volver a Eventos
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {eventDetailData.event.name}
                  </h1>
                  <StatusChanger
                    event={eventDetailData.event}
                    onStatusChange={(eventId, action) =>
                      handleEventAction(eventId, action)
                    }
                  />
                </div>

                <p className="text-gray-600">
                  {eventDetailData.event.venue?.name} •{" "}
                  {eventDetailData.event.operator?.username || "Sin operador"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditEventModalOpen(true)}
                  className="px-3 py-1 bg-blue-400 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleEventAction(eventIdFromParams, "cancel")}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar Evento
                </button>
                <button
                  onClick={() => handleDeleteEvent(eventIdFromParams)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Sidebar - Always visible */}
            <div className="w-80 bg-white rounded-lg shadow p-4 h-fit sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Información del Evento
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Estado del Stream
                  </label>
                  <div className="flex items-center gap-2">
                    <StreamStatusBadge
                      status={eventDetailData.event.streamStatus || "offline"}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Espectadores
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {eventDetailData.event.currentViewers || 0}
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Próxima Pelea
                  </label>
                  <p className="text-sm text-gray-900">
                    {eventDetailData.event.fights &&
                    eventDetailData.event.fights.length > 0
                      ? eventDetailData.event.fights[0].name
                      : "No programada"}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Acciones Rápidas
                  </h4>
                  <div className="space-y-2">
                    {/* Quick Action: Pause/Resume Stream */}
                    <button
                      onClick={async () => {
                        // Toggle stream pause state
                        if (
                          eventDetailData?.event.streamStatus === "connected" &&
                          !isStreamPaused
                        ) {
                          const response =
                            await streamingAPI.pauseStream(eventIdFromParams);
                          if (response.success) {
                            setIsStreamPaused(true);
                            // Update event status in parent state
                            setEventDetailData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    event: {
                                      ...prev.event,
                                      streamStatus: "paused",
                                    },
                                    fights: prev.fights || [], // Preserve fights
                                  }
                                : null,
                            );
                          }
                        } else if (isStreamPaused) {
                          const response =
                            await streamingAPI.resumeStream(eventIdFromParams);
                          if (response.success) {
                            setIsStreamPaused(false);
                            // Update event status in parent state
                            setEventDetailData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    event: {
                                      ...prev.event,
                                      streamStatus: "connected",
                                    },
                                    fights: prev.fights || [], // Preserve fights
                                  }
                                : null,
                            );
                          }
                        }
                      }}
                      disabled={operationInProgress !== null}
                      className="w-full px-3 py-2 bg-blue-400 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isStreamPaused ? "Reanudar Stream" : "Pausar Stream"}
                    </button>
                    <button
                      onClick={() => setActiveTab("fights")}
                      className="w-full px-3 py-2 bg-green-400 text-white rounded text-sm hover:bg-green-500"
                    >
                      Abrir Pelea
                    </button>
                    <button
                      onClick={() => setActiveTab("fights")}
                      className="w-full px-3 py-2 bg-purple-400 text-white rounded text-sm hover:bg-purple-500"
                    >
                      Completar Evento
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area with Tabs */}
            <div className="flex-1">
              {/* Tabs */}
              <EventTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {/* Tab Content */}
              <div className="p-6 bg-white rounded-b-lg rounded-r-lg">
                {detailLoading ? (
                  <LoadingSpinner text="Cargando detalles del evento..." />
                ) : eventDetailData ? (
                  <>
                    {activeTab === "streaming" && (
                      <StreamingControlTab
                        eventId={eventIdFromParams}
                        eventDetailData={eventDetailData}
                        onStreamStatusChange={(status) => {
                          if (eventDetailData) {
                            setEventDetailData({
                              ...eventDetailData,
                              event: { ...eventDetailData.event, ...status },
                              fights: eventDetailData.fights || [],
                            });
                          }
                        }}
                      />
                    )}

                    {activeTab === "fights" && (
                      <FightsControlTab
                        eventId={eventIdFromParams}
                        eventDetailData={eventDetailData}
                        onFightsUpdate={(fights) => {
                          if (eventDetailData) {
                            setEventDetailData({
                              ...eventDetailData,
                              fights,
                              event: {
                                ...eventDetailData.event,
                                completedFights: fights.filter(
                                  (f: Fight) => f.status === "completed",
                                ).length,
                                totalFights: fights.length,
                              },
                            });
                          }
                        }}
                        onEventUpdate={(event) => {
                          if (eventDetailData) {
                            setEventDetailData({
                              ...eventDetailData,
                              event,
                              fights: eventDetailData.fights || [],
                            });
                          }
                        }}
                      />
                    )}

                    {activeTab === "bets" && (
                      <BetsActiveTab
                        eventId={eventIdFromParams}
                        eventDetailData={eventDetailData}
                      />
                    )}
                  </>
                ) : (
                  <EmptyState
                    title="Error al cargar el evento"
                    description="No se pudieron cargar los datos del evento. Verifica la conexión e inténtalo nuevamente."
                    icon={<XCircle className="w-12 h-12" />}
                    action={
                      <button
                        onClick={() => fetchEventDetail(eventIdFromParams)}
                        className="btn-primary"
                      >
                        Reintentar
                      </button>
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* Modal de Edición de Evento */}
          {isEditEventModalOpen && eventDetailData && (
            <EditEventModal
              event={eventDetailData.event}
              onClose={() => setIsEditEventModalOpen(false)}
              onEventUpdated={handleEventUpdated}
            />
          )}
        </div>
      </SSEErrorBoundary>
    );
  }

  // Otherwise, render the original events list

  if (loading) {
    return <LoadingSpinner text="Cargando eventos..." />;
  }

  return (
    <SSEErrorBoundary>
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
                          onStatusChange={(eventId, action) =>
                            handleEventAction(eventId, action)
                          }
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
                        <div className="relative group inline-block">
                          <button
                            onClick={() =>
                              handleEventAction(event.id, "activate")
                            }
                            disabled={
                              operationInProgress === `${event.id}-activate`
                            }
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                          >
                            <Play className="w-4 h-4" />
                            Activar
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                            Activar el evento para comenzar la programación
                          </div>
                        </div>
                      )}
                      {event.status === "scheduled" && (
                        <>
                          {event.streamStatus !== "connected" ? (
                            <div className="relative group inline-block">
                              <button
                                onClick={() =>
                                  handleEventAction(event.id, "start-stream")
                                }
                                disabled={
                                  operationInProgress ===
                                  `${event.id}-start-stream`
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
                                  handleEventAction(event.id, "stop-stream")
                                }
                                disabled={
                                  operationInProgress ===
                                  `${event.id}-stop-stream`
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
                      {(event.status === "scheduled" ||
                        event.status === "live") && (
                        <div className="relative group inline-block">
                          <button
                            onClick={() =>
                              handleEventAction(event.id, "complete")
                            }
                            disabled={
                              operationInProgress === `${event.id}-complete`
                            }
                            className="px-3 py-1 bg-blue-400 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Finalizar
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                            Marcar el evento como completado
                          </div>
                        </div>
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
                      <div className="relative group inline-block">
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                          title="Cancelar Evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                          Cancelar este evento
                        </div>
                      </div>{" "}
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

        {/* Sección 2: Historial de Eventos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Historial de Eventos ({filteredEvents.length})
          </h2>

          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
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
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
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
                    <StatusBadge status={event.status} />
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
                    <div className="relative group inline-block">
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Cancelar Evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                        Cancelar este evento
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Modal de Edición de Evento */}
        {isEditEventModalOpen && eventDetailData && (
          <EditEventModal
            event={eventDetailData.event}
            onClose={() => setIsEditEventModalOpen(false)}
            onEventUpdated={handleEventUpdated}
          />
        )}
      </div>
    </SSEErrorBoundary>
  );
};

export default AdminEventsPage;
