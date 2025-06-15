// frontend/src/components/shared/ConfirmDialog.tsx
// ⚠️ COMPONENTE OPTIMIZADO - ConfirmDialog con más variantes y funcionalidades

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  Trash2,
  Ban,
  Shield,
  Zap,
  X,
} from "lucide-react";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;

  // Contenido
  title: string;
  message: string;
  details?: string;

  // Variantes
  variant?: "default" | "danger" | "warning" | "success" | "info";
  type?: "delete" | "disable" | "activate" | "update" | "custom";

  // Botones
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  showCancel?: boolean;

  // Configuración
  loading?: boolean;
  countdown?: number; // Segundos para auto-confirm
  requireConfirmation?: boolean; // Requiere escribir "CONFIRMAR"
  confirmationText?: string;

  // Avanzado
  size?: "sm" | "md" | "lg";
  preventClose?: boolean; // No permite cerrar con ESC o click fuera
  autoClose?: boolean; // Se cierra automáticamente después de confirm

  // Callbacks
  onBeforeConfirm?: () => Promise<boolean>; // Validación antes de confirmar
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  details,
  variant = "default",
  type = "custom",
  confirmText,
  cancelText = "Cancelar",
  confirmDisabled = false,
  showCancel = true,
  loading = false,
  countdown,
  requireConfirmation = false,
  confirmationText = "CONFIRMAR",
  size = "md",
  preventClose = false,
  autoClose = true,
  onBeforeConfirm,
}) => {
  const theme = getUserThemeClasses();

  // Estados internos
  const [confirmInput, setConfirmInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [isValidated, setIsValidated] = useState(false);

  // Configuración según variante y tipo
  const getConfig = () => {
    const configs = {
      delete: {
        variant: "danger" as const,
        icon: <Trash2 className="w-6 h-6" />,
        confirmText: "Eliminar",
        iconColor: "text-red-500",
        buttonColor: "bg-red-600 hover:bg-red-700",
      },
      disable: {
        variant: "warning" as const,
        icon: <Ban className="w-6 h-6" />,
        confirmText: "Desactivar",
        iconColor: "text-yellow-500",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      },
      activate: {
        variant: "success" as const,
        icon: <CheckCircle className="w-6 h-6" />,
        confirmText: "Activar",
        iconColor: "text-green-500",
        buttonColor: "bg-green-600 hover:bg-green-700",
      },
      update: {
        variant: "info" as const,
        icon: <Zap className="w-6 h-6" />,
        confirmText: "Actualizar",
        iconColor: "text-blue-500",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
      },
      custom: {
        variant: variant,
        icon: getVariantIcon(variant),
        confirmText: "Confirmar",
        iconColor: getVariantIconColor(variant),
        buttonColor: getVariantButtonColor(variant),
      },
    };

    return configs[type] || configs.custom;
  };

  function getVariantIcon(variant: string) {
    switch (variant) {
      case "danger":
        return <AlertTriangle className="w-6 h-6" />;
      case "warning":
        return <AlertCircle className="w-6 h-6" />;
      case "success":
        return <CheckCircle className="w-6 h-6" />;
      case "info":
        return <Info className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  }

  function getVariantIconColor(variant: string) {
    switch (variant) {
      case "danger":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "success":
        return "text-green-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  }

  function getVariantButtonColor(variant: string) {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "success":
        return "bg-green-600 hover:bg-green-700";
      case "info":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return "bg-[#596c95] hover:bg-[#4a5b80]";
    }
  }

  const config = getConfig();
  const finalConfirmText = confirmText || config.confirmText;

  // Validaciones
  const isConfirmationValid =
    !requireConfirmation ||
    confirmInput.toUpperCase() === confirmationText.toUpperCase();

  const canConfirm =
    !confirmDisabled &&
    !loading &&
    isConfirmationValid &&
    (!countdown || timeLeft === 0);

  // Countdown effect
  useEffect(() => {
    if (countdown && timeLeft && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, countdown]);

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmInput("");
      setTimeLeft(countdown);
      setIsValidated(false);
    }
  }, [isOpen, countdown]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, preventClose, onClose]);

  // Handle confirm
  const handleConfirm = async () => {
    if (!canConfirm) return;

    if (onBeforeConfirm) {
      setIsValidated(true);
      const canProceed = await onBeforeConfirm();
      setIsValidated(false);

      if (!canProceed) return;
    }

    onConfirm();

    if (autoClose) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "max-w-sm";
      case "lg":
        return "max-w-2xl";
      default:
        return "max-w-md";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Dialog */}
      <div
        className={`relative bg-[#2a325c] border border-[#596c95] rounded-lg shadow-2xl p-6 m-4 w-full ${getSizeClasses()}`}
      >
        {/* Close button (si no está preventClose) */}
        {!preventClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header con icono */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            {config.icon}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>

            <p className="text-gray-300 leading-relaxed">{message}</p>

            {details && (
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                {details}
              </p>
            )}
          </div>
        </div>

        {/* Countdown */}
        {countdown && timeLeft && timeLeft > 0 && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              Esta acción se ejecutará automáticamente en {timeLeft} segundo
              {timeLeft !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Input de confirmación */}
        {requireConfirmation && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Escribe "{confirmationText}" para confirmar:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={confirmationText}
              className={`${theme.input} ${
                confirmInput && !isConfirmationValid
                  ? "border-red-500 focus:ring-red-500"
                  : ""
              }`}
              autoFocus
            />
            {confirmInput && !isConfirmationValid && (
              <p className="text-red-400 text-xs mt-1">El texto no coincide</p>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          {showCancel && (
            <button
              onClick={onClose}
              disabled={loading || isValidated}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isValidated}
            className={`px-4 py-2 ${config.buttonColor} disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center gap-2`}
          >
            {(loading || isValidated) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}

            {finalConfirmText}

            {countdown && timeLeft && timeLeft > 0 && (
              <span className="text-xs opacity-75">({timeLeft}s)</span>
            )}
          </button>
        </div>

        {/* Info adicional */}
        {(type === "delete" || variant === "danger") && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-xs">
              ⚠️ Esta acción no se puede deshacer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook para usar el dialog de forma programática
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    props: Partial<ConfirmDialogProps>;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    props: {},
  });

  const confirm = (
    props: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        props,
        resolve,
      });
    });
  };

  const handleClose = () => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState({ isOpen: false, props: {} });
  };

  const handleConfirm = () => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState({ isOpen: false, props: {} });
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      {...(dialogState.props as ConfirmDialogProps)}
      isOpen={dialogState.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  );

  return {
    confirm,
    ConfirmDialogComponent,
  };
};

export default ConfirmDialog;
