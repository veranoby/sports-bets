import axios, {
  type AxiosError,
  type Method,
  type AxiosRequestConfig,
} from "axios";
import type { Article } from "../types/article";
import type {
  ApiResponse,
  ApiError,
  Event,
  Fight,
  Venue,
  Gallera,
  Bet,
} from "../types/index";

const api = axios.create({
  baseURL: "/api", // The vite proxy in vite.config.ts will handle this
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add interceptors for handling tokens or errors globally.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

const apiCall = async <T>(
  method: Method,
  endpoint: string,
  data?: unknown,
  headers?: AxiosRequestConfig["headers"],
): Promise<ApiResponse<T>> => {
  try {
    const response = await api.request<ApiResponse<T>>({
      method,
      url: endpoint,
      data:
        method.toLowerCase() !== "get" && method.toLowerCase() !== "delete"
          ? data
          : undefined,
      params:
        method.toLowerCase() === "get" || method.toLowerCase() === "delete"
          ? data
          : undefined,
      headers,
    });
    // Return backend response directly (it already has success/data structure)
    return response.data;
  } catch (error) {
    console.error(`Error at ${endpoint}:`, error);
    const err = error as AxiosError<unknown>;
    const apiError: ApiError = {
      name: "ApiError",
      message:
        (err.response?.data as { message?: string })?.message ||
        err.message ||
        "An error occurred",
      status: err.response?.status,
    };
    return {
      success: false,
      data: null as T,
      error: apiError.message,
      code: apiError.status,
    };
  }
};

export const fightsAPI = {
  create: async (data: {
    eventId: string;
    redCorner: string;
    blueCorner: string;
    weight: number;
    number: number;
    notes?: string;
  }) => {
    return apiCall("post", "/fights", data);
  },
  openBetting: async (fightId: string) => {
    return apiCall("post", `/fights/${fightId}/open-betting`);
  },
  closeBetting: async (fightId: string) => {
    return apiCall("post", `/fights/${fightId}/close-betting`);
  },
  recordResult: async (
    fightId: string,
    result: { winner: string; method: string; round?: number; time?: string },
  ) => {
    return apiCall("post", `/fights/${fightId}/result`, result);
  },
  // Admin component methods
  getFightsByEvent: async (eventId: string) => {
    return apiCall("get", `/events/${eventId}/fights`);
  },
  createFight: async (data: Partial<Fight>) => {
    return apiCall("post", "/fights", data);
  },
  updateFightStatus: async (fightId: string, status: string) => {
    return apiCall("put", `/fights/${fightId}/status`, { status });
  },
  assignFightResult: async (
    fightId: string,
    result: { winner: string; method: string; round?: number; time?: string },
  ) => {
    return apiCall("post", `/fights/${fightId}/result`, result);
  },
};

export const adminAPI = {
  updateUserMembership: async (
    userId: string,
    data: { membership_type: string; assigned_username: string },
  ) => {
    return apiCall("put", `/admin/users/${userId}/membership`, data);
  },
};

export const userAPI = {
  create: async (data: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) => {
    return apiCall("post", "/users", data);
  },
  uploadPaymentProof: async (formData: FormData) => {
    return apiCall("post", "/users/upload-payment-proof", formData, {
      "Content-Type": "multipart/form-data",
    });
  },
  getProfile: async () => {
    return apiCall("get", "/users/profile");
  },
  getAll: async (params?: Record<string, unknown>) => {
    return apiCall("get", "/users", params);
  },
  getById: async (id: string) => {
    return apiCall("get", `/users/${id}`);
  },
};

// Wrap the axios client to return ApiResponse format
export const apiClient = {
  get: async <T>(endpoint: string, config?: { params?: Record<string, unknown> }): Promise<ApiResponse<T>> => {
    return apiCall<T>("get", endpoint, config?.params);
  },
  post: async <T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> => {
    return apiCall<T>("post", endpoint, data);
  },
  put: async <T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> => {
    return apiCall<T>("put", endpoint, data);
  },
  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiCall<T>("delete", endpoint);
  },
};

// Keep raw axios client for internal use
export const rawApiClient = api;

export const authAPI = {
  login: async (credentials: { login: string; password: string }) => {
    return apiCall("post", "/auth/login", credentials);
  },
  checkMembershipStatus: async () => {
    return apiCall("post", "/auth/check-membership-status");
  },
};

export const eventsAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    return apiCall("get", "/events", params);
  },
  getById: async (id: string) => {
    return apiCall("get", `/events/${id}`);
  },
  create: async (data: Partial<Event>) => {
    return apiCall("post", "/events", data);
  },
  update: async (id: string, data: Partial<Event>) => {
    return apiCall("put", `/events/${id}`, data);
  },
  // Admin component methods
  updateEventStatus: async (eventId: string, status: string) => {
    return apiCall("put", `/events/${eventId}/status`, { status });
  },
  assignOperator: async (eventId: string, operatorId: string) => {
    return apiCall("put", `/events/${eventId}/operator`, { operatorId });
  },
  generateStreamKey: async (eventId: string) => {
    return apiCall("post", `/events/${eventId}/stream-key`);
  },
  getCurrentBetting: async (eventId: string) => {
    return apiCall("get", `/events/${eventId}/current-betting`);
  },
};

