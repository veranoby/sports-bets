// frontend/src/types/walletOperation.ts

export interface WalletOperation {
  id: string;
  userId: string;
  walletId: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  paymentProofUrl?: string;
  adminProofUrl?: string;
  adminNotes?: string;
  rejectionReason?: string;
  processedBy?: string;
  processedAt?: string;
  completedAt?: string;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletOperationFilters {
  status?: string;
  type?: "deposit" | "withdrawal";
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface WalletOperationStats {
  deposit?: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    cancelled: number;
  };
  withdrawal?: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    cancelled: number;
  };
  totals?: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    cancelled: number;
  };
}

export interface CreateDepositData {
  amount: number;
  paymentProofUrl?: string;
}

export interface CreateWithdrawalData {
  amount: number;
}

export interface ApproveOperationData {
  adminNotes?: string;
}

export interface CompleteOperationData {
  adminProofUrl: string;
  adminNotes?: string;
}

export interface RejectOperationData {
  rejectionReason: string;
  adminNotes?: string;
}

export interface UploadProofData {
  adminProofUrl: string;
}
