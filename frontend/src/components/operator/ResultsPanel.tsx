import React from "react";
import { ResultRecorder } from "./ResultRecorder";

const ResultsPanel: React.FC = () => {
  const handleRecordResult = async (result: "red" | "blue" | "draw") => {
    await fetch(`/api/fights/current/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Registro de Resultados
      </h3>
      <ResultRecorder fightId="current" />
    </div>
  );
};

export default ResultsPanel;
