import { useState, useEffect, useCallback } from "react";
import useSSE from "./useSSE";

interface StreamStatusData {
  eventId: string;
  isLive: boolean;
  viewers: number;
  streamUrl: string;
  // Add other relevant stream properties as needed
}

interface UseStreamStatusReturn {
  isLive: boolean;
  viewers: number;
  streamUrl: string | null;
  status: "connecting" | "connected" | "disconnected" | "error";
  error: Error | null;
}

const useStreamStatus = (eventId: string): UseStreamStatusReturn => {
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // Connect to the admin streaming SSE channel
  const { lastEvent, status, error } = useSSE<StreamStatusData>(
    "/api/sse/admin/streaming",
  );

  useEffect(() => {
    if (lastEvent && lastEvent.type === "STREAM_STATUS_UPDATE") {
      const data = lastEvent.data;
      if (data.eventId === eventId) {
        setIsLive(data.isLive);
        setViewers(data.viewers);
        setStreamUrl(data.streamUrl);
      }
    }
  }, [lastEvent, eventId]);

  return {
    isLive,
    viewers,
    streamUrl,
    status,
    error,
  };
};

export default useStreamStatus;
