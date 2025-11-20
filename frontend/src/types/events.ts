// frontend/src/types/events.ts
// TypeScript interface definitions for event-related components

export interface EventDetailData {
  id: string;
  name: string;
  location: string;
  status: 'pending' | 'live' | 'completed' | 'paused' | 'scheduled' | 'betting' | 'intermission';
  streamStatus: 'connected' | 'disconnected' | 'offline' | 'paused';
  createdAt: string;
  venue: {
    id: string;
    name: string;
  };
  operator: {
    id: string;
    name: string;
  };
  currentViewers?: number;
  totalFights?: number;
  completedFights?: number;
  scheduledDate?: string;
  streamUrl?: string;
  fights?: any[]; // Fights data type would be defined elsewhere
}

export interface StreamStatus {
  status: 'connected' | 'disconnected' | 'offline' | 'paused';
  viewers: number;
  bitrate: number;
  connectedAt?: string;
  disconnectAt?: string;
}

export interface StreamMetrics {
  connectionCount: number;
  activeBets: number;
  memoryUsage: number;
  streamStatus: {
    isLive: boolean;
    timestamp: string;
    memory: {
      currentMB: number;
      limitMB: number;
      percentUsed: number;
    };
    database: {
      activeConnections: number;
      availableConnections: number;
      queuedRequests: number;
    };
  };
}