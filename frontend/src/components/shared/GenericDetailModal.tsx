// frontend/src/components/shared/GenericDetailModal.tsx
// ================================================================
// 🎯 MODAL UNIFICADO: Reemplaza BetDetailModal, TransactionDetailModal, EventDetailModal
// ⚡ PRESERVA: Todas las funcionalidades específicas de cada modal original

import React from "react";
import Modal from "./Modal";
import StatusChip from "./StatusChip";
import { Copy } from "lucide-react";

// Types para configuración flexible
export interface FieldConfig {
  key: string;
  label: string;
  render?: (value: any, data: any) => React.ReactNode;
  copyable?: boolean;
  conditional?: (data: any) => boolean;
}

export interface ActionConfig {
  label: string;
  onClick: (data: any) => void;
  variant: "primary" | "danger" | "success";
  conditional?: (data: any) => boolean;
  className?: string;
}

interface GenericDetailModalProps<T> {
  title: string;
  data: T | null;
  isOpen: boolean;
  onClose: () => void;
  fields: FieldConfig[];
  actions?: ActionConfig[];
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

  const renderField = (field: FieldConfig) => {
    // Skip field if conditional returns false
    if (field.conditional && !field.conditional(data)) {
      return null;
    }

    const value = (data as any)[field.key];

    return (
      <div key={field.key} className="flex justify-between items-center">
        <span className="font-bold">{field.label}:</span>
        <div className="flex items-center gap-2">
          {field.render ? (
            field.render(value, data)
          ) : field.key === "status" ? (
            <StatusChip status={value} size="sm" />
          ) : field.key === "createdAt" || field.key.includes("Date") ? (
            <span>{value ? new Date(value).toLocaleString() : "-"}</span>
          ) : field.key === "amount" || field.key.includes("Prize") ? (
            <span>
              ${typeof value === "number" ? value.toFixed(2) : value || 0}
            </span>
          ) : field.key === "id" ? (
            <span className="font-mono text-xs">{value}</span>
          ) : (
            <span>{value || "-"}</span>
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

  const renderAction = (action: ActionConfig) => {
    // Skip action if conditional returns false
    if (action.conditional && !action.conditional(data)) {
      return null;
    }

    const baseClasses = "px-4 py-2 rounded font-medium transition-colors";
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
};

export default GenericDetailModal;
