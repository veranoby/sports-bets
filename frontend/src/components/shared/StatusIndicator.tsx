import React from "react";

interface StatusIndicatorProps {
  status: "connected" | "disconnected" | "connecting";
  label?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = "md",
  showLabel = true,
}) => {
  const statusClasses = {
    connected: "text-[#10b981]", // Verde
    disconnected: "text-[#cd6263]", // Rojo
    connecting: "text-[#596c95]", // Azul
  };

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <div
        className={`animate-ping rounded-full ${statusClasses[status]} bg-opacity-50`}
      />
      {showLabel && label && (
        <span className={`ml-2 ${statusClasses[status]}`}>{label}</span>
      )}
    </div>
  );
};

export default StatusIndicator;
