// frontend/src/hooks/useToast.ts
// ================================================================
// 🍞 USE TOAST: Hook para manejo global de notificaciones

import { useState, useCallback } from "react";
import { type ToastMessage, type ToastType } from "../components/shared/Toast";

let toastId = 0;

interface AddToastPayload {
  type: ToastType;
  title: string;
  message?: string;
  description?: string;
  options?: {
    duration?: number;
    persistent?: boolean;
  };
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (payload: AddToastPayload) => {
      const { type, title, description, message, options } = payload;
      const id = `toast-${++toastId}`;
      const newToast: ToastMessage = {
        id,
        type,
        title,
        description: description || message,
        duration: options?.duration,
        persistent: options?.persistent,
      };

      setToasts((prev) => [...prev, newToast]);

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Métodos de conveniencia
  const toast = {
    success: (
      title: string,
      description?: string,
      options?: { duration?: number; persistent?: boolean }
    ) => addToast({ type: "success", title, description, options }),

    error: (
      title: string,
      description?: string,
      options?: { duration?: number; persistent?: boolean }
    ) => addToast({ type: "error", title, description, options }),

    warning: (
      title: string,
      description?: string,
      options?: { duration?: number; persistent?: boolean }
    ) => addToast({ type: "warning", title, description, options }),

    info: (
      title: string,
      description?: string,
      options?: { duration?: number; persistent?: boolean }
    ) => addToast({ type: "info", title, description, options }),
  };

  return {
    toasts,
    toast,
    addToast,
    removeToast,
    clearAllToasts,
  };
};