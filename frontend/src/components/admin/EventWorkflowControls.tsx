// frontend/src/components/admin/EventWorkflowControls.tsx
import React from "react";
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  Shield,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import type { EventData } from "../../types";
import { eventsAPI } from "../../services/api";
import StatusChanger from "./StatusChanger";

interface EventWorkflowControlsProps {
  eventId: string;
  operatorId: string;
  currentStatus: string;
  onStatusChange: (eventId: string, action: string) => void;
  currentEvent: EventData;
}

const EventWorkflowControls: React.FC<EventWorkflowControlsProps> = ({
  eventId,
  operatorId,
  currentStatus,
  onStatusChange,
}) => {
  const { user } = useAuth();

  if (user?.role === "operator" && operatorId !== user.id) {
    return (
      <div className="bg-gray-100 rounded-xl shadow-sm border p-4">
        <div className="text-center text-gray-500 py-6">
          <Shield className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p>No tienes permiso para gestionar este evento</p>
        </div>
      </div>
    );
  }

  const handleStreamAction = async (action: "start" | "stop" | "pause" | "resume") => {
    try {
      switch (action) {
        case "start":
          await eventsAPI.startStream(eventId);
          break;
        case "stop":
          await eventsAPI.stopStream(eventId);
          break;
        case "pause":
          // await eventsAPI.pauseStream(eventId); // This seems to be missing from config/api
          break;
        case "resume":
          // await eventsAPI.resumeStream(eventId); // This seems to be missing from config/api
          break;
      }
    } catch (error) {
      console.error(`Error performing stream action ${action}:`, error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-600" />
          Control de Evento
        </h3>
        <StatusChanger
          event={{ id: eventId, status: currentStatus }}
          onStatusChange={onStatusChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleStreamAction("start")}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Play className="w-4 h-4" />
          Iniciar Stream
        </button>
        <button
          onClick={() => handleStreamAction("stop")}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Square className="w-4 h-4" />
          Detener Stream
        </button>
        <button
          onClick={() => handleStreamAction("pause")}
          className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Pause className="w-4 h-4" />
          Pausar
        </button>
        <button
          onClick={() => handleStreamAction("resume")}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Play className="w-4 h-4" />
          Reanudar
        </button>
      </div>
    </div>
  );
};

export default EventWorkflowControls;