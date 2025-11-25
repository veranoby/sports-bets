// frontend/src/components/admin/WalletOperationCard.tsx

import React from "react";
import { Wallet, Clock, Check, X, Eye, AlertTriangle, User } from "lucide-react";
import { WalletOperation } from "../../types/walletOperation";

interface WalletOperationCardProps {
  operation: WalletOperation;
  onApprove: () => void;
  onReject: () => void;
}

const WalletOperationCard: React.FC<WalletOperationCardProps> = ({ 
  operation, 
  onApprove, 
  onReject 
}) => {
  // Determinar estilos según el estado
  const getStatusColors = () => {
    switch (operation.status) {
      case 'pending':
        return { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' };
      case 'approved':
        return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' };
      case 'completed':
        return { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' };
      case 'rejected':
        return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' };
      case 'cancelled':
        return { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' };
    }
  };

  const statusColors = getStatusColors();

  // Determinar ícono según el tipo
  const getTypeIcon = () => {
    if (operation.type === 'deposit') {
      return <Wallet className="w-5 h-5 text-green-600" />;
    } else {
      return <Wallet className="w-5 h-5 text-red-600" />;
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
    <div className={`border rounded-lg p-4 ${statusColors.border} ${statusColors.bg} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors.text} ${statusColors.bg}`}>
            {operation.type === 'deposit' ? 'Depósito' : 'Retiro'} 
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors.text} ${statusColors.bg}`}>
            {operation.status}
          </span>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(operation.amount)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center text-sm text-gray-600">
        <User className="w-4 h-4 mr-1" />
        <span className="truncate">{operation.userId}</span>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        <p className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          {new Date(operation.requestedAt).toLocaleDateString('es-ES')}
        </p>
      </div>

      {/* Mostrar información adicional según el tipo y estado */}
      {operation.type === 'deposit' && operation.paymentProofUrl && (
        <div className="mt-2">
          <a 
            href={operation.paymentProofUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center"
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver comprobante
          </a>
        </div>
      )}

      {operation.type === 'withdrawal' && operation.adminProofUrl && (
        <div className="mt-2">
          <a 
            href={operation.adminProofUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center"
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver comprobante de admin
          </a>
        </div>
      )}

      {operation.adminNotes && (
        <div className="mt-2 text-xs text-gray-500">
          <p className="truncate" title={operation.adminNotes}>
            <strong>Notas:</strong> {operation.adminNotes}
          </p>
        </div>
      )}

      {/* Acciones para operaciones pendientes */}
      {operation.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-md transition-colors"
          >
            <Check className="w-4 h-4" />
            Aprobar
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            Rechazar
          </button>
        </div>
      )}

      {/* Mostrar estado adicional si es rechazado */}
      {operation.status === 'rejected' && operation.rejectionReason && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 text-xs rounded flex items-start">
          <AlertTriangle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>Razón: {operation.rejectionReason}</span>
        </div>
      )}
    </div>
  );
};

export default WalletOperationCard;