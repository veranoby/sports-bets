// models/Event.ts
interface Event {
  id: string;
  name: string;
  venueId: string; // Referencia a Venue
  scheduledDate: Date;
  endDate?: Date;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  operatorId?: string; // Referencia al Usuario con rol 'operator'
  streamKey?: string; // Para configuración de OBS
  streamUrl?: string; // URL de la transmisión
  createdBy: string; // Referencia al Usuario que creó el evento
  createdAt: Date;
  updatedAt: Date;
  fights: Fight[]; // Relación con peleas
}
