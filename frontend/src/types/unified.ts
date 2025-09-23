import type {
  User,
  Venue,
  Fight,
  BetSide,
  BetStatus as IndexBetStatus,
} from "./index";

// Status from admin/Events.tsx
type AdminEventStatus =
  | "scheduled"
  | "active"
  | "live"
  | "completed"
  | "cancelled";
// Status from types/index.ts
type IndexEventStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

export interface UnifiedEvent {
  id: string;
  name: string;
  description?: string;
  venueId: string;
  scheduledDate: string;
  endDate?: string;
  status: AdminEventStatus | IndexEventStatus;
  operatorId?: string;
  streamKey?: string;
  streamUrl?: string;
  createdBy: string;
  totalFights: number;
  completedFights: number;
  totalBets: number;
  totalPrizePool: number;
  createdAt: string;
  updatedAt: string;
  venue?: Venue;
  operator?: User;
  creator?: User;
  fights?: Fight[];
  startTime: string;
  currentViewers?: number;
  activeBets: number;
}

// Status from LiveEvent.tsx
type LiveBetStatus = "active" | "matched" | "won" | "lost";

export interface UnifiedBet {
  id: string;
  userId: string;
  fightId: string;
  amount: number;
  side: BetSide;
  status: IndexBetStatus | LiveBetStatus;
  result?: "win" | "loss" | "draw" | "void";
  odds: number;
  payout?: number;
  potentialWin: number;
  createdAt: Date | string;
  updatedAt: Date;
  betType?: "flat" | "doy";
  proposalStatus?: "none" | "pending" | "accepted" | "rejected";
  parentBetId?: string;
  matchedWith?: string;
  terms?: {
    ratio: number;
    isOffer: boolean;
    pagoAmount?: number;
    doyAmount?: number;
    proposedBy?: string;
  };
  fight?: Fight;
  user?: User;
  matchedBet?: UnifiedBet;
  eventName?: string;
  fighterNames?: {
    red: string;
    blue: string;
  };
  isLive?: boolean;
  // From LiveEvent.tsx local Bet
  choice: string;
  createdBy: string;
}

export interface UnifiedUser extends User {
  emailVerified?: boolean;
  passwordUpdatedAt?: string;
}
