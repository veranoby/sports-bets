"use client";

import React from "react";
import { Play, DollarSign, XCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { ActionButton } from "../shared/ActionButton";

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

export const ActionButtons = ({
  selectedEventId,
  fightStatus,
  onStreamStart,
  onStreamStop,
}: ActionButtonsProps) => {
  // Local functions
  const handleCreate = () => console.log("create event");
  const handleUpdate = () => console.log("update event");
  const handleDelete = () => console.log("delete event");

  // Determinar qué botones están habilitados según el estado
  const canStartTransmission = fightStatus === "upcoming";
  const canOpenBetting = fightStatus === "live";
  const canCloseBetting = fightStatus === "betting";

  return (
    <div className="flex flex-col gap-4 p-4 border border-[#596c95] rounded-lg">
      {/* CRUD Section */}
      <div className="flex gap-2">
        <ActionButton
          onClick={handleCreate}
          className="bg-[#596c95] text-white hover:bg-[#596c95]/90"
        >
          Create
        </ActionButton>
        <ActionButton
          onClick={handleUpdate}
          disabled={!selectedEventId || fightStatus === "live"}
          className="bg-[#596c95] text-white hover:bg-[#596c95]/90 disabled:opacity-50"
        >
          Update
        </ActionButton>
        <ActionButton
          onClick={handleDelete}
          disabled={!selectedEventId || fightStatus === "live"}
          className="bg-[#cd6263] text-white hover:bg-[#cd6263]/90 disabled:opacity-50"
        >
          Delete
        </ActionButton>
      </div>

      {/* Streaming Section */}
      <div className="flex gap-2">
        <ActionButton
          onClick={onStreamStart}
          disabled={fightStatus === "live"}
          className="bg-[#596c95] text-white hover:bg-[#596c95]/90 disabled:opacity-50"
        >
          Start Streaming
        </ActionButton>
        <ActionButton
          onClick={onStreamStop}
          disabled={fightStatus !== "live"}
          className="bg-[#cd6263] text-white hover:bg-[#cd6263]/90 disabled:opacity-50"
        >
          Stop Streaming
        </ActionButton>
      </div>
    </div>
  );
};

export default ActionButtons;
