// frontend/src/components/betting/DOYProposalModal.tsx
// Modal for creating DOY proposals between users

import React, { useState, useEffect } from "react";
import { X, DollarSign, Users, Clock, Shield } from "lucide-react";
import Modal from "../shared/Modal";
import type { User } from "../../types";

interface DOYProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposal: {
    fightId: string;
    targetUserId: string;
    amount: number;
    proposalAmount: number;
    side: "red" | "blue";
    timePrediction?: number; // Time prediction in minutes for DOY
    roundPrediction?: number; // Round prediction for DOY
  }) => void;
  fightId: string;
  users: User[];
  currentUserId: string;
}

type DOYFormData = {
  targetUserId: string;
  amount: number;
  proposalAmount: number;
  side: "red" | "blue";
  timePrediction: number;
  roundPrediction: number;
};

const DOYProposalModal: React.FC<DOYProposalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fightId,
  users,
  currentUserId,
}) => {
  const [formData, setFormData] = useState<DOYFormData>({
    targetUserId: "",
    amount: 0,
    proposalAmount: 0,
    side: "red",
    timePrediction: 0,
    roundPrediction: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        targetUserId: "",
        amount: 0,
        proposalAmount: 0,
        side: "red",
        timePrediction: 0,
        roundPrediction: 0,
      });
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.targetUserId) {
        throw new Error("Debe seleccionar un contrincante");
      }
      if (formData.targetUserId === currentUserId) {
        throw new Error("No puedes hacerte DOY a ti mismo");
      }
      if (formData.amount <= 0) {
        throw new Error("El monto debe ser mayor a 0");
      }
      if (formData.proposalAmount <= 0) {
        throw new Error("La propuesta debe ser mayor a 0");
      }
      if (formData.timePrediction <= 0 && formData.roundPrediction <= 0) {
        throw new Error("Debe ingresar predicción de tiempo o número de ronda");
      }

      await onSubmit({
        fightId,
        targetUserId: formData.targetUserId,
        amount: formData.amount,
        proposalAmount: formData.proposalAmount,
        side: formData.side,
        timePrediction:
          formData.timePrediction > 0 ? formData.timePrediction : undefined,
        roundPrediction:
          formData.roundPrediction > 0 ? formData.roundPrediction : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al crear la propuesta DOY",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = <K extends keyof DOYFormData>(
    field: K,
    value: DOYFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Filter users to exclude current user
  const availableUsers = users.filter((user) => user.id !== currentUserId);

  return (
    <Modal title="Propuesta DOY" isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contrincante
            </label>
            <select
              value={formData.targetUserId}
              onChange={(e) =>
                handleInputChange("targetUserId", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Seleccione un contrincante</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto de la Apuesta
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.amount || ""}
                onChange={(e) =>
                  handleInputChange("amount", parseFloat(e.target.value) || 0)
                }
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto de la Propuesta
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.proposalAmount || ""}
                onChange={(e) =>
                  handleInputChange(
                    "proposalAmount",
                    parseFloat(e.target.value) || 0,
                  )
                }
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lado
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleInputChange("side", "red")}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  formData.side === "red"
                    ? "border-red-500 bg-red-100 text-red-700"
                    : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
                disabled={loading}
              >
                🔴 Rojo
              </button>
              <button
                type="button"
                onClick={() => handleInputChange("side", "blue")}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  formData.side === "blue"
                    ? "border-blue-500 bg-blue-100 text-blue-700"
                    : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
                disabled={loading}
              >
                🔵 Azul
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Predicción Tiempo (min)
              </label>
              <input
                type="number"
                value={formData.timePrediction || ""}
                onChange={(e) =>
                  handleInputChange(
                    "timePrediction",
                    parseInt(e.target.value) || 0,
                  )
                }
                min="1"
                max="99"
                placeholder="Ej: 15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Predicción Ronda
              </label>
              <input
                type="number"
                value={formData.roundPrediction || ""}
                onChange={(e) =>
                  handleInputChange(
                    "roundPrediction",
                    parseInt(e.target.value) || 0,
                  )
                }
                min="1"
                max="10"
                placeholder="Ej: 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            <Clock className="w-3 h-3" />
            <span>La propuesta expirará en 3 minutos si no se acepta</span>
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              disabled={
                loading ||
                !formData.targetUserId ||
                (formData.timePrediction <= 0 && formData.roundPrediction <= 0)
              }
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border border-solid border-white border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Enviar DOY
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default DOYProposalModal;
