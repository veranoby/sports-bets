import React, { useState } from "react";
import { Play, Square, Video } from "lucide-react";
import StatusIndicator from "../shared/StatusIndicator";

const StreamControls: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async (eventId: string) => {
    try {
      await fetch(`/api/events/${eventId}/stream/start`, { method: "POST" });
      setIsStreaming(true); // Actualizar estado si la llamada es exitosa
    } catch (error) {
      console.error("Error al iniciar la transmisión:", error);
    }
  };

  const stopStream = async (eventId: string) => {
    try {
      await fetch(`/api/events/${eventId}/stream/stop`, { method: "POST" });
      setIsStreaming(false); // Actualizar estado si la llamada es exitosa
    } catch (error) {
      console.error("Error al detener la transmisión:", error);
    }
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
      <StatusIndicator
        status={isStreaming ? "connected" : "disconnected"}
        label={isStreaming ? "Transmisión en vivo" : "Sin conexión"}
        size="lg"
      />
    </div>
  );
};

export default StreamControls;
