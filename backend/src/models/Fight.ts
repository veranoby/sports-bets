// models/Fight.ts
interface Fight {
  id: string;
  eventId: string; // Referencia a Event
  number: number; // Número secuencial dentro del evento
  redCorner: string; // Nombre del criadero/gallo rojo
  blueCorner: string; // Nombre del criadero/gallo azul
  weight: number; // Peso en libras
  notes?: string;
  status: "upcoming" | "betting" | "live" | "completed" | "cancelled";
  result?: "red" | "blue" | "draw" | "cancelled";
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  bets: Bet[]; // Relación con apuestas
}
