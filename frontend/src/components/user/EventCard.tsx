"use client";

import React from "react";
import { Clock, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusChip from "../shared/StatusChip";

/**
 * EventCard component for displaying event information
 * Shows different styling for live vs upcoming events
 */
interface EventCardProps {
  id: string;
  venueName: string;
  isLive: boolean;
  dateTime: string;
  activeBettors: number;
  imageUrl?: string;
  onSelect: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  venueName,
  isLive,
  dateTime,
  activeBettors,
  imageUrl,
  onSelect,
}) => {
  const navigate = useNavigate();

  // Format date for display
  const formattedDate = new Date(dateTime).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const formattedTime = new Date(dateTime).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Handle image loading errors
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = "/placeholder.svg";
  };

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md cursor-pointer"
      onClick={() => onSelect(id)}
    >
      <div className="relative">
        <div className="aspect-[16/9] overflow-hidden bg-gray-50">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={`Evento en ${venueName}`}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        </div>

        {isLive && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-md">
            <span className="animate-pulse mr-1.5 h-2 w-2 rounded-full bg-white"></span>
            <StatusChip status="live" size="sm" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 text-lg">{venueName}</h3>
          {!isLive && (
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              Próximo
            </span>
          )}
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-3">
          <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span>
            {isLive ? "En curso" : `${formattedDate} - ${formattedTime}`}
          </span>
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-4">
          <Users className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span>{activeBettors} apostadores activos</span>
        </div>

        <button
          onClick={() => navigate(`/live-event/${id}`)}
          className={`w-full flex items-center justify-center font-medium py-2.5 px-4 rounded-lg transition-colors ${
            isLive
              ? "bg-red-500 hover:bg-red-600 text-white !border-0"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700 !border-0"
          }`}
          aria-label={
            isLive ? "Entrar al evento en vivo" : "Ver detalles del evento"
          }
          type="button"
          style={{
            backgroundColor: isLive ? "rgb(239 68 68)" : "rgb(243 244 246)",
            color: isLive ? "white" : "rgb(55 65 81)",
          }}
        >
          {isLive ? "Entrar ahora" : "Ver detalles"}
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </button>
      </div>
    </div>
  );
};

export default EventCard;
