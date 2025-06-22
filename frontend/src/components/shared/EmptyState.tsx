// frontend/src/components/shared/EmptyState.tsx - MIGRADO V9
// ============================================================
// ELIMINADO: getUserThemeClasses() import y usage
// APLICADO: Clases CSS estáticas directas

import React from "react";
import { Calendar } from "lucide-react";
// ❌ ELIMINADO: import { getUserThemeClasses } from "../../contexts/UserThemeContext";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
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
  return (
    <div className={`text-center p-8 ${className}`}>
      <div className="mx-auto w-12 h-12 text-theme-light mb-4">
        {React.isValidElement(icon)
          ? React.cloneElement(icon, { className: "w-12 h-12" })
          : icon || <Calendar className="w-12 h-12" />}
      </div>

      <h3 className="text-lg font-medium mb-2 text-theme-primary">{title}</h3>

      {description && (
        <p className="text-sm text-theme-light mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}

      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
