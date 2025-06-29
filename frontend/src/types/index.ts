// Tipos centralizados para evitar importaciones circulares

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "operator" | "venue" | "user";
  isActive: boolean;
  profileInfo?: {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    identificationNumber?: string;
    verificationLevel: "none" | "basic" | "full";
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  venueId: string;
  scheduledDate: string;
  endDate?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
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
}

export interface Fight {
  id: string;
  eventId: string;
  redFighter: string;
  blueFighter: string;
  status: FightStatus;
  result?: FightResult;
  startTime?: Date;
  endTime?: Date;
  createdAt: string;
  updatedAt: string;
  event?: Event;
  bets?: Bet[];
}

// 1. TIPOS BASE PARA APUESTAS (agregar si faltan)
export type BetSide = "red" | "blue";
export type BetStatus = "pending" | "active" | "settled" | "cancelled";
export type BetResult = "win" | "loss" | "draw" | "void";
export type BetType = "flat" | "doy";
export type ProposalStatus = "none" | "pending" | "accepted" | "rejected";

// 2. INTERFACE BET COMPLETA (reemplazar la existente)
export interface Bet {
  id: string;
  userId: string;
  fightId: string;
  amount: number;
  side: BetSide;
  status: BetStatus;
  result?: BetResult;
  odds: number;
  payout?: number;
  potentialWin: number;
  createdAt: Date;
  updatedAt: Date;

  // Campos para sistema PAGO/DOY
  betType?: BetType;
  proposalStatus?: ProposalStatus;
  parentBetId?: string;

  // Relaciones y datos adicionales
  matchedWith?: string;
  terms?: {
    ratio: number;
    isOffer: boolean;
    pagoAmount?: number;
    doyAmount?: number;
    proposedBy?: string;
  };

  // Datos poblados
  fight?: Fight;
  user?: User;
  matchedBet?: Bet;
  eventName?: string;
  fighterNames?: {
    red: string;
    blue: string;
  };
  isLive?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  description?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  ownerId: string;
  status: "pending" | "active" | "suspended";
  isVerified: boolean;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  owner?: User;
}

export interface Wallet {
  balance: number;
  frozenAmount: number;
  availableBalance: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: "deposit" | "withdrawal" | "bet-win" | "bet-loss" | "bet-refund";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  reference?: string;
  description: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  plan: "daily" | "monthly";
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  autoRenew: boolean;
  amount?: number;
  daysRemaining: number;
  isActive: boolean;
}

// 3. NAVIGATION PAGE TYPE (agregar si falta)
export type NavigationPage = "home" | "events" | "bets" | "wallet" | "profile";

// 4. FIGHT TYPES (verificar que existan)
export type FightStatus = "scheduled" | "live" | "finished" | "cancelled";
export type FightResult = "red" | "blue" | "draw" | "no_contest";

// 5. STREAMING TYPES (agregar si faltan)
export type StreamQuality = "720p" | "480p" | "360p";
export type StreamStatus = "connected" | "disconnected" | "retrying";

// Tipos para StatsGrid
export interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period: string;
  };
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  format?: "currency" | "percentage" | "number";
  description?: string;
}

export interface ChartDataset {
  id: string;
  labels: string[];
  dataset: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  };
}
