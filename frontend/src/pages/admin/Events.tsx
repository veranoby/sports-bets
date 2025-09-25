// frontend/src/pages/admin/Events.tsx
// 🎥 GESTIÓN EVENTOS ADMIN - EL CORAZÓN DEL SISTEMA ⭐⭐⭐
// Funcionalidad crítica: Modal Gestión Evento con control completo

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
  XCircle,
  Edit,
  Radio,
  Target,
  BarChart3,
  X,
  User,
  Building2,
  Video,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import CreateFightModal from "../../components/admin/CreateFightModal";
import EditEventModal from "../../components/admin/EditEventModal";
import StreamStatusMonitor from "../../components/admin/StreamStatusMonitor";
import EventWorkflowControls from "../../components/admin/EventWorkflowControls";
import FightStatusManager from "../../components/admin/FightStatusManager";

// APIs
import {
  eventsAPI,
  fightsAPI,
  betsAPI,
  usersAPI,
  venuesAPI,
} from "../../config/api";

// Hooks
import useSSE from "../../hooks/useSSE";
import { useAuth } from "../../contexts/AuthContext";

interface Event {
  id: string;
  name: string;
  scheduledDate: string;
  status: "scheduled" | "active" | "live" | "completed" | "cancelled";
  venueId: string;
  operatorId?: string;
  totalFights: number;
  completedFights: number;
  totalBets: number;
  totalPrizePool: number;
  streamUrl?: string;
  streamKey?: string;
  streamStatus?: "offline" | "live" | "error";
  venue?: {
    name: string;
    location: string;
  };
  operator?: {
    username: string;
    email: string;
  };
  creator?: {
    username: string;
  };
}

interface Fight {
  id: string;
  eventId: string;
  number: number;
  redCorner: string;
  blueCorner: string;
  weight: number;
  status: "upcoming" | "betting" | "live" | "completed" | "cancelled";
  result?: "red" | "blue" | "draw" | "cancelled";
  bettingStartTime?: string;
  bettingEndTime?: string;
  totalBets: number;
  totalAmount: number;
  notes?: string;
}

interface Bet {
  id: string;
  amount: number;
  odds: number;
  choice: string;
  createdBy: string;
  createdAt: string;
  status: "active" | "matched" | "won" | "lost";
}

interface Incident {
  id: string;
  timestamp: string;
  type: string;
  description: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface Venue {
  id: string;
  name: string;
  location: string;
}

interface StreamStatus {
  status: "offline" | "live" | "error";
  timestamp: string;
}

interface EventDetailData {
  event: Event;
  fights: Fight[];
  liveBets: Bet[];
  streamInfo: {
    status: "offline" | "live" | "error";
    url?: string;
    viewers?: number;
    latency?: number;
  };
  incidents: Incident[];
  stats: {
    totalUsers: number;
    activeBets: number;
    revenue: number;
  };
}

const AdminEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Estados principales
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de transmisión en tiempo real usando SSE
  const [streamStatuses, setStreamStatuses] = useState<
    Record<string, StreamStatus>
  >({});

