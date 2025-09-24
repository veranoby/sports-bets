import React, { useEffect } from "react";
import useSSE from "../../hooks/useSSE";

interface StreamStatus {
  status: "live" | "offline" | "error";
  viewers?: number;
  timestamp?: string;
  [key: string]: unknown; // Allow additional properties
}

interface StreamStatusMonitorProps {
  eventId: string;
  onStatusUpdate: (status: StreamStatus) => void;
}

const StreamStatusMonitor: React.FC<StreamStatusMonitorProps> = ({
  eventId,
  onStatusUpdate,
}) => {
  const sseData = useSSE(`/api/sse/events/${eventId}/stream`);

  useEffect(() => {
    if (sseData.data) {
      // Type guard to ensure data has required properties
      const streamData = sseData.data as StreamStatus;
      if (
        streamData &&
        typeof streamData === "object" &&
        "status" in streamData
      ) {
        onStatusUpdate(streamData);
      }
    }
  }, [sseData.data, onStatusUpdate]);

  return null; // Componente sin UI, solo para manejar SSE
};

export default StreamStatusMonitor;
