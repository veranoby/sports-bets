import React from "react";
import type { FC } from "react";

export type ResultType = "red" | "blue" | "draw" | "cancelled";

interface ResultRecorderProps {
  isActive: boolean;
  onRecordResult: (result: ResultType) => void;
}

const ResultRecorder: FC<ResultRecorderProps> = ({
  isActive,
  onRecordResult,
}) => {
  const buttonClasses =
    "flex-1 p-4 text-lg font-bold text-white rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        REGISTRAR RESULTADO
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Botón GANA ROJO */}
        <button
          onClick={() => onRecordResult("red")}
          disabled={!isActive}
          className={`${buttonClasses} bg-red-500 hover:bg-red-600 active:bg-red-700`}
        >
          GANA ROJO
        </button>

        {/* Botón EMPATE */}
        <button
          onClick={() => onRecordResult("draw")}
          disabled={!isActive}
          className={`${buttonClasses} bg-gray-500 hover:bg-gray-600 active:bg-gray-700`}
        >
          EMPATE
        </button>

        {/* Botón GANA AZUL */}
        <button
          onClick={() => onRecordResult("blue")}
          disabled={!isActive}
          className={`${buttonClasses} bg-blue-500 hover:bg-blue-600 active:bg-blue-700`}
        >
          GANA AZUL
        </button>
      </div>
    </div>
  );
};

export default ResultRecorder;
