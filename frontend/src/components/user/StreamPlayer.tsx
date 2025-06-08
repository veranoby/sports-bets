import { useState, useEffect } from "react";
import { Play, Pause, RefreshCw, Wifi, WifiOff, Tv2 } from "lucide-react";

type StreamQuality = "720p" | "480p" | "360p";
type StreamStatus = "connected" | "disconnected" | "retrying";

const StreamPlayer = ({ streamUrl }: { streamUrl: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [quality, setQuality] = useState<StreamQuality>("720p");
  const [status, setStatus] = useState<StreamStatus>("connected");
  const [connectionStrength, setConnectionStrength] = useState(3); // 1-3 scale
  const [showOverlay, setShowOverlay] = useState(true);

  // Simulate connection strength changes
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStrength(Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate stream status changes
  useEffect(() => {
    if (status === "retrying") {
      const timer = setTimeout(() => {
        setStatus("connected");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleRetry = () => {
    setStatus("retrying");
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  return (
    <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
      {/* Video Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center text-white">
        <div className="text-center">
          <Tv2 size={48} className="mx-auto mb-4" />
          <p className="text-xl font-medium">Transmisión en vivo simulada</p>
          <p className="text-gray-300 mt-2">Calidad: {quality}</p>
        </div>
      </div>

      {/* Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">Evento en vivo</span>
                <div className="flex items-center text-white">
                  {status === "connected" ? (
                    <>
                      <Wifi size={16} className="mr-1" />
                      <span className="text-xs">
                        {connectionStrength === 3
                          ? "Excelente"
                          : connectionStrength === 2
                          ? "Buena"
                          : "Débil"}
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={16} className="mr-1" />
                      <span className="text-xs">
                        {status === "disconnected"
                          ? "Desconectado"
                          : "Reconectando..."}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlay}
                  className="p-2 bg-white/20 rounded-full pointer-events-auto hover:bg-white/30 transition"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <div className="relative group">
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className="p-2 bg-white/20 rounded text-white text-xs hover:bg-white/30 transition"
          >
            {showOverlay ? "Ocultar" : "Mostrar"} info
          </button>
        </div>

        {status === "disconnected" && (
          <button
            onClick={handleRetry}
            className="p-2 bg-red-500 rounded text-white text-xs flex items-center hover:bg-red-600 transition"
          >
            <RefreshCw size={14} className="mr-1" />
            Reconectar
          </button>
        )}
      </div>

      {/* Quality Selector */}
      <div className="absolute bottom-4 right-4 group">
        <button className="p-2 bg-white/20 rounded text-white text-xs hover:bg-white/30 transition">
          Calidad: {quality}
        </button>
        <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-24 bg-gray-800 rounded shadow-lg">
          {(["720p", "480p", "360p"] as StreamQuality[]).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`block w-full text-left px-3 py-2 text-sm ${
                quality === q
                  ? "bg-blue-600 text-white"
                  : "text-gray-200 hover:bg-gray-700"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreamPlayer;
