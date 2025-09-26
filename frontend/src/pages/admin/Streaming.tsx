import React, { useState, useEffect } from "react";
import HLSPlayer from "../../components/streaming/HLSPlayer";
import useStreamStatus from "../../hooks/useStreamStatus";
import { eventsAPI } from "../../config/api"; // Assuming eventsAPI has stream control methods
import { AlertTriangle, Play, Square, Wifi, Eye } from "lucide-react";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";

interface StreamingPageProps {
  eventId?: string;
}

const AdminStreamingPage: React.FC<StreamingPageProps> = () => {
  const [eventId, setEventId] = useState<string>(""); // This should ideally come from route params or a selector
  const [streamKey, setStreamKey] = useState<string>(""); // This should ideally come from event data
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the stream status hook for the current eventId
  const {
    isLive,
    viewers,
    streamUrl: liveStreamUrl,
    status: streamStatus,
    error: streamError,
  } = useStreamStatus(eventId);

  useEffect(() => {
    // In a real application, eventId and streamKey would be fetched or passed via props/context
    // For demonstration, we'll use placeholders or a simple input.
    // Example: fetch event details based on a route param to get streamKey and construct streamUrl
    if (eventId) {
      // Simulate fetching stream details
      // This part would be replaced by actual API calls to get event-specific stream info
      setCurrentStreamUrl(`http://localhost:8000/live/${streamKey}/index.m3u8`);
    }
  }, [eventId, streamKey]);

  const handleStartStream = async () => {
    if (!eventId) {
      setError("Please provide an Event ID.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await eventsAPI.startStream(eventId);
      // Optimistically update UI or refetch event data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start stream.");
    } finally {
      setLoading(false);
    }
  };

  const handleStopStream = async () => {
    if (!eventId) {
      setError("Please provide an Event ID.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await eventsAPI.stopStream(eventId);
      // Optimistically update UI or refetch event data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop stream.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Stream Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Controls and Info */}
        <div className="lg:col-span-1 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Stream Details
          </h2>

          <div className="mb-4">
            <label
              htmlFor="eventId"
              className="block text-sm font-medium text-gray-700"
            >
              Event ID
            </label>
            <input
              type="text"
              id="eventId"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Enter Event ID"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="streamKey"
              className="block text-sm font-medium text-gray-700"
            >
              Stream Key
            </label>
            <input
              type="text"
              id="streamKey"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="Enter Stream Key (e.g., test_stream_001)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          {error && <ErrorMessage error={error} className="mb-4" />}

          <div className="flex items-center gap-2 mb-4">
            <span
              className={`w-3 h-3 rounded-full ${getStatusColor(streamStatus)}`}
            ></span>
            <span className="text-gray-700">SSE Status: {streamStatus}</span>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700">
              Live Status:{" "}
              <span
                className={`font-bold ${isLive ? "text-green-600" : "text-red-600"}`}
              >
                {isLive ? "LIVE" : "OFFLINE"}
              </span>
            </p>
            <p className="text-sm font-medium text-gray-700 flex items-center">
              <Eye className="w-4 h-4 mr-1" /> Viewers: {viewers}
            </p>
            <p className="text-sm font-medium text-gray-700 flex items-center">
              <Wifi className="w-4 h-4 mr-1" /> Stream URL:{" "}
              {liveStreamUrl || "N/A"}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleStartStream}
              disabled={loading || isLive}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Start Stream
            </button>
            <button
              onClick={handleStopStream}
              disabled={loading || !isLive}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Stop Stream
            </button>
          </div>

          {streamError && (
            <div className="mt-4 text-red-600 text-sm flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Stream Error: {streamError.message}
            </div>
          )}
        </div>

        {/* HLS Player Preview */}
        <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden shadow-lg">
          {currentStreamUrl && (
            <HLSPlayer streamUrl={currentStreamUrl} autoplay muted controls />
          )}
          {!currentStreamUrl && (
            <div className="flex items-center justify-center h-full text-gray-400">
              Enter Event ID and Stream Key to preview stream.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStreamingPage;
