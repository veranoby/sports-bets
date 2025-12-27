// frontend/src/components/admin/EventWorkflowControls.tsx
// Enhanced event workflow controls with pause/resume functionality for intermission periods

import React, { useState, useEffect } from "react";
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  Users,
  Eye,
  Trophy,
  Shield,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import type { Fight, User, EventData } from "../../types";
import { eventsAPI, fightsAPI } from "../../services/api";

interface EventWorkflowControlsProps {
  eventId: string;
  operatorId: string;
  currentStatus:
    | "scheduled"
    | "betting"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "intermission";
  onStatusChange: (newStatus: string, message?: string) => void;
  currentEvent: EventData; // The event object
  fights: Fight[];
}

const EventWorkflowControls: React.FC<EventWorkflowControlsProps> = ({
  eventId,
  operatorId,
  currentStatus,
  onStatusChange,
  currentEvent,
  fights,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFight, setActiveFight] = useState<Fight | null>(null);

  // Check if user has permission to manage this event
  useEffect(() => {
    if (user?.role === "operator" && operatorId !== user.id) {
      setError(
        "Acceso no autorizado: No puedes gestionar eventos de otros operadores",
      );
    }
  }, [user, operatorId]);

  // Find active or next fight
  useEffect(() => {
    if (fights && fights.length > 0) {
      // Find the first fight that is not completed
      const nextFight = fights.find(
        (fight) => fight.status !== "completed" && fight.status !== "cancelled",
      );
      setActiveFight(nextFight || null);
    }
  }, [fights]);

  // If user is an operator but doesn't own this event, don't render controls
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

  const getActiveFight = (): Fight | undefined => {
    if (fights && fights.length > 0) {
      return fights.find(
        (fight) => fight.status !== "completed" && fight.status !== "cancelled",
      );
    }
    return undefined;
  };

  const handlePauseStream = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await eventsAPI.pauseStream(eventId);
      if (response.success) {
        onStatusChange(
          "intermission",
          "Stream pausado - próximo combate listo...",
        );
      } else {
        throw new Error(response.error || "Error al pausar el stream");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al pausar el stream";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeStream = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await eventsAPI.resumeStream(eventId);
      if (response.success) {
        onStatusChange("in-progress", "Stream reanudado - evento en vivo...");
      } else {
        throw new Error(response.error || "Error al reanudar el stream");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al reanudar el stream";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBetting = async (fightId: string) => {
    if (!fightId) return;

    setLoading(true);
    setError(null);

    try {
      // Update fight status to betting
      const response = await fightsAPI.updateStatus(fightId, "betting");
      if (response.success) {
        onStatusChange(
          "betting",
          `Ventana de apuestas abierta para el combate #${getActiveFight()?.number || "N/A"}`,
        );
      } else {
        throw new Error(response.error || "Error al abrir apuestas");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al abrir apuestas";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFight = async (fightId: string) => {
    if (!fightId) return;

    setLoading(true);
    setError(null);

    try {
      // Update fight status to live
      const response = await fightsAPI.updateStatus(fightId, "live");
      if (response.success) {
        onStatusChange(
          "live",
          `Combate #${getActiveFight()?.number || "N/A"} iniciado - apuestas cerradas`,
        );
      } else {
        throw new Error(response.error || "Error al iniciar combate");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar combate";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteEvent = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await eventsAPI.updateEventStatus(eventId, "completed");
      if (response.success) {
        onStatusChange("completed", "Evento completado exitosamente");
      } else {
        throw new Error(response.error || "Error al completar evento");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al completar evento";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatusConfig = (status: string) => {
    switch (status) {
      case "scheduled":
        return {
          color: "bg-blue-100 text-blue-800",
          label: "Programado",
          icon: <Users className="w-4 h-4" />,
        };
      case "betting":
        return {
          color: "bg-green-100 text-green-800",
          label: "Apuestas Abiertas",
          icon: <Trophy className="w-4 h-4" />,
        };
      case "live":
        return {
          color: "bg-red-100 text-red-800",
          label: "En Vivo",
          icon: <Eye className="w-4 h-4" />,
        };
      case "intermission":
        return {
          color: "bg-yellow-100 text-yellow-800",
          label: "Intermisión",
          icon: <Pause className="w-4 h-4" />,
        };
      case "completed":
        return {
          color: "bg-gray-100 text-gray-800",
          label: "Completado",
          icon: <Shield className="w-4 h-4" />,
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-800",
          label: "Cancelado",
          icon: <Square className="w-4 h-4" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          label: "Desconocido",
          icon: <Users className="w-4 h-4" />,
        };
    }
  };

  const getFightStatusConfig = (status: string) => {
    switch (status) {
      case "upcoming":
        return {
          color: "bg-blue-100 text-blue-800",
          label: "Próximo",
          icon: <Users className="w-4 h-4" />,
        };
      case "betting":
        return {
          color: "bg-green-100 text-green-800",
          label: "Apuestas Abiertas",
          icon: <Trophy className="w-4 h-4" />,
        };
      case "live":
        return {
          color: "bg-red-100 text-red-800",
          label: "En Vivo",
          icon: <Eye className="w-4 h-4" />,
        };
      case "completed":
        return {
          color: "bg-gray-100 text-gray-800",
          label: "Completado",
          icon: <Shield className="w-4 h-4" />,
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-800",
          label: "Cancelado",
          icon: <Square className="w-4 h-4" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          label: "Desconocido",
          icon: <Users className="w-4 h-4" />,
        };
    }
  };

  const statusConfig = getEventStatusConfig(currentStatus);
  const hasActiveFight =
    activeFight && ["upcoming", "betting", "live"].includes(activeFight.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-600" />
          Control de Evento
        </h3>

        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Pause/Resume stream controls (only when event is live) */}
        {currentStatus === "in-progress" && (
          <button
            onClick={handlePauseStream}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Pause className="w-4 h-4" />
            Pausa Intermisión
          </button>
        )}

        {currentStatus === "intermission" && (
          <button
            onClick={handleResumeStream}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Play className="w-4 h-4" />
            Reanudar Stream
          </button>
        )}

        {/* Start betting for next fight */}
        {hasActiveFight && activeFight.status === "upcoming" && (
          <button
            onClick={() => handleStartBetting(activeFight!.id)}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Abrir Apuestas
          </button>
        )}

        {/* Start fight (only when betting is open) */}
        {hasActiveFight && activeFight.status === "betting" && (
          <button
            onClick={() => handleStartFight(activeFight!.id)}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Iniciar Combate
          </button>
        )}

        {/* Complete event if needed */}
        {currentStatus === "in-progress" && (
          <button
            onClick={handleCompleteEvent}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors col-span-2"
          >
            <Shield className="w-4 h-4" />
            Completar Evento
          </button>
        )}
      </div>

      {/* Fight listing */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Próximos Combates
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {fights && fights.length > 0 ? (
            fights.map((fight) => {
              const fightStatus = getFightStatusConfig(fight.status);
              return (
                <div
                  key={fight.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    fight.id === activeFight?.id
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{fight.number}</span>
                    <span className="text-sm">
                      {fight.redCorner} vs {fight.blueCorner}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${fightStatus.color}`}
                  >
                    {fightStatus.icon}
                    {fightStatus.label}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">No hay combates programados</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventWorkflowControls;
