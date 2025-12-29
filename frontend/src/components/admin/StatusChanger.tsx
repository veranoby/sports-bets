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

  const statusConfig = {
    draft: { text: "Borrador", color: "bg-gray-200 text-gray-800" },
    scheduled: { text: "Programada", color: "bg-blue-100 text-blue-800" },
    ready: { text: "Próxima", color: "bg-yellow-100 text-yellow-800" },
    betting_open: {
      text: "Apuestas Abiertas",
      color: "bg-green-100 text-green-800",
    },
    in_progress: { text: "En Progreso", color: "bg-red-100 text-red-800" },
    completed: { text: "Finalizada", color: "bg-purple-100 text-purple-800" },
    cancelled: { text: "Cancelada", color: "bg-gray-200 text-gray-800" },
  };

  const getValidActions = (status: string) => {
    switch (status) {
      case "draft":
        return [{ action: "schedule", label: "Programar Evento" }];
      case "scheduled":
        return [{ action: "mark_ready", label: "Marcar como Próxima" }];
      case "ready":
        return [{ action: "open_betting", label: "Abrir Apuestas" }];
      case "betting_open":
        return [{ action: "start_fight", label: "Iniciar Pelea" }];
      case "in_progress":
        return [{ action: "complete", label: "Finalizar Evento" }];
      default:
        return [];
    }
  };

  const validActions = getValidActions(event.status);
  const currentStatusDisplay =
    statusConfig[event.status as keyof typeof statusConfig] ||
    statusConfig.draft;

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${currentStatusDisplay.color} cursor-pointer hover:opacity-90`}
        onClick={() => setIsOpen(!isOpen)}
      >
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
            </button>
          ))}
          <button
            type="button"
            className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            onClick={() => handleActionClick("cancel")}
          >
            <div className="font-medium">Cancelar Evento</div>
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusChanger;
