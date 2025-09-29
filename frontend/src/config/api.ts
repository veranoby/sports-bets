import axios from "axios";
import type { Event, Venue, Gallera } from "../types";

// Configuración base de la API
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Crear instancia de axios con configuración base
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Extraer mensaje de error del backend
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Error desconocido";

    return Promise.reject(new Error(errorMessage));
  },
);

// Servicios API organizados por categoría
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    apiClient.post("/auth/register", data),

  login: (data: { login: string; password: string }) =>
    apiClient.post("/auth/login", data),

  me: () => apiClient.get("/auth/me"),

  refreshToken: () => apiClient.post("/auth/refresh"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post("/auth/change-password", data),

  logout: () => apiClient.post("/auth/logout"),
};

export const eventsAPI = {
  getAll: (params?: {
    venueId?: string;
    status?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
    includeVenue?: boolean;
    includeOperator?: boolean;
    includeStats?: boolean;
  }) => apiClient.get("/events", { params }),

  getById: (id: string) => apiClient.get(`/events/${id}`),

  create: (data: {
    name: string;
    venueId: string;
    scheduledDate: string;
    operatorId?: string;
  }) => apiClient.post("/events", data),

  update: (id: string, data: Partial<Event>) =>
    apiClient.put(`/events/${id}`, data),

  activate: (id: string) => apiClient.post(`/events/${id}/activate`),

  startStream: (id: string) => apiClient.post(`/events/${id}/stream/start`),

  stopStream: (id: string) => apiClient.post(`/events/${id}/stream/stop`),

  getStreamStatus: (id: string) => apiClient.get(`/events/${id}/stream/status`),

  complete: (id: string) => apiClient.post(`/events/${id}/complete`),

  getStats: (id: string) => apiClient.get(`/events/${id}/stats`),

  getCurrentBetting: (id: string) =>
    apiClient.get(`/events/${id}/current-betting`),

  delete: (id: string) => apiClient.delete(`/events/${id}`),

  cancel: (id: string) => apiClient.post(`/events/${id}/cancel`),
};

export const fightsAPI = {
  getAll: (params?: { eventId?: string; status?: string }) =>
    apiClient.get("/fights", { params }),

  getById: (id: string) => apiClient.get(`/fights/${id}`),

  create: (data: {
    eventId: string;
    number: number;
    redCorner: string;
    blueCorner: string;
    weight: number;
    notes?: string;
    initialOdds?: { red: number; blue: number };
  }) => apiClient.post("/fights", data),

  update: (
    id: string,
    data: {
      redCorner?: string;
      blueCorner?: string;
      weight?: number;
      notes?: string;
      status?: string;
    },
  ) => apiClient.put(`/fights/${id}`, data),

  openBetting: (id: string) => apiClient.post(`/fights/${id}/open-betting`),

  closeBetting: (id: string) => apiClient.post(`/fights/${id}/close-betting`),

  recordResult: (
    id: string,
    data: { winner: "red" | "blue" | "draw"; notes?: string },
  ) => apiClient.post(`/fights/${id}/result`, data),
};

