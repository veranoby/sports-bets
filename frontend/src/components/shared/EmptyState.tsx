// frontend/src/components/shared/EmptyState.tsx - VERSIÓN CORREGIDA

import React from "react";
import { Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode; // Acepta tanto componente como JSX
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
}) => {
  // Función para renderizar el icono correctamente
  const renderIcon = () => {
    if (!icon) {
      // Icono por defecto
      return <Calendar className="w-full h-full" />;
    }

    // Si es un componente de Lucide (función), renderizarlo como JSX
    if (typeof icon === "function") {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-full h-full" />;
    }

    // Si ya es JSX, renderizarlo directamente
    return icon;
  };

  return (
    <div className={`text-center p-8 ${className}`}>
      <div className="mx-auto w-12 h-12 text-gray-400 flex items-center justify-center">
        {renderIcon()}
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#596c95] hover:bg-[#4a5b80] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
