// CREAR O REEMPLAZAR CONTENIDO
import React from "react";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

interface StatusIndicatorProps {
  status: "connected" | "disconnected" | "connecting";
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = "md",
  className = "",
}) => {
  const theme = getUserThemeClasses();

  const statusConfig = {
    connected: {
      color: "bg-theme-success",
      textColor: theme.successText,
      pulse: false,
    },
    disconnected: {
      color: "bg-theme-error",
      textColor: theme.errorText,
      pulse: true,
    },
    connecting: {
      color: "bg-theme-warning",
      textColor: theme.warningText,
      pulse: true,
    },
  };

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} ${config.color} rounded-full ${
          config.pulse ? "animate-pulse" : ""
        }`}
      />
      {label && <span className={`text-sm ${config.textColor}`}>{label}</span>}
    </div>
  );
};

export default StatusIndicator;
