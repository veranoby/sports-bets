import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface StatusChangerProps {
  event: {
    id: string;
    status: string;
  };
  onStatusChange: (eventId: string, action: string) => void;
}

const StatusChanger: React.FC<StatusChangerProps> = ({
  event,
  onStatusChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Smart filtering: show only valid actions based on current status
  const getValidActions = (currentStatus: string) => {
    const allActions = {
      activate: {
        action: "activate",
        label: "Iniciar Evento",
        description: "Cambiar estado a iniciado/en progreso",
      },
      complete: {
        action: "complete",
        label: "Marcar como Terminado",
        description: "Finalizar el evento",
      },
      cancel: {
        action: "cancel",
        label: "Cancelar Evento",
        description: "Marcar el evento como cancelado",
      },
    };

    // Define valid transitions based on current status
    switch (currentStatus) {
      case "scheduled":
        return [allActions.activate, allActions.cancel];

      case "in-progress":
        return [allActions.complete, allActions.cancel];

      case "paused":
      case "intermission":
        return [allActions.activate, allActions.complete, allActions.cancel];

      case "completed":
      case "cancelled":
        // Terminal states - no actions available
        return [];

      default:
        // Unknown state - show all options
        return [allActions.activate, allActions.complete, allActions.cancel];
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
      text: "Iniciado",
      color: "bg-blue-100 text-blue-800",
      icon: null,
    },
    live: {
      text: "En Vivo",
      color: "bg-red-100 text-red-800",
      icon: null,
    },
    completed: {
      text: "Terminado",
      color: "bg-green-100 text-green-800",
      icon: null,
    },
    cancelled: {
      text: "Cancelado",
      color: "bg-red-100 text-red-800",
      icon: null,
    },
    "in-progress": {
      text: "Iniciado",
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

  const currentStatusDisplay =
    currentStatusConfig[event.status as keyof typeof currentStatusConfig] ||
    currentStatusConfig.scheduled;

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
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

  // Don't render dropdown if no actions available (terminal states)
  if (validActions.length === 0) {
    return (
      <div
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${currentStatusDisplay.color}`}
      >
        {currentStatusDisplay.icon}
        {currentStatusDisplay.text}
      </div>
    );
  }

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
