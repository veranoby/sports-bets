import React from "react";
import { Users, Calendar, MapPin, ChevronRight } from "lucide-react";

interface UserEntityCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string;
  articlesCount?: number;
  establishedDate?: string;
  onClick: () => void;
  type: "gallera" | "venue";
}

const UserEntityCard: React.FC<UserEntityCardProps> = ({
  name,
  description,
  location,
  imageUrl,
  articlesCount,
  establishedDate,
  onClick,
  type,
}) => {
  return (
    <div
      className="card-background p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer hover:bg-[#2a325c]/30"
      onClick={onClick}
    >
      {/* Header with image and basic info */}
      <div className="flex items-center mb-4">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-red-500"
          />
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-theme-primary">{name}</h2>
          <div className="flex items-center gap-1 text-sm text-theme-light">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-theme-light" />
      </div>

      {/* Description */}
      <p className="text-theme-secondary mb-4 text-sm line-clamp-2">
        {description}
      </p>

      {/* Footer with metadata */}
      <div className="flex justify-between text-sm text-theme-light">
        {articlesCount !== undefined && (
          <div className="flex items-center">
            <Users size={16} className="mr-2" />
            {articlesCount} artículos
          </div>
        )}
        {establishedDate && (
          <div className="flex items-center">
            <Calendar size={16} className="mr-2" />
            {type === "gallera" ? "Fundada" : "Establecido"} en{" "}
            {new Date(establishedDate).getFullYear()}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserEntityCard;
