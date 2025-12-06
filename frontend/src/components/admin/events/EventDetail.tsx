import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Edit,
  Trash2,
  Settings,
  Target,
  DollarSign,
  Video,
  Square,
  Activity,
  CheckCircle,
  Play,
  RotateCcw,
  Wifi,
  AlertTriangle,
  CheckCircle as CheckCircleIcon,
  User,
  Building2,
  Clock,
  Calendar,
  Radio,
  XCircle,
} from "lucide-react";

// Components
import Card from "../../../components/shared/Card";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import ErrorMessage from "../../../components/shared/ErrorMessage";
import EmptyState from "../../../components/shared/EmptyState";
import CreateFightModal from "../../../components/admin/CreateFightModal";
import EditEventModal from "../../../components/admin/EditEventModal";
import SSEErrorBoundary from "../../../components/admin/SSEErrorBoundary";
import StatusChanger from "../../../components/admin/StatusChanger";
import HLSPlayer from "../../../components/streaming/HLSPlayer";
import { useSSEConnection } from "../../../hooks/useSSEConnection";
import { useStreamControl } from "../../../hooks/useStreamControl";
import StreamingControlTab from "../../../components/admin/StreamingControlTab";
import FightsControlTab from "../../../components/admin/FightsControlTab";
import BetsActiveTab from "../../../components/admin/BetsActiveTab";

// APIs
import { eventsAPI, fightsAPI, streamingAPI } from "../../../config/api";

// Types
import type { Event, Fight } from "../../../types";

