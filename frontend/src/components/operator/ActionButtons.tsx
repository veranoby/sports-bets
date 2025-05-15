"use client";

import type React from "react";
import { Play, DollarSign, XCircle } from "lucide-react";

interface ActionButtonsProps {
  fightStatus: "upcoming" | "betting" | "live" | "completed";
  onStartTransmission: () => void;
  onOpenBetting: () => void;
  onCloseBetting: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  fightStatus,
  onStartTransmission,
  onOpenBetting,
  onCloseBetting,
}) => {
  // Determinar qué botones están habilitados según el estado
  const canStartTransmission = fightStatus === "upcoming";
  const canOpenBetting = fightStatus === "live";
  const canCloseBetting = fightStatus === "betting";

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones</h2>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={onStartTransmission}
          disabled={!canStartTransmission}
          className={`flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium text-base
            ${
              canStartTransmission
                ? "bg-red-500 hover:bg-red-600"
                : fightStatus === "live" || fightStatus === "betting"
                ? "bg-green-500 cursor-default"
                : "bg-gray-300 cursor-not-allowed"
            } transition-colors`}
        >
          <Play className="w-5 h-5 mr-2" />
          {fightStatus === "live" || fightStatus === "betting"
            ? "TRANSMISIÓN ACTIVA"
            : "INICIAR TRANSMISIÓN"}
        </button>

        <button
          onClick={onOpenBetting}
          disabled={!canOpenBetting}
          className={`flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium text-base
            ${
              canOpenBetting
                ? "bg-blue-500 hover:bg-blue-600"
                : fightStatus === "betting"
                ? "bg-green-500 cursor-default"
                : "bg-gray-300 cursor-not-allowed"
            } transition-colors`}
        >
          <DollarSign className="w-5 h-5 mr-2" />
          {fightStatus === "betting" ? "APUESTAS ABIERTAS" : "ABRIR APUESTAS"}
        </button>

        <button
          onClick={onCloseBetting}
          disabled={!canCloseBetting}
          className={`flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium text-base
            ${
              canCloseBetting
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-gray-300 cursor-not-allowed"
            } transition-colors`}
        >
          <XCircle className="w-5 h-5 mr-2" />
          CERRAR APUESTAS
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
