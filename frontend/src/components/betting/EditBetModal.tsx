// frontend/src/components/betting/EditBetModal.tsx

import React, { useState, useEffect } from 'react';
import { useBets } from '../../hooks/useApi';
import { BetData } from '../../types';
import Modal from '../shared/Modal';
import { DollarSign, RotateCcw, AlertTriangle } from 'lucide-react';

interface EditBetModalProps {
  bet: BetData;
  onClose: () => void;
  onSave: (updatedBet: BetData) => void;
}

const EditBetModal: React.FC<EditBetModalProps> = ({ bet, onClose, onSave }) => {
  const { updateBet } = useBets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for editable fields
  const [amount, setAmount] = useState(bet.amount.toString());
  const [side, setSide] = useState<'red' | 'blue'>(bet.side as 'red' | 'blue');
  const [betType, setBetType] = useState<'flat' | 'doy'>(bet.betType as 'flat' | 'doy');
  const [doyAmount, setDoyAmount] = useState(bet.terms?.doyAmount?.toString() || '');
  
  // Check if bet can be edited (should be pending)
  const canEdit = bet.status === 'pending';

  useEffect(() => {
    if (!canEdit) {
      setError('Solo se pueden editar apuestas pendientes');
    }
  }, [canEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare update data
      const updateData: any = {
        amount: Number(amount),
        side,
        betType,
      };

      // Add DOY amount if bet type is DOY
      if (betType === 'doy' && doyAmount) {
        updateData.terms = {
          ...bet.terms,
          doyAmount: Number(doyAmount)
        };
      }

      // Send update request
      const response = await updateBet(bet.id, updateData);
      if (response.success && response.data) {
        onSave(response.data);
        onClose();
      }
    } catch (err: any) {
      console.error('Error updating bet:', err);
      setError(err.message || 'Error al actualizar la apuesta');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Modal title={`Editar Apuesta #${bet.id.substring(0, 8)}`} onClose={onClose}>
      <div className="space-y-4">
        {!canEdit ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">No se puede editar</h3>
              <p className="text-red-700 text-sm">
                Esta apuesta ya no está pendiente y no puede ser editada
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Bet Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Información Actual</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Monto:</span>
                  <p className="font-medium">{formatCurrency(bet.amount)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Lado:</span>
                  <p className="font-medium">{bet.side === 'red' ? '🔴 Rojo' : '🔵 Azul'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <p className="font-medium capitalize">{bet.betType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <p className="font-medium capitalize">{bet.status}</p>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium">
                  Monto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    step="0.01"
                    required
                    disabled={!canEdit || loading}
                    placeholder="Ingrese el nuevo monto"
                  />
                </div>
              </div>

              {/* Side */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium">
                  Lado <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSide('red')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                      side === 'red'
                        ? 'bg-red-100 border-2 border-red-500 text-red-700 font-medium'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={!canEdit || loading}
                  >
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Rojo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide('blue')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                      side === 'blue'
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-700 font-medium'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={!canEdit || loading}
                  >
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span>Azul</span>
                  </button>
                </div>
              </div>

              {/* Bet Type */}
              <div>
                <label className="block text-gray-700 mb-1 font-medium">
                  Tipo de Apuesta <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBetType('flat');
                      setDoyAmount(''); // Clear DOY amount when switching to flat
                    }}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                      betType === 'flat'
                        ? 'bg-green-100 border-2 border-green-500 text-green-700 font-medium'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={!canEdit || loading}
                  >
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Plana</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetType('doy')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                      betType === 'doy'
                        ? 'bg-yellow-100 border-2 border-yellow-500 text-yellow-700 font-medium'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={!canEdit || loading}
                  >
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span>DOY</span>
                  </button>
                </div>
              </div>

              {/* DOY Amount - Only show if bet type is DOY */}
              {betType === 'doy' && (
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">
                    Monto DOY <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={doyAmount}
                      onChange={(e) => setDoyAmount(e.target.value)}
                      className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      min="0.01"
                      step="0.01"
                      required
                      disabled={!canEdit || loading}
                      placeholder="Ingrese monto DOY"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Monto adicional que recibirás si ganas (mínimo debe ser mayor al monto principal)
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canEdit || loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
};

export default EditBetModal;