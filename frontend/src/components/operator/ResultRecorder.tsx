"use client";

import React, { useState } from "react";
import { useFights } from "../../hooks/useApi";
import ErrorMessage from "../shared/ErrorMessage";

interface ResultRecorderProps {
  fightId: string;
}

export const ResultRecorder = ({ fightId }: ResultRecorderProps) => {
  const { recordResult } = useFights();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecordResult = async (
    result: "red" | "blue" | "draw" | "no_contest"
  ) => {
    setIsSubmitting(true);
    try {
      await recordResult(fightId, result);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Registrar Resultado
      </h2>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleRecordResult("red")}
          disabled={isSubmitting}
          className={`py-4 px-2 rounded-lg font-bold text-white text-center
            ${
              isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }
            transition-colors`}
        >
          GANA ROJO
        </button>

        <button
          onClick={() => handleRecordResult("draw")}
          disabled={isSubmitting}
          className={`py-4 px-2 rounded-lg font-bold text-white text-center
            ${
              isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-500 hover:bg-gray-600"
            }
            transition-colors`}
        >
          EMPATE
        </button>

        <button
          onClick={() => handleRecordResult("blue")}
          disabled={isSubmitting}
          className={`py-4 px-2 rounded-lg font-bold text-white text-center
            ${
              isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }
            transition-colors`}
        >
          GANA AZUL
        </button>
      </div>

      {error && <ErrorMessage error={error} className="mt-2" />}
      {!isSubmitting && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Cierre las apuestas para registrar el resultado
        </p>
      )}
    </div>
  );
};
