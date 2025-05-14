"use client";

import type React from "react";
import { Clock, Users, ArrowRight } from "lucide-react";

// Define component props interface with complete typing
interface EventCardProps {
  id: string;
  venueName: string;
  isLive: boolean;
  dateTime: string;
  activeBettors: number;
  imageUrl: string;
  onEnter: (id: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  venueName,
  isLive,
  dateTime,
  activeBettors,
  imageUrl,
  onEnter,
}) => {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 mb-4">
      {/* Event image with overlay gradient */}
      <div className="relative h-36 sm:h-32 overflow-hidden">
        {/* Use a fallback image if the provided URL is empty */}
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={`Evento en ${venueName}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

        {/* Live indicator badge */}
        {isLive && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
            <span className="animate-pulse mr-1 h-2 w-2 rounded-full bg-white"></span>
            EN VIVO
          </div>
        )}

        {/* Venue name overlay */}
        <div className="absolute bottom-3 left-3 text-white">
          <h3 className="font-bold text-lg line-clamp-1">{venueName}</h3>
        </div>
      </div>

      {/* Event details and action button */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          {/* Time information */}
          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
            <Clock size={16} className="mr-1 flex-shrink-0" />
            <span className="truncate">
              {isLive ? "En progreso" : dateTime}
            </span>
          </div>

          {/* Active bettors count */}
          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
            <Users size={16} className="mr-1 flex-shrink-0" />
            <span>{activeBettors} apostadores</span>
          </div>
        </div>

        {/* Action button - different text based on live status */}
        <button
          onClick={() => onEnter(id)}
          className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-700"
        >
          {isLive ? "Entrar ahora" : "Ver detalles"}
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default EventCard;
