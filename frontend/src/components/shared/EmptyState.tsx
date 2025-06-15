// frontend/src/components/shared/EmptyState.tsx
// 🚨 ARREGLO CRÍTICO: React child object error

import React from "react";
import { Calendar } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "light" | "dark"; // 🔧 NUEVO: Consistencia visual
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
  variant = "light",
}) => {
  // 🔧 ARREGLO: Renderizar icono de manera consistente
  const renderIcon = () => {
    if (icon) {
      // Si es un elemento React, clonarlo sin clases conflictivas
      if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement, {
          className: "w-12 h-12", // 🔧 FIJO: tamaño consistente
        });
      }
      return icon;
    }
    // Icono por defecto
    return <Calendar className="w-12 h-12" />;
  };

  // 🎨 NUEVO: Tema consistente según variante
  const themeClasses =
    variant === "dark"
      ? "text-gray-300 bg-[#1a1f37]"
      : "text-gray-900 bg-white";

  const iconColor = variant === "dark" ? "text-gray-400" : "text-gray-400";
  const descColor = variant === "dark" ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`text-center p-8 ${className}`}>
      {/* 🔧 ARREGLO: Contenedor de icono sin clases conflictivas */}
      <div className={`mx-auto mb-4 ${iconColor}`}>{renderIcon()}</div>

      <h3 className={`text-lg font-medium mb-2 ${themeClasses.split(" ")[0]}`}>
        {title}
      </h3>

      {description && (
        <p className={`text-sm ${descColor} mb-4 max-w-sm mx-auto`}>
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#596c95] hover:bg-[#4a5b80] focus:outline-none focus:ring-2 focus:ring-[#596c95] focus:ring-offset-2 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
