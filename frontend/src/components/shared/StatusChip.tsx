// frontend/src/components/shared/StatusChip.tsx - VERSIÓN UNIFICADA
// ================================================================
// 🎯 ABSORBE StatusIndicator - Preserva todas las funcionalidades

import React from "react";

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "live"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "settled"
  | "matched"
  | "connected"
  | "disconnected"
  | "banned"
  | "postponed"
  | "betting"
  | "closed"
  | "processing"
  | "confirmed"
  | "failed"
  | "unmatched"
  | "retrying"
  | "connecting"
  | "success"
  | "error"
  | "warning";

interface StatusChipProps {
  status: string;
  size?: "sm" | "md" | "lg";
  variant?: "chip" | "indicator" | "outline";
  className?: string;
  // StatusIndicator compatibility props
  isConnected?: boolean;
  label?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = "md",
  variant = "chip",
  className = "",
  isConnected,
  label,
}) => {
  // Auto-determine status from isConnected if provided (StatusIndicator compatibility)
  const finalStatus =
    isConnected !== undefined
      ? isConnected
        ? "connected"
        : "disconnected"
      : status;

  // Common status configurations
  const statusConfig = {
    // Estados positivos
    active: {
      chip: "bg-theme-success/20 text-theme-success",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-400",
        pulse: false,
      },
    },
    approved: {
      chip: "bg-theme-success/20 text-theme-success",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-400",
        pulse: false,
      },
    },
    completed: {
      chip: "bg-theme-success/20 text-theme-success",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-400",
        pulse: false,
      },
    },
    settled: {
      chip: "bg-theme-success/20 text-theme-success",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-400",
        pulse: false,
      },
    },
    connected: {
      chip: "bg-theme-success/20 text-theme-success",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-400",
        pulse: false,
      },
    },
    confirmed: {
      chip: "bg-theme-success/20 text-theme-success",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-400",
        pulse: false,
      },
    },
    success: {
      chip: "bg-theme-success/20 text-theme-success",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-400",
        pulse: false,
      },
    },

    // Estados en progreso
    live: {
      chip: "bg-theme-secondary/20 text-theme-secondary",
      indicator: {
        color: "bg-blue-500",
        textColor: "text-blue-400",
        pulse: true,
      },
    },
    pending: {
      chip: "bg-yellow-100 text-yellow-800",
      indicator: {
        color: "bg-yellow-500",
        textColor: "text-yellow-400",
        pulse: true,
      },
    },
    processing: {
      chip: "bg-blue-100 text-blue-800",
      indicator: {
        color: "bg-blue-500",
        textColor: "text-blue-400",
        pulse: true,
      },
    },
    connecting: {
      chip: "bg-yellow-100 text-yellow-800",
      indicator: {
        color: "bg-yellow-500",
        textColor: "text-yellow-400",
        pulse: true,
      },
    },

    // Estados negativos
    inactive: {
      chip: "bg-gray-100 text-gray-600",
      indicator: {
        color: "bg-gray-500",
        textColor: "text-gray-400",
        pulse: false,
      },
    },
    rejected: {
      chip: "bg-theme-danger/20 text-theme-danger",
      indicator: {
        color: "bg-red-500",
        textColor: "text-red-400",
        pulse: false,
      },
    },
    cancelled: {
      chip: "bg-theme-danger/20 text-theme-danger",
      indicator: {
        color: "bg-red-500",
        textColor: "text-red-400",
        pulse: false,
      },
    },
    disconnected: {
      chip: "bg-theme-danger/20 text-theme-danger",
      indicator: {
        color: "bg-red-500",
        textColor: "text-red-400",
        pulse: true,
      },
    },
    failed: {
      chip: "bg-theme-danger/20 text-theme-danger",
      indicator: {
        color: "bg-red-500",
        textColor: "text-red-400",
        pulse: false,
      },
    },
    error: {
      chip: "bg-red-100 text-red-800",
      indicator: {
        color: "bg-red-500",
        textColor: "text-red-400",
        pulse: false,
      },
    },

    // Estados neutros
    upcoming: {
      chip: "bg-gray-100 text-gray-600",
      indicator: {
        color: "bg-gray-400",
        textColor: "text-gray-400",
        pulse: false,
      },
    },
    matched: {
      chip: "bg-purple-100 text-purple-800",
      indicator: {
        color: "bg-purple-500",
        textColor: "text-purple-400",
        pulse: false,
      },
    },
  };

  const config =
    statusConfig[finalStatus as keyof typeof statusConfig] ||
    statusConfig.inactive;

  const getSizeClasses = () => {
    if (variant === "indicator") {
      return {
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
      }[size];
    }

    return {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1 text-sm",
      lg: "px-4 py-2 text-base",
    }[size];
  };

  // Render as indicator (circle with optional label)
  if (variant === "indicator") {
    const indicatorConfig = config.indicator;
    const sizeClasses = getSizeClasses();

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${sizeClasses} ${indicatorConfig.color} rounded-full ${
            indicatorConfig.pulse ? "animate-pulse" : ""
          }`}
        />
        {(label || finalStatus) && (
          <span className={`text-sm ${indicatorConfig.textColor}`}>
            {label || finalStatus}
          </span>
        )}
      </div>
    );
  }

  // Render as chip (default behavior)
  const chipClasses =
    variant === "outline"
      ? `border-2 border-current bg-transparent ${config.chip.replace(/bg-\S+/, "")}`
      : config.chip;

  return (
    <span
      className={`
        inline-flex items-center justify-center font-medium rounded-full
        ${getSizeClasses()}
        ${chipClasses}
        ${className}
      `.trim()}
    >
      {finalStatus}
    </span>
  );
};

export default StatusChip;
