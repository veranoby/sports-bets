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
      onStatusUpdate(sseData.data);
    }
  }, [sseData.data, onStatusUpdate]);

  return null; // Componente sin UI, solo para manejar SSE
};

export default StreamStatusMonitor;
