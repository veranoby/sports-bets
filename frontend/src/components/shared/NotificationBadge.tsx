// CREAR ARCHIVO NUEVO
import React from "react";

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
  const sizeClasses = {
    sm: "w-4 h-4 text-[10px]",
    md: "w-5 h-5 text-xs",
    lg: "w-6 h-6 text-sm",
  };

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-theme-error text-theme-primary ${className}`}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;