export const venuesAPI = {
  update: async (id: string, data: Partial<Venue>) => {
    return apiCall("put", `/venues/${id}`, data);
  },
  create: async (data: Partial<Venue>) => {
    return apiCall("post", "/venues", data);
  },
  getAll: async (params?: Record<string, unknown>) => {
    return apiCall("get", "/venues", params);
  },
};

export const gallerasAPI = {
  update: async (id: string, data: Partial<Gallera>) => {
    return apiCall("put", `/galleras/${id}`, data);
  },
  create: async (data: Partial<Gallera>) => {
    return apiCall("post", "/galleras", data);
  },
};

// Add streamingAPI for missing methods
export const streamingAPI = {
  getStatus: async (streamId: string) => {
    return apiCall("get", `/streaming/${streamId}/status`);
  },
  updateStatus: async (streamId: string, status: string) => {
    return apiCall("put", `/streaming/${streamId}/status`, { status });
  },
  startStream: async (streamId: string) => {
    return apiCall("post", `/streaming/${streamId}/start`);
  },
  stopStream: async (streamId: string) => {
    return apiCall("post", `/streaming/${streamId}/stop`);
  },
  getStreamAnalytics: async (streamId?: string, params?: { timeRange?: "1h" | "24h" | "7d" | "30d"; metrics?: string; }) => {
    return apiCall("get", `/streaming/analytics/${streamId || ""}`, { params });
  },
  trackViewerEvent: async (data: { eventId: string; event: string; data?: Record<string, unknown>; timestamp: string; }) => {
    return apiCall("post", "/streaming/analytics/event", data);
  },
};

// Add missing APIs and aliases for components
export const betsAPI = {
  getMyBets: async () => {
    return apiCall("get", "/bets/my-bets");
  },
  create: async (data: Partial<Bet>) => {
    return apiCall("post", "/bets", data);
  },
  cancel: async (betId: string) => {
    return apiCall("delete", `/bets/${betId}`);
  },
  accept: async (betId: string) => {
    return apiCall("post", `/bets/${betId}/accept`);
  },
  getCompatibleBets: async (params: {
    fightId: string;
    side: "red" | "blue";
    minAmount: number;
    maxAmount: number;
  }) => {
    return apiCall("get", "/bets/compatible", params);
  },
  acceptProposal: async (betId: string) => {
    return apiCall("post", `/bets/${betId}/accept-proposal`);
  },
  rejectProposal: async (betId: string) => {
    return apiCall("post", `/bets/${betId}/reject-proposal`);
  },
  getPendingProposals: async () => {
    return apiCall("get", "/bets/pending-proposals");
  },
};

export const articlesAPI = {
  getAll: async (params?: Record<string, unknown>) => {
    return apiCall("get", "/articles", params);
  },
  getFeatured: async (params: Record<string, unknown>) => {
    return apiCall("get", "/articles/featured", params);
  },
  create: async (data: {
    title: string;
    content: string;
    summary: string;
    venue_id?: string;
    featured_image_url?: string;
  }) => {
    return apiCall("post", "/articles", data);
  },
  update: async (id: string, data: Partial<Article>) => {
    return apiCall("put", `/articles/${id}`, data);
  },
  delete: async (id: string) => {
    return apiCall("delete", `/articles/${id}`);
  },
};

export const walletAPI = {
  getBalance: async () => {
    return apiCall("get", "/wallet/balance");
  },
  addFunds: async (amount: number) => {
    return apiCall("post", "/wallet/add-funds", { amount });
  },
  getTransactions: async (params?: Record<string, unknown>) => {
    return apiCall("get", "/wallet/transactions", params);
  },
  getStats: async (params?: Record<string, unknown>) => {
    return apiCall("get", "/wallet/stats", params);
  },
};

// API aliases for backward compatibility
export const usersAPI = userAPI;
export const eventAPI = eventsAPI;
export const fightAPI = fightsAPI;
