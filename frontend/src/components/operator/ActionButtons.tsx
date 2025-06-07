"use client";

import React from "react";
import { Play, DollarSign, XCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { useEventActions } from "../../hooks/useApi";
import { Button } from "../shared/ActionButton";

interface ActionButtonsProps {
  selectedEventId: string | null;
  fightStatus: "upcoming" | "betting" | "live" | "completed";
  onStartTransmission: () => void;
  onOpenBetting: () => void;
  onCloseBetting: () => void;
  onStreamStart: () => void;
  onStreamStop: () => void;
  onEventCreated: () => void;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  selectedEventId,
  fightStatus,
  onStartTransmission,
  onOpenBetting,
  onCloseBetting,
  onStreamStart,
  onStreamStop,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
}) => {
  const { handleCreate, handleUpdate, handleDelete } = useEventActions();

  // Determinar qué botones están habilitados según el estado
  const canStartTransmission = fightStatus === "upcoming";
  const canOpenBetting = fightStatus === "live";
  const canCloseBetting = fightStatus === "betting";

  const handleCreateEvent = async () => {
    const newEvent = await handleCreate({
      name: "Nuevo Evento",
      status: "pending",
    });
    if (newEvent) onEventCreated();
  };

  const handleUpdateEvent = async () => {
    if (!selectedEventId) return;
    const updatedEvent = await handleUpdate(selectedEventId, {
      name: "Evento Actualizado",
    });
    if (updatedEvent) onEventUpdated();
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventId) return;
    await handleDelete(selectedEventId);
    onEventDeleted();
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-[#596c95] rounded-lg">
      {/* Sección CRUD */}
      <div className="flex gap-2">
        <Button
          onClick={handleCreateEvent}
          className="bg-[#596c95] text-white hover:bg-[#596c95]/90"
        >
          <Plus className="h-4 w-4 mr-2" /> Crear
        </Button>
        <Button
          onClick={handleUpdateEvent}
          disabled={!selectedEventId || fightStatus === "live"}
          className="bg-[#596c95] text-white hover:bg-[#596c95]/90 disabled:opacity-50"
        >
          <Pencil className="h-4 w-4 mr-2" /> Editar
        </Button>
        <Button
          onClick={handleDeleteEvent}
          disabled={!selectedEventId || fightStatus === "live"}
          className="bg-[#cd6263] text-white hover:bg-[#cd6263]/90 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Eliminar
        </Button>
      </div>

      {/* Sección Streaming */}
      <div className="flex gap-2">
        <Button
          onClick={onStreamStart}
          disabled={fightStatus === "live"}
          className="bg-[#596c95] text-white hover:bg-[#596c95]/90 disabled:opacity-50"
        >
          Iniciar Streaming
        </Button>
        <Button
          onClick={onStreamStop}
          disabled={fightStatus !== "live"}
          className="bg-[#cd6263] text-white hover:bg-[#cd6263]/90 disabled:opacity-50"
        >
          Detener Streaming
        </Button>
      </div>
    </div>
  );
};

export default ActionButtons;
