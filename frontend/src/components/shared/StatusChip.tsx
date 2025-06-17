import React from "react";

type StatusType =
  | "active"
  | "inactive" // Usuarios
  | "pending"
  | "approved"
  | "rejected" // Venues
  | "live"
  | "upcoming"
  | "completed"
  | "cancelled" // Eventos/Peleas
  | "settled"
  | "matched" // Apuestas
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
  | "info"
  | "warning"
  | "error"
  | "success"
  | "none" // 🔧 Nuevo tipo para verificación
  | "basic" // 🔧 Nuevo tipo para verificación
  | "full"; // 🔧 Nuevo tipo para verificación

interface StatusChipProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  className?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = "md",
  variant = "default",
  className = "",
}) => {
  const statusConfig = {
    // Estados positivos - Verde
    active: { bg: "#10b981", text: "white" },
    approved: { bg: "#10b981", text: "white" },
    completed: { bg: "#10b981", text: "white" },
    settled: { bg: "#10b981", text: "white" },
    connected: { bg: "#10b981", text: "white" },

    // Estados en progreso - Azul oficial
    live: { bg: "#cd6263", text: "white" },
    pending: { bg: "#596c95", text: "white" },
    matched: { bg: "#596c95", text: "white" },

    // Estados neutrales - Gris
    upcoming: { bg: "#6b7280", text: "white" },
    inactive: { bg: "#6b7280", text: "white" },

    // Estados negativos - Rojo
    cancelled: { bg: "#ef4444", text: "white" },
    rejected: { bg: "#ef4444", text: "white" },
    disconnected: { bg: "#ef4444", text: "white" },

    banned: { bg: "#ef4444", text: "white" },
    postponed: { bg: "#6b7280", text: "white" },
    betting: { bg: "#596c95", text: "white" },
    closed: { bg: "#6b7280", text: "white" },
    processing: { bg: "#596c95", text: "white" },
    confirmed: { bg: "#10b981", text: "white" },
    failed: { bg: "#ef4444", text: "white" },
    unmatched: { bg: "#6b7280", text: "white" },
    retrying: { bg: "#596c95", text: "white" },
    info: { bg: "#3b82f6", text: "white" }, // Azul
    warning: { bg: "#f59e0b", text: "white" }, // Amarillo
    error: { bg: "#ef4444", text: "white" }, // Rojo
    success: { bg: "#10b981", text: "white" }, // Verde
    none: { bg: "#6b7280", text: "white" }, // Gris - Sin verificar
    basic: { bg: "#f59e0b", text: "white" }, // Amarillo - Básico
    full: { bg: "#10b981", text: "white" }, // Verde - Verificado
    // 🔧 Fallback para valores no definidos
    unknown: { bg: "#6b7280", text: "white" },
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const statusLabels = {
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
    live: "En vivo",
    upcoming: "Próximo",
    completed: "Completado",
    cancelled: "Cancelado",
    settled: "Liquidado",
    matched: "Emparejado",
    connected: "Conectado",
    disconnected: "Desconectado",
    banned: "Bloqueado",
    postponed: "Postpuesto",
    betting: "Apuestas",
    closed: "Cerrado",
    processing: "Procesando",
    confirmed: "Confirmado",
    failed: "Fallido",
    unmatched: "No emparejado",
    retrying: "Reintentando",
    info: "Info",
    warning: "Advertencia",
    error: "Error",
    success: "Éxito",
    none: "Sin verificar",
    basic: "Básico",
    full: "Verificado",
    unknown: "Desconocido",
  };

  return (
    <span
      className={`rounded-full font-medium ${sizeClasses[size]} ${
        variant === "outline" ? "border" : ""
      } ${className}`}
      style={{
        backgroundColor:
          variant === "default"
            ? statusConfig[status]?.bg || statusConfig.unknown.bg
            : "transparent",
        color:
          variant === "default"
            ? statusConfig[status]?.text || statusConfig.unknown.text
            : statusConfig[status]?.bg || statusConfig.unknown.bg,
        borderColor: statusConfig[status]?.bg || statusConfig.unknown.bg,
      }}
    >
      {statusLabels[status] || statusLabels.unknown}
    </span>
  );
};

export default StatusChip;
