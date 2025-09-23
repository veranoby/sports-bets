import React, { useState, useEffect } from "react";
import StatusChip from "../shared/StatusChip";
import Card from "../shared/Card";
import type { StreamQuality, StreamStatus } from "../../types";

interface StreamingPanelProps {
  streamUrl: string;
  initialQuality?: StreamQuality;
  onQualityChange?: (quality: StreamQuality) => void;
  compactMode?: boolean;
}

export const StreamingPanel: React.FC<StreamingPanelProps> = ({
  streamUrl,
  initialQuality = "720p",
  onQualityChange,
  compactMode = false,
}) => {
  const [currentQuality, setCurrentQuality] =
    useState<StreamQuality>(initialQuality);
  const [streamStatus, setStreamStatus] =
    useState<StreamStatus>("disconnected");
  const [viewers, setViewers] = useState<number>(0);
  const [duration, setDuration] = useState<string>("00:00:00");
  const [bitrate, setBitrate] = useState<string>("0 kbps");

  useEffect(() => {
    // Simular conexión al stream
    setStreamStatus("connecting");
    const timer = setTimeout(() => {
      setStreamStatus("connected");
      setViewers(1500);
      setDuration("01:23:45");
      setBitrate("2500 kbps");
    }, 2000);

    return () => clearTimeout(timer);
  }, [streamUrl]);

  const handleQualityChange = (quality: StreamQuality) => {
    setCurrentQuality(quality);
    if (onQualityChange) onQualityChange(quality);
  };

  const renderQualityControls = () => (
    <div className="flex gap-2">
      {(["720p", "480p", "360p"] as StreamQuality[]).map((quality) => (
        <button
          key={quality}
          className={`px-3 py-1 rounded-md text-sm ${
            currentQuality === quality
              ? "bg-[#596c95] text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
          onClick={() => handleQualityChange(quality)}
        >
          {quality}
        </button>
      ))}
    </div>
  );

  const renderStats = () => (
    <div className="flex gap-4 text-sm text-gray-400">
      <div className="flex items-center gap-1">
        <span>👁️</span>
        <span>{viewers.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>⏱️</span>
        <span>{duration}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>📊</span>
        <span>{bitrate}</span>
      </div>
    </div>
  );

  if (compactMode) {
    return (
      <Card
        title="Stream en vivo"
        variant="stat"
        size="sm"
        className="p-4 bg-theme-card text-theme-primary"
      >
        <div className="flex items-center justify-between">
          <StatusChip status={streamStatus} />
          {renderStats()}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Stream en vivo"
      variant="stat"
      size="lg"
      className="p-6 bg-theme-card text-theme-primary"
    >
      <div className="flex flex-col gap-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {streamStatus === "connected" ? (
            <video
              src={streamUrl}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              {streamStatus === "connecting" ? "Conectando..." : "Desconectado"}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <StatusChip status={streamStatus} />
          {renderQualityControls()}
          {renderStats()}
        </div>
      </div>
    </Card>
  );
};
export default StreamingPanel;