// ✅ BETS API COMPLETA CON MÉTODOS PAGO/DOY
export const betsAPI = {
  getMyBets: (params?: {
    status?: string;
    fightId?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get("/bets", { params }),

  getAvailable: (fightId: string) =>
    apiClient.get(`/bets/available/${fightId}`),

  create: (data: {
    fightId: string;
    side: "red" | "blue";
    amount: number;
    ratio?: number;
    isOffer?: boolean;
    type?: "pago" | "doy";
  }) => apiClient.post("/bets", data),

  accept: (betId: string) => apiClient.post(`/bets/${betId}/accept`),

  cancel: (betId: string) => apiClient.put(`/bets/${betId}/cancel`),

  getStats: () => apiClient.get("/bets/stats"),

  // 🎯 MÉTODOS PAGO/DOY AÑADIDOS
  proposePago: (betId: string, pagoAmount: number) =>
    apiClient.post(`/bets/${betId}/propose-pago`, { pagoAmount }),

  acceptProposal: (betId: string) =>
    apiClient.put(`/bets/${betId}/accept-proposal`),

  rejectProposal: (betId: string) =>
    apiClient.put(`/bets/${betId}/reject-proposal`),

  getPendingProposals: () => apiClient.get("/bets/pending-proposals"),
  getCompatibleBets: (params: {
    fightId: string;
    side: "red" | "blue";
    minAmount: number;
    maxAmount: number;
  }) => apiClient.get(`/bets/available/${params.fightId}`, { params }),
};

export const walletAPI = {
  getWallet: () => apiClient.get("/wallet"),

  getTransactions: (params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get("/wallet/transactions", { params }),

  deposit: (data: {
    amount: number;
    paymentMethod: "card" | "transfer";
    paymentData?: Record<string, unknown>;
  }) => apiClient.post("/wallet/deposit", data),

  withdraw: (data: {
    amount: number;
    accountNumber: string;
    accountType?: string;
    bankName?: string;
  }) => apiClient.post("/wallet/withdraw", data),

  getBalance: () => apiClient.get("/wallet/balance"),

  getStats: () => apiClient.get("/wallet/stats"),

  // ✅ Funciones nuevas para retiros y métricas financieras
  getWithdrawalRequests: (params?: {
    status?: string;
    includeUser?: boolean;
    limit?: number;
  }) => apiClient.get("/wallet/withdrawal-requests", { params }),

  processWithdrawalRequest: (
    id: string,
    data: {
      status: string;
      rejectionReason?: string;
      transferProof?: string;
      processNotes?: string;
    },
  ) => apiClient.put(`/wallet/withdrawal-requests/${id}`, data),

  getFinancialMetrics: (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get("/wallet/financial-metrics", { params }),

  getRevenueBySource: (params?: Record<string, unknown>) =>
    apiClient.get("/wallet/revenue-by-source", { params }),

  getRevenueTrends: (params?: Record<string, unknown>) =>
    apiClient.get("/wallet/revenue-trends", { params }),

  // Get wallet for specific user (admin only)
  getUserWallet: (userId: string) => apiClient.get(`/wallet/user/${userId}`),
};

export const subscriptionAPI = {
  // Get current active subscription
  getCurrentSubscription: () => apiClient.get("/subscriptions/current"),

  // Create new subscription with payment
  createSubscription: (data: {
    planType: "daily" | "monthly";
    paymentToken: string;
    autoRenew?: boolean;
  }) => apiClient.post("/subscriptions/create", data),

  // Cancel active subscription
  cancelSubscription: (data?: { reason?: string }) =>
    apiClient.post("/subscriptions/cancel", data),

  // Get payment history
  getPaymentHistory: (params?: {
    limit?: number;
    offset?: number;
    status?: "completed" | "failed" | "refunded";
  }) => apiClient.get("/subscriptions/history", { params }),

  // Check subscription access
  checkAccess: (data?: { feature?: string }) =>
    apiClient.post("/subscriptions/check-access", data),

  // Get available subscription plans
  getPlans: () => apiClient.get("/subscriptions/plans"),

  // Toggle auto-renew setting
  updateAutoRenew: (id: string, data: { autoRenew: boolean }) =>
    apiClient.put(`/subscriptions/${id}/auto-renew`, data),
};

// Legacy alias for compatibility
export const subscriptionsAPI = subscriptionAPI;

export const venuesAPI = {
  getAll: (params?: { status?: string; limit?: number; offset?: number }) =>
    apiClient.get("/venues", { params }),

  getById: (id: string) => apiClient.get(`/venues/${id}`),

  create: (data: {
    name: string;
    location: string;
    description?: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
    };
    ownerId?: string;
  }) => apiClient.post("/venues", data),

  update: (id: string, data: Partial<Venue>) =>
    apiClient.put(`/venues/${id}`, data),

  updateStatus: (id: string, status: string, reason?: string) =>
    apiClient.put(`/venues/${id}/status`, { status, reason }),

  delete: (id: string) => apiClient.delete(`/venues/${id}`),

  getMyVenues: () => apiClient.get("/venues/my/venues"),
};

export const gallerasAPI = {
  getAll: (params?: { status?: string; limit?: number; offset?: number }) =>
    apiClient.get("/galleras", { params }),

  getById: (id: string) => apiClient.get(`/galleras/${id}`),

  create: (data: {
    name: string;
    location: string;
    description?: string;
    specialties?: Gallera["specialties"];
    activeRoosters?: number;
    fightRecord?: Gallera["fightRecord"];
    ownerId?: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
    };
  }) => apiClient.post("/galleras", data),

  update: (id: string, data: Partial<Gallera>) =>
    apiClient.put(`/galleras/${id}`, data),

  updateStatus: (id: string, status: string, reason?: string) =>
    apiClient.put(`/galleras/${id}/status`, { status, reason }),

  delete: (id: string) => apiClient.delete(`/galleras/${id}`),
};

export const streamingAPI = {
  // Stream access
  getStreamAccess: (eventId: string) =>
    apiClient.get(`/streaming/events/${eventId}/stream-access`),

  validateToken: (token: string) =>
    apiClient.post("/streaming/validate-token", { token }),

  // Stream control
  startStream: (config: {
    eventId: string;
    title: string;
    description?: string;
    quality: "360p" | "480p" | "720p";
    bitrate: number;
    fps: number;
  }) => apiClient.post("/streaming/start", config),

  stopStream: (data: { streamId?: string; eventId?: string }) =>
    apiClient.post("/streaming/stop", data),

  // System status and analytics
  getSystemStatus: () => apiClient.get("/streaming/status"),

  getStreamAnalytics: (
    streamId?: string,
    params?: {
      timeRange?: "1h" | "24h" | "7d" | "30d";
      metrics?: string;
    },
  ) => apiClient.get(`/streaming/analytics/${streamId || ""}`, { params }),

  // Stream keys and RTMP
  generateStreamKey: (data: { eventId: string }) =>
    apiClient.post("/streaming/keys/generate", data),

  revokeStreamKey: (streamKey: string) =>
    apiClient.delete(`/streaming/keys/${streamKey}`),

  getOBSConfig: (streamKey: string) =>
    apiClient.get(`/streaming/obs-config/${streamKey}`),

  // System health
  getSystemHealth: () => apiClient.get("/streaming/health"),

  // Analytics events
  trackViewerEvent: (data: {
    eventId: string;
    event: string;
    data?: Record<string, unknown>;
    timestamp: string;
  }) => apiClient.post("/streaming/analytics/event", data),
};

export const usersAPI = {
  getProfile: () => apiClient.get("/users/profile"),

  updateProfile: (data: {
    profileInfo?: {
      fullName?: string;
      phoneNumber?: string;
      address?: string;
      identificationNumber?: string;
    };
  }) => apiClient.put("/users/profile", data),

  getAll: (params?: {
    role?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) => apiClient.get("/users", { params }),

  getById: (id: string) => apiClient.get(`/users/${id}`),

  create: (data: {
    username: string;
    email: string;
    password: string;
    role: string;
    profileInfo?: {
      fullName?: string;
      phoneNumber?: string;
    };
  }) => apiClient.post("/users", data),

  updateStatus: (id: string, status: boolean, reason?: string) =>
    apiClient.put(`/users/${id}/status`, { status, reason }),

  updateRole: (id: string, role: string, reason?: string) =>
    apiClient.put(`/users/${id}/role`, { role, reason }),

  // General update method (admin only)
  update: (
    id: string,
    data: {
      username?: string;
      email?: string;
      role?: string;
      profileInfo?: Record<string, unknown>;
    },
  ) => apiClient.put(`/users/${id}`, data),

  getAvailableOperators: () => apiClient.get("/users/operators/available"),

  // Get operators with active status
  getOperators: () => apiClient.get("/users?role=operator&isActive=true"),

  // Delete/deactivate user (admin only)
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

export const articlesAPI = {
  getAll: (params?: {
    search?: string;
    venueId?: string;
    status?: string;
    page?: number;
    limit?: number;
    includeAuthor?: boolean;
    includeVenue?: boolean;
    author_id?: string;
    venue_id?: string;
  }) => apiClient.get("/articles", { params }),

  getFeatured: (params?: {
    limit?: number;
    type?: "banner" | "featured" | "promotion";
  }) =>
    apiClient.get("/articles", {
      params: {
        status: "published",
        featured: true,
        limit: params?.limit || 5,
        ...params,
      },
    }),

  getById: (id: string) => apiClient.get(`/articles/${id}`),

  create: (data: {
    title: string;
    content: string;
    summary: string;
    venue_id?: string;
    featured_image_url?: string;
  }) => apiClient.post("/articles", data),

  update: (
    id: string,
    data: {
      title?: string;
      content?: string;
      summary?: string;
      venue_id?: string;
      featured_image_url?: string;
    },
  ) => apiClient.put(`/articles/${id}`, data),

  updateStatus: (id: string, status: "published" | "archived" | "pending") =>
    apiClient.put(`/articles/${id}/status`, { status }),

  delete: (id: string) => apiClient.delete(`/articles/${id}`),
};

// System API for monitoring and health
export const systemAPI = {
  getMetrics: () => apiClient.get("/system/metrics"),
  getHealth: () => apiClient.get("/system/health"),
  getLogs: () => apiClient.get("/system/logs"),
};

// Settings API for system configuration
export const settingsAPI = {
  getAll: () => apiClient.get("/settings"),
  update: (data: Record<string, unknown>) => apiClient.put("/settings", data),
  get: (key: string) => apiClient.get(`/settings/${key}`),
  set: (key: string, value: unknown) =>
    apiClient.put(`/settings/${key}`, { value }),
};

// Admin API for membership management
export const adminAPI = {
  updateUserMembership: (
    userId: string,
    data: {
      membership_type: string;
      assigned_username: string;
    },
  ) => apiClient.put(`/admin/users/${userId}/membership`, data),

  getUserMembership: (userId: string) =>
    apiClient.get(`/admin/users/${userId}/membership`),

  getMembershipStats: () => apiClient.get("/admin/membership/stats"),
};

// WebSocket configuration
export const WEBSOCKET_URL =
  import.meta.env.VITE_WS_URL || "http://localhost:3001";

// Re-exportar tipos desde el archivo de tipos (para compatibilidad)
export type {
  ApiResponse,
  User,
  Event,
  Fight,
  Bet,
  Venue,
  Wallet,
  Transaction,
  UserSubscription as Subscription,
} from "../types";