interface EventDetailProps {
  eventId: string;
  onClose: () => void;
  onEventAction: (eventId: string, action: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventDetail: React.FC<EventDetailProps> = ({
  eventId,
  onClose,
  onEventAction,
  onDeleteEvent,
}) => {
  const navigate = useNavigate();
  const [eventDetailData, setEventDetailData] = useState<{
    event: Event;
    fights: Fight[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  // Remove activeTab since we're using a new 3-row layout
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null,
  );
  const [isSSEConnected, setIsSSEConnected] = useState<boolean>(true); // Default to true initially
  const [isStreamPaused, setIsStreamPaused] = useState(false); // State for stream pause status
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null); // State for selected fight
  const [isCreateFightModalOpen, setIsCreateFightModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  // SSE and Stream Control Hooks
  const { handleStartStream, handleStopStream, handlePauseStream, handleResumeStream } = useStreamControl();

  // Fetch event detail data
  const fetchEventDetail = useCallback(async () => {
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
  }, [eventId]);

  useEffect(() => {
    fetchEventDetail();
  }, [fetchEventDetail]);

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
    if (eventDetailData) {
      setEventDetailData({
        ...eventDetailData,
        event: updatedEvent,
      });
    }
    setIsEditEventModalOpen(false);
  };

  const handleEventActionLocal = async (action: string) => {
    if (!eventDetailData) return;
    
    setOperationInProgress(`${eventDetailData.event.id}-${action}`);
    try {
      await onEventAction(eventDetailData.event.id, action);
      // Refresh the data after action
      await fetchEventDetail();
    } catch (err) {
      console.error(`Error in ${action}:`, err);
    } finally {
      setOperationInProgress(null);
    }
  };

  // Status badge component for stream status
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

  if (detailLoading) {
    return <LoadingSpinner text="Cargando detalles del evento..." />;
  }

  if (!eventDetailData) {
    return (
      <SSEErrorBoundary>
        <div className="min-h-screen bg-theme-card p-6">
          <EmptyState
            title="Error al cargar el evento"
            description="No se pudieron cargar los datos del evento. Verifica la conexión e inténtalo nuevamente."
            icon={<XCircle className="w-12 h-12" />}
            action={
              <button
                onClick={fetchEventDetail}
                className="btn-primary"
              >
                Reintentar
              </button>
            }
          />
        </div>
      </SSEErrorBoundary>
    );
  }

  const tabs = [
    { id: "streaming", label: "🎬 Transmisión En Vivo", icon: Video },
    { id: "fights", label: "🥊 Peleas", icon: Target },
    { id: "bets", label: "💵 Apuestas Activas", icon: DollarSign },
  ];

  return (
    <SSEErrorBoundary>
      <div className="min-h-screen bg-theme-card p-6 space-y-6">
        {/* Row 1: Header with back button, event name, status, operator, edit, and delete buttons */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="w-5 h-5" />
                Volver a Eventos
              </button>

              <h1 className="text-2xl font-bold text-gray-900">
                {eventDetailData.event.name}
              </h1>

              <StatusChanger
                event={eventDetailData.event}
                onStatusChange={(eventId, action) => onEventAction(eventId, action)}
              />

              <div className="text-gray-600">
                {eventDetailData.event.operator?.username || "Sin operador"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditEventModalOpen(true)}
                className="px-4 py-2 bg-blue-400 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleEventActionLocal("complete")}
                className="px-4 py-2 bg-purple-400 text-white rounded text-sm hover:bg-purple-700 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Completar Evento
              </button>
              <button
                onClick={() => onDeleteEvent(eventDetailData.event.id)}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Streaming Control Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Control de Streaming</h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Streaming Status and Controls */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Estado del Stream:</span>
                  <StreamStatusBadge
                    status={eventDetailData.event.streamStatus || "offline"}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Espectadores:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {eventDetailData.event.currentViewers || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    // Start stream
                    setOperationInProgress(`${eventId}-start-stream`);
                    try {
                      const response = await eventsAPI.startStream(eventId);
                      if (response.data.success) {
                        // Update event status
                        if (eventDetailData) {
                          setEventDetailData(prev => prev ? {
                            ...prev,
                            event: { ...prev.event, streamStatus: "connected" },
                            fights: prev.fights || []
                          } : null);
                        }
                      }
                    } catch (error) {
                      console.error("Error starting stream:", error);
                    } finally {
                      setOperationInProgress(null);
                    }
                  }}
                  disabled={operationInProgress !== null || eventDetailData.event.streamStatus === "connected"}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Stream
                </button>

                <button
                  onClick={async () => {
                    // Pause stream
                    setOperationInProgress(`${eventId}-pause-stream`);
                    try {
                      const response = await streamingAPI.pauseStream(eventId);
                      if (response.data.success) {
                        setIsStreamPaused(true);
                        if (eventDetailData) {
                          setEventDetailData(prev => prev ? {
                            ...prev,
                            event: { ...prev.event, streamStatus: "paused" },
                            fights: prev.fights || []
                          } : null);
                        }
                      }
                    } catch (error) {
                      console.error("Error pausing stream:", error);
                    } finally {
                      setOperationInProgress(null);
                    }
                  }}
                  disabled={operationInProgress !== null || eventDetailData.event.streamStatus !== "connected" || isStreamPaused}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Activity className="w-4 h-4" />
                  Pausar Stream
                </button>

                <button
                  onClick={async () => {
                    // Resume stream
                    setOperationInProgress(`${eventId}-resume-stream`);
                    try {
                      const response = await streamingAPI.resumeStream(eventId);
                      if (response.data.success) {
                        setIsStreamPaused(false);
                        if (eventDetailData) {
                          setEventDetailData(prev => prev ? {
                            ...prev,
                            event: { ...prev.event, streamStatus: "connected" },
                            fights: prev.fights || []
                          } : null);
                        }
                      }
                    } catch (error) {
                      console.error("Error resuming stream:", error);
                    } finally {
                      setOperationInProgress(null);
                    }
                  }}
                  disabled={operationInProgress !== null || eventDetailData.event.streamStatus !== "paused"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reanudar Stream
                </button>

                <button
                  onClick={async () => {
                    // Stop stream
                    setOperationInProgress(`${eventId}-stop-stream`);
                    try {
                      const response = await eventsAPI.stopStream(eventId);
                      if (response.data.success) {
                        if (eventDetailData) {
                          setEventDetailData(prev => prev ? {
                            ...prev,
                            event: { ...prev.event, streamStatus: "disconnected" },
                            fights: prev.fights || []
                          } : null);
                        }
                      }
                    } catch (error) {
                      console.error("Error stopping stream:", error);
                    } finally {
                      setOperationInProgress(null);
                    }
                  }}
                  disabled={operationInProgress !== null || eventDetailData.event.streamStatus !== "connected"}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Square className="w-4 h-4" />
                  Detener Stream
                </button>
              </div>
            </div>

            {/* Small Player Preview - Right side */}
            <div className="lg:col-span-5 flex justify-end">
              <div className="w-full max-w-md">
                {eventDetailData.event.streamUrl ? (
                  <HLSPlayer
                    streamUrl={eventDetailData.event.streamUrl}
                    autoplay={false}
                    controls={true}
                    muted={true}
                    className="w-full aspect-video rounded-lg overflow-hidden"
                  />
                ) : (
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-400">Stream no disponible</p>
                      <p className="text-sm text-gray-500 mt-1">Inicie el stream para ver la vista previa</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SSE Connection Status (optional additional info) */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isSSEConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                <span className="text-sm font-medium text-gray-700">Conexión SSE: {isSSEConnected ? "Conectado" : "Desconectado"}</span>
              </div>
              <button
                onClick={() => {
                  // Add actual SSE reconnect functionality
                  setIsSSEConnected(true); // Simulate reconnection
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Reconectar SSE
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Two columns (Fights Management | Active Bets) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Fights Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Peleas</h2>

            <FightsControlTab
              eventId={eventId}
              eventDetailData={eventDetailData}
              selectedFightId={selectedFightId}
              onFightSelect={setSelectedFightId}
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
          </div>

          {/* Column 2: Active Bets Monitor */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monitor de Apuestas Activas</h2>

            <BetsActiveTab
              eventId={eventId}
              eventDetailData={eventDetailData}
              fightId={selectedFightId}
            />
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

        {/* Modal de Crear Pelea */}
        {isCreateFightModalOpen && (
          <CreateFightModal
            eventId={eventId}
            onClose={() => setIsCreateFightModalOpen(false)}
            onFightCreated={handleFightCreated}
          />
        )}
      </div>
    </SSEErrorBoundary>
  );
};

export default EventDetail;