"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { Edit2 } from "lucide-react";
import type { Fight } from "../../types";
import StatusChip from "../shared/StatusChip";

interface FightsListProps {
  fights: Fight[];
  type: "upcoming" | "completed";
  onSelectFight?: (fightId: string) => void;
  onEditFight?: (fightId: string) => void;
}

const FightsList: React.FC<FightsListProps> = ({
  fights,
  type,
  onSelectFight,
  onEditFight,
}) => {
  // Filtrar peleas según el tipo
  const filteredFights = fights.filter((fight) => {
    if (type === "upcoming") {
      return (
        fight.status === "upcoming" ||
        fight.status === "live" ||
        fight.status === "betting"
      );
    } else {
      return fight.status === "completed";
    }
  });

  // Renderizar el resultado con el color correspondiente
  const renderResult = (result?: "red" | "blue" | "draw") => {
    if (!result) return null;

    const getResultConfig = () => {
      switch (result) {
        case "red":
          return { bg: "bg-red-100", text: "text-red-700", label: "Ganó Rojo" };
        case "blue":
          return {
            bg: "bg-blue-100",
            text: "text-blue-700",
            label: "Ganó Azul",
          };
        case "draw":
          return { bg: "bg-gray-100", text: "text-gray-700", label: "Empate" };
        default:
          return {
            bg: "bg-gray-100",
            text: "text-gray-700",
            label: "Pendiente",
          };
      }
    };

    const config = getResultConfig();

    return (
      <div
        className={`flex items-center ${config.bg} ${config.text} px-2 py-1 rounded-md text-xs font-medium`}
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        {config.label}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-900">
          {type === "upcoming" ? "Próximas Peleas" : "Peleas Completadas"}
        </h2>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {filteredFights.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay peleas {type === "upcoming" ? "próximas" : "completadas"}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredFights.map((fight) => (
              <li
                key={fight.id}
                className={`p-3 hover:bg-gray-50 transition-colors ${
                  fight.status === "live" || fight.status === "betting"
                    ? "bg-blue-50"
                    : ""
                }`}
                onClick={() => onSelectFight && onSelectFight(fight.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full mr-3 font-bold text-gray-700">
                      {fight.number}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {fight.redBreeder}
                        </span>
                        <span className="mx-2 text-gray-400">vs</span>
                        <span className="font-medium text-gray-900">
                          {fight.blueBreeder}
                        </span>
                      </div>

                      <StatusChip
                        status={
                          fight.status === "live"
                            ? "live"
                            : fight.status === "completed"
                            ? "completed"
                            : "upcoming"
                        }
                        size="sm"
                      />

                      {fight.status === "betting" && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Apuestas abiertas
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {type === "completed" ? (
                      renderResult(fight.result)
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditFight) onEditFight(fight.id);
                        }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          type === "upcoming"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        <Edit2 className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FightsList;
