import { Event } from "../../../types";
import { StatusChip } from "../../shared/StatusChip"; // Componente reutilizable

interface EventListProps {
  events: Event[];
  onSelect: (eventId: string) => void;
}

export const EventList = ({ events, onSelect }: EventListProps) => (
  <div className="bg-[#1a1f37] rounded-lg shadow-md p-4">
    <h3 className="text-white font-bold mb-4">Eventos Activos</h3>
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="p-3 bg-[#2a325c] rounded-lg hover:bg-[#596c95] transition-colors cursor-pointer"
          onClick={() => onSelect(event.id)}
        >
          <div className="flex justify-between items-center">
            <h4 className="text-white font-medium">{event.name}</h4>
            <StatusChip status={event.status} />
          </div>
          <p className="text-gray-300 text-sm mt-1">
            {new Date(event.date).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  </div>
);
