import React from "react";
import Modal from "../shared/Modal";
import StatusChip from "../shared/StatusChip";
import type { Fight } from "../../types";

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

const FightDetailModal = ({
  fight,
  onClose,
  onOpenBetting,
  onCloseBetting,
  onRecordResult,
}: {
  fight: Fight;
  onClose: () => void;
  onOpenBetting?: (fightId: string) => void;
  onCloseBetting?: (fightId: string) => void;
  onRecordResult?: (fightId: string, result: string) => void;
}) => {
  if (!fight) return null;

  return (
    <Modal title="Detalle de Pelea" isOpen={!!fight} onClose={onClose}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-bold">ID:</span>
          <span className="font-mono text-xs">{fight.id}</span>
        </div>
        <div>
          <span className="font-bold">Estado:</span>{" "}
          {/* FightStatus es subconjunto de StatusType */}
          <StatusChip status={fight.status as StatusType} size="sm" />
        </div>
        <div>
          <span className="font-bold">Peleadores:</span> {fight.redFighter} vs{" "}
          {fight.blueFighter}
        </div>
        <div>
          <span className="font-bold">Resultado:</span> {fight.result || "-"}
        </div>
        <div>
          <span className="font-bold">Inicio:</span>{" "}
          {fight.startTime ? new Date(fight.startTime).toLocaleString() : "-"}
        </div>
        <div>
          <span className="font-bold">Fin:</span>{" "}
          {fight.endTime ? new Date(fight.endTime).toLocaleString() : "-"}
        </div>
        <div>
          <span className="font-bold">Creado:</span>{" "}
          {new Date(fight.createdAt).toLocaleString()}
        </div>
        {/* Mostrar apuestas si existen */}
        {fight.bets && fight.bets.length > 0 && (
          <div>
            <span className="font-bold">Apuestas:</span>
            <ul className="list-disc ml-6 text-xs">
              {fight.bets.map((bet) => (
                <li key={bet.id}>
                  {bet.user?.username || bet.userId}: ${bet.amount} ({bet.side})
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Acciones rápidas: abrir/cerrar apuestas y registrar resultado */}
        {fight.status === "scheduled" && onOpenBetting && (
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => onOpenBetting(fight.id)}
          >
            Abrir apuestas
          </button>
        )}
        {fight.status === "live" && onCloseBetting && (
          <button
            className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded"
            onClick={() => onCloseBetting(fight.id)}
          >
            Cerrar apuestas
          </button>
        )}
        {fight.status === "live" && onRecordResult && (
          <div className="mt-4 flex gap-2">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={() => onRecordResult(fight.id, "red")}
            >
              Registrar: Gana Rojo
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => onRecordResult(fight.id, "blue")}
            >
              Registrar: Gana Azul
            </button>
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded"
              onClick={() => onRecordResult(fight.id, "draw")}
            >
              Registrar: Empate
            </button>
          </div>
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

export default FightDetailModal;
