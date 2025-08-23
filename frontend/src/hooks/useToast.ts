// frontend/src/hooks/useToast.ts
// ================================================================
// 🍞 USE TOAST: Hook para manejo global de notificaciones

import { useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../components/shared/Toast';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    description?: string,
    options?: {
      duration?: number;
      persistent?: boolean;
    }
  ) => {
    const id = `toast-${++toastId}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      description,
      duration: options?.duration,
      persistent: options?.persistent
    };

    setToasts(prev => [...prev, newToast]);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Métodos de conveniencia
  const toast = {
    success: (title: string, description?: string, options?: { duration?: number; persistent?: boolean }) =>
      addToast('success', title, description, options),
    
    error: (title: string, description?: string, options?: { duration?: number; persistent?: boolean }) =>
      addToast('error', title, description, options),
    
    warning: (title: string, description?: string, options?: { duration?: number; persistent?: boolean }) =>
      addToast('warning', title, description, options),
    
    info: (title: string, description?: string, options?: { duration?: number; persistent?: boolean }) =>
      addToast('info', title, description, options),
  };

  return {
    toasts,
    toast,
    removeToast,
    clearAllToasts
  };
};