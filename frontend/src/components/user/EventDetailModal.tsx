import React from "react";
import Modal from "../shared/Modal";
import StatusChip from "../shared/StatusChip";
import type { Event } from "../../types";

// Copio el tipo StatusType de StatusChip para tipado estricto
// Mantener sincronizado si se actualiza en StatusChip
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

const EventDetailModal = ({
  event,
  onClose,
  onActivateEvent,
}: {
  event: Event;
  onClose: () => void;
  onActivateEvent?: (eventId: string) => void;
}) => {
  if (!event) return null;

  return (
    <Modal title="Detalle de Evento" isOpen={!!event} onClose={onClose}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-bold">ID:</span>
          <span className="font-mono text-xs">{event.id}</span>
          <button
            onClick={() => navigator.clipboard.writeText(event.id)}
            className="ml-2 text-gray-400 hover:text-gray-700"
          >
            Copiar
          </button>
        </div>
        <div>
          <span className="font-bold">Nombre:</span> {event.name}
        </div>
        <div>
          <span className="font-bold">Estado:</span>{" "}
          <StatusChip status={event.status as StatusType} size="sm" />
        </div>
        <div>
          <span className="font-bold">Fecha:</span>{" "}
          {new Date(event.scheduledDate).toLocaleString()}
        </div>
        <div>
          <span className="font-bold">Venue:</span>{" "}
          {event.venue?.name || event.venueId}
        </div>
        <div>
          <span className="font-bold">Total de Peleas:</span>{" "}
          {event.totalFights}
        </div>
        <div>
          <span className="font-bold">Apuestas:</span> {event.totalBets}
        </div>
        <div>
          <span className="font-bold">Premio acumulado:</span> $
          {event.totalPrizePool}
        </div>
        <div>
          <span className="font-bold">Creado:</span>{" "}
          {new Date(event.createdAt).toLocaleString()}
        </div>
        {/* Acción rápida: activar evento */}
        {event.status === "scheduled" && onActivateEvent && (
          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => onActivateEvent(event.id)}
          >
            Activar evento
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

export default EventDetailModal;
