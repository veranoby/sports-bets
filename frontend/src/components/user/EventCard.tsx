"use client";

import React from "react";
import { Clock, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusChip from "../shared/StatusChip";
import clsx from "clsx";

/**
 * EventCard component for displaying event information
 * Shows different styling for live vs upcoming events
 */
interface EventCardProps {
  id: string;
  venueName: string;
  isLive?: boolean; // Made optional for backward compatibility
  dateTime: string;
  activeBettors: number;
  imageUrl?: string;
  onSelect: (eventId: string) => void;
  variant?: "default" | "live" | "upcoming" | "archived" | "compact";
  showLiveBadge?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  venueName,
  isLive: propsIsLive,
  dateTime,
  activeBettors,
  imageUrl,
  onSelect,
  variant = "default",
  showLiveBadge = true,
}) => {
  const navigate = useNavigate();

  // Determine isLive based on props and variant for backward compatibility
  const isLive = propsIsLive ?? variant === "live";

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
      className={clsx(
        "bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md cursor-pointer",
        {
          "border-red-100": isLive,
          "border-gray-100": !isLive,
          "h-full": variant === "compact",
        }
      )}
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

        {isLive && showLiveBadge && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-md">
            <span className="animate-pulse mr-1.5 h-2 w-2 rounded-full bg-white"></span>
            <StatusChip status="live" size="sm" />
          </div>
        )}
      </div>

      <div className={clsx("p-4", { "p-3": variant === "compact" })}>
        <div className="flex justify-between items-start mb-2">
          <h3
            className={clsx("font-bold text-gray-900", {
              "text-lg": variant !== "compact",
              "text-base": variant === "compact",
            })}
          >
            {venueName}
          </h3>
          {!isLive && variant !== "compact" && (
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

        {variant !== "compact" && (
          <div className="flex items-center text-gray-500 text-sm mb-4">
            <Users className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span>{activeBettors} apostadores activos</span>
          </div>
        )}

        <button
          onClick={() => navigate(`/live-event/${id}`)}
          className={clsx(
            "w-full flex items-center justify-center font-medium py-2.5 px-4 rounded-lg transition-colors",
            {
              "bg-red-500 hover:bg-red-600 text-white": isLive,
              "bg-gray-100 hover:bg-gray-200 text-gray-700": !isLive,
              "py-2 px-3 text-sm": variant === "compact",
            }
          )}
          aria-label={
            isLive ? "Entrar al evento en vivo" : "Ver detalles del evento"
          }
          type="button"
        >
          {isLive ? "Entrar ahora" : "Ver detalles"}
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </button>
      </div>
    </div>
  );
};

export default EventCard;
