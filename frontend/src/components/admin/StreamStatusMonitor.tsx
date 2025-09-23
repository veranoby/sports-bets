import React, { useEffect } from "react";
import useSSE from "../../hooks/useSSE";

interface StreamStatusMonitorProps {
  eventId: string;
  onStatusUpdate: (status: any) => void;
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
