import React, { useState, useEffect } from "react";
import {
  Activity,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Play,
  Square,
  Pause,
  RotateCcw,
} from "lucide-react";
import HLSPlayer from "../../components/streaming/HLSPlayer";
import { useSSEConnection } from "../../hooks/useSSEConnection";
import { streamingAPI, eventsAPI, apiClient } from "../../services/api";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { useStreamControl } from "../../hooks/useStreamControl";

interface StreamingControlTabProps {
  eventId: string;
  eventDetailData: any;
  onStreamStatusChange: (status: any) => void;
}

const StreamingControlTab: React.FC<StreamingControlTabProps> = ({
  eventId,
  eventDetailData,
  onStreamStatusChange,
}) => {
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // Use the SSE connection hook for metrics and status updates
  const {
    data,
    isConnected,
    error: sseError,
    reconnect,
  } = useSSEConnection({
    endpoint: `/api/sse/streaming?token=${localStorage.getItem("token")}`,
  });

  const {
    handleStartStream: onStartStream,
    handleStopStream: onStopStream,
    handlePauseStream: onPauseStream,
    handleResumeStream: onResumeStream,
    isLoading,
    error,
  } = useStreamControl();

  // Get stream URL when an event is selected
  useEffect(() => {
    const getStreamAccess = async () => {
      if (eventId) {
        try {
          // First try to get stream access using the events endpoint
          const response = await eventsAPI.getStreamAccess(eventId);
          if (response.success && response.data) {
            setStreamUrl(response.data.streamUrl || response.data.hlsUrl);
          } else {
            console.error("Failed to get stream access:", response.error);
          }
        } catch (error) {
          console.error("Error getting stream access:", error);
        }
      }
    };

    getStreamAccess();
  }, [eventId]);

  // State for stream key and RTMP URL
  const [streamKey, setStreamKey] = useState<string>("");
  const [rtmpUrl, setRtmpUrl] = useState<string>("");

  const handleStartStream = async () => {
    await onStartStream(eventId);
    // Update local state after successful API call
    setIsStreamPlaying(true);
    setIsStreamPaused(false);
  };

  const handleStopStream = async () => {
    await onStopStream(eventId);
    // Update local state after successful API call
    setIsStreamPlaying(false);
    setIsStreamPaused(false);
  };

  const handlePauseStream = async () => {
    await onPauseStream(eventId);
    // Update local state after successful API call
    setIsStreamPaused(true);
  };

  const handleResumeStream = async () => {
    await onResumeStream(eventId);
    // Update local state after successful API call
    setIsStreamPaused(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return isStreamPaused ? "bg-yellow-500" : "bg-green-500"; // Yellow when paused, green when live and not paused
      case "betting":
        return "bg-yellow-500";
      case "scheduled":
        return "bg-blue-500";
      case "completed":
        return "bg-gray-500";
      case "intermission":
        return "bg-orange-500";
      case "paused":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Control de Streaming
            </h3>
            <p className="text-sm text-gray-600">
              Gestión de transmisión en vivo para este evento
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                isConnected
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="font-medium">
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>

            {!isConnected && (
              <button
                onClick={reconnect}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Reconectar
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isStreamPlaying ? (
            <button
              onClick={handleStartStream}
              disabled={!eventId}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Iniciar Stream
            </button>
          ) : (
            <>
              {!isStreamPaused ? (
                <button
                  onClick={handlePauseStream}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pausar Stream
                </button>
              ) : (
                <button
                  onClick={handleResumeStream}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reanudar Stream
                </button>
              )}
              <button
                onClick={handleStopStream}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Detener Stream
              </button>
            </>
          )}
        </div>

        {/* Current Event Status */}
        {eventDetailData && eventDetailData.event && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${getStatusColor(eventDetailData.event.status)}`}
              ></span>
              <span className="text-sm font-medium text-gray-700">
                Estado:{" "}
                {isStreamPaused
                  ? "PAUSADO"
                  : eventDetailData.event.status.charAt(0).toUpperCase() +
                    eventDetailData.event.status.slice(1)}
              </span>
              <span className="text-sm text-gray-600">
                Espectadores: {eventDetailData.event.currentViewers || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Player (70%) + Metrics (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Stream Player - 70% width */}
        <div className="lg:col-span-7 bg-black rounded-lg shadow-lg overflow-hidden">
          {streamUrl ? (
            <HLSPlayer streamUrl={streamUrl} autoplay controls muted={false} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 p-12 text-center">
              <div>
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-lg">No stream available</p>
                <p className="text-sm">Stream has not been started yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Panel - 30% width */}
        <div className="lg:col-span-3 space-y-6">
          {/* Connection and Bets Metrics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              Métricas en Tiempo Real
            </h2>

            <div className="space-y-4">
              {/* Connection Count */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="text-sm text-gray-600">Conexiones Activas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.connectionCount !== undefined
                      ? data.connectionCount
                      : "--"}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Wifi className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              {/* Active Bets */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                <div>
                  <p className="text-sm text-gray-600">Apuestas Activas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data?.activeBets !== undefined ? data.activeBets : "--"}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>

              {/* Stream Status */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div>
                  <p className="text-sm text-gray-600">Estado del Stream</p>
                  <p className="text-lg font-bold text-gray-900">
                    {data?.streamStatus?.isLive ? "EN VIVO" : "OFFLINE"}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    data?.streamStatus?.isLive ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {data?.streamStatus?.isLive ? (
                    <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
                  ) : (
                    <Square className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Metrics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recursos del Sistema
            </h2>

            {data?.streamStatus && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Memoria:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {data.streamStatus.memory.percentUsed}% (
                    {data.streamStatus.memory.currentMB}MB)
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      data.streamStatus.memory.percentUsed > 80
                        ? "bg-red-500"
                        : data.streamStatus.memory.percentUsed > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${data.streamStatus.memory.percentUsed}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm mt-3">
                  <span className="text-gray-600">Conexiones DB:</span>
                  <span className="font-medium text-gray-900">
                    {data.streamStatus.database.activeConnections}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cola DB:</span>
                  <span className="font-medium text-gray-900">
                    {data.streamStatus.database.queuedRequests}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Connection Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Estado de Conexión
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">SSE:</span>
                <span
                  className={`text-sm font-medium ${
                    isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isConnected ? "Conectado" : "Desconectado"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Última Actualización:
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {data?.streamStatus?.timestamp
                    ? new Date(data.streamStatus.timestamp).toLocaleTimeString()
                    : "--:--:--"}
                </span>
              </div>
            </div>

            {!isConnected && (
              <div className="mt-4">
                <button
                  onClick={reconnect}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reconectar SSE
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* OBS Configuration Section - appears only when stream is started */}
      {streamKey && rtmpUrl && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-amber-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-md font-semibold text-gray-800">
              Configuración OBS Studio
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server (RTMP URL)
              </label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={rtmpUrl}
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 px-3 py-2 text-sm bg-gray-100 text-gray-800"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(rtmpUrl)}
                  className="px-3 py-2 bg-amber-600 text-white rounded-r-md hover:bg-amber-700 text-sm flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stream Key
              </label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={streamKey}
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 px-3 py-2 text-sm bg-gray-100 text-gray-800"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(streamKey)}
                  className="px-3 py-2 bg-amber-600 text-white rounded-r-md hover:bg-amber-700 text-sm flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            <strong>Instrucciones:</strong> En OBS Studio → Configuración →
            Transmisión → Servicio: Personalizado... → Copia los valores
            anteriores en Servidor y Clave de Transmisión.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6">
          <ErrorMessage
            error={`Error en SSE: ${error.message || "Unknown error"}`}
          />
        </div>
      )}
    </div>
  );
};

export default StreamingControlTab;
