// models/Bet.ts
interface Bet {
  id: string;
  fightId: string; // Referencia a Fight
  userId: string; // Referencia a User (apostador)
  side: "red" | "blue";
  amount: number;
  potentialWin: number; // Calculado según términos
  status: "pending" | "active" | "completed" | "cancelled";
  result?: "win" | "loss" | "draw" | "cancelled";
  matchedWith?: string; // Referencia a otra Bet (para apuestas P2P)
  terms?: {
    ratio: number; // Ej: 1.8 significa que por cada $1, se paga $1.80
    isOffer: boolean; // Si es una oferta pendiente de ser aceptada
  };
  createdAt: Date;
  updatedAt: Date;
}
