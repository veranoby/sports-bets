import React, { useState, useEffect } from "react";
import { Activity, Wifi, AlertTriangle, CheckCircle, Play, Square } from "lucide-react";
import HLSPlayer from "../../components/streaming/HLSPlayer";
import useSSEConnection from "../../hooks/useSSEConnection";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

interface StreamingEvent {
  id: string;
  name: string;
  status: "scheduled" | "betting" | "live" | "completed" | "intermission";
  scheduledTime: string;
  currentViewers: number;
}

const OptimizedStreamingMonitor: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [events, setEvents] = useState<StreamingEvent[]>([]);
  
  // Use the new SSE connection hook
  const { data, isConnected, error, reconnect } = useSSEConnection();

  // Simulate loading active events (in a real app, this would come from an API)
  useEffect(() => {
    const mockEvents: StreamingEvent[] = [
      {
        id: "1",
        name: "Campeonato Local de Gallos",
        status: "live",
        scheduledTime: "2025-11-19T15:00:00Z",
        currentViewers: 1250
      },
      {
        id: "2",
        name: "Torneo Regional Interclubes",
        status: "scheduled",
        scheduledTime: "2025-11-20T18:00:00Z",
        currentViewers: 0
      },
      {
        id: "3",
        name: "Gran Final GalloBets",
        status: "betting",
        scheduledTime: "2025-11-22T20:00:00Z",
        currentViewers: 0
      }
    ];
    setEvents(mockEvents);
    setSelectedEvent("1"); // Default to first live event
  }, []);

  // Simulate getting stream URL when an event is selected
  useEffect(() => {
    if (selectedEvent) {
      // In a real app, this would make an API call to get the stream URL
      // For now, using a placeholder URL
      setStreamUrl("http://localhost:8000/live/test_stream/index.m3u8");
    }
  }, [selectedEvent]);

  const handleStartStream = () => {
    // In a real app, this would make an API call to start the stream
    setIsStreamPlaying(true);
    console.log("Starting stream for event:", selectedEvent);
  };

  const handleStopStream = () => {
    // In a real app, this would make an API call to stop the stream
    setIsStreamPlaying(false);
    console.log("Stopping stream for event:", selectedEvent);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-500";
      case "betting":
        return "bg-yellow-500";
      case "scheduled":
        return "bg-blue-500";
      case "completed":
        return "bg-gray-500";
      case "intermission":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Streaming & Monitoreo
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestión de streams y métricas en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
              isConnected 
                ? "bg-green-50 border border-green-200 text-green-700" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}></div>
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

        {/* Event Selector and Stream Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-3 bg-white shadow-lg rounded-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evento en Vivo
                </label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleStartStream}
                  disabled={isStreamPlaying}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Stream
                </button>
                <button
                  onClick={handleStopStream}
                  disabled={!isStreamPlaying}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Detener Stream
                </button>
              </div>
            </div>

            {/* Current Event Status */}
            {selectedEvent && (
              <div className="mt-4 flex flex-wrap gap-4">
                {events
                  .filter(event => event.id === selectedEvent)
                  .map(event => (
                    <div key={event.id} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></span>
                      <span className="text-sm font-medium text-gray-700">
                        Estado: {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Espectadores: {event.currentViewers}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Player (70%) + Metrics (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Stream Player - 70% width */}
          <div className="lg:col-span-7 bg-black rounded-lg shadow-lg overflow-hidden">
            {streamUrl ? (
              <HLSPlayer 
                streamUrl={streamUrl} 
                autoplay 
                controls 
                muted={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 p-12 text-center">
                <div>
                  <Activity className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-lg">No stream available</p>
                  <p className="text-sm">Select an event to preview stream</p>
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
                      {data?.connectionCount !== undefined ? data.connectionCount : "--"}
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
                      {data?.streamStatus.isLive ? "EN VIVO" : "OFFLINE"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    data?.streamStatus.isLive 
                      ? "bg-green-100" 
                      : "bg-red-100"
                  }`}>
                    {data?.streamStatus.isLive ? (
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
                      {data.streamStatus.memory.percentUsed}% ({data.streamStatus.memory.currentMB}MB)
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        data.streamStatus.memory.percentUsed > 80 
                          ? 'bg-red-500' 
                          : data.streamStatus.memory.percentUsed > 60 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${data.streamStatus.memory.percentUsed}%` }}
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
                  <span className={`text-sm font-medium ${
                    isConnected ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Última Actualización:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {data?.streamStatus.timestamp
                      ? new Date(data.streamStatus.timestamp).toLocaleTimeString()
                      : '--:--:--'}
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

        {/* Error Display */}
        {error && (
          <div className="mt-6">
            <ErrorMessage error={`Error en SSE: ${error.message || 'Unknown error'}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedStreamingMonitor;