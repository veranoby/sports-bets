// frontend/src/components/shared/GenericDetailModal.tsx
// ================================================================
// 🎯 MODAL UNIFICADO: Reemplaza BetDetailModal, TransactionDetailModal, EventDetailModal
// ⚡ PRESERVA: Todas las funcionalidades específicas de cada modal original

import React from "react";
import Modal from "./Modal";
import StatusChip from "./StatusChip";
import { Copy } from "lucide-react";

// Types para configuración flexible
export interface FieldConfig<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], data: T) => React.ReactNode;
  copyable?: boolean;
  conditional?: (data: T) => boolean;
}

export interface ActionConfig<T> {
  label: string;
  onClick: (data: T) => void;
  variant: "primary" | "danger" | "success";
  conditional?: (data: T) => boolean;
  className?: string;
}

interface GenericDetailModalProps<T> {
  title: string;
  data: T | null;
  isOpen: boolean;
  onClose: () => void;
  fields: FieldConfig<T>[];
  actions?: ActionConfig<T>[];
  className?: string;
}

const GenericDetailModal = <
  T extends { id: string; status?: string; createdAt?: string },
>({
  title,
  data,
  isOpen,
  onClose,
  fields,
  actions = [],
  className = "",
}: GenericDetailModalProps<T>) => {
  if (!data) return null;

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const renderField = (field: FieldConfig<T>) => {
    // Skip field if conditional returns false
    if (field.conditional && !field.conditional(data)) {
      return null;
    }

    const value = data[field.key];

    return (
      <div
        key={String(field.key)}
        className="flex justify-between items-center"
      >
        <span className="font-bold">{field.label}:</span>
        <div className="flex items-center gap-2">
          {field.render ? (
            field.render(value, data)
          ) : String(field.key) === "status" ? (
            <StatusChip status={String(value)} size="sm" />
          ) : String(field.key) === "createdAt" ||
            String(field.key).includes("Date") ? (
            <span>
              {value
                ? new Date(value as string | number).toLocaleString()
                : "-"}
            </span>
          ) : String(field.key) === "amount" ||
            String(field.key).includes("Prize") ? (
            <span>
              $
              {typeof value === "number"
                ? value.toFixed(2)
                : String(value) || 0}
            </span>
          ) : String(field.key) === "id" ? (
            <span className="font-mono text-xs">{String(value)}</span>
          ) : (
            <span>{String(value) || "-"}</span>
          )}
          {field.copyable && value && (
            <button
              onClick={() => handleCopy(String(value))}
              className="ml-2 text-gray-400 hover:text-gray-700"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAction = (action: ActionConfig<T>) => {
    // Skip action if conditional returns false
    if (action.conditional && !action.conditional(data)) {
      return null;
    }

    const baseClasses = "px-4 py-2 rounded font-medium transition-colors";
    const variantClasses = {
      primary: "bg-blue-400 text-white hover:bg-blue-700",
      danger: "bg-red-600 text-white hover:bg-red-700",
      success: "bg-green-600 text-white hover:bg-green-700",
    };

    return (
      <button
        key={action.label}
        onClick={() => action.onClick(data)}
        className={`${baseClasses} ${variantClasses[action.variant]} ${action.className || ""}`}
      >
        {action.label}
      </button>
    );
  };

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      className={className}
    >
      <div className="space-y-3">{fields.map(renderField)}</div>

      {/* Actions Section */}
      {actions.length > 0 && (
        <div className="flex gap-3 mt-6">{actions.map(renderAction)}</div>
      )}

      {/* Default Close Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
};

export default GenericDetailModal;
