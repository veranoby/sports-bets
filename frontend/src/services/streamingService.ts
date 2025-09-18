import axios, { type AxiosError, type Method, type AxiosRequestConfig } from 'axios';
import { type ApiResponse, type ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Local, typed apiCall function for this service
const apiCall = async <T>(method: Method, endpoint: string, data?: unknown, headers?: AxiosRequestConfig['headers']): Promise<ApiResponse<T>> => {
    try {
      const response = await api.request<T>({
        method,
        url: endpoint,
        data: method.toLowerCase() !== 'get' && method.toLowerCase() !== 'delete' ? data : undefined,
        params: method.toLowerCase() === 'get' || method.toLowerCase() === 'delete' ? data : undefined,
        headers,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error at ${endpoint}:`, error);
      const err = error as AxiosError<unknown>;
      const apiError: ApiError = {
        name: 'ApiError',
        message: (err.response?.data as { message?: string })?.message || err.message || 'An error occurred',
        status: err.response?.status,
      };
      return { success: false, data: null as T, error: apiError.message, code: apiError.status };
    }
}

export interface StreamConfig {
  eventId: string;
  title: string;
  description?: string;
  quality: '360p' | '480p' | '720p';
  bitrate: number;
  fps: number;
}

export interface StreamResponse {
  streamId: string;
  rtmpUrl: string;
  streamKey: string;
  hlsUrl: string;
  status: 'starting' | 'live' | 'stopping' | 'stopped';
}

export interface StreamStatus {
  status: 'healthy' | 'degraded' | 'error';
  activeStreams: number;
  totalViewers: number;
  serverLoad: number;
  uptime: number;
  errors?: string[];
}

export interface StreamAnalytics {
  streamId: string;
  currentViewers: number;
  peakViewers: number;
  averageViewTime: number;
  viewersByRegion: Record<string, number>;
  qualityDistribution: Record<string, number>;
  totalViews: number;
  duration: number;
}

export interface StreamAccessToken {
  streamUrl: string;
  token: string;
  expiresAt: string;
  userId: number;
  eventId: string;
}

class StreamingService {
  async startStream(config: StreamConfig): Promise<ApiResponse<StreamResponse>> {
    return apiCall<StreamResponse>('post', '/streaming/start', config);
  }

  async stopStream(streamId: string): Promise<ApiResponse<{ success: boolean; duration: number; viewerCount: number }>> {
    return apiCall<{ success: boolean; duration: number; viewerCount: number }>('post', '/streaming/stop', { streamId });
  }

  async getStatus(): Promise<ApiResponse<StreamStatus>> {
    return apiCall<StreamStatus>('get', '/streaming/status');
  }

  async getAnalytics(streamId?: string): Promise<ApiResponse<StreamAnalytics>> {
    const url = streamId ? `/streaming/analytics/${streamId}` : '/streaming/analytics';
    return apiCall<StreamAnalytics>('get', url);
  }

  async getStreamAccess(eventId: string): Promise<ApiResponse<StreamAccessToken>> {
    return apiCall<StreamAccessToken>('get', `/events/${eventId}/stream-access`);
  }

  async validateStreamToken(token: string): Promise<ApiResponse<{ valid: boolean; userId: number; eventId: string }>> {
    return apiCall<{ valid: boolean; userId: number; eventId: string }>('post', '/streaming/validate-token', { token });
  }

  async reportViewingEvent(eventId: string, event: string, data?: Record<string, unknown>): Promise<ApiResponse<void>> {
    return apiCall<void>('post', '/streaming/analytics/event', {
      eventId,
      event,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async getStreamHealth(streamId: string): Promise<ApiResponse<{
    bitrate: number;
    fps: number;
    resolution: string;
    droppedFrames: number;
    latency: number;
    bufferHealth: number;
  }>> {
    type HealthData = {
      bitrate: number;
      fps: number;
      resolution: string;
      droppedFrames: number;
      latency: number;
      bufferHealth: number;
    };
    return apiCall<HealthData>('get', `/streaming/${streamId}/health`);
  }

  async updateStreamConfig(streamId: string, config: Partial<StreamConfig>): Promise<ApiResponse<void>> {
    return apiCall<void>('patch', `/streaming/${streamId}/config`, config);
  }

  async generateStreamKey(config: { eventId: string }): Promise<ApiResponse<{ 
    streamKey: string; 
    rtmpUrl: string; 
    eventId: string;
    generatedAt: string;
    validFor: string;
  }>> {
    type KeyData = { 
      streamKey: string; 
      rtmpUrl: string; 
      eventId: string;
      generatedAt: string;
      validFor: string;
    };
    return apiCall<KeyData>('post', '/streaming/keys/generate', config);
  }

  async revokeStreamKey(streamKey: string): Promise<ApiResponse<{
    streamKey: string;
    revokedAt: string;
    revokedBy: string;
  }>> {
    type RevokeData = {
      streamKey: string;
      revokedAt: string;
      revokedBy: string;
    };
    return apiCall<RevokeData>('delete', `/streaming/keys/${streamKey}`);
  }

  async getOBSConfig(streamKey: string): Promise<ApiResponse<{
    server: string;
    streamKey: string;
    settings: {
      keyframeInterval: number;
      videoCodec: string;
      audioCodec: string;
      recommendedBitrate: number;
    };
    instructions: string[];
  }>> {
    type ObsConfig = {
      server: string;
      streamKey: string;
      settings: {
        keyframeInterval: number;
        videoCodec: string;
        audioCodec: string;
        recommendedBitrate: number;
      };
      instructions: string[];
    };
    return apiCall<ObsConfig>('get', `/streaming/obs-config/${streamKey}`);
  }

  async getSystemHealth(): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'error';
    activeStreams: number;
    totalViewers: number;
    serverLoad: number;
    uptime: number;
    rtmpServer: {
      url: string;
      status: string;
      capacity: {
        maxStreams: number;
        currentStreams: number;
      };
    };
  }>> {
    type SystemHealth = {
      status: 'healthy' | 'degraded' | 'error';
      activeStreams: number;
      totalViewers: number;
      serverLoad: number;
      uptime: number;
      rtmpServer: {
        url: string;
        status: string;
        capacity: {
          maxStreams: number;
          currentStreams: number;
        };
      };
    };
    return apiCall<SystemHealth>('get', '/streaming/health');
  }

  async getAvailableQualities(streamId: string): Promise<ApiResponse<Array<{
    label: string;
    src: string;
    bitrate: number;
    resolution: string;
  }>>> {
    type Quality = {
      label: string;
      src: string;
      bitrate: number;
      resolution: string;
    };
    return apiCall<Quality[]>('get', `/streaming/${streamId}/qualities`);
  }

  subscribeToStreamEvents(streamId: string, callbacks: {
    onViewerJoin?: (data: Record<string, unknown>) => void;
    onViewerLeave?: (data: Record<string, unknown>) => void;
    onQualityChange?: (data: Record<string, unknown>) => void;
    onHealthUpdate?: (data: Record<string, unknown>) => void;
    onError?: (error: unknown) => void;
  }): () => void {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll implement polling as fallback
    let polling = true;

    const poll = async () => {
      if (!polling) return;

      try {
        // const analytics = await this.getAnalytics(streamId);
        // Trigger callbacks based on analytics changes
        // This is simplified - in production we'd use real-time events
      } catch (error) {
        callbacks.onError?.(error);
      }
    };

    const intervalId: NodeJS.Timeout = setInterval(poll, 5000); // Poll every 5 seconds

    // Return cleanup function
    return () => {
      polling = false;
      clearInterval(intervalId);
    };
  }

  async getRecordingStatus(streamId: string): Promise<ApiResponse<{
    isRecording: boolean;
    recordingId?: string;
    duration: number;
    fileSize: number;
  }>> {
    type RecordingStatus = {
      isRecording: boolean;
      recordingId?: string;
      duration: number;
      fileSize: number;
    };
    return apiCall<RecordingStatus>('get', `/streaming/${streamId}/recording`);
  }

  async toggleRecording(streamId: string, start: boolean): Promise<ApiResponse<void>> {
    return apiCall<void>('post', `/streaming/${streamId}/recording`, { action: start ? 'start' : 'stop' });
  }

  async getStreamThumbnail(streamId: string): Promise<ApiResponse<string>> {
    return apiCall<string>('get', `/streaming/${streamId}/thumbnail`);
  }

  async testRTMPConnection(rtmpUrl: string, streamKey: string): Promise<ApiResponse<{
    connected: boolean;
    latency: number;
    bitrate: number;
    errors?: string[];
  }>> {
    type RtmpStatus = {
      connected: boolean;
      latency: number;
      bitrate: number;
      errors?: string[];
    };
    return apiCall<RtmpStatus>('post', '/streaming/test-connection', {
      rtmpUrl,
      streamKey
    });
  }
}

// Create singleton instance
export const streamingService = new StreamingService();

// Export for use in other components
export default streamingService;
