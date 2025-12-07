import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Play,
  Square,
  Plus,
  Settings,
  DollarSign,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
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
import type { Event } from "../../../types";

interface EventListProps {
  onEventAction: (eventId: string, action: string) => void;
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

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "");

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

  const filteredEvents = useMemo(() => {
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(b.scheduledDate).getTime() -
        new Date(a.scheduledDate).getTime(),
    );
    return sortedEvents;
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
                        onStatusChange={onEventAction}
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
                          onClick={() => onEventAction(event.id, "activate")}
                          disabled={false} // Temporarily disable this check, will be handled by parent component if needed
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
                    {(event.status === "scheduled" ||
                      event.status === "live") && (
                      <div className="relative group inline-block">
                        <button
                          onClick={() => onEventAction(event.id, "complete")}
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
                    {onPermanentDelete && (
                      <div className="relative group inline-block">
                        <button
                          onClick={async () => {
                            if (
                              window.confirm(
                                "⚠️ ¿ELIMINAR PERMANENTEMENTE este evento de la base de datos? Esta acción NO se puede deshacer.",
                              )
                            ) {
                              try {
                                await onPermanentDelete(event.id);
                                // Optimización: actualizar estado local sin re-fetch
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
                          className="p-2 bg-red-800 text-white rounded text-sm hover:bg-red-900 flex items-center gap-1"
                          title="Eliminar Permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10">
                          ⚠️ ELIMINAR PERMANENTEMENTE de la BD
                        </div>
                      </div>
                    )}{" "}
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
                  <StatusChanger event={event} onStatusChange={onEventAction} />
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
                              // Optimización: actualizar estado local sin re-fetch
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
  );
};

export default EventList;
