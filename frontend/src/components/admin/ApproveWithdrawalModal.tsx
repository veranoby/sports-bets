// frontend/src/components/admin/ApproveWithdrawalModal.tsx

import React, { useState } from "react";
import { Check, X, Upload } from "lucide-react";
import { WalletOperation } from "../../types/walletOperation";

interface ApproveWithdrawalModalProps {
  operation: WalletOperation;
  onClose: () => void;
  onApprove: (operationId: string, adminNotes?: string) => Promise<void>;
  onComplete: (operationId: string, adminProofUrl: string, adminNotes?: string) => Promise<void>;
}

const ApproveWithdrawalModal: React.FC<ApproveWithdrawalModalProps> = ({
  operation,
  onClose,
  onApprove,
  onComplete
}) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [adminProofUrl, setAdminProofUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'complete'>('approve'); // Approve first, then complete

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (actionType === 'approve') {
        // Only approve the operation
        await onApprove(operation.id, adminNotes);
      } else {
        // Complete the operation with proof
        await onComplete(operation.id, adminProofUrl, adminNotes);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear monto
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {actionType === 'approve' ? 'Aprobar Retiro' : 'Completar Retiro'}
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
              Detalles del Retiro
            </label>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Usuario:</span> {operation.userId}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Monto:</span> {formatCurrency(operation.amount)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Fecha de Solicitud:</span> {new Date(operation.requestedAt).toLocaleString('es-ES')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                actionType === 'approve'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActionType('approve')}
              disabled={isLoading}
            >
              Aprobar
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                actionType === 'complete'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActionType('complete')}
              disabled={isLoading}
            >
              Completar
            </button>
          </div>

          {actionType === 'complete' && (
            <div>
              <label htmlFor="adminProofUrl" className="block text-sm font-medium text-gray-700 mb-1">
                URL de Comprobante de Transferencia (Obligatorio)
              </label>
              <input
                type="url"
                id="adminProofUrl"
                value={adminProofUrl}
                onChange={(e) => setAdminProofUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://ejemplo.com/comprobante-transferencia.pdf"
                required
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                El comprobante de transferencia es obligatorio para completar el retiro
              </p>
            </div>
          )}

          <div>
            <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas del Administrador (opcional)
            </label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center gap-2"
            >
              {isLoading ? (
                'Procesando...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {actionType === 'approve' ? 'Aprobar Retiro' : 'Completar Retiro'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveWithdrawalModal;