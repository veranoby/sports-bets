// frontend/src/components/shared/ErrorMessage.tsx
// ✅ EXTENDER el componente existente con nuevas funcionalidades

import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  variant?: "card" | "inline" | "page";
  className?: string;
  showIcon?: boolean;
  // ✅ NUEVAS PROPS para funcionalidad de timeout
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
  // ✅ Nuevas props con defaults
  autoClose = false,
  duration = 8000,
  onClose,
  showProgress = false,
  closeable = false,
}) => {
  const [visible, setVisible] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const errorText = typeof error === "string" ? error : error.message;

  // ✅ Auto-cerrar después del tiempo especificado
  useEffect(() => {
    if (autoClose && visible) {
      const id = setTimeout(() => {
        handleClose();
      }, duration);
      setTimeoutId(id);

      return () => {
        if (id) clearTimeout(id);
      };
    }
  }, [autoClose, visible, duration]);

  // ✅ Cleanup al desmontar
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
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  const variants = {
    card: "bg-red-50 border border-red-200 rounded-lg p-4",
    inline: "text-red-600 text-sm",
    page: "min-h-[400px] flex items-center justify-center",
  };

  // ✅ Variant inline (mantener funcionalidad existente)
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <AlertCircle className="w-4 h-4 text-red-500" />}
        <span className="text-red-600">{errorText}</span>
        {closeable && (
          <button
            onClick={handleClose}
            className="ml-2 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // ✅ Variants card y page (mejoradas)
  return (
    <div className={`${variants[variant]} ${className} relative`}>
      <div className={variant === "page" ? "text-center" : ""}>
        <div className="flex items-start">
          {showIcon && (
            <AlertCircle
              className={`w-${variant === "page" ? "12" : "5"} h-${
                variant === "page" ? "12" : "5"
              } text-red-500 ${
                variant === "page"
                  ? "mx-auto mb-4"
                  : "mt-0.5 mr-3 flex-shrink-0"
              }`}
            />
          )}

          <div className="flex-1">
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
              }`}
            >
              {errorText}
            </p>
          </div>

          {/* ✅ Botón cerrar (nuevo) */}
          {closeable && variant !== "page" && (
            <button
              onClick={handleClose}
              className="ml-2 flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              title="Cerrar mensaje"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ✅ Botón retry (mantener funcionalidad existente) */}
        {onRetry && (
          <div className={variant === "page" ? "" : "mt-3"}>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-[#596c95] text-white px-4 py-2 rounded-lg hover:bg-[#4a5a85] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {variant === "page" ? "Reintentar" : "Retry"}
            </button>
          </div>
        )}

        {/* ✅ Barra de progreso (nueva funcionalidad) */}
        {autoClose && showProgress && variant !== "inline" && (
          <div className="mt-3 w-full bg-red-200 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-red-400 transition-all ease-linear"
              style={{
                width: "100%",
                animation: `progress-shrink ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}

        {/* ✅ Botón cerrar para variant page */}
        {closeable && variant === "page" && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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

// ✅ MANTENER export named para compatibilidad
export { ErrorMessage };
