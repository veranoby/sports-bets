import React from "react";
import type { FC } from "react";

type FightStatus = "upcoming" | "betting" | "live" | "completed";

interface ActionButtonsProps {
  fightStatus: FightStatus;
  onStartTransmission: () => void;
  onOpenBetting: () => void;
  onCloseBetting: () => void;
}

const ActionButtons: FC<ActionButtonsProps> = ({
  fightStatus,
  onStartTransmission,
  onOpenBetting,
  onCloseBetting,
}) => {
  const getButtonClasses = (isActive: boolean, isEnabled: boolean) => {
    const baseClasses =
      "py-4 px-6 rounded-lg text-lg font-bold transition-all shadow-md";
    const enabledClasses = isActive
      ? "bg-green-600 hover:bg-green-700 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800";
    const disabledClasses = "bg-gray-100 text-gray-400 cursor-not-allowed";

    return `${baseClasses} ${isEnabled ? enabledClasses : disabledClasses}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Botón INICIAR TRANSMISIÓN */}
      <button
        onClick={onStartTransmission}
        disabled={fightStatus !== "upcoming"}
        className={getButtonClasses(
          fightStatus === "live",
          fightStatus === "upcoming"
        )}
      >
        INICIAR TRANSMISIÓN
      </button>

      {/* Botón ABRIR APUESTAS */}
      <button
        onClick={onOpenBetting}
        disabled={fightStatus !== "upcoming"}
        className={getButtonClasses(
          fightStatus === "betting",
          fightStatus === "upcoming"
        )}
      >
        ABRIR APUESTAS
      </button>

      {/* Botón CERRAR APUESTAS */}
      <button
        onClick={onCloseBetting}
        disabled={fightStatus !== "betting"}
        className={getButtonClasses(
          false, // Nunca activo, solo habilitado
          fightStatus === "betting"
        )}
      >
        CERRAR APUESTAS
      </button>
    </div>
  );
};

export default ActionButtons;
