import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface StatusChangerProps {
  event: {
    id: string;
    status: string;
  };
  onStatusChange: (eventId: string, action: string) => void;
}

const StatusChanger: React.FC<StatusChangerProps> = ({ event, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Define valid status transitions based on current status
  const getValidActions = (currentStatus: string) => {
    switch (currentStatus) {
      case "scheduled":
        return [
          { action: "activate", label: "Activar", description: "Cambiar a en progreso" },
          { action: "cancel", label: "Cancelar", description: "Cancelar el evento" }
        ];
      case "in-progress":
      case "live":
        return [
          { action: "complete", label: "Completar", description: "Marcar como completado" },
          { action: "cancel", label: "Cancelar", description: "Cancelar el evento" }
        ];
      case "completed":
        return [
          { action: "activate", label: "Reabrir", description: "Reabrir el evento" }
        ];
      case "cancelled":
        return [
          { action: "activate", label: "Reabrir", description: "Reabrir el evento" }
        ];
      default:
        return [
          { action: "activate", label: "Activar", description: "Cambiar a en progreso" },
          { action: "complete", label: "Completar", description: "Marcar como completado" },
          { action: "cancel", label: "Cancelar", description: "Cancelar el evento" }
        ];
    }
  };

  const validActions = getValidActions(event.status);
  const currentStatusConfig = {
    scheduled: {
      text: "Programado",
      color: "bg-gray-100 text-gray-800",
      icon: null,
    },
    active: {
      text: "Activo",
      color: "bg-blue-100 text-blue-800",
      icon: null,
    },
    live: {
      text: "En Vivo",
      color: "bg-red-100 text-red-800",
      icon: null,
    },
    completed: {
      text: "Completado",
      color: "bg-green-100 text-green-800",
      icon: null,
    },
    cancelled: {
      text: "Cancelado",
      color: "bg-red-100 text-red-800",
      icon: null,
    },
    "in-progress": {
      text: "En Progreso",
      color: "bg-yellow-100 text-yellow-800",
      icon: null,
    },
    betting: {
      text: "Apuestas Abiertas",
      color: "bg-purple-100 text-purple-800",
      icon: null,
    },
    paused: {
      text: "Pausado",
      color: "bg-yellow-100 text-yellow-800",
      icon: null,
    },
  };

  const currentStatusDisplay = currentStatusConfig[event.status as keyof typeof currentStatusConfig] || 
    currentStatusConfig.scheduled;

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleActionClick = (action: string) => {
    onStatusChange(event.id, action);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${currentStatusDisplay.color} cursor-pointer hover:opacity-90`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentStatusDisplay.icon}
        {currentStatusDisplay.text}
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
          {validActions.map((action, index) => (
            <button
              key={index}
              type="button"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => handleActionClick(action.action)}
            >
              <div className="font-medium">{action.label}</div>
              <div className="text-xs text-gray-500">{action.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusChanger;