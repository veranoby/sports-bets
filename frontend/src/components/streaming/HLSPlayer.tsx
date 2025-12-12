import React, { useEffect, useRef, useState, useMemo } from "react";
import Hls from "hls.js";

interface HLSPlayerProps {
  streamUrl?: string;
  streamKey?: string;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  onError?: (error: Error) => void;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({
  streamUrl,
  streamKey, // Optional stream key to append to base URL
  controls = true,
  autoplay = false,
  muted = false,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Construct the streaming URL using environment variable
  const constructedStreamUrl = useMemo(() => {
    if (streamUrl) {
      // If streamUrl is already a full URL, use it as-is
      return streamUrl;
    } else if (streamKey) {
      // If streamKey is provided, construct URL using base URL from environment
      const baseUrl =
        import.meta.env.VITE_STREAM_BASE_URL || "http://localhost:8000/hls";
      return `${baseUrl}/${streamKey}.m3u8`;
    }
    return null;
  }, [streamUrl, streamKey]);

  useEffect(() => {
    const activeStreamUrl = constructedStreamUrl || streamUrl;

    if (!activeStreamUrl) {
      setError("No stream URL provided.");
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const initializePlayer = () => {
      const activeStreamUrl = constructedStreamUrl || streamUrl;

      try {
        if (Hls.isSupported()) {
          hls = new Hls({
            // ✅ LIVE STREAMING CONFIG: Start playback near the end for live experience
            liveSyncDurationCount: 3, // Start 3 segments from the live edge
            liveBackBufferLength: 0, // Don't keep old segments in buffer
            maxBufferLength: 10, // Maximum 10 seconds of buffer
            maxMaxBufferLength: 30,
            enableWorker: true,
            lowLatencyMode: false,
          });
          hls.loadSource(activeStreamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoplay) {
              video.play().catch(() => {
                console.warn("Autoplay was prevented by the browser.");
              });
            }
            setIsLoading(false);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              const errorMessage = `HLS.js fatal error: ${data.type} - ${data.details}`;
              console.error(errorMessage);
              setError(
                "Error loading stream. It may be offline or unavailable.",
              );
              if (onError) onError(new Error(`${data.type} - ${data.details}`));
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = activeStreamUrl;
          video.addEventListener("loadedmetadata", () => {
            if (autoplay) {
              video.play().catch(() => {
                console.warn("Autoplay was prevented by the browser.");
              });
            }
            setIsLoading(false);
          });
          video.addEventListener("error", () => {
            const errorMessage = "Native HLS playback error.";
            console.error(errorMessage);
            setError("Error loading stream.");
            if (onError) onError(new Error(errorMessage));
          });
        } else {
          throw new Error("HLS is not supported on this browser.");
        }
      } catch (e: any) {
        console.error("Player initialization error:", e);
        setError("Could not initialize video player.");
        if (onError) onError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
      }
    };

    initializePlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [constructedStreamUrl, streamUrl, autoplay, onError]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
          <span className="ml-4">Loading Stream...</span>
        </div>
      )}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-800">
          <p className="font-semibold">Stream Unavailable</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        controls={controls && !error}
        muted={muted}
        className={`w-full h-full object-contain ${isLoading || error ? "hidden" : ""}`}
        playsInline
      />
    </div>
  );
};

export default HLSPlayer;
