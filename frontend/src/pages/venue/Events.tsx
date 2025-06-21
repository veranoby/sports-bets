import React from "react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Card from "../../components/shared/Card";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

const VenueEvents: React.FC = () => {
  const theme = getUserThemeClasses();

  // Datos de ejemplo para eventos del local
  const events = [
    {
      id: "1",
      name: "Torneo de Gallos Clase A",
      date: "2023-11-15",
      time: "14:00",
      totalBets: 45,
      status: "scheduled",
    },
    {
      id: "2",
      name: "Campeonato Regional",
      date: "2023-11-20",
      time: "16:00",
      totalBets: 32,
      status: "in-progress",
    },
  ];

  return (
    <div className={`${theme.pageBackground} min-h-screen p-4`}>
      <h1 className="text-2xl font-bold mb-6">Eventos del Local</h1>

      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className={`${theme.cardBackground} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{event.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{event.totalBets} apuestas</span>
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#596c95] text-white rounded-lg hover:bg-[#4a5b80] transition-colors text-sm">
                Gestionar
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VenueEvents;
