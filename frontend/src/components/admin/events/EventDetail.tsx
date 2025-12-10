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
  ArrowLeft,
  XCircle,
  Award,
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
import SetWinnerModal from "../../../components/admin/SetWinnerModal";
import HLSPlayer from "../../../components/streaming/HLSPlayer";
import { useSSEConnection } from "../../../hooks/useSSEConnection";
import { useStreamControl } from "../../../hooks/useStreamControl";
import StreamingControlTab from "../../../components/admin/StreamingControlTab";
import FightsControlTab from "../../../components/admin/FightsControlTab";
import BetsActiveTab from "../../../components/admin/BetsActiveTab";

// APIs
import { eventsAPI, fightsAPI, streamingAPI } from "../../../config/api";
import { apiClient } from "../../../services/api";

// Types
import type { Event, Fight } from "../../../types";

interface EventDetailProps {
  eventId: string;
  onClose: () => void;
  onEventAction: (eventId: string, action: string) => void;
  onPermanentDelete?: (eventId: string) => void;
}

const EventDetail: React.FC<EventDetailProps> = ({
  eventId,
  onClose,
  onEventAction,
  onPermanentDelete,
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
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false); // State for winner modal

  // SSE and Stream Control Hooks
  const {
    handleStartStream,
    handleStopStream,
    handlePauseStream,
    handleResumeStream,
  } = useStreamControl();

  // SSE listener for event status changes
  useEffect(() => {
    if (!eventId) return;

    // Create a function to handle event status updates
    const handleEventStatusUpdate = (data: any) => {
      if (data.eventId === eventId && eventDetailData) {
        setEventDetailData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            event: {
              ...prev.event,
              ...data, // Update with new data from SSE
            },
          };
        });
      }
    };

    // Listen for event status changes
    const apiBaseUrl =
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
      "http://localhost:3001";
    const event = new EventSource(
      `${apiBaseUrl}/api/sse/admin/global?token=${localStorage.getItem("token")}`,
    );

    event.onmessage = (e) => {
      try {
        const parsedData = JSON.parse(e.data);
        if (
          parsedData.type === "EVENT_ACTIVATED" ||
          parsedData.type === "EVENT_COMPLETED" ||
          parsedData.type === "EVENT_CANCELLED" ||
          parsedData.type === "EVENT_SCHEDULED"
        ) {
          if (parsedData.data?.eventId === eventId) {
            handleEventStatusUpdate(parsedData.data);
          }
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    return () => {
      event.close();
    };
  }, [eventId, eventDetailData]);

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
        fights: fightsRes.data || [],
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
      // Refresh the data after action to reflect the status change immediately
      await fetchEventDetail();
    } catch (err) {
      console.error(`Error in ${action}:`, err);
    } finally {
      setOperationInProgress(null);
    }
  };

  // Function to handle fight status updates
  const handleFightStatusUpdate = async (
    fightId: string,
    status: string,
    result?: string,
  ) => {
    if (!fightId) {
      console.error("No fight selected");
      return;
    }

    try {
      setOperationInProgress(`${fightId}-${status}`);

      // Call the API to update the fight status
      const response = await fightsAPI.updateStatus(fightId, status, result);

      if (response.success) {
        // Refresh event detail data to reflect changes
        await fetchEventDetail();
        console.log(`Fight status updated to ${status}`);
      } else {
        console.error("Failed to update fight status:", response.error);
      }
    } catch (error) {
      console.error(`Error updating fight status to ${status}:`, error);
    } finally {
      setOperationInProgress(null);
    }
  };

  // Handler for the "Register Start of Fight" button
  const handleRegisterFightStart = async () => {
    if (!selectedFightId) {
      console.error("No fight selected");
      return;
    }
    await handleFightStatusUpdate(selectedFightId, "live");
  };

  // Handler for the "Register End of Fight" button
  const handleRegisterFightEnd = () => {
    if (!selectedFightId) {
      console.error("No fight selected");
      return;
    }
    setIsWinnerModalOpen(true); // Open the modal to select winner
  };

  // Handler for submitting the winner
  const handleSubmitWinner = async (fightId: string, winner: string) => {
    await handleFightStatusUpdate(fightId, "completed", winner);
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
              <button onClick={fetchEventDetail} className="btn-primary">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header & actions */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                {eventDetailData.event.name}
                <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold">
                  {eventDetailData.event.operator?.username || "Sin operador"}
                </span>
              </h1>
              <button
                onClick={() => setIsEditEventModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-600 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Estado:</span>
                <StatusChanger
                  event={eventDetailData.event}
                  onStatusChange={(eventId, action) =>
                    onEventAction(eventId, action)
                  }
                />
              </div>
              {onPermanentDelete && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "⚠️ ¿ELIMINAR PERMANENTEMENTE este evento? NO se puede deshacer.",
                      )
                    ) {
                      onPermanentDelete(eventDetailData.event.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-800 flex items-center gap-2"
                  title="Eliminar permanentemente de la BD"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar BD
                </button>
              )}
            </div>
          </div>

          {/* Stream preview */}
          <div className="bg-white rounded-lg shadow p-3 lg:row-span-2 flex items-center justify-center">
            <div className="w-full max-w-xl">
              {eventDetailData.event.streamUrl &&
              eventDetailData.event.streamStatus === "connected" ? (
                <HLSPlayer
                  streamUrl={eventDetailData.event.streamUrl}
                  autoplay={false}
                  controls={true}
                  muted={true}
                  className="w-full aspect-video rounded-lg overflow-hidden"
                />
              ) : (
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center text-white">
                  <div className="text-center space-y-1">
                    <Video className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-300">
                      {eventDetailData.event.streamStatus === "connected"
                        ? "Streaming offline"
                        : eventDetailData.event.streamStatus === "paused"
                          ? "Stream pausado"
                          : "Stream no disponible"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {eventDetailData.event.streamStatus === "connected"
                        ? "Conexión activa, pero stream no disponible"
                        : "Inicie el stream para ver la vista previa"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Streaming controls */}
          <div className="bg-white p-4 rounded-lg shadow space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Control de Streaming
                </h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
                  Estado:
                  <StreamStatusBadge
                    status={eventDetailData.event.streamStatus || "offline"}
                  />
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
                  Espectadores:
                  <span className="text-sm font-bold text-gray-900">
                    {eventDetailData.event.currentViewers || 0}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-gray-50">
                  <span
                    className={`w-2 h-2 rounded-full ${isSSEConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                  ></span>
                  <span className="font-semibold">
                    SSE {isSSEConnected ? "Conectado" : "Desconectado"}
                  </span>
                </div>
                <button
                  onClick={() => setIsSSEConnected(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                >
                  Reconectar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <button
                onClick={async () => {
                  // Start stream
                  setOperationInProgress(`${eventId}-start-stream`);
                  try {
                    const response = await eventsAPI.startStream(eventId);
                    if (response.data.success) {
                      // Update event status
                      if (eventDetailData) {
                        setEventDetailData((prev) =>
                          prev
                            ? {
                                ...prev,
                                event: {
                                  ...prev.event,
                                  streamStatus: "connected",
                                },
                                fights: prev.fights || [],
                              }
                            : null,
                        );
                      }
                    }
                  } catch (error) {
                    console.error("Error starting stream:", error);
                  } finally {
                    setOperationInProgress(null);
                  }
                }}
                disabled={
                  operationInProgress !== null ||
                  eventDetailData.event.streamStatus === "connected"
                }
                title={
                  eventDetailData.event.streamStatus === "connected"
                    ? "Stream ya está activo"
                    : operationInProgress !== null
                      ? "Operación en progreso"
                      : "Iniciar transmisión"
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        setEventDetailData((prev) =>
                          prev
                            ? {
                                ...prev,
                                event: {
                                  ...prev.event,
                                  streamStatus: "paused",
                                },
                                fights: prev.fights || [],
                              }
                            : null,
                        );
                      }
                    }
                  } catch (error) {
                    console.error("Error pausing stream:", error);
                  } finally {
                    setOperationInProgress(null);
                  }
                }}
                disabled={
                  operationInProgress !== null ||
                  eventDetailData.event.streamStatus !== "connected" ||
                  isStreamPaused
                }
                title={
                  operationInProgress !== null
                    ? "Operación en progreso"
                    : eventDetailData.event.streamStatus !== "connected"
                      ? "Stream no activo"
                      : isStreamPaused
                        ? "Stream ya está pausado"
                        : "Pausar transmisión"
                }
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        setEventDetailData((prev) =>
                          prev
                            ? {
                                ...prev,
                                event: {
                                  ...prev.event,
                                  streamStatus: "connected",
                                },
                                fights: prev.fights || [],
                              }
                            : null,
                        );
                      }
                    }
                  } catch (error) {
                    console.error("Error resuming stream:", error);
                  } finally {
                    setOperationInProgress(null);
                  }
                }}
                disabled={
                  operationInProgress !== null ||
                  eventDetailData.event.streamStatus !== "paused"
                }
                title={
                  operationInProgress !== null
                    ? "Operación en progreso"
                    : eventDetailData.event.streamStatus !== "paused"
                      ? "Stream no está pausado"
                      : "Reanudar transmisión"
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        setEventDetailData((prev) =>
                          prev
                            ? {
                                ...prev,
                                event: {
                                  ...prev.event,
                                  streamStatus: "disconnected",
                                },
                                fights: prev.fights || [],
                              }
                            : null,
                        );
                      }
                    }
                  } catch (error) {
                    console.error("Error stopping stream:", error);
                  } finally {
                    setOperationInProgress(null);
                  }
                }}
                disabled={
                  operationInProgress !== null ||
                  eventDetailData.event.streamStatus !== "connected"
                }
                title={
                  operationInProgress !== null
                    ? "Operación en progreso"
                    : eventDetailData.event.streamStatus !== "connected"
                      ? "Stream no activo"
                      : "Detener transmisión"
                }
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-4 h-4" />
                Detener Stream
              </button>

              {/* OBS Connection Status Indicator */}
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${eventDetailData.event.streamStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                <span className="hidden md:inline">Estado OBS:</span>
                <span>
                  {eventDetailData.event.streamStatus === "connected"
                    ? "Conectado"
                    : eventDetailData.event.streamStatus === "paused"
                      ? "Pausado"
                      : "Desconectado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Two columns (Fights Management | Active Bets) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Fights Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Gestión de Peleas
            </h2>

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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedFightId ? "bg-red-400" : "bg-gray-400"}`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${selectedFightId ? "bg-red-500" : "bg-gray-500"}`}
                  ></span>
                </div>
                Monitor de Pelea Actual
              </h2>
              {selectedFightId && (
                <span className="text-xs font-mono px-2 py-1 bg-white border border-gray-200 rounded text-gray-600">
                  ID: {selectedFightId.slice(-6)}
                </span>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col gap-6">
              {/* SECCION DE MANEJO DE INICIO Y TERMINO DE LA  PELEA ACTUAL*/}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Controles de Pelea
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleRegisterFightStart}
                    disabled={operationInProgress !== null || !selectedFightId}
                    className="relative group overflow-hidden px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-sm hover:shadow-md hover:from-blue-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center text-sm font-bold"
                  >
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full" />
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    INICIAR PELEA
                  </button>
                  <button
                    onClick={handleRegisterFightEnd}
                    disabled={operationInProgress !== null || !selectedFightId}
                    className="relative group overflow-hidden px-4 py-3 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl shadow-sm hover:shadow-md hover:from-red-500 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center text-sm font-bold"
                  >
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full" />
                    <Award className="w-4 h-4 mr-2" />
                    FINALIZAR
                  </button>
                </div>
              </div>

              {/* SECCION DE MANEJO DE APUESTAS DE LA PELEA ACTUAL, SI ESTA HABILITADO LA VARIABLE bet */}
              <div className="flex-1 flex flex-col pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Panel de Apuestas
                  </h3>
                </div>

                <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200/60 p-1">
                  <BetsActiveTab
                    eventId={eventId}
                    eventDetailData={eventDetailData}
                    fightId={selectedFightId}
                    selectedFightId={selectedFightId}
                    onStartBettingSession={async (fightId: string) => {
                      await handleFightStatusUpdate(fightId, "betting");
                    }}
                    onCloseBettingSession={async (fightId: string) => {
                      await handleFightStatusUpdate(fightId, "live");
                    }}
                    operationInProgress={operationInProgress}
                  />
                </div>
              </div>
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

        {/* Modal de Crear Pelea */}
        {isCreateFightModalOpen && (
          <CreateFightModal
            eventId={eventId}
            onClose={() => setIsCreateFightModalOpen(false)}
            onFightCreated={handleFightCreated}
          />
        )}

        {/* Modal de Seleccion de Ganador */}
        {isWinnerModalOpen && selectedFightId && (
          <SetWinnerModal
            isOpen={isWinnerModalOpen}
            onClose={() => setIsWinnerModalOpen(false)}
            fightId={selectedFightId}
            onSubmit={handleSubmitWinner}
          />
        )}
      </div>
    </SSEErrorBoundary>
  );
};

export default EventDetail;
