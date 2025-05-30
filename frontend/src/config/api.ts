// frontend/src/config/api.ts
import axios from 'axios';

// Configuración base de la API
export const API_BASE_URL = 'http://localhost:3001/api';

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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
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
};

export const eventsAPI = {
  getAll: (params?: { venueId?: string; status?: string }) =>
    apiClient.get('/events', { params }),
  
  getById: (id: string) => apiClient.get(`/events/${id}`),
  
  create: (data: any) => apiClient.post('/events', data),
  
  activate: (id: string) => apiClient.post(`/events/${id}/activate`),
  
  startStream: (id: string) => apiClient.post(`/events/${id}/stream/start`),
  
  stopStream: (id: string) => apiClient.post(`/events/${id}/stream/stop`),
};

export const fightsAPI = {
  getAll: (params?: { eventId?: string; status?: string }) =>
    apiClient.get('/fights', { params }),
  
  getById: (id: string) => apiClient.get(`/fights/${id}`),
  
  create: (data: any) => apiClient.post('/fights', data),
  
  update: (id: string, data: any) => apiClient.put(`/fights/${id}`, data),
  
  openBetting: (id: string) => apiClient.post(`/fights/${id}/open-betting`),
  
  closeBetting: (id: string) => apiClient.post(`/fights/${id}/close-betting`),
  
  recordResult: (id: string, result: 'red' | 'blue' | 'draw' | 'cancelled') =>
    apiClient.post(`/fights/${id}/result`, { result }),
};

export const betsAPI = {
  getMyBets: (params?: { status?: string; fightId?: string }) =>
    apiClient.get('/bets', { params }),
  
  getAvailable: (fightId: string) =>
    apiClient.get(`/bets/available/${fightId}`),
  
  create: (data: {
    fightId: string;
    side: 'red' | 'blue';
    amount: number;
    ratio?: number;
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
};

export const venuesAPI = {
  getAll: () => apiClient.get('/venues'),
};

// WebSocket configuration
export const WEBSOCKET_URL = 'http://localhost:3001';

// Hook personalizado para WebSocket
export const useWebSocket = () => {
  const [socket, setSocket] = useState<any>(null);
  
  useEffect(() => {
    import('socket.io-client').then(({ io }) => {
      const newSocket = io(WEBSOCKET_URL);
      setSocket(newSocket);
      
      return () => newSocket.close();
    });
  }, []);
  
  return socket;
};

// Tipos TypeScript para las respuestas
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'venue' | 'user';
  isActive: boolean;
  profileInfo?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  venueId: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  streamUrl?: string;
  totalFights: number;
  completedFights: number;
}

export interface Fight {
  id: string;
  eventId: string;
  number: number;
  redCorner: string;
  blueCorner: string;
  weight: number;
  status: 'upcoming' | 'betting' | 'live' | 'completed' | 'cancelled';
  result?: 'red' | 'blue' | 'draw' | 'cancelled';
}

export interface Bet {
  id: string;
  fightId: string;
  userId: string;
  side: 'red' | 'blue';
  amount: number;
  potentialWin: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  result?: 'win' | 'loss' | 'draw' | 'cancelled';
}