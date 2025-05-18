// models/Wallet.ts
interface Wallet {
  userId: string; // Referencia a User
  balance: number; // Saldo disponible
  frozenAmount: number; // Monto congelado en apuestas activas
  createdAt: Date;
  updatedAt: Date;
  transactions: Transaction[]; // Relación con transacciones
}

interface Transaction {
  id: string;
  walletId: string; // Referencia a Wallet
  type: "deposit" | "withdrawal" | "bet-win" | "bet-loss" | "bet-refund";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  reference?: string; // Referencia externa (ej: ID de transacción en Kushki)
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
