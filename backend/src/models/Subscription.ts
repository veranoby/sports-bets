// models/Subscription.ts
interface Subscription {
  id: string;
  userId: string; // Referencia a User
  plan: "daily" | "weekly" | "monthly";
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "cancelled";
  autoRenew: boolean;
  paymentId?: string; // Referencia a Transaction
  createdAt: Date;
  updatedAt: Date;
}
