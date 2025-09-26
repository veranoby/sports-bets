import React, { useState, useEffect, useCallback } from "react";
import {
  Play,
  Square,
  Settings,
  Users,
  Activity,
  Copy,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Card from "../shared/Card";
import { streamingAPI } from "../../services/api";

interface StreamStatus {
  isLive: boolean;
  streamId?: string;
  rtmpUrl?: string;
  streamKey?: string;
  hlsUrl?: string;
  viewerCount: number;
  duration: number;
  bitrate: number;
  quality: string;
  health: "healthy" | "degraded" | "error";
  errors?: string[];
}

interface StreamConfig {
  eventId: string;
  title: string;
  description?: string;
  quality: "360p" | "480p" | "720p";
  bitrate: number;
  fps: number;
}

interface StreamData {
  streamId: string;
  rtmpUrl: string;
  streamKey: string;
  hlsUrl: string;
}

interface StreamControlsProps {
  eventId: string;
  onStreamStart?: (streamData: StreamData) => void;
  onStreamStop?: () => void;
  className?: string;
}

const StreamControls: React.FC<StreamControlsProps> = ({
  eventId,
  onStreamStart,
  onStreamStop,
  className = "",
}) => {
  const [status, setStatus] = useState<StreamStatus>({
    isLive: false,
    viewerCount: 0,
    duration: 0,
    bitrate: 0,
    quality: "720p",
    health: "healthy",
  });

  const [config, setConfig] = useState<StreamConfig>({
    eventId,
    title: "",
    description: "",
    quality: "720p",
    bitrate: 2500,
    fps: 30,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch stream status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await streamingAPI.getStatus("default-stream");
      // Update status based on API response
      if (response.success && response.data) {
        setStatus((prev) => ({
          ...prev,
          ...(response.data as object),
        }));
      }
    } catch (err) {
      console.error("Failed to fetch stream status:", err);
    }
  }, []);

  // Poll status every 5 seconds when live
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status.isLive) {
      interval = setInterval(fetchStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.isLive, fetchStatus]);

  // Start stream
  const handleStartStream = useCallback(async () => {
    if (!config.title.trim()) {
      setError("Stream title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await streamingAPI.startStream(eventId);

      const streamData = response.data as StreamData;

      setStatus((prev) => ({
        ...prev,
        isLive: true,
        streamId: streamData?.streamId || "",
        rtmpUrl: streamData?.rtmpUrl || "",
        streamKey: streamData?.streamKey || "",
        hlsUrl: streamData?.hlsUrl || "",
        health: "healthy",
      }));

      onStreamStart?.(streamData);
    } catch (err: unknown) {
      let errorMessage = "Failed to start stream";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [config, eventId, onStreamStart]);

  // Stop stream
  const handleStopStream = useCallback(async () => {
    if (!status.streamId) return;

    setLoading(true);
    setError(null);

    try {
      await streamingAPI.stopStream(status.streamId || "default-stream");

      setStatus((prev) => ({
        ...prev,
        isLive: false,
        streamId: undefined,
        rtmpUrl: undefined,
        streamKey: undefined,
        hlsUrl: undefined,
        viewerCount: 0,
        duration: 0,
      }));

      onStreamStop?.();
    } catch (err: unknown) {
      let errorMessage = "Failed to stop stream";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [status.streamId, onStreamStop]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, []);

  // Quality options
  const qualityOptions = [
    { value: "360p", label: "360p (1 Mbps)", bitrate: 1000 },
    { value: "480p", label: "480p (1.5 Mbps)", bitrate: 1500 },
    { value: "720p", label: "720p (2.5 Mbps)", bitrate: 2500 },
  ];

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="streaming-dashboard">
      {/* Stream Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Stream Management
          </h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                status.isLive ? "bg-red-500 animate-pulse" : "bg-gray-300"
              }`}
            />
            <span className="font-medium" data-testid="stream-status">
              {status.isLive ? "Live" : "Ready to Stream"}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stream Controls */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {!status.isLive ? (
              <button
                onClick={handleStartStream}
                disabled={loading}
                data-testid="start-stream-btn"
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                <span>{loading ? "Starting..." : "Start Stream"}</span>
              </button>
            ) : (
              <button
                onClick={handleStopStream}
                disabled={loading}
                data-testid="stop-stream-btn"
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                <span>{loading ? "Stopping..." : "Stop Stream"}</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Stream Configuration */}
      {showSettings && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Stream Configuration
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="stream-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Stream Title *
              </label>
              <input
                type="text"
                id="stream-title"
                data-testid="stream-title"
                value={config.title}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter stream title"
                disabled={status.isLive}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="stream-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="stream-description"
                data-testid="stream-description"
                value={config.description}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter stream description"
                disabled={status.isLive}
              />
            </div>

            {/* Quality Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="stream-quality"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quality
                </label>
                <select
                  id="stream-quality"
                  data-testid="quality-select"
                  value={config.quality}
                  onChange={(e) => {
                    const selectedOption = qualityOptions.find(
                      (opt) => opt.value === e.target.value,
                    );
                    setConfig((prev) => ({
                      ...prev,
                      quality: e.target.value as "360p" | "480p" | "720p",
                      bitrate: selectedOption?.bitrate || prev.bitrate,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={status.isLive}
                >
                  {qualityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="stream-bitrate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Bitrate (kbps)
                </label>
                <input
                  type="number"
                  id="stream-bitrate"
                  data-testid="bitrate-input"
                  value={config.bitrate}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      bitrate: parseInt(e.target.value),
                    }))
                  }
                  min="500"
                  max="3000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={status.isLive}
                />
              </div>

              <div>
                <label
                  htmlFor="stream-fps"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  FPS
                </label>
                <select
                  id="stream-fps"
                  value={config.fps}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      fps: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={status.isLive}
                >
                  <option value={24}>24 FPS</option>
                  <option value={30}>30 FPS</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* RTMP Details */}
      {status.isLive && status.rtmpUrl && status.streamKey && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            OBS Studio Setup
          </h3>
          <div
            data-testid="obs-instructions"
            className="text-sm text-gray-600 mb-4"
          >
            Copy the RTMP URL and Stream Key to OBS Studio for streaming.
          </div>

          <div className="space-y-4">
            {/* RTMP URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RTMP URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={status.rtmpUrl}
                  readOnly
                  data-testid="rtmp-url"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => copyToClipboard(status.rtmpUrl!, "rtmp")}
                  data-testid="copy-rtmp-url"
                  className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {copiedField === "rtmp" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {copiedField === "rtmp" ? "Copied!" : "Copy"}
                  </span>
                </button>
              </div>
            </div>

            {/* Stream Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stream Key
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  value={status.streamKey}
                  readOnly
                  data-testid="stream-key"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => copyToClipboard(status.streamKey!, "key")}
                  data-testid="copy-stream-key"
                  className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {copiedField === "key" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {copiedField === "key" ? "Copied!" : "Copy"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Live Stats */}
      {status.isLive && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Live Statistics
            </h3>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                status.health === "healthy"
                  ? "bg-green-100 text-green-700"
                  : status.health === "degraded"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {status.health}
            </div>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            data-testid="analytics-panel"
          >
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Viewers
                </span>
              </div>
              <p
                className="text-2xl font-bold text-gray-900"
                data-testid="current-viewers"
              >
                {status.viewerCount.toLocaleString()}
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Duration
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(status.duration)}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700 block mb-1">
                Bitrate
              </span>
              <p className="text-2xl font-bold text-gray-900">
                {(status.bitrate / 1000).toFixed(1)}M
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700 block mb-1">
                Quality
              </span>
              <p className="text-2xl font-bold text-gray-900">
                {status.quality}
              </p>
            </div>
          </div>

          {/* Health Warnings */}
          {status.errors && status.errors.length > 0 && (
            <div
              className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              data-testid="stream-warning"
            >
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">
                  Stream quality degraded
                </h4>
              </div>
              <ul
                className="text-sm text-yellow-700 space-y-1"
                data-testid="error-list"
              >
                {status.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              <div className="mt-3 space-x-2">
                <button
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                  data-testid="restart-stream-btn"
                >
                  Restart Stream
                </button>
                <button
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  data-testid="reduce-quality-btn"
                >
                  Reduce Quality
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default StreamControls;