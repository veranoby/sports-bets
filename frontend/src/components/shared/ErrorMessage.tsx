// frontend/src/components/shared/ErrorMessage.tsx
// 🚨 COMPONENTE MEJORADO - Error Message con transiciones suaves

import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  variant?: "card" | "inline" | "page";
  className?: string;
  showIcon?: boolean;
  // Funcionalidad de timeout
  autoClose?: boolean;
  duration?: number; // en ms
  onClose?: () => void;
  showProgress?: boolean;
  closeable?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  variant = "card",
  className = "",
  showIcon = true,
  autoClose = false,
  duration = 8000,
  onClose,
  showProgress = false,
  closeable = false,
}) => {
  const [visible, setVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const errorText = typeof error === "string" ? error : error.message;

  // Auto-cerrar después del tiempo especificado
  useEffect(() => {
    if (autoClose && visible && !isClosing) {
      const id = setTimeout(() => {
        handleClose();
      }, duration);
      setTimeoutId(id);

      return () => {
        if (id) clearTimeout(id);
      };
    }
  }, [autoClose, visible, duration, isClosing]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const handleClose = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    // 🔧 MEJORA: Transición suave de cierre
    setIsClosing(true);

    // Delay para permitir animación de salida
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300); // 300ms para transición suave
  };

  // 🔧 MEJORA: No renderizar si no es visible
  if (!visible) return null;

  const variants = {
    card: "bg-red-50 border border-red-200 rounded-lg p-4",
    inline: "text-red-600 text-sm",
    page: "min-h-[400px] flex items-center justify-center",
  };

  // 🔧 MEJORA: Clases de transición mejoradas
  const transitionClasses = isClosing
    ? "opacity-0 transform scale-95 transition-all duration-300 ease-in-out"
    : "opacity-100 transform scale-100 transition-all duration-300 ease-in-out";

  // Variant inline
  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-2 ${className} ${transitionClasses}`}
      >
        {showIcon && (
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
        <span className="text-red-600 flex-1">{errorText}</span>
        {closeable && (
          <button
            onClick={handleClose}
            className="ml-2 text-red-400 hover:text-red-600 transition-colors focus:outline-none"
            title="Cerrar mensaje"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Variants card y page
  return (
    <div
      className={`${variants[variant]} ${className} relative ${transitionClasses}`}
    >
      <div className={variant === "page" ? "text-center" : ""}>
        <div className="flex items-start">
          {showIcon && (
            <AlertCircle
              className={`w-${variant === "page" ? "12" : "5"} h-${
                variant === "page" ? "12" : "5"
              } text-red-500 flex-shrink-0 ${
                variant === "page" ? "mx-auto mb-4" : "mt-0.5 mr-3"
              }`}
            />
          )}

          <div className="flex-1 min-w-0">
            {variant === "page" && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error
              </h3>
            )}
            <p
              className={`${
                variant === "page"
                  ? "text-gray-600 mb-4"
                  : "text-sm text-red-700 font-medium"
              } break-words`}
            >
              {errorText}
            </p>
          </div>

          {/* Botón cerrar para variants card e inline */}
          {closeable && variant !== "page" && (
            <button
              onClick={handleClose}
              className="ml-2 flex-shrink-0 text-red-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded p-1"
              title="Cerrar mensaje"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón retry */}
        {onRetry && (
          <div
            className={`${
              variant === "page" ? "" : "mt-3"
            } flex justify-center`}
          >
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-[#596c95] text-white px-4 py-2 rounded-lg hover:bg-[#4a5a85] transition-colors focus:outline-none focus:ring-2 focus:ring-[#596c95] focus:ring-opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {variant === "page" ? "Reintentar" : "Retry"}
            </button>
          </div>
        )}

        {/* Barra de progreso para auto-close */}
        {autoClose && showProgress && variant !== "inline" && !isClosing && (
          <div className="mt-3 w-full bg-red-200 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-red-400 transition-all ease-linear rounded-full"
              style={{
                width: "100%",
                animation: `progress-shrink ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}

        {/* Botón cerrar para variant page */}
        {closeable && variant === "page" && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded p-1"
            title="Cerrar mensaje"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

// Mantener export named para compatibilidad
export { ErrorMessage };
