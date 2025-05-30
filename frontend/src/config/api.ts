import axios from 'axios';

// Configuración base de la API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Crear instancia de axios con configuración base
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Extraer mensaje de error del backend
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Error desconocido';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Servicios API organizados por categoría
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    apiClient.post('/auth/register', data),
  
  login: (data: { login: string; password: string }) =>
    apiClient.post('/auth/login', data),
  
  me: () => apiClient.get('/auth/me'),
  
  refreshToken: () => apiClient.post('/auth/refresh'),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),
  
  logout: () => apiClient.post('/auth/logout'),
};

export const eventsAPI = {
  getAll: (params?: { venueId?: string; status?: string; upcoming?: boolean; limit?: number; offset?: number }) =>
    apiClient.get('/events', { params }),
  
  getById: (id: string) => apiClient.get(`/events/${id}`),
  
  create: (data: {
    name: string;
    venueId: string;
    scheduledDate: string;
    operatorId?: string;
  }) => apiClient.post('/events', data),
  
  update: (id: string, data: any) => apiClient.put(`/events/${id}`, data),
  
  activate: (id: string) => apiClient.post(`/events/${id}/activate`),
  
  startStream: (id: string) => apiClient.post(`/events/${id}/stream/start`),
  
  stopStream: (id: string) => apiClient.post(`/events/${id}/stream/stop`),
  
  getStreamStatus: (id: string) => apiClient.get(`/events/${id}/stream/status`),
  
  complete: (id: string) => apiClient.post(`/events/${id}/complete`),
  
  getStats: (id: string) => apiClient.get(`/events/${id}/stats`),
  
  delete: (id: string) => apiClient.delete(`/events/${id}`),
};

export const fightsAPI = {
  getAll: (params?: { eventId?: string; status?: string }) =>
    apiClient.get('/fights', { params }),
  
  getById: (id: string) => apiClient.get(`/fights/${id}`),
  
  create: (data: {
    eventId: string;
    number: number;
    redCorner: string;
    blueCorner: string;
    weight: number;
    notes?: string;
    initialOdds?: { red: number; blue: number };
  }) => apiClient.post('/fights', data),
  
  update: (id: string, data: {
    redCorner?: string;
    blueCorner?: string;
    weight?: number;
    notes?: string;
    status?: string;
  }) => apiClient.put(`/fights/${id}`, data),
  
  openBetting: (id: string) => apiClient.post(`/fights/${id}/open-betting`),
  
  closeBetting: (id: string) => apiClient.post(`/fights/${id}/close-betting`),
  
  recordResult: (id: string, result: 'red' | 'blue' | 'draw' | 'cancelled') =>
    apiClient.post(`/fights/${id}/result`, { result }),
};

export const betsAPI = {
  getMyBets: (params?: { status?: string; fightId?: string; limit?: number; offset?: number }) =>
    apiClient.get('/bets', { params }),
  
  getAvailable: (fightId: string) =>
    apiClient.get(`/bets/available/${fightId}`),
  
  create: (data: {
    fightId: string;
    side: 'red' | 'blue';
    amount: number;
    ratio?: number;
    isOffer?: boolean;
  }) => apiClient.post('/bets', data),
  
  accept: (betId: string) => apiClient.post(`/bets/${betId}/accept`),
  
  cancel: (betId: string) => apiClient.put(`/bets/${betId}/cancel`),
  
  getStats: () => apiClient.get('/bets/stats'),
};

export const walletAPI = {
  getWallet: () => apiClient.get('/wallet'),
  
  getTransactions: (params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get('/wallet/transactions', { params }),
  
  deposit: (data: {
    amount: number;
    paymentMethod: 'card' | 'transfer';
    paymentData?: any;
  }) => apiClient.post('/wallet/deposit', data),
  
  withdraw: (data: {
    amount: number;
    accountNumber: string;
    accountType?: string;
    bankName?: string;
  }) => apiClient.post('/wallet/withdraw', data),
  
  getBalance: () => apiClient.get('/wallet/balance'),
  
  getStats: () => apiClient.get('/wallet/stats'),
};

export const subscriptionsAPI = {
  getMy: () => apiClient.get('/subscriptions'),
  
  getCurrent: () => apiClient.get('/subscriptions/current'),
  
  create: (data: {
    plan: 'daily' | 'monthly';
    autoRenew?: boolean;
    paymentData?: any;
  }) => apiClient.post('/subscriptions', data),
  
  cancel: (id: string) => apiClient.put(`/subscriptions/${id}/cancel`),
  
  toggleAutoRenew: (id: string, autoRenew: boolean) =>
    apiClient.put(`/subscriptions/${id}/auto-renew`, { autoRenew }),
  
  getPlans: () => apiClient.get('/subscriptions/plans/info'),
  
  checkAccess: () => apiClient.post('/subscriptions/check-access'),
  
  extend: (id: string) => apiClient.put(`/subscriptions/${id}/extend`),
};

export const venuesAPI = {
  getAll: (params?: { status?: string; limit?: number; offset?: number }) =>
    apiClient.get('/venues', { params }),
  
  getById: (id: string) => apiClient.get(`/venues/${id}`),
  
  create: (data: {
    name: string;
    location: string;
    description?: string;
    contactInfo?: any;
    ownerId?: string;
  }) => apiClient.post('/venues', data),
  
  update: (id: string, data: {
    name?: string;
    location?: string;
    description?: string;
    contactInfo?: any;
    status?: string;
  }) => apiClient.put(`/venues/${id}`, data),
  
  updateStatus: (id: string, status: string, reason?: string) =>
    apiClient.put(`/venues/${id}/status`, { status, reason }),
  
  delete: (id: string) => apiClient.delete(`/venues/${id}`),
  
  getMyVenues: () => apiClient.get('/venues/my/venues'),
};

export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  
  updateProfile: (data: {
    profileInfo?: {
      fullName?: string;
      phoneNumber?: string;
      address?: string;
      identificationNumber?: string;
    };
  }) => apiClient.put('/users/profile', data),
  
  getAll: (params?: { role?: string; isActive?: boolean; limit?: number; offset?: number }) =>
    apiClient.get('/users', { params }),
  
  getById: (id: string) => apiClient.get(`/users/${id}`),
  
  updateStatus: (id: string, isActive: boolean, reason?: string) =>
    apiClient.put(`/users/${id}/status`, { isActive, reason }),
  
  updateRole: (id: string, role: string, reason?: string) =>
    apiClient.put(`/users/${id}/role`, { role, reason }),
  
  getAvailableOperators: () => apiClient.get('/users/operators/available'),
};

// WebSocket configuration
export const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

// Re-exportar tipos desde el archivo de tipos (para compatibilidad)
export type { APIResponse, User, Event, Fight, Bet, Venue, Wallet, Transaction, Subscription } from '../types';