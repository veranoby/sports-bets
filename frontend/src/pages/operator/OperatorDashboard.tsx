// frontend/src/pages/operator/OperatorDashboard.tsx
// 🎯 DASHBOARD OPERADOR - INTERFAZ LIMITADA PARA OPERACIONES DELEGADAS
// Reutiliza componentes del admin con restricciones de visibilidad basadas en roles

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Play,
  Square,
  Eye,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Monitor,
  Radio,
  Target,
  BarChart3,
  Search,
  Filter,
  Zap,
  User,
  Building2,
  Video,
  Settings,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import StreamStatusMonitor from "../../components/admin/StreamStatusMonitor";

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

const OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Estados principales
  const [events, setEvents] = useState<Event[]>([]);
  const [assignedEvents, setAssignedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de transmisión en tiempo real usando SSE
  const [streamStatuses, setStreamStatuses] = useState<Record<string, any>>({});

  // Estados operativos
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null
  );

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener solo eventos asignados al operador actual
      const eventsRes = await eventsAPI.getAll({
        limit: 500,
        includeVenue: true,
        includeOperator: true,
        includeStats: true,
      });

      const allEvents = eventsRes.data?.events || [];
      
      // Filtrar eventos asignados al operador actual
      const assigned = allEvents.filter(event => event.operatorId);
      
      setEvents(allEvents);
      setAssignedEvents(assigned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading events");
    } finally {
      setLoading(false);
    }
  }, []);

  // Usar SSE para obtener el estado de transmisión en tiempo real
  useEffect(() => {
    if (assignedEvents.length > 0) {
      assignedEvents.forEach(event => {
        if (event.id) {
          const sseData = useSSE(`/api/sse/events/${event.id}/stream`, {
            dependencies: [event.id],
            reconnectInterval: 5000,
            onError: (error) => console.warn('Stream SSE error:', error)
          });
          
          if (sseData.data) {
            setStreamStatuses(prev => ({
              ...prev,
              [event.id]: sseData.data
            }));
          }
        }
      });
    }
  }, [assignedEvents]);

  // Acciones de evento (limitadas para operadores)
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
      }

      // Actualizar eventos local
      setAssignedEvents(
        assignedEvents.map((e) => (e.id === eventId ? { ...e, ...response.data } : e))
      );
    } catch (err) {
      setError(
        `Error en ${action}: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // Acciones de pelea
  const handleFightAction = async (
    fightId: string,
    action: string,
    result?: string
  ) => {
    try {
      setOperationInProgress(`fight-${fightId}-${action}`);

      let response;
      switch (action) {
        case "open-betting":
          response = await fightsAPI.openBetting(fightId);
          break;
        case "close-betting":
          response = await fightsAPI.closeBetting(fightId);
          break;
        case "start-fight":
          response = await fightsAPI.updateStatus(fightId, "live");
          break;
        case "record-result":
          response = await fightsAPI.recordResult(fightId, result);
          break;
      }

      // Actualizar eventos para reflejar cambios
      fetchEvents();
    } catch (err) {
      setError(
        `Error en pelea: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Formatear fechas
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calcular progreso del evento
  const calculateEventProgress = (event: Event) => {
    if (event.totalFights === 0) return 0;
    return Math.round((event.completedFights / event.totalFights) * 100);
  };

  // Renderizar barra de progreso
  const renderProgressBar = (event: Event) => {
    const progress = calculateEventProgress(event);
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  // Renderizar estado del evento
  const renderEventStatus = (status: string) => {
    const statusConfig = {
      scheduled: { icon: Calendar, color: "text-gray-500", bg: "bg-gray-100" },
      "in-progress": { icon: Play, color: "text-blue-500", bg: "bg-blue-100" },
      live: { icon: Radio, color: "text-green-500", bg: "bg-green-100" },
      completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
      cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-100" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
        <Icon className="mr-1.5 h-3 w-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchEvents} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Operador</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona tus eventos asignados y transmisiones en tiempo real
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/operator/events")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Ver Todos los Eventos
          </button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Eventos Asignados
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {assignedEvents.length}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Play className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Eventos Activos
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {assignedEvents.filter(e => e.status === "in-progress" || e.status === "live").length}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Radio className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Transmisiones Activas
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {Object.values(streamStatuses).filter((s: any) => s?.isStreaming).length}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Peleas Completadas
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {assignedEvents.reduce((sum, e) => sum + e.completedFights, 0)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Eventos Asignados */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Eventos Asignados ({assignedEvents.length})
          </h2>
        </div>

        {assignedEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No tienes eventos asignados"
            description="Tu administrador te asignará eventos para gestionar."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {event.name}
                    </h3>
                    {renderEventStatus(event.status)}
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {event.venue?.name} • {formatDate(event.scheduledDate)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Peleas: {event.completedFights}/{event.totalFights}</span>
                      <span>{calculateEventProgress(event)}%</span>
                    </div>
                    <div className="mt-1">
                      {renderProgressBar(event)}
                    </div>
                  </div>

                  {/* Monitor de Estado de Transmisión */}
                  <div className="mt-4">
                    <StreamStatusMonitor 
                      eventId={event.id} 
                      streamStatus={streamStatuses[event.id]?.status || "offline"}
                      isStreaming={streamStatuses[event.id]?.isStreaming || false}
                    />
                  </div>

                  {/* Acciones */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => navigate(`/operator/events/${event.id}`)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Settings className="mr-1.5 h-4 w-4" />
                      Gestionar
                    </button>
                    
                    {event.status === "scheduled" && (
                      <button
                        onClick={() => handleEventAction(event.id, "activate")}
                        disabled={!!operationInProgress}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <Play className="mr-1.5 h-4 w-4" />
                        Activar
                      </button>
                    )}
                    
                    {(event.status === "in-progress" || event.status === "live") && (
                      <>
                        {!streamStatuses[event.id]?.isStreaming ? (
                          <button
                            onClick={() => handleEventAction(event.id, "start-stream")}
                            disabled={!!operationInProgress}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <Radio className="mr-1.5 h-4 w-4" />
                            Iniciar Stream
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEventAction(event.id, "stop-stream")}
                            disabled={!!operationInProgress}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <Square className="mr-1.5 h-4 w-4" />
                            Detener Stream
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDashboard;