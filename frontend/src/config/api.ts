import axios, { type AxiosResponse } from "axios";
import type {
  APIResponse,
  User,
  Event,
  Fight,
  Bet,
  Venue,
  Wallet,
  Transaction,
  Subscription,
} from "../types";

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
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    console.log("🔍 INTERCEPTOR - Raw axios response:", response);
    console.log("🔍 INTERCEPTOR - response.data:", response.data);
    console.log("🔍 INTERCEPTOR - Returning:", response.data);
    return response.data; // Return the raw axios response
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Extract error message from backend
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Error desconocido";

    return Promise.reject(new Error(errorMessage));
  }
);

// Helper para formatear respuestas de API a APIResponse
const formatApiResponse = <T>(
  promise: Promise<AxiosResponse<T>>
): Promise<APIResponse<T>> => {
  console.log("🔍 formatApiResponse - Promise received:", promise);

  return promise
    .then((res) => {
      console.log("🔍 formatApiResponse - Raw res:", res);

      const result = {
        success: true,
        data: res.data || res, // 🔧 FIX: Manejar ambos casos
      };

      console.log("🔍 formatApiResponse - Final result:", result);
      return result;
    })
    .catch((err) => {
      console.log("🔍 formatApiResponse - Error caught:", err);
      const message = err.message || "Error desconocido";
      return Promise.reject({ success: false, message });
    });
};

// Servicios API organizados por categoría
export const authAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
  }): Promise<APIResponse<{ user: User; token: string }>> =>
    formatApiResponse(
      apiClient.post<{ user: User; token: string }>("/auth/register", data)
    ),

  login: (data: {
    login: string;
    password: string;
  }): Promise<APIResponse<{ user: User; token: string }>> =>
    formatApiResponse(
      apiClient.post<{ user: User; token: string }>("/auth/login", data)
    ),

  me: (): Promise<APIResponse<{ user: User; wallet: any }>> =>
    formatApiResponse(apiClient.get<{ user: User; wallet: any }>("/auth/me")),

  refreshToken: (): Promise<APIResponse<{ token: string }>> =>
    formatApiResponse(apiClient.post<{ token: string }>("/auth/refresh")),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(
      apiClient.post<{ message: string }>("/auth/change-password", data)
    ),

  logout: (): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(apiClient.post<{ message: string }>("/auth/logout")),
};

export const eventsAPI = {
  getAll: (params?: {
    venueId?: string;
    status?: string;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<
    APIResponse<{
      events: Event[];
      total: number;
      limit: number;
      offset: number;
    }>
  > =>
    formatApiResponse(
      apiClient.get<{
        events: Event[];
        total: number;
        limit: number;
        offset: number;
      }>("/events", { params })
    ),

  getById: (id: string): Promise<APIResponse<Event>> =>
    formatApiResponse(apiClient.get<Event>(`/events/${id}`)),

  create: (
    data: Omit<
      Event,
      | "id"
      | "status"
      | "totalFights"
      | "completedFights"
      | "totalBets"
      | "totalPrizePool"
      | "createdAt"
      | "updatedAt"
      | "venue"
      | "operator"
      | "creator"
      | "fights"
      | "startTime"
    >
  ): Promise<APIResponse<Event>> =>
    formatApiResponse(apiClient.post<Event>("/events", data)),

  update: (id: string, data: Partial<Event>): Promise<APIResponse<Event>> =>
    formatApiResponse(apiClient.put<Event>(`/events/${id}`, data)),

  activate: (id: string): Promise<APIResponse<Event>> =>
    formatApiResponse(apiClient.post<Event>(`/events/${id}/activate`)),

  startStream: (id: string): Promise<APIResponse<Event>> =>
    formatApiResponse(apiClient.post<Event>(`/events/${id}/stream/start`)),

  stopStream: (id: string): Promise<APIResponse<Event>> =>
    formatApiResponse(apiClient.post<Event>(`/events/${id}/stream/stop`)),

  getStreamStatus: (
    id: string
  ): Promise<APIResponse<{ status: string; streamUrl?: string }>> =>
    formatApiResponse(
      apiClient.get<{ status: string; streamUrl?: string }>(
        `/events/${id}/stream/status`
      )
    ),

  complete: (id: string): Promise<APIResponse<Event>> =>
    formatApiResponse(apiClient.post<Event>(`/events/${id}/complete`)),

  getStats: (id: string): Promise<APIResponse<Partial<Event>>> =>
    formatApiResponse(apiClient.get<Partial<Event>>(`/events/${id}/stats`)),

  delete: (id: string): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(apiClient.delete<{ message: string }>(`/events/${id}`)),
};

export const fightsAPI = {
  getAll: (params?: {
    eventId?: string;
    status?: string;
  }): Promise<APIResponse<Fight[]>> =>
    formatApiResponse(apiClient.get<Fight[]>("/fights", { params })),

  getById: (id: string): Promise<APIResponse<Fight>> =>
    formatApiResponse(apiClient.get<Fight>(`/fights/${id}`)),

  create: (
    data: Omit<
      Fight,
      | "id"
      | "status"
      | "result"
      | "startTime"
      | "endTime"
      | "createdAt"
      | "updatedAt"
      | "event"
      | "bets"
    >
  ): Promise<APIResponse<Fight>> =>
    formatApiResponse(apiClient.post<Fight>("/fights", data)),

  update: (id: string, data: Partial<Fight>): Promise<APIResponse<Fight>> =>
    formatApiResponse(apiClient.put<Fight>(`/fights/${id}`, data)),

  openBetting: (id: string): Promise<APIResponse<Fight>> =>
    formatApiResponse(apiClient.post<Fight>(`/fights/${id}/open-betting`)),

  closeBetting: (id: string): Promise<APIResponse<Fight>> =>
    formatApiResponse(apiClient.post<Fight>(`/fights/${id}/close-betting`)),

  recordResult: (
    id: string,
    result: "red" | "blue" | "draw" | "no_contest"
  ): Promise<APIResponse<Fight>> =>
    formatApiResponse(
      apiClient.post<Fight>(`/fights/${id}/result`, { result })
    ),
};

export const betsAPI = {
  getMyBets: (params?: {
    status?: string;
    fightId?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<{ bets: Bet[]; total: number }>> =>
    formatApiResponse(
      apiClient.get<{ bets: Bet[]; total: number }>("/bets", { params })
    ),

  getAvailable: (fightId: string): Promise<APIResponse<Bet[]>> =>
    formatApiResponse(apiClient.get<Bet[]>(`/bets/available/${fightId}`)),

  create: (
    data: Pick<Bet, "fightId" | "side" | "amount"> & {
      terms?: { ratio?: number; isOffer?: boolean };
    }
  ): Promise<APIResponse<Bet>> =>
    formatApiResponse(apiClient.post<Bet>("/bets", data)),

  accept: (betId: string): Promise<APIResponse<Bet>> =>
    formatApiResponse(apiClient.post<Bet>(`/bets/${betId}/accept`)),

  cancel: (betId: string): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(
      apiClient.put<{ message: string }>(`/bets/${betId}/cancel`, {})
    ),

  getStats: (): Promise<APIResponse<Record<string, number>>> =>
    formatApiResponse(apiClient.get<Record<string, number>>("/bets/stats")),
};

export const walletAPI = {
  getWallet: (): Promise<
    APIResponse<{ wallet: Wallet; recentTransactions: Transaction[] }>
  > =>
    formatApiResponse(
      apiClient.get<{ wallet: Wallet; recentTransactions: Transaction[] }>(
        "/wallet"
      )
    ),

  getTransactions: (params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<APIResponse<{ transactions: Transaction[]; total: number }>> =>
    formatApiResponse(
      apiClient.get<{ transactions: Transaction[]; total: number }>(
        "/wallet/transactions",
        { params }
      )
    ),

  deposit: (data: {
    amount: number;
    paymentMethod: "card" | "transfer";
    paymentData?: any;
  }): Promise<APIResponse<{ message: string; transactionId?: string }>> =>
    formatApiResponse(
      apiClient.post<{ message: string; transactionId?: string }>(
        "/wallet/deposit",
        data
      )
    ),

  withdraw: (data: {
    amount: number;
    accountNumber: string;
    accountType?: string;
    bankName?: string;
  }): Promise<APIResponse<{ message: string; transactionId?: string }>> =>
    formatApiResponse(
      apiClient.post<{ message: string; transactionId?: string }>(
        "/wallet/withdraw",
        data
      )
    ),

  getBalance: (): Promise<
    APIResponse<{ balance: number; frozenAmount: number }>
  > =>
    formatApiResponse(
      apiClient.get<{ balance: number; frozenAmount: number }>(
        "/wallet/balance"
      )
    ),

  getStats: (): Promise<APIResponse<Record<string, number>>> =>
    formatApiResponse(apiClient.get<Record<string, number>>("/wallet/stats")),
};

export const subscriptionsAPI = {
  getMy: (): Promise<APIResponse<Subscription[]>> =>
    formatApiResponse(apiClient.get<Subscription[]>("/subscriptions")),

  getCurrent: (): Promise<APIResponse<Subscription>> =>
    formatApiResponse(apiClient.get<Subscription>("/subscriptions/current")),

  create: (data: {
    plan: "daily" | "monthly";
    autoRenew?: boolean;
    paymentData?: any;
  }): Promise<APIResponse<Subscription>> =>
    formatApiResponse(apiClient.post<Subscription>("/subscriptions", data)),

  cancel: (id: string): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(
      apiClient.put<{ message: string }>(`/subscriptions/${id}/cancel`, {})
    ),

  toggleAutoRenew: (
    id: string,
    autoRenew: boolean
  ): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(
      apiClient.put<{ message: string }>(`/subscriptions/${id}/auto-renew`, {
        autoRenew,
      })
    ),

  getPlans: (): Promise<
    APIResponse<{ id: string; name: string; price: number; duration: string }[]>
  > =>
    formatApiResponse(
      apiClient.get<
        { id: string; name: string; price: number; duration: string }[]
      >("/subscriptions/plans/info")
    ),

  checkAccess: (): Promise<APIResponse<{ hasAccess: boolean }>> =>
    formatApiResponse(
      apiClient.post<{ hasAccess: boolean }>("/subscriptions/check-access")
    ),

  extend: (id: string): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(
      apiClient.put<{ message: string }>(`/subscriptions/${id}/extend`, {})
    ),
};

export const venuesAPI = {
  getAll: (params?: {
    status?: string;
    ownerId?: string;
  }): Promise<APIResponse<{ venues: Venue[]; total: number }>> =>
    formatApiResponse(
      apiClient.get<{ venues: Venue[]; total: number }>("/venues", { params })
    ),

  getById: (id: string): Promise<APIResponse<Venue>> =>
    formatApiResponse(apiClient.get<Venue>(`/venues/${id}`)),

  create: (
    data: Omit<
      Venue,
      | "id"
      | "ownerId"
      | "status"
      | "isVerified"
      | "createdAt"
      | "updatedAt"
      | "images"
    >
  ): Promise<APIResponse<Venue>> =>
    formatApiResponse(apiClient.post<Venue>("/venues", data)),

  update: (id: string, data: Partial<Venue>): Promise<APIResponse<Venue>> =>
    formatApiResponse(apiClient.put<Venue>(`/venues/${id}`, data)),

  updateStatus: (
    id: string,
    status: "approved" | "rejected",
    reason?: string
  ): Promise<APIResponse<Venue>> =>
    formatApiResponse(
      apiClient.put<Venue>(`/venues/${id}/status`, { status, reason })
    ),

  getVenueEvents: (id: string): Promise<APIResponse<Event[]>> =>
    formatApiResponse(apiClient.get<Event[]>(`/venues/${id}/events`)),

  delete: (id: string): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(apiClient.delete<{ message: string }>(`/venues/${id}`)),
};

export const usersAPI = {
  getAll: (params?: {
    role?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<{ users: User[]; total: number }>> =>
    formatApiResponse(
      apiClient.get<{ users: User[]; total: number }>("/users", { params })
    ),

  getById: (id: string): Promise<APIResponse<User>> =>
    formatApiResponse(apiClient.get<User>(`/users/${id}`)),

  create: (
    data: Omit<
      User,
      | "id"
      | "role"
      | "isActive"
      | "profileInfo"
      | "lastLogin"
      | "createdAt"
      | "updatedAt"
    >
  ): Promise<APIResponse<User>> =>
    formatApiResponse(apiClient.post<User>("/users", data)),

  updateStatus: (id: string, isActive: boolean): Promise<APIResponse<User>> =>
    formatApiResponse(apiClient.put<User>(`/users/${id}/status`, { isActive })),

  updateRole: (id: string, role: string): Promise<APIResponse<User>> =>
    formatApiResponse(apiClient.put<User>(`/users/${id}/role`, { role })),

  updateProfile: (
    id: string,
    data: Partial<User["profileInfo"]>
  ): Promise<APIResponse<User>> =>
    formatApiResponse(apiClient.patch<User>(`/users/${id}/profile`, data)),

  delete: (id: string): Promise<APIResponse<{ message: string }>> =>
    formatApiResponse(apiClient.delete<{ message: string }>(`/users/${id}`)),
};

// WebSocket configuration
export const WEBSOCKET_URL =
  import.meta.env.VITE_WS_URL || "http://localhost:3001";

// Re-exportar tipos desde el archivo de tipos (para compatibilidad)
export type {
  APIResponse,
  User,
  Event,
  Fight,
  Bet,
  Venue,
  Wallet,
  Transaction,
  Subscription,
} from "../types";
