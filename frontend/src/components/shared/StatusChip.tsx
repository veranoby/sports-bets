import React from "react";

interface StatusChipProps {
  status: "active" | "pending" | "completed" | "cancelled" | "live";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = "md",
  variant = "default",
}) => {
  const statusConfig = {
    active: { bg: "#596c95", text: "white" },
    pending: { bg: "#f59e0b", text: "white" },
    completed: { bg: "#10b981", text: "white" },
    cancelled: { bg: "#ef4444", text: "white" },
    live: { bg: "#cd6263", text: "white" },
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <span
      className={`rounded-full font-medium ${sizeClasses[size]} ${
        variant === "outline" ? "border" : ""
      }`}
      style={{
        backgroundColor:
          variant === "default" ? statusConfig[status].bg : "transparent",
        color:
          variant === "default"
            ? statusConfig[status].text
            : statusConfig[status].bg,
        borderColor: statusConfig[status].bg,
      }}
    >
      {status}
    </span>
  );
};

export default StatusChip;
