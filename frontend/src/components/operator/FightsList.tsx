import React from "react";
import type { FC } from "react";

interface Fight {
  id: string;
  eventId: string;
  number: number;
  redCorner: string;
  blueCorner: string;
  weight: number;
  notes: string;
  status: "upcoming" | "betting" | "live" | "completed";
  result?: "red" | "blue" | "draw" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

interface FightsListProps {
  fights: Fight[];
  type: "upcoming" | "completed";
  onEdit?: (fightId: string) => void;
}

const FightsList: FC<FightsListProps> = ({ fights, type, onEdit }) => {
  const getResultColor = (result?: string) => {
    switch (result) {
      case "red":
        return "bg-red-100 text-red-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      case "draw":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-50 text-gray-500";
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <div className="max-h-96 overflow-y-auto">
        {fights.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay peleas {type === "upcoming" ? "próximas" : "completadas"}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {fights.map((fight) => (
              <li key={fight.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      Pelea #{fight.number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {fight.redCorner} vs {fight.blueCorner}
                    </div>
                    {type === "completed" && fight.result && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getResultColor(fight.result)}`}
                      >
                        {fight.result === "red" && "Ganó Rojo"}
                        {fight.result === "blue" && "Ganó Azul"}
                        {fight.result === "draw" && "Empate"}
                        {fight.result === "cancelled" && "Cancelada"}
                      </span>
                    )}
                  </div>

                  {type === "upcoming" && onEdit && (
                    <button
                      onClick={() => onEdit(fight.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Editar
                    </button>
                  )}
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
