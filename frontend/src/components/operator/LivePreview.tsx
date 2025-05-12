import React from "react";
import type { FC } from "react";

type StreamStatus = "upcoming" | "betting" | "live" | "completed";

interface LivePreviewProps {
  status: StreamStatus;
}

const LivePreview: FC<LivePreviewProps> = ({ status }) => {
  const getStatusText = (): string => {
    switch (status) {
      case "upcoming":
        return "Evento programado";
      case "betting":
        return "Apuestas abiertas";
      case "live":
        return "En vivo";
      case "completed":
        return "Evento finalizado";
      default:
        return "";
    }
  };

  const isConnected = status === "live";

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white">
      {/* Vista previa de la transmisión */}
      <div className="bg-gray-200 h-48 flex items-center justify-center relative">
        <span className="text-gray-500">Vista previa de la transmisión</span>
        {status === "live" && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
            EN VIVO
          </div>
        )}
      </div>

      {/* Indicador de estado y texto */}
      <div className="p-4">
        <div className="flex items-center mb-2">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {getStatusText()}
        </h3>
      </div>
    </div>
  );
};

export default LivePreview;
