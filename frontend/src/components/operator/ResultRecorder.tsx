"use client";

import React from "react";

interface ResultRecorderProps {
  isActive: boolean;
  onRecordResult: (result: "red" | "draw" | "blue") => void;
}

const ResultRecorder: React.FC<ResultRecorderProps> = ({
  isActive,
  onRecordResult,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Registrar Resultado
      </h2>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onRecordResult("red")}
          disabled={!isActive}
          className={`py-4 px-2 rounded-lg font-bold text-white text-center
            ${
              isActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-300 cursor-not-allowed"
            }
            transition-colors`}
        >
          GANA ROJO
        </button>

        <button
          onClick={() => onRecordResult("draw")}
          disabled={!isActive}
          className={`py-4 px-2 rounded-lg font-bold text-white text-center
            ${
              isActive
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-gray-300 cursor-not-allowed"
            }
            transition-colors`}
        >
          EMPATE
        </button>

        <button
          onClick={() => onRecordResult("blue")}
          disabled={!isActive}
          className={`py-4 px-2 rounded-lg font-bold text-white text-center
            ${
              isActive
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-300 cursor-not-allowed"
            }
            transition-colors`}
        >
          GANA AZUL
        </button>
      </div>

      {!isActive && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Cierre las apuestas para registrar el resultado
        </p>
      )}
    </div>
  );
};

export default ResultRecorder;
