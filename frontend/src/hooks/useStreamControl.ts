import { useState, useCallback } from "react";
import { streamingAPI } from "../services/api";

interface UseStreamControlReturn {
  handleStartStream: (eventId: string) => Promise<void>;
  handleStopStream: (eventId: string) => Promise<void>;
  handlePauseStream: (eventId: string) => Promise<void>;
  handleResumeStream: (eventId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useStreamControl = (): UseStreamControlReturn => {
  const [loadingStates, setLoadingStates] = useState({
    start: false,
    stop: false,
    pause: false,
    resume: false,
  });
  const [error, setError] = useState<string | null>(null);

  const updateLoadingState = useCallback(
    (operation: keyof typeof loadingStates, value: boolean) => {
      setLoadingStates((prev) => ({
        ...prev,
        [operation]: value,
      }));
    },
    [],
  );

  const getIsLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some((value) => value === true);
  }, [loadingStates]);

  const handleStartStream = useCallback(
    async (eventId: string) => {
      if (loadingStates.start) return;

      try {
        updateLoadingState("start", true);
        setError(null);

        const response = await streamingAPI.startStream(eventId);
        if (!response.success) {
          throw new Error(response.error || "Failed to start stream");
        }
      } catch (err) {
        console.error("Error starting stream:", err);
        setError(err instanceof Error ? err.message : "Error starting stream");
      } finally {
        updateLoadingState("start", false);
      }
    },
    [loadingStates.start, updateLoadingState],
  );

  const handleStopStream = useCallback(
    async (eventId: string) => {
      if (loadingStates.stop) return;

      try {
        updateLoadingState("stop", true);
        setError(null);

        const response = await streamingAPI.stopStream(eventId);
        if (!response.success) {
          throw new Error(response.error || "Failed to stop stream");
        }
      } catch (err) {
        console.error("Error stopping stream:", err);
        setError(err instanceof Error ? err.message : "Error stopping stream");
      } finally {
        updateLoadingState("stop", false);
      }
    },
    [loadingStates.stop, updateLoadingState],
  );

  const handlePauseStream = useCallback(
    async (eventId: string) => {
      if (loadingStates.pause) return;

      try {
        updateLoadingState("pause", true);
        setError(null);

        const response = await streamingAPI.pauseStream(eventId);
        if (!response.success) {
          throw new Error(response.error || "Failed to pause stream");
        }
      } catch (err) {
        console.error("Error pausing stream:", err);
        setError(err instanceof Error ? err.message : "Error pausing stream");
      } finally {
        updateLoadingState("pause", false);
      }
    },
    [loadingStates.pause, updateLoadingState],
  );

  const handleResumeStream = useCallback(
    async (eventId: string) => {
      if (loadingStates.resume) return;

      try {
        updateLoadingState("resume", true);
        setError(null);

        const response = await streamingAPI.resumeStream(eventId);
        if (!response.success) {
          throw new Error(response.error || "Failed to resume stream");
        }
      } catch (err) {
        console.error("Error resuming stream:", err);
        setError(err instanceof Error ? err.message : "Error resuming stream");
      } finally {
        updateLoadingState("resume", false);
      }
    },
    [loadingStates.resume, updateLoadingState],
  );

  return {
    handleStartStream,
    handleStopStream,
    handlePauseStream,
    handleResumeStream,
    isLoading: getIsLoading(),
    error,
  };
};
