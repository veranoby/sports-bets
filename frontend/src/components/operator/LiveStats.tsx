import React from "react";
import { Activity, Users, TrendingUp } from "lucide-react";
import { useEvents } from "../../hooks/useApi";

const LiveStats: React.FC = () => {
  const { events } = useEvents();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Estadísticas en Vivo
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <Activity
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: "#596c95" }}
          />
          <p className="text-2xl font-bold" style={{ color: "#596c95" }}>
            {events.length}
          </p>
          <p className="text-sm text-gray-600">Eventos Activos</p>
        </div>
        <div className="text-center">
          <Users
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: "#cd6263" }}
          />
          <p className="text-2xl font-bold" style={{ color: "#cd6263" }}>
            0
          </p>
          <p className="text-sm text-gray-600">Usuarios Conectados</p>
        </div>
        <div className="text-center">
          <TrendingUp
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: "#596c95" }}
          />
          <p className="text-2xl font-bold" style={{ color: "#596c95" }}>
            0
          </p>
          <p className="text-sm text-gray-600">Apuestas Totales</p>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;
