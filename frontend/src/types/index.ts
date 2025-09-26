import React from "react";

// Tipos centralizados para evitar importaciones circulares

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  code?: number;
  message?: string;
  // Common API response properties
  users?: T;
  venues?: T;
  total?: number;
  totalPages?: number;
  articles?: T;
  parsed?: unknown;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  passwordUpdatedAt?: string;
  role: "admin" | "operator" | "venue" | "user" | "gallera";
  isActive: boolean;
  profileInfo?: {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    identificationNumber?: string;
    verificationLevel: "none" | "basic" | "full";
    // Venue fields
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
    taxId?: string;
    licenseNumber?: string;
    // Gallera fields
    registrationDetails?: string;
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  // Suscripción normalizada proveniente de /api/users/profile
  subscription?: UserSubscription;
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
  // Additional properties for UI
  streamStatus?: StreamStatus;
  currentViewers?: number;
  activeBets?: number;
  description?: string;
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
  // Additional properties for admin components
  number?: number;
  rooster_1?: string;
  rooster_2?: string;
  bets?: Bet[];
}

// 1. TIPOS BASE PARA APUESTAS (agregar si faltan)
export type BetSide = "red" | "blue";
export type BetStatus = "pending" | "active" | "settled" | "cancelled";
export type BetResult = "win" | "loss" | "draw" | "void";
export type BetType = "flat" | "doy" | "pago";
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
    website?: string;
    address?: string;
  };
  ownerId: string;
  status: "pending" | "active" | "suspended" | "rejected";
  isVerified: boolean;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  owner?: User;
}

export interface Gallera {
  id: string;
  name: string;
  location: string;
  description?: string;
  ownerId: string;
  owner_id?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  specialties?: {
    breeds?: string[];
    trainingMethods?: string[];
    experience?: string;
  };
  activeRoosters?: number;
  active_roosters?: number;
  fightRecord?: {
    wins: number;
    losses: number;
    draws: number;
  };
  fight_record?: {
    wins: number;
    losses: number;
    draws: number;
  };
  status: "pending" | "active" | "suspended" | "rejected";
  isVerified: boolean;
  is_verified?: boolean;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
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
  metadata?: unknown;
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

// Nueva representación normalizada utilizada por backend /users/profile
export interface UserSubscription {
  type: "free" | "daily" | "monthly";
  status: "active" | "cancelled" | "expired" | "pending";
  expiresAt: string | null;
  features: string[];
  remainingDays: number;
  manual_expires_at?: string;
  [key: string]: unknown; // Allow additional properties for compatibility
}

export interface Proposal {
  id: string;
  proposer: User; // Could be a string ID, but using full User object based on context
  originalAmount: number;
  pagoAmount: number;
  createdAt: string; // ISO date string format
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

// 3. NAVIGATION PAGE TYPE (agregar si falta)
export type NavigationPage = "home" | "events" | "bets" | "wallet" | "profile";

// 4. FIGHT TYPES (verificar que existan)
export type FightStatus =
  | "upcoming"
  | "betting"
  | "live"
  | "completed"
  | "cancelled";
export type FightResult = "red" | "blue" | "draw" | "no_contest";

// 5. STREAMING TYPES (agregar si faltan)
export type StreamQuality = "720p" | "480p" | "360p";
export type StreamStatus =
  | "connected"
  | "disconnected"
  | "retrying"
  | "connecting";

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

// Betting Notifications Types
export interface BettingNotificationData {
  type: string;
  amount: number;
  fighter: string;
}

export interface BettingNotificationsResponse {
  type: string;
  amount?: number;
  fighter?: string;
  data?: {
    amount: number;
    fighter: string;
  };
}

// BetData interface for form data before being converted to Bet
export interface BetData {
  id: string;
  userId?: string;
  fightId: string;
  amount: number;
  side: BetSide;
  status: BetStatus;
  result?: BetResult;
  odds?: number;
  payout?: number;
  potentialWin?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  betType?: BetType;
  proposalStatus?: ProposalStatus;
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
  matchedBet?: Bet;
  eventName?: string;
  fighterNames?: {
    red: string;
    blue: string;
  };
  isLive?: boolean;
}

// EventData interface for API responses that may differ from Event
export interface EventData extends Event {
  currentViewers?: number;
  activeBets?: number;
  totalViewers?: number;
}

export interface EventDetailData {
  event: Event;
  fights: Fight[];
}
