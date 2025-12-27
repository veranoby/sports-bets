import React, { useState, useEffect, useCallback } from "react";
import {
  Edit,
  Trash2,
  Settings,
  Target,
  DollarSign,
  Video,
  Square,
  XCircle,
  Activity,
} from "lucide-react";

// Components
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import EmptyState from "../../../components/shared/EmptyState";
import CreateFightModal from "../../../components/admin/CreateFightModal";
import EditEventModal from "../../../components/admin/EditEventModal";
import SSEErrorBoundary from "../../../components/admin/SSEErrorBoundary";
import StatusChanger from "../../../components/admin/StatusChanger";
import SetWinnerModal from "../../../components/admin/SetWinnerModal";
import HLSPlayer from "../../../components/streaming/HLSPlayer";
import { useAdminSSE, AdminChannel } from "../../../hooks/useSSE";
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
  onPermanentDelete?: (eventId: string) => void;
}

const EventDetail: React.FC<EventDetailProps> = ({
  eventId,
  onClose,
  onEventAction,
  onPermanentDelete,
}) => {
  const [eventDetailData, setEventDetailData] = useState<{
    event: Event;
    fights: Fight[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null,
  );
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [isCreateFightModalOpen, setIsCreateFightModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Get selected fight object to access its status
  const selectedFight =
    eventDetailData?.fights.find((f) => f.id === selectedFightId) || null;

  // ✅ Local wrapper to update state after status change (matching EventList pattern)
  const handleStatusChange = async (eventId: string, action: string) => {
    try {
      console.log("🔄 EventDetail handleStatusChange called:", {
        eventId,
        action,
      });
      const updatedEvent = await onEventAction(eventId, action);
      console.log("📦 EventDetail received updatedEvent:", updatedEvent);

      if (!updatedEvent) {
        console.warn("⚠️ No updated event returned - SSE will handle update");
        return;
      }

      // ✅ OPTIMISTIC UPDATE: Immediately update local state
      setEventDetailData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          event: {
            ...prev.event,
            ...updatedEvent,
            venue: updatedEvent.venue || prev.event.venue,
            operator: updatedEvent.operator || prev.event.operator,
          },
        };
      });
    } catch (err) {
      console.error("❌ Error changing status in EventDetail:", err);
    }
  };

  // ✅ SSE Connection using useAdminSSE hook (replaces manual EventSource - eliminates duplicate connection)
  const adminSSE = useAdminSSE(AdminChannel.GLOBAL);

  // Subscribe to event and stream status changes via SSE
  useEffect(() => {
    if (!eventId || adminSSE.status !== "connected") return;

    const unsubscribe = adminSSE.subscribeToEvents({
      // Event status changes
      EVENT_ACTIVATED: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: { ...prev.event, status: (event as any).status },
            };
          });
        }
      },
      EVENT_COMPLETED: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: { ...prev.event, status: (event as any).status },
            };
          });
        }
      },
      EVENT_CANCELLED: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: { ...prev.event, status: (event as any).status },
            };
          });
        }
      },
      EVENT_SCHEDULED: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: { ...prev.event, status: (event as any).status },
            };
          });
        }
      },
      // Stream status changes
      STREAM_STARTED: (event) => {
        console.log(`🎬 [SSE] STREAM_STARTED received:`, event);
        console.log(`🎬 [SSE] Current eventId: ${eventId}`);
        console.log(`🎬 [SSE] Event.eventId: ${(event as any).eventId}`);
        console.log(
          `🎬 [SSE] Event metadata.eventId: ${event.metadata?.eventId}`,
        );

        // ✅ FIX: Event properties are at root level, not in .data
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          console.log(`✅ [SSE] STREAM_STARTED - Updating UI`);
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                streamStatus: "connected",
                streamUrl: (event as any).streamUrl || prev.event.streamUrl,
                hlsStatus: (event as any).hlsStatus || prev.event.hlsStatus,
              },
            };
          });
        } else {
          console.log(
            `⚠️ [SSE] STREAM_STARTED - Event filtered out (ID mismatch)`,
          );
        }
      },
      STREAM_STOPPED: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                streamStatus: "disconnected",
              },
            };
          });
        }
      },
      STREAM_PAUSED: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                streamStatus: "paused",
              },
            };
          });
        }
      },
      STREAM_RESUMED: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                streamStatus: "connected",
              },
            };
          });
        }
      },
      STREAM_STATUS_UPDATE: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          let newStreamStatus = null;
          if ((event as any).type === "STREAM_PAUSED") {
            newStreamStatus = "paused";
          } else if ((event as any).type === "STREAM_RESUMED") {
            newStreamStatus = "connected";
          } else if ((event as any).status === "live") {
            newStreamStatus = "connected";
          } else if ((event as any).status === "ended") {
            newStreamStatus = "disconnected";
          }

          if (newStreamStatus) {
            setEventDetailData((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                event: {
                  ...prev.event,
                  streamStatus: newStreamStatus,
                  streamUrl: (event as any).streamUrl || prev.event.streamUrl,
                },
              };
            });
          }
        }
      },
      // ✅ Phase 2: RTMP Ingest Events (OBS connection)
      RTMP_CONNECTED: (event) => {
        console.log(`📡 [SSE] RTMP_CONNECTED received:`, event);
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          console.log(`✅ [SSE] RTMP_CONNECTED - Updating UI`);

          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                streamStatus: (event as any).streamStatus || "connected",
              },
            };
          });
        }
      },
      RTMP_DISCONNECTED: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                streamStatus: (event as any).streamStatus || "offline",
              },
            };
          });
        }
      },
      // ✅ Phase 2: HLS Distribution Events (public stream availability)
      HLS_READY: (event) => {
        console.log(`🎥 [SSE] HLS_READY received:`, event);
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          console.log(`✅ [SSE] HLS_READY - Updating UI`);
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                hlsStatus: "ready",
                streamUrl: (event as any).streamUrl || prev.event.streamUrl,
              },
            };
          });
        }
      },
      HLS_UNAVAILABLE: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                hlsStatus: "offline",
              },
            };
          });
        }
      },
      HLS_PROCESSING: (event) => {
        if (
          (event as any).eventId === eventId ||
          event.metadata?.eventId === eventId
        ) {
          setEventDetailData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              event: {
                ...prev.event,
                hlsStatus: "processing",
              },
            };
          });
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [eventId, adminSSE]);

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

  // ✅ Handler directo para fight update (matching handleEventUpdated pattern)
  const handleFightUpdated = (updatedFight: Fight) => {
    console.log("🔄 EventDetail handleFightUpdated called:", updatedFight);
    if (eventDetailData) {
      const updatedFights = eventDetailData.fights.map((f: Fight) =>
        f.id === updatedFight.id ? updatedFight : f,
      );
      console.log("📦 EventDetail updated fights:", updatedFights);
      setEventDetailData({
        ...eventDetailData,
        fights: updatedFights,
        event: {
          ...eventDetailData.event,
          completedFights: updatedFights.filter(
            (f: Fight) => f.status === "completed",
          ).length,
          totalFights: updatedFights.length,
        },
      });
    }
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

  // Handler for opening betting (upcoming -> betting)
  const handleOpenBetting = async () => {
    if (!selectedFightId) {
      console.error("No fight selected");
      return;
    }
    await handleFightStatusUpdate(selectedFightId, "betting");
  };

  // Handler for the "Register Start of Fight" button (betting -> live)
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

  // RTMP Status Badge component
  const RtmpStatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      connected: {
        text: "OBS Conectado",
        color: "bg-green-100 text-green-800",
        icon: <Radio className="w-3 h-3 mr-1" />,
        pulse: true,
      },
      connecting: {
        text: "Conectando...",
        color: "bg-yellow-100 text-yellow-800",
        icon: <ActivityIcon className="w-3 h-3 mr-1" />,
        pulse: true,
      },
      offline: {
        text: "OBS Desconectado",
        color: "bg-gray-200 text-gray-700",
        icon: <XCircleIcon className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      paused: {
        text: "OBS Pausado",
        color: "bg-yellow-100 text-yellow-800",
        icon: <ActivityIcon className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      disconnected: {
        text: "OBS Desconectado",
        color: "bg-gray-200 text-gray-700",
        icon: <XCircleIcon className="w-3 h-3 mr-1" />,
        pulse: false,
      },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${config.color} ${config.pulse ? "animate-pulse" : ""}`}
        title={`Estado de conexión OBS (RTMP): ${config.text}`}
      >
        {config.icon}
        {config.text}
      </span>
    );
  };

  // HLS Status Badge component
  const HlsStatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      ready: {
        text: "Stream Público",
        color: "bg-green-100 text-green-800",
        icon: <Video className="w-3 h-3 mr-1" />,
        pulse: true,
      },
      processing: {
        text: "Procesando...",
        color: "bg-yellow-100 text-yellow-800",
        icon: <ActivityIcon className="w-3 h-3 mr-1" />,
        pulse: true,
      },
      offline: {
        text: "No Disponible",
        color: "bg-gray-200 text-gray-700",
        icon: <XCircleIcon className="w-3 h-3 mr-1" />,
        pulse: false,
      },
      error: {
        text: "Error HLS",
        color: "bg-red-100 text-red-800",
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
        pulse: false,
      },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${config.color} ${config.pulse ? "animate-pulse" : ""}`}
        title={`Estado de distribución HLS: ${config.text}`}
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
                  onStatusChange={handleStatusChange}
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
              (eventDetailData.event.hlsStatus === "ready" ||
                eventDetailData.event.streamStatus === "connected") ? (
                <HLSPlayer
                  streamUrl={eventDetailData.event.streamUrl}
                  autoplay={true}
                  controls={true}
                  muted={true}
                  className="w-full aspect-video rounded-lg overflow-hidden"
                  // ✅ ULTRA Low-latency HLS config (target: 3-5s total latency)
                  hlsConfig={{
                    startPosition: -1, // Force live edge on load
                    liveSyncDurationCount: 2, // 2 segments from edge (2s with 1s fragments)
                    liveMaxLatencyDurationCount: 3, // Max 3s behind live
                    maxBufferLength: 4, // Minimal buffer (4s)
                    maxMaxBufferLength: 8, // Max 8s buffer
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 0, // No old segments kept
                    liveDurationInfinity: true, // Treat as infinite live stream
                  }}
                />
              ) : (
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center text-white">
                  <div className="text-center space-y-1">
                    <Video className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-300">
                      {eventDetailData.event.hlsStatus === "processing"
                        ? "Procesando stream..."
                        : eventDetailData.event.hlsStatus === "error"
                          ? "Error en transcoding HLS"
                          : "Stream no disponible"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {eventDetailData.event.streamStatus === "connected" &&
                      eventDetailData.event.hlsStatus === "processing"
                        ? "OBS conectado. Esperando segmentos HLS..."
                        : eventDetailData.event.streamStatus === "offline"
                          ? "OBS desconectado. Inicie streaming desde OBS Studio."
                          : "Verifique configuración de streaming"}
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
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-gray-50">
                  <RtmpStatusBadge
                    status={eventDetailData.event.streamStatus || "offline"}
                  />
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-gray-50">
                  <HlsStatusBadge
                    status={eventDetailData.event.hlsStatus || "offline"}
                  />
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
                  Espectadores:{" "}
                  <span className="text-sm font-bold text-gray-900">
                    {eventDetailData.event.currentViewers || 0}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Signal Status Badge */}
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-gray-50">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      eventDetailData.event.streamStatus === "connected"
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  ></span>
                  <span className="font-semibold text-xs">
                    Señal:{" "}
                    {eventDetailData.event.streamStatus === "connected"
                      ? "Recibiendo"
                      : "Esperando"}
                  </span>
                </div>
              </div>
            </div>

            {/* OBS Configuration Info - CRITICAL FOR USER */}
            {eventDetailData.event.streamKey && (
              <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <div className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> DATOS DE CONEXIÓN OBS
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-blue-600 font-semibold mb-1">
                      1. Servidor (URL)
                    </span>
                    <div className="flex items-center gap-1">
                      <code className="flex-1 block bg-white p-2 rounded border border-blue-200 font-mono select-all">
                        rtmp://{window.location.hostname}:1935/live
                      </code>
                    </div>
                  </div>
                  <div>
                    <span className="block text-blue-600 font-semibold mb-1">
                      2. Clave de Transmisión (Key)
                    </span>
                    <div className="flex gap-2">
                      <code className="flex-1 block bg-white p-2 rounded border border-blue-200 font-mono select-all overflow-hidden text-ellipsis font-bold">
                        {eventDetailData.event.streamKey}
                      </code>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            eventDetailData.event.streamKey || "",
                          )
                        }
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold shadow-sm transition-colors"
                        title="Copiar Clave"
                      >
                        COPIAR
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-blue-500 italic">
                  * En OBS: Ajustes &gt; Emisión &gt; Servicio: Personalizado
                  &gt; Pegar estos datos.
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <button
                onClick={async () => {
                  setOperationInProgress(`${eventId}-start-stream`);
                  try {
                    await eventsAPI.startStream(eventId);
                    // ✅ SSE will update state automatically - no optimistic update needed
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
                  setOperationInProgress(`${eventId}-pause-stream`);
                  try {
                    await streamingAPI.pauseStream(eventId);
                    // ✅ SSE will update state automatically - no optimistic update needed
                  } catch (error) {
                    console.error("Error pausing stream:", error);
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
                      : "Pausar transmisión"
                }
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Activity className="w-4 h-4" />
                Pausar Stream
              </button>

              <button
                onClick={async () => {
                  setOperationInProgress(`${eventId}-resume-stream`);
                  try {
                    await streamingAPI.resumeStream(eventId);
                    // ✅ SSE will update state automatically - no optimistic update needed
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
                  setOperationInProgress(`${eventId}-stop-stream`);
                  try {
                    await eventsAPI.stopStream(eventId);
                    // ✅ SSE will update state automatically - no optimistic update needed
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

              {/* OBS Connection Status Indicator - Updated for Clarity */}
              <div
                className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-2"
                title="Indica si la plataforma está recibiendo y procesando señal para la audiencia"
              >
                <div
                  className={`w-2 h-2 rounded-full ${eventDetailData.event.streamStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                <span className="hidden md:inline">Señal En Vivo:</span>
                <span>
                  {eventDetailData.event.streamStatus === "connected"
                    ? "Transmitiendo"
                    : eventDetailData.event.streamStatus === "paused"
                      ? "Pausado"
                      : "Sin señal pública"}
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
              onFightCreated={handleFightCreated}
              onFightUpdated={handleFightUpdated}
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
                  {/* Conditional rendering based on fight status to enforce sequential workflow */}
                  {selectedFight?.status === "upcoming" && (
                    <button
                      onClick={handleOpenBetting}
                      disabled={
                        operationInProgress !== null || !selectedFightId
                      }
                      className="relative group overflow-hidden px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-sm hover:shadow-md hover:from-blue-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center text-sm font-bold"
                    >
                      <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full" />
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      ABRIR APUESTAS
                    </button>
                  )}
                  {selectedFight?.status === "betting" && (
                    <button
                      onClick={handleRegisterFightStart}
                      disabled={
                        operationInProgress !== null || !selectedFightId
                      }
                      className="relative group overflow-hidden px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-sm hover:shadow-md hover:from-blue-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center text-sm font-bold"
                    >
                      <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full" />
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      INICIAR PELEA
                    </button>
                  )}
                  {selectedFight?.status === "live" && (
                    <button
                      onClick={handleRegisterFightEnd}
                      disabled={
                        operationInProgress !== null || !selectedFightId
                      }
                      className="relative group overflow-hidden px-4 py-3 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl shadow-sm hover:shadow-md hover:from-red-500 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center text-sm font-bold"
                    >
                      <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 -translate-x-full" />
                      <Award className="w-4 h-4 mr-2" />
                      FINALIZAR
                    </button>
                  )}
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
