import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HLSPlayerProps {
  streamUrl: string;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  onError?: (error: Error) => void;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({
  streamUrl,
  controls = true,
  autoplay = false,
  muted = false,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamUrl) {
      setError("No stream URL provided.");
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const initializePlayer = () => {
      try {
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(streamUrl);
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
              if (onError) onError(data);
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
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
            if (onError) onError(errorMessage);
          });
        } else {
          throw new Error("HLS is not supported on this browser.");
        }
      } catch (e: any) {
        console.error("Player initialization error:", e);
        setError("Could not initialize video player.");
        if (onError) onError(e);
        setIsLoading(false);
      }
    };

    initializePlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl, autoplay, onError]);

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
