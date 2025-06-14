import React from "react";
import Modal from "../shared/Modal";
import StatusChip from "../shared/StatusChip";
import { Copy } from "lucide-react";
import type { Bet } from "../../types";

const BetDetailModal = ({
  bet,
  onClose,
  onCancelBet,
}: {
  bet: Bet;
  onClose: () => void;
  onCancelBet?: (betId: string) => void;
}) => {
  if (!bet) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(bet.id);
  };

  return (
    <Modal title="Detalle de Apuesta" isOpen={!!bet} onClose={onClose}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-bold">ID:</span>
          <span className="font-mono text-xs">{bet.id}</span>
          <button
            onClick={handleCopyId}
            className="ml-2 text-gray-400 hover:text-gray-700"
          >
            <Copy size={16} />
          </button>
        </div>
        <div>
          <span className="font-bold">Evento:</span> {bet.eventName || "-"}
        </div>
        <div>
          <span className="font-bold">Peleadores:</span> {bet.fighterNames?.red}{" "}
          vs {bet.fighterNames?.blue}
        </div>
        <div>
          <span className="font-bold">Monto:</span> ${bet.amount}
        </div>
        <div>
          <span className="font-bold">Cuota:</span> {bet.odds}
        </div>
        <div>
          <span className="font-bold">Estado:</span>{" "}
          <StatusChip status={bet.status} size="sm" />
        </div>
        <div>
          <span className="font-bold">Resultado:</span> {bet.result || "-"}
        </div>
        <div>
          <span className="font-bold">Creada:</span>{" "}
          {new Date(bet.createdAt).toLocaleString()}
        </div>
        {/* Acción rápida: cancelar apuesta */}
        {(bet.status === "pending" || bet.status === "active") &&
          onCancelBet && (
            <button
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
              onClick={() => onCancelBet(bet.id)}
            >
              Cancelar apuesta
            </button>
          )}
      </div>
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

export default BetDetailModal;
