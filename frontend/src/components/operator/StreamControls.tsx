import React from "react";
import { Play, Square, Video } from "lucide-react";

const StreamControls: React.FC = () => {
  const startStream = async (eventId: string) => {
    await fetch(`/api/events/${eventId}/stream/start`, { method: "POST" });
  };

  const stopStream = async (eventId: string) => {
    await fetch(`/api/events/${eventId}/stream/stop`, { method: "POST" });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Control de Transmisión
      </h3>
      <div className="flex gap-2">
        <button
          onClick={() => startStream("123")}
          className="flex items-center px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: "#596c95" }}
        >
          <Play className="w-4 h-4 mr-2" />
          Iniciar Transmisión
        </button>
        <button
          onClick={() => stopStream("123")}
          className="flex items-center px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: "#cd6263" }}
        >
          <Square className="w-4 h-4 mr-2" />
          Detener
        </button>
      </div>
    </div>
  );
};

export default StreamControls;
