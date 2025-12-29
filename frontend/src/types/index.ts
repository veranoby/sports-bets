import React from "react";

// Tipos centralizados para evitar importaciones circulares

import type { Article } from "./article";

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

export type { Article };

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export interface MonitoringAlert {
  id: string;
  level: "critical" | "warning" | "info";
  service: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface SystemStats {
  timestamp: string;
  activeUsers: number;
  liveEvents: number;
  activeBets: number;
  connectionCount: number;
  requestsPerMinute: number;
  errorRate: number;
  memory: {
    currentMB: number;
    limitMB: number;
    percentUsed: number;
  };
  database: {
    activeConnections: number;
    availableConnections: number;
    queuedRequests: number;
    totalConnections: number;
    status: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  passwordUpdatedAt?: string;
  role: "admin" | "operator" | "venue" | "user" | "gallera";
  isActive: boolean;
  approved?: boolean;
  profileInfo?: {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    identificationNumber?: string;
    verificationLevel: "none" | "basic" | "full";
    images?: string[];
    // Venue fields
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
    taxId?: string;
    licenseNumber?: string;
    venueName?: string;
    venueLocation?: string;
    venueDescription?: string;
    venueEmail?: string;
    venueWebsite?: string;
    // Gallera fields
    registrationDetails?: string;
    galleraName?: string;
    galleraLocation?: string;
    galleraDescription?: string;
    galleraEmail?: string;
    galleraWebsite?: string;
    // Additional properties for GalleraDetailPage
    location?: string;
    description?: string;
    establishedDate?: string;
    certified?: boolean;
    rating?: number;
    premiumLevel?: string;
    imageUrl?: string;
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  created_at?: string; // For API compatibility
  // Suscripción normalizada proveniente de /api/users/profile
  subscription?: UserSubscription;
  // Adding wallet info for unified user profile
  wallet?: {
    balance: number;
    pendingBalance?: number;
    lastTransaction?: {
      id: string;
      type: "deposit" | "withdrawal" | "bet" | "win";
      amount: number;
      date: string;
    };
  };
  // API response data
  events?: EventData[];
  /** @deprecated FASE 5: Venue data moved to User.profileInfo for users with role='venue' */
  venues?: Venue[];
  /** @deprecated FASE 5: Gallera data moved to User.profileInfo for users with role='gallera' */
  galleras?: Gallera[];
  user?: {
    profileInfo?: {
      fullName?: string;
    };
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "general" | "event" | "bet" | "system";
  status: "sent" | "scheduled" | "failed";
  userId?: string;
  readAt?: Date | string;
  createdAt: string;
  updatedAt?: string;
  scheduledFor?: string;
}

export interface UserSubscription {
  id: string;
  plan: "free" | "basic" | "premium";
  status: "active" | "cancelled" | "expired" | "pending";
  expiresAt?: string;
  manual_expires_at?: string;
  features: string[];
  [key: string]: unknown; // Index signature for compatibility
}

// Type alias for form data compatibility
export type SubscriptionData = UserSubscription;

/**
 * @deprecated FASE 5 Consolidation (2025-11-04): Venue data now stored in User.profileInfo
 *
 * Migration Guide:
 * - Old: venue.name → New: user.profileInfo.venueName
 * - Old: venue.location → New: user.profileInfo.venueLocation
 * - Old: venue.description → New: user.profileInfo.venueDescription
 * - Old: venue.contactInfo.email → New: user.profileInfo.venueEmail
 * - Old: venue.contactInfo.website → New: user.profileInfo.venueWebsite
 * - Old: venue.images → New: user.profileInfo.images
 *
 * API Migration:
 * - Old: venuesAPI.getAll() → New: usersAPI.getAll({ role: 'venue' })
 * - Old: venuesAPI.update(id, data) → New: usersAPI.updateProfileInfo(userId, data)
 */
export interface Venue {
  id: string;
  name: string;
  address?: string;
  location?: string;
  description?: string;
  status?: "active" | "cancelled" | "expired" | "pending";
  isActive: boolean;
  imageUrl?: string;
  images?: string[];
  ownerId?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  features?: string[];
  certified?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * @deprecated FASE 5 Consolidation (2025-11-04): Gallera data now stored in User.profileInfo
 *
 * Migration Guide:
 * - Old: gallera.name → New: user.profileInfo.galleraName
 * - Old: gallera.location → New: user.profileInfo.galleraLocation
 * - Old: gallera.description → New: user.profileInfo.galleraDescription
 * - Old: gallera.contactInfo.email → New: user.profileInfo.galleraEmail
 * - Old: gallera.contactInfo.website → New: user.profileInfo.galleraWebsite
 * - Old: gallera.specialties → New: user.profileInfo.galleraSpecialties
 * - Old: gallera.activeRoosters → New: user.profileInfo.galleraActiveRoosters
 * - Old: gallera.images → New: user.profileInfo.images
 *
 * API Migration:
 * - Old: gallerasAPI.getAll() → New: usersAPI.getAll({ role: 'gallera' })
 * - Old: gallerasAPI.update(id, data) → New: usersAPI.updateProfileInfo(userId, data)
 */
export interface Gallera {
  id: string;
  name: string;
  location?: string;
  description?: string;
  status?: "active" | "cancelled" | "expired" | "pending";
  isActive?: boolean;
  imageUrl?: string;
  specialties?: {
    breeds?: unknown[];
    trainingMethods?: unknown[];
    experience?: string;
  };
  activeRoosters?: number;
  establishedDate?: string;
  certified?: boolean;
  rating?: number;
  fightRecord?: {
    wins?: number;
    losses?: number;
    draws?: number;
  };
  images?: string[];
  ownerId?: string;
  articles?: unknown[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// EventData with proper typing from API responses
export interface EventData {
  id: string;
  name: string;
  description?: string;
  scheduledDate: string;
  startTime?: string;
  status:
    | "upcoming"
    | "live"
    | "completed"
    | "cancelled"
    | "betting"
    | "in-progress"
    | "scheduled";
  venue: {
    id: string;
    name: string;
    location?: string;
    profileInfo?: {
      venueName?: string;
      venueLocation?: string;
      venueDescription?: string;
      venueEmail?: string;
      venueWebsite?: string;
      images?: string[];
    };
  };
  liveStream?: {
    url?: string;
    isActive: boolean;
    viewers?: number;
  };
  betting?: {
    isEnabled: boolean;
    minBet?: number;
    maxBet?: number;
    odds?: Record<string, number>;
  };
  participants?: {
    gallero1?: string;
    gallero2?: string;
    rooster1?: string;
    rooster2?: string;
  };
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  categoryId?: string;
  venueId: string;
  operatorId?: string;
  operator?: string | { username: string };
  streamKey?: string;
  currentViewers?: number;
  activeBets?: number;
  completedFights?: number;
  totalFights?: number;
  totalPrizePool?: number;
  streamStatus?: string;
  fights?: Fight[];
}

// For compatibility with some components using Event name
export type Event = EventData;

export interface Bet {
  id: string;
  eventId: string;
  userId: string;
  amount: number;
  odds: number; // Made required
  side: "red" | "blue";
  status: "pending" | "won" | "lost" | "cancelled" | "active";
  payout?: number;
  placedAt: string;
  settledAt?: string;
  fighterNames?: {
    red: string;
    blue: string;
  };
  result?: string;
  fightId: string;
  createdAt?: string;
  createdBy?: string;
  choice?: string;
}

export interface BetData extends Omit<Bet, "odds"> {
  odds?: number; // Optional in BetData
  event?: EventData;
  user?: User;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  pendingBalance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fight interface for cockfighting events (VERIFIED against backend/src/models/Fight.ts)
export interface Fight {
  id: string;
  eventId: string;
  number: number; // Required in database
  redCorner: string; // Required in database
  blueCorner: string; // Required in database
  weight: number; // Required in database
  notes?: string;
  status: "upcoming" | "betting" | "live" | "completed" | "cancelled";
  initialOdds?: {
    red: number;
    blue: number;
  };
  bettingStartTime?: string;
  bettingEndTime?: string;
  totalBets?: number;
  totalAmount?: number;
  result?: "red" | "blue" | "draw" | "cancelled";
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

// Bet side and status enums
export type BetSide = "rooster1" | "rooster2" | "draw";
export type BetStatus = "pending" | "won" | "lost" | "cancelled" | "refunded";

export interface Transaction {
  id: string;
  walletId: string;
  type: "deposit" | "withdrawal" | "bet" | "win" | "refund";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  description?: string;
  reference?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: "bank_transfer" | "mobile_money" | "card";
  provider: string;
  accountInfo: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

// Props interfaces for components
export interface TabsProps {
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

// Component interfaces
export interface ToggleProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface AlertDialogHeaderProps {
  children: React.ReactNode;
}

export interface AlertDialogTitleProps {
  children: React.ReactNode;
}

export interface AlertDialogDescriptionProps {
  children: React.ReactNode;
}

export interface AlertDialogFooterProps {
  children: React.ReactNode;
}

export interface AlertDialogActionProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export interface AlertDialogCancelProps {
  onClick?: () => void;
  children: React.ReactNode;
}

// Form interfaces
export interface FormFieldProps {
  name: string;
  children: React.ReactNode;
}

export interface FormItemProps {
  children: React.ReactNode;
  className?: string;
}

export interface FormLabelProps {
  children: React.ReactNode;
  className?: string;
}

export interface FormControlProps {
  children: React.ReactNode;
}

export interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export interface FormMessageProps {
  className?: string;
  children?: React.ReactNode;
}

// Button interfaces
export interface ButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

// Additional UI component interfaces
export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export interface AvatarProps {
  children: React.ReactNode;
  className?: string;
}

export interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}

export interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  children: React.ReactNode;
  className?: string;
}

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onSelect?: () => void;
}

export interface DropdownMenuSeparatorProps {
  className?: string;
}

export interface TooltipProps {
  children: React.ReactNode;
}

export interface TooltipTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface SheetTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export interface SheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface SheetDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

// Additional missing interfaces
export interface BettingNotificationsResponse {
  notifications: Notification[];
  total: number;
  type?: string;
  data?: unknown;
  amount?: number;
  fighter?: string;
}

export interface UserProfileFormProps {
  user: User;
  onSave?: () => Promise<void>;
  onCancel?: () => void;
  fullNameLabel?: string;
}
