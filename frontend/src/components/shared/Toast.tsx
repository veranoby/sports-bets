// frontend/src/components/shared/Toast.tsx
// ================================================================
// 🍞 TOAST: Sistema de notificaciones unificado para toda la app

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

// Types
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  description,
  duration = 5000,
  persistent = false,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss si no es persistent
    if (!persistent) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, persistent, handleClose]);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [onClose, id]);

  // Configuración por tipo
  const config = {
    success: {
      icon: CheckCircle,
      bg: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      titleColor: "text-green-900",
      descColor: "text-green-800",
    },
    error: {
      icon: AlertCircle,
      bg: "bg-red-50 border-red-200",
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      descColor: "text-red-800",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-50 border-yellow-200",
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
      descColor: "text-yellow-800",
    },
    info: {
      icon: Info,
      bg: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      descColor: "text-blue-800",
    },
  };

  const { icon: Icon, bg, iconColor, titleColor, descColor } = config[type];

  return (
    <div
      className={`
        max-w-sm w-full border rounded-lg shadow-lg p-4 transition-all duration-300
        ${bg}
        ${isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        ${isLeaving ? "translate-x-full opacity-0" : ""}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${titleColor}`}>{title}</h4>

          {description && (
            <p className={`text-sm mt-1 ${descColor}`}>{description}</p>
          )}
        </div>

        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors ${iconColor}`}
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
