// CREAR ARCHIVO NUEVO
import React from "react";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

interface NotificationBadgeProps {
  count: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  size = "md",
  className = "",
}) => {
  const theme = getUserThemeClasses();

  if (count <= 0) return null;

  const sizeClasses = {
    sm: "text-xs min-w-4 h-4 px-1",
    md: "text-xs min-w-5 h-5 px-1.5",
    lg: "text-sm min-w-6 h-6 px-2",
  };

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={`${theme.secondaryButton} ${sizeClasses[size]} rounded-full flex items-center justify-center font-medium ${className}`}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;
