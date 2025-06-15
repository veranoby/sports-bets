// frontend/src/components/shared/ErrorMessage.tsx
// ✅ COMPONENTE MEJORADO: Compatible con nuevo sistema de error handling

import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  variant?: "card" | "inline" | "page" | "dark-card";
  className?: string;
  showIcon?: boolean;
  // ✅ Props para control avanzado de timeouts
  autoClose?: boolean;
  duration?: number; // en ms
  onClose?: () => void;
  showProgress?: boolean;
  closeable?: boolean;
  // ✅ Nuevas props para mejor UX
  persistent?: boolean; // No se cierra automáticamente
  dismissible?: boolean; // Se puede cerrar haciendo click
  animation?: boolean; // Habilitar/deshabilitar animaciones
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  variant = "card",
  className = "",
  showIcon = true,
  // Configuración de auto-close
  autoClose = false,
  duration = 8000,
  onClose,
  showProgress = false,
  closeable = false,
  // Nuevas props
  persistent = false,
  dismissible = false,
  animation = true,
}) => {
  const [visible, setVisible] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [progressWidth, setProgressWidth] = useState(100);

  const errorText = typeof error === "string" ? error : error.message;

  // ✅ Auto-cerrar con barra de progreso
  useEffect(() => {
    if (autoClose && visible && !persistent) {
      // Iniciar countdown de progreso
      if (showProgress) {
        const progressInterval = setInterval(() => {
          setProgressWidth((prev) => {
            const decrement = (100 / duration) * 100; // Actualizar cada 100ms
            const newWidth = prev - decrement;
            return newWidth <= 0 ? 0 : newWidth;
          });
        }, 100);

        // Limpiar intervalo después del timeout
        setTimeout(() => {
          clearInterval(progressInterval);
        }, duration);
      }

      // Configurar timeout principal
      const id = setTimeout(() => {
        handleClose();
      }, duration);
      setTimeoutId(id);

      return () => {
        if (id) clearTimeout(id);
      };
    }
  }, [autoClose, visible, duration, persistent, showProgress]);

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

    if (animation) {
      // Animación de salida
      setVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    } else {
      setVisible(false);
      onClose?.();
    }
  };

  const handleDismiss = () => {
    if (dismissible || closeable) {
      handleClose();
    }
  };

  if (!visible) return null;

  // ✅ Configuración de variantes mejorada
  const variants = {
    card: "bg-red-50 border border-red-200 rounded-lg p-4 error-message-improved",
    "dark-card":
      "bg-[#2a325c] border border-[#596c95] rounded-lg p-4 sportsbets-error sportsbets-error-accent",
    inline: "text-red-600 text-sm",
    page: "min-h-[400px] flex items-center justify-center",
  };

  // ✅ Variant inline (mantener funcionalidad existente)
  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-2 ${className} ${
          animation ? "error-enter" : ""
        }`}
        onClick={handleDismiss}
      >
        {showIcon && <AlertCircle className="w-4 h-4 text-red-500" />}
        <span className="text-red-600">{errorText}</span>
        {closeable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="ml-2 text-red-400 hover:text-red-600 transition-colors error-close-button"
            title="Cerrar mensaje"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // ✅ Variants card, dark-card y page (mejoradas)
  return (
    <div
      className={`${variants[variant]} ${className} relative ${
        animation ? "error-enter" : ""
      }`}
      onClick={handleDismiss}
      role="alert"
      aria-live="polite"
    >
      <div className={variant === "page" ? "text-center" : ""}>
        <div className="flex items-start">
          {showIcon && (
            <AlertCircle
              className={`w-${variant === "page" ? "12" : "5"} h-${
                variant === "page" ? "12" : "5"
              } ${variant === "dark-card" ? "text-red-400" : "text-red-500"} ${
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
                  : variant === "dark-card"
                  ? "text-sm text-red-100 font-medium"
                  : "text-sm text-red-700 font-medium"
              }`}
            >
              {errorText}
            </p>
          </div>

          {/* ✅ Botón cerrar mejorado */}
          {closeable && variant !== "page" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className={`ml-2 flex-shrink-0 transition-colors error-close-button ${
                variant === "dark-card"
                  ? "text-red-300 hover:text-red-100"
                  : "text-red-400 hover:text-red-600"
              }`}
              title="Cerrar mensaje"
              aria-label="Cerrar mensaje de error"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ✅ Botón retry mejorado */}
        {onRetry && (
          <div className={variant === "page" ? "" : "mt-3"}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                variant === "dark-card"
                  ? "bg-[#596c95] text-white hover:bg-[#4a5a85] focus:ring-[#596c95]"
                  : "bg-[#596c95] text-white hover:bg-[#4a5a85] focus:ring-[#596c95]"
              }`}
              aria-label="Reintentar operación"
            >
              <RefreshCw className="w-4 h-4" />
              {variant === "page" ? "Reintentar" : "Retry"}
            </button>
          </div>
        )}

        {/* ✅ Barra de progreso mejorada */}
        {autoClose && showProgress && variant !== "inline" && !persistent && (
          <div className="mt-3 w-full bg-red-200 rounded-full h-1 overflow-hidden">
            <div
              className={`h-full transition-all ease-linear ${
                variant === "dark-card" ? "bg-red-400" : "bg-red-500"
              }`}
              style={{
                width: `${progressWidth}%`,
                transition: "width 100ms linear",
              }}
            />
          </div>
        )}

        {/* ✅ Botón cerrar para variant page */}
        {closeable && variant === "page" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors error-close-button"
            title="Cerrar mensaje"
            aria-label="Cerrar mensaje de error"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ✅ Indicador de persistencia */}
        {persistent && (
          <div className="mt-2 text-xs opacity-75">
            <span
              className={
                variant === "dark-card" ? "text-gray-300" : "text-gray-500"
              }
            >
              Este mensaje permanecerá visible hasta que lo cierres manualmente
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

// ✅ MANTENER export named para compatibilidad
export { ErrorMessage };
