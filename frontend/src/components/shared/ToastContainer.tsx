// frontend/src/components/shared/ToastContainer.tsx
// ================================================================
// 🍞 TOAST CONTAINER: Container de notificaciones con posicionamiento fijo

import React from "react";
import Toast, { type ToastMessage } from "./Toast";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  position = "top-right",
}) => {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed z-[9999] ${positionClasses[position]} space-y-3 pointer-events-none`}
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onRemove} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
