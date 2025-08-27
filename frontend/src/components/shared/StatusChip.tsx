// REEMPLAZAR TODO EL CONTENIDO
import React from "react";

interface StatusChipProps {
  status: string;
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
    // Estados positivos
    active: "bg-theme-success/20 text-theme-success",
    approved: "bg-theme-success/20 text-theme-success",
    completed: "bg-theme-success/20 text-theme-success",
    settled: "bg-theme-success/20 text-theme-success",
    connected: "bg-theme-success/20 text-theme-success",
    confirmed: "bg-theme-success/20 text-theme-success",
    success: "bg-theme-success/20 text-theme-success",
    full: "bg-theme-success/20 text-theme-success",

    // Estados en progreso
    live: "bg-theme-secondary/20 text-theme-secondary",
    pending: "bg-theme-primary/20 text-theme-primary",
    matched: "bg-theme-primary/20 text-theme-primary",
    betting: "bg-theme-primary/20 text-theme-primary",
    processing: "bg-theme-primary/20 text-theme-primary",
    retrying: "bg-theme-primary/20 text-theme-primary",

    // Estados warning
    upcoming: "bg-theme-warning/20 text-theme-warning",
    basic: "bg-theme-warning/20 text-theme-warning",
    warning: "bg-theme-warning/20 text-theme-warning",

    // Estados negativos
    cancelled: "bg-theme-error/20 text-theme-error",
    rejected: "bg-theme-error/20 text-theme-error",
    disconnected: "bg-theme-error/20 text-theme-error",
    banned: "bg-theme-error/20 text-theme-error",
    failed: "bg-theme-error/20 text-theme-error",
    error: "bg-theme-error/20 text-theme-error",

    // Estados neutros
    inactive: "bg-gray-500/20 text-gray-400",
    postponed: "bg-gray-500/20 text-gray-400",
    closed: "bg-gray-500/20 text-gray-400",
    unmatched: "bg-gray-500/20 text-gray-400",
    none: "bg-gray-500/20 text-gray-400",
    unknown: "bg-gray-500/20 text-gray-400",

    // Información
    info: "bg-theme-info/20 text-theme-info",
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

  const statusClass =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;
  const label =
    statusLabels[status as keyof typeof statusLabels] || statusLabels.unknown;

  return (
    <span
      className={`rounded-full font-medium ${
        sizeClasses[size]
      } ${statusClass} ${variant === "outline" ? "border" : ""} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusChip;
