import React from "react";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  isOpen,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-100 text-blue-700",
  };

  const icon =
    variant === "danger" || variant === "warning" ? (
      <AlertTriangle className="w-6 h-6 text-yellow-500" />
    ) : (
      <Info className="w-6 h-6 text-blue-500" />
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className={`p-4 rounded-t-lg ${variantStyles[variant]}`}>
          <div className="flex items-center">
            {icon}
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
        </div>
        <div className="p-4 text-gray-700">{message}</div>
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : variant === "warning"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
