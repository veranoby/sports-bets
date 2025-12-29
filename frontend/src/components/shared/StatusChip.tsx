// frontend/src/components/shared/StatusChip.tsx - VERSIÓN UNIFICADA
// ================================================================
// 🎯 ABSORBE StatusIndicator - Preserva todas las funcionalidades

import React from "react";

export type StatusType =
  | "draft"
  | "scheduled"
  | "ready"
  | "betting_open"
  | "in_progress"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "settled"
  | "matched"
  | "connected"
  | "disconnected"
  | "banned"
  | "postponed"
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

  // Common status configurations using Tailwind classes
  const statusConfig = {
    // Nuevos estados
    draft: {
      chip: "bg-gray-200 text-gray-800",
      indicator: {
        color: "bg-gray-400",
        textColor: "text-gray-500",
        pulse: false,
      },
    },
    scheduled: {
      chip: "bg-blue-100 text-blue-800",
      indicator: {
        color: "bg-blue-500",
        textColor: "text-blue-600",
        pulse: false,
      },
    },
    ready: {
      chip: "bg-yellow-100 text-yellow-800",
      indicator: {
        color: "bg-yellow-500",
        textColor: "text-yellow-600",
        pulse: true,
      },
    },
    betting_open: {
      chip: "bg-green-100 text-green-800",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-600",
        pulse: true,
      },
    },
    in_progress: {
      chip: "bg-red-100 text-red-800",
      indicator: {
        color: "bg-red-500",
        textColor: "text-red-600",
        pulse: true,
      },
    },
    completed: {
      chip: "bg-purple-100 text-purple-800",
      indicator: {
        color: "bg-purple-500",
        textColor: "text-purple-600",
        pulse: false,
      },
    },
    cancelled: {
      chip: "bg-gray-200 text-gray-800",
      indicator: {
        color: "bg-gray-400",
        textColor: "text-gray-500",
        pulse: false,
      },
    },

    // Estados positivos
    approved: {
      chip: "bg-green-500/20 text-green-500",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-600",
        pulse: false,
      },
    },
    settled: {
      chip: "bg-green-500/20 text-green-500",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-600",
        pulse: false,
      },
    },
    connected: {
      chip: "bg-green-500/20 text-green-500",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-600",
        pulse: false,
      },
    },
    confirmed: {
      chip: "bg-green-500/20 text-green-500",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-600",
        pulse: false,
      },
    },
    success: {
      chip: "bg-green-500/20 text-green-500",
      indicator: {
        color: "bg-green-500",
        textColor: "text-green-600",
        pulse: false,
      },
    },

    // Estados en progreso
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
        textColor: "text-blue-600",
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
      chip: "bg-red-500/20 text-red-500",
      indicator: {
        color: "bg-red-500",
        textColor: "text-red-400",
        pulse: false,
      },
    },
    disconnected: {
      chip: "bg-red-500/20 text-red-500",
      indicator: {
        color: "bg-red-500",
        textColor: "text-red-400",
        pulse: true,
      },
    },
    failed: {
      chip: "bg-red-500/20 text-red-500",
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
