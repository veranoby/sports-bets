import React from "react";
import { Wifi, WifiOff } from "lucide-react";
import StatusChip from "../shared/StatusChip";

interface LivePreviewProps {
  status: "upcoming" | "betting" | "live" | "completed";
}

const LivePreview: React.FC<LivePreviewProps> = ({ status }) => {
  // Determinar el estado de la transmisión
  const isConnected = status === "live" || status === "betting";

  // Configurar mensajes según el estado
  const getStatusConfig = () => {
    switch (status) {
      case "upcoming":
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-500",
          message: "Transmisión no iniciada",
        };
      case "betting":
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          message: "Apuestas abiertas",
        };
      case "live":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          message: "EN VIVO",
        };
      case "completed":
        return {
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          message: "Pelea completada",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-500",
          message: "Estado desconocido",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Barra de estado */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500 mr-2" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500 mr-2" />
          )}
          <span className="text-sm font-medium">
            {isConnected ? "Transmisión conectada" : "Transmisión desconectada"}
          </span>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor}`}
        >
          {statusConfig.message}
        </div>
      </div>

      {/* Vista previa */}
      <div className="aspect-video bg-gray-800 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Vista previa de transmisión</div>
      </div>

      <StatusChip
        status={isConnected ? "connected" : "disconnected"}
        size="sm"
      />
    </div>
  );
};

export default LivePreview;
