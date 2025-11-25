// frontend/src/components/admin/RejectOperationModal.tsx

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { WalletOperation } from "../../types/walletOperation";

interface RejectOperationModalProps {
  operation: WalletOperation;
  onClose: () => void;
  onReject: (
    operationId: string,
    rejectionReason: string,
    adminNotes?: string,
  ) => Promise<void>;
}

const RejectOperationModal: React.FC<RejectOperationModalProps> = ({
  operation,
  onClose,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      alert("La razón de rechazo es obligatoria");
      return;
    }

    setIsLoading(true);
    try {
      await onReject(operation.id, rejectionReason, adminNotes);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear monto
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Rechazar Operación
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detalles de la Operación
            </label>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Usuario:</span> {operation.userId}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Tipo:</span>{" "}
                {operation.type === "deposit" ? "Depósito" : "Retiro"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Monto:</span>{" "}
                {formatCurrency(operation.amount)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Fecha de Solicitud:</span>{" "}
                {new Date(operation.requestedAt).toLocaleString("es-ES")}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="rejectionReason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Razón de Rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="Especificar la razón del rechazo..."
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="adminNotes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notas del Administrador (opcional)
            </label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Agregar notas sobre esta operación..."
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center gap-2"
            >
              {isLoading ? (
                "Procesando..."
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Rechazar Operación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectOperationModal;
