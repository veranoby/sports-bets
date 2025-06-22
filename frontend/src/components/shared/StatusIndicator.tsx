// frontend/src/components/shared/StatusIndicator.tsx - FIXED V10
// =================================================================
// FIXED: Removed color prop requirement, auto-detect from status
// FIXED: Proper TypeScript types and default behavior

import React from "react";

interface StatusIndicatorProps {
  isConnected?: boolean;
  status?: "connected" | "disconnected" | "connecting";
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isConnected,
  status,
  label,
  size = "md",
  className = "",
}) => {
  // ✅ AUTO-DETERMINE STATUS from isConnected if status not provided
  const finalStatus = status || (isConnected ? "connected" : "disconnected");

  const statusConfig = {
    connected: {
      color: "bg-green-500",
      textColor: "text-green-400",
      pulse: false,
    },
    disconnected: {
      color: "bg-red-500",
      textColor: "text-red-400",
      pulse: true,
    },
    connecting: {
      color: "bg-yellow-500",
      textColor: "text-yellow-400",
      pulse: true,
    },
  };

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const config = statusConfig[finalStatus];

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