  // Filtros
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );
  const [dateFilter, setDateFilter] = useState(
    searchParams.get("date") || "today",
  );

  // Modal gestión evento
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetailData, setEventDetailData] =
    useState<EventDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [isCreateFightModalOpen, setIsCreateFightModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  // Estados operativos
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null,
  );

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const eventsRes = await eventsAPI.getAll({
        limit: 500,
        includeVenue: true,
        includeOperator: true,
        includeStats: true,
      });

      let eventData = eventsRes.data?.events || [];

      // If user is an operator, only show events assigned to them
      if (user?.role === "operator") {
        eventData = eventData.filter((event) => event.operatorId === user.id);
      }

      setEvents(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading events");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Usar SSE para obtener actualizaciones del sistema en tiempo real
  const systemSSE = useSSE("/api/sse/admin/system-status");

  // Manejar actualizaciones SSE del sistema
  useEffect(() => {
    if (systemSSE.data) {
      const { eventType } = systemSSE.data;

      if (eventType === "event_activated" || eventType === "event_completed") {
        // Refrescar eventos cuando hay cambios
        fetchEvents();
      }
    }
  }, [systemSSE.data, fetchEvents]);

  // Fetch event detail
  const fetchEventDetail = useCallback(async (eventId: string) => {
    try {
      setDetailLoading(true);

      const [eventRes, fightsRes, betsRes, streamRes] = await Promise.all([
        eventsAPI.getById(eventId),
        fightsAPI.getAll({ eventId }),
        betsAPI.getLive({ eventId }),
        eventsAPI.getStreamStatus(eventId),
      ]);

      setEventDetailData({
        event: eventRes.data,
        fights: fightsRes.data?.fights || [],
        liveBets: betsRes.data?.bets || [],
        streamInfo: streamRes.data || { status: "offline" },
        incidents: [], // TODO: Implementar incidents API
        stats: {
          totalUsers: betsRes.data?.uniqueUsers || 0,
          activeBets: betsRes.data?.total || 0,
          revenue: fightsRes.data?.totalRevenue || 0,
        },
      });
    } catch (err) {
      console.error("Error loading event detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Filtrado
  const { todayEvents, filteredEvents } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    // Eventos de hoy
    const todayEvts = events.filter(
      (e) => e.scheduledDate.startsWith(today) || e.status === "live",
    );

    // Filtros aplicados
    let filtered = [...events];

    if (statusFilter) {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (dateFilter === "today") {
      filtered = todayEvts;
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter((e) => new Date(e.scheduledDate) >= weekAgo);
    }

    return {
      todayEvents: todayEvts,
      filteredEvents: filtered.sort(
        (a, b) =>
          new Date(b.scheduledDate).getTime() -
          new Date(a.scheduledDate).getTime(),
      ),
    };
  }, [events, statusFilter, dateFilter]);

  // Acciones de evento
  const handleEventAction = async (eventId: string, action: string) => {
    try {
      setOperationInProgress(`${eventId}-${action}`);

      let response;
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
          response = await eventsAPI.cancel(eventId);
          break;
      }

      // Actualizar eventos local
      setEvents(
        events.map((e) => (e.id === eventId ? { ...e, ...response.data } : e)),
      );

      // Actualizar detail si está abierto
      if (selectedEventId === eventId && eventDetailData) {
        setEventDetailData({
          ...eventDetailData,
          event: { ...eventDetailData.event, ...response.data },
        });
      }
    } catch (err) {
      setError(
        `Error en ${action}: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`,
      );
    } finally {
      setOperationInProgress(null);
    }
  };



  const handleFightCreated = (newFight: Fight) => {
    if (eventDetailData) {
      setEventDetailData({
        ...eventDetailData,
        fights: [...eventDetailData.fights, newFight],
      });
    }
    setIsCreateFightModalOpen(false);
  };

  const handleEventUpdated = (updatedEvent: Event) => {
    setEvents(events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (eventDetailData && eventDetailData.event.id === updatedEvent.id) {
      setEventDetailData({
        ...eventDetailData,
        event: updatedEvent,
      });
    }
    setIsEditEventModalOpen(false);
  };

  const openEventDetail = (eventId: string) => {
    setSelectedEventId(eventId);
    fetchEventDetail(eventId);
  };

  const closeEventDetail = () => {
    setSelectedEventId(null);
    setEventDetailData(null);
    setActiveTab("general");
  };

  // Fetch inicial
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Componentes auxiliares
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      scheduled: "bg-gray-100 text-gray-800",
      active: "bg-blue-100 text-blue-800",
      live: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || colors.scheduled
        }`}
      >
        {status === "live" && <span className="animate-pulse mr-1">🔴</span>}
        {status}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
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
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`px-3 py-1 rounded text-sm ${
                dateFilter === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setDateFilter("")}
              className={`px-3 py-1 rounded text-sm ${
                !dateFilter
                  ? "bg-blue-600 text-white"
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
      {todayEvents.length > 0 && (
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
                      <StatusBadge status={event.status} />
                      {event.streamStatus === "live" && (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <Radio className="w-4 h-4" />
                          <span>TRANSMITIENDO</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{event.venue?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{event.operator?.username || "Sin asignar"}</span>
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
                      <button
                        onClick={() => handleEventAction(event.id, "activate")}
                        disabled={
                          operationInProgress === `${event.id}-activate`
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                      >
                        <Play className="w-4 h-4" />
                        Activar
                      </button>
                    )}

                    {event.status === "active" && (
                      <>
                        {streamStatuses[event.id]?.status !== "live" ? (
                          <button
                            onClick={() =>
                              handleEventAction(event.id, "start-stream")
                            }
                            disabled={
                              operationInProgress === `${event.id}-start-stream`
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                          >
                            <Video className="w-4 h-4" />
                            Iniciar Stream
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleEventAction(event.id, "stop-stream")
                            }
                            disabled={
                              operationInProgress === `${event.id}-stop-stream`
                            }
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                          >
                            <Square className="w-4 h-4" />
                            Detener Stream
                          </button>
                        )}
                      </>
                    )}

                    {(event.status === "active" || event.status === "live") && (
                      <button
                        onClick={() => handleEventAction(event.id, "complete")}
                        disabled={
                          operationInProgress === `${event.id}-complete`
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Finalizar
                      </button>
                    )}

                    <button
                      onClick={() => openEventDetail(event.id)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                    >
                      <Settings className="w-4 h-4" />
                      Gestionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
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
                      {new Date(event.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    {event.totalFights} peleas • $
                    {event.totalPrizePool.toLocaleString()}
                  </div>
                  <StatusBadge status={event.status} />
                  <button
                    onClick={() => openEventDetail(event.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modal Gestión Evento - EL CORAZÓN DEL SISTEMA */}
      {selectedEventId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestión de Evento
                </h2>
                {eventDetailData && (
                  <p className="text-sm text-gray-600">
                    {eventDetailData.event.name} •{" "}
                    {eventDetailData.event.venue?.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditEventModalOpen(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleEventAction(selectedEventId!, "cancel")}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar Evento
                </button>
                <button
                  onClick={closeEventDetail}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { id: "general", label: "Info General", icon: Calendar },
                  { id: "fights", label: "Peleas ⭐", icon: Target },
                  { id: "bets", label: "Apuestas Vivo", icon: DollarSign },
                  { id: "stream", label: "Streaming", icon: Video },
                  { id: "problems", label: "Problemas", icon: AlertTriangle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
              {detailLoading ? (
                <LoadingSpinner text="Cargando gestión de evento..." />
              ) : eventDetailData ? (
                <>
                  {/* Tab Info General */}
                  {activeTab === "general" && (
                    <div className="space-y-6">
                      {/* Event Workflow Controls - NEW */}
                      <EventWorkflowControls
                        event={eventDetailData.event}
                        onEventUpdated={(updatedEvent) => {
                          setEventDetailData({
                            ...eventDetailData,
                            event: updatedEvent,
                          });
                          setEvents(
                            events.map((e) =>
                              e.id === updatedEvent.id ? updatedEvent : e,
                            ),
                          );
                        }}
                        disabled={operationInProgress !== null}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Información del Evento
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Nombre
                              </label>
                              <p className="text-sm text-gray-900">
                                {eventDetailData.event.name}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Venue
                              </label>
                              <p className="text-sm text-gray-900">
                                {eventDetailData.event.venue?.name}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Fecha Programada
                              </label>
                              <p className="text-sm text-gray-900">
                                {new Date(
                                  eventDetailData.event.scheduledDate,
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Operador Asignado
                              </label>
                              <p className="text-sm text-gray-900">
                                {eventDetailData.event.operator?.username ||
                                  "Sin asignar"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Estado y Estadísticas
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Estado
                              </label>
                              <StatusBadge
                                status={eventDetailData.event.status}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Progreso Peleas
                              </label>
                              <p className="text-sm text-gray-900">
                                {eventDetailData.event.completedFights} /{" "}
                                {eventDetailData.event.totalFights} completadas
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Total Apuestas
                              </label>
                              <p className="text-sm text-gray-900">
                                {eventDetailData.event.totalBets}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Pool de Premios
                              </label>
                              <p className="text-sm text-gray-900">
                                $
                                {eventDetailData.event.totalPrizePool.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Peleas ⭐⭐⭐ - CRÍTICO */}
                  {activeTab === "fights" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Control de Streaming
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Estado del Stream
                              </label>
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    streamStatuses[eventDetailData.event.id]
                                      ?.status === "live"
                                      ? "bg-red-500 animate-pulse"
                                      : streamStatuses[eventDetailData.event.id]
                                            ?.status === "error"
                                        ? "bg-red-500"
                                        : "bg-gray-400"
                                  }`}
                                ></div>
                                <span className="text-sm capitalize">
                                  {streamStatuses[eventDetailData.event.id]
                                    ?.status || "offline"}
                                </span>
                              </div>
                            </div>

                            {eventDetailData.streamInfo.url && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">
                                  URL del Stream
                                </label>
                                <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                                  {eventDetailData.streamInfo.url}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleEventAction(
                                    eventDetailData.event.id,
                                    "start-stream",
                                  )
                                }
                                disabled={
                                  streamStatuses[eventDetailData.event.id]
                                    ?.status === "live" ||
                                  operationInProgress?.includes("stream")
                                }
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Iniciar Stream
                              </button>
                              <button
                                onClick={() =>
                                  handleEventAction(
                                    eventDetailData.event.id,
                                    "stop-stream",
                                  )
                                }
                                disabled={
                                  streamStatuses[eventDetailData.event.id]
                                    ?.status !== "live" ||
                                  operationInProgress?.includes("stream")
                                }
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                              >
                                <Square className="w-4 h-4" />
                                Detener Stream
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Estadísticas Técnicas
                          </h3>
                          <div className="space-y-3">
                            {eventDetailData.streamInfo.viewers !==
                              undefined && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">
                                  Espectadores
                                </label>
                                <p className="text-sm text-gray-900">
                                  {eventDetailData.streamInfo.viewers}
                                </p>
                              </div>
                            )}
                            {eventDetailData.streamInfo.bitrate && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">
                                  Bitrate
                                </label>
                                <p className="text-sm text-gray-900">
                                  {eventDetailData.streamInfo.bitrate} kbps
                                </p>
                              </div>
                            )}
                            {eventDetailData.streamInfo.uptime && (
                              <div>
                                <label className="block text-sm font-medium text-gray-500">
                                  Tiempo en línea
                                </label>
                                <p className="text-sm text-gray-900">
                                  {Math.floor(
                                    eventDetailData.streamInfo.uptime / 60,
                                  )}{" "}
                                  min
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          Gestión de Peleas ({eventDetailData.fights.length})
                        </h3>
                        <button
                          onClick={() => {
                            setIsCreateFightModalOpen(true);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Nueva Pelea
                        </button>
                      </div>

                      <div className="space-y-4">
                        {eventDetailData.fights.length === 0 ? (
                          <EmptyState
                            title="Sin peleas programadas"
                            description="Este evento aún no tiene peleas asignadas. Agrega peleas para comenzar con las apuestas."
                            icon={<Target className="w-12 h-12" />}
                            action={
                              <button
                                onClick={() => {
                                  setIsCreateFightModalOpen(true);
                                }}
                                className="btn-primary"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Primera Pelea
                              </button>
                            }
                          />
                        ) : (
                          eventDetailData.fights.map((fight) => (
                            <FightStatusManager
                              key={fight.id}
                              fight={fight}
                              onFightUpdated={(updatedFight) => {
                                setEventDetailData({
                                  ...eventDetailData,
                                  fights: eventDetailData.fights.map((f) =>
                                    f.id === updatedFight.id ? updatedFight : f,
                                  ),
                                });
                              }}
                              disabled={operationInProgress !== null}
                              className="mb-4"
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab Apuestas en Vivo */}
                  {activeTab === "bets" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card
                          variant="stat"
                          title="Usuarios Conectados"
                          value={eventDetailData.stats.totalUsers}
                          color="blue"
                        />
                        <Card
                          variant="stat"
                          title="Apuestas Activas"
                          value={eventDetailData.stats.activeBets}
                          color="yellow"
                        />
                        <Card
                          variant="stat"
                          title="Volumen Total"
                          value={`${eventDetailData.stats.revenue.toLocaleString()}`}
                          color="green"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Monitor de Apuestas
                        </h3>
                        <EmptyState
                          title="Monitor de apuestas en tiempo real"
                          description="Las apuestas aparecerán aquí cuando el evento esté activo. Esta funcionalidad está en desarrollo."
                          icon={<BarChart3 className="w-12 h-12" />}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tab Streaming */}
                  {activeTab === "stream" && (
                    <div className="space-y-6">
                      <EmptyState
                        title="Controles de streaming movidos"
                        description="Los controles de streaming ahora se encuentran en la pestaña de Peleas para un manejo más integrado."
                        icon={<Video className="w-12 h-12" />}
                      />
                    </div>
                  )}

                  {/* Tab Problemas */}
                  {activeTab === "problems" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          Incidencias y Problemas
                        </h3>
                        <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Reportar Problema
                        </button>
                      </div>

                      <EmptyState
                        title="Sin incidencias reportadas"
                        description="Todo funciona correctamente. El sistema de logging de problemas está en desarrollo."
                        icon={<CheckCircle className="w-12 h-12" />}
                      />
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="Error al cargar el evento"
                  description="No se pudieron cargar los datos del evento. Verifica la conexión e inténtalo nuevamente."
                  icon={<XCircle className="w-12 h-12" />}
                  action={
                    <button
                      onClick={() => fetchEventDetail(selectedEventId!)}
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
      )}

      {isCreateFightModalOpen && selectedEventId && (
        <CreateFightModal
          eventId={selectedEventId}
          onClose={() => setIsCreateFightModalOpen(false)}
          onFightCreated={handleFightCreated}
        />
      )}

      {isEditEventModalOpen && eventDetailData && (
        <EditEventModal
          event={eventDetailData.event}
          onClose={() => setIsEditEventModalOpen(false)}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* Componentes para monitorear el estado de transmisión en tiempo real */}
      {events.map((event) => (
        <StreamStatusMonitor
          key={event.id}
          eventId={event.id}
          onStatusUpdate={(status) => {
            setStreamStatuses((prev) => ({
              ...prev,
              [event.id]: status,
            }));
          }}
        />
      ))}
    </div>
  );
};

export default AdminEventsPage;
