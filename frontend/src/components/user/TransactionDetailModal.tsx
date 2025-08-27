import React from "react";
import Modal from "../shared/Modal";
import StatusChip from "../shared/StatusChip";
import type { Transaction } from "../../types";

// Copiado de StatusChip para tipado estricto
type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "live"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "settled"
  | "matched"
  | "connected"
  | "disconnected"
  | "banned"
  | "postponed"
  | "betting"
  | "closed"
  | "processing"
  | "confirmed"
  | "failed"
  | "unmatched"
  | "retrying";

const TransactionDetailModal = ({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) => {
  if (!transaction) return null;

  return (
    <Modal
      title="Detalle de Transacción"
      isOpen={!!transaction}
      onClose={onClose}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-bold">ID:</span>
          <span className="font-mono text-xs">{transaction.id}</span>
        </div>
        <div>
          <span className="font-bold">Tipo:</span> {transaction.type}
        </div>
        <div>
          <span className="font-bold">Estado:</span>{" "}
          <StatusChip status={transaction.status as StatusType} size="sm" />
        </div>
        <div>
          <span className="font-bold">Monto:</span> ${transaction.amount}
        </div>
        <div>
          <span className="font-bold">Descripción:</span>{" "}
          {transaction.description}
        </div>
        <div>
          <span className="font-bold">Fecha:</span>{" "}
          {new Date(transaction.createdAt).toLocaleString()}
        </div>
        {transaction.reference && (
          <div>
            <span className="font-bold">Referencia:</span>{" "}
            {transaction.reference}
          </div>
        )}
        {/* Acciones rápidas futuras aquí */}
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

export default TransactionDetailModal;
