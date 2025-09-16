import axios from 'axios';

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
  /**
   * Start a new RTMP stream
   */
  async startStream(config: StreamConfig): Promise<StreamResponse> {
    try {
      const response = await api.post('/streaming/start', config);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to start stream');
      } else {
        throw new Error('Failed to start stream');
      }
    }
  }

  /**
   * Stop an active stream
   */
  async stopStream(streamId: string): Promise<{ success: boolean; duration: number; viewerCount: number }> {
    try {
      const response = await api.post('/streaming/stop', { streamId });
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to stop stream');
      } else {
        throw new Error('Failed to stop stream');
      }
    }
  }

  /**
   * Get overall streaming system status
   */
  async getStatus(): Promise<StreamStatus> {
    try {
      const response = await api.get('/streaming/status');
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get stream status');
      } else {
        throw new Error('Failed to get stream status');
      }
    }
  }

  /**
   * Get real-time analytics for a stream
   */
  async getAnalytics(streamId?: string): Promise<StreamAnalytics> {
    try {
      const url = streamId ? `/streaming/analytics/${streamId}` : '/streaming/analytics';
      const response = await api.get(url);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get stream analytics');
      } else {
        throw new Error('Failed to get stream analytics');
      }
    }
  }

  /**
   * Get signed stream access URL for viewing
   */
  async getStreamAccess(eventId: string): Promise<StreamAccessToken> {
    try {
      const response = await api.get(`/events/${eventId}/stream-access`);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get stream access');
      } else {
        throw new Error('Failed to get stream access');
      }
    }
  }

  /**
   * Validate stream access token
   */
  async validateStreamToken(token: string): Promise<{ valid: boolean; userId: number; eventId: string }> {
    try {
      const response = await api.post('/streaming/validate-token', { token });
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to validate stream token');
      } else {
        throw new Error('Failed to validate stream token');
      }
    }
  }

  /**
   * Report stream viewing analytics
   */
  async reportViewingEvent(eventId: string, event: string, data?: Record<string, unknown>): Promise<void> {
    try {
      await api.post('/streaming/analytics/event', {
        eventId,
        event,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Silently fail analytics to not interrupt stream
      console.warn('Failed to report viewing event:', error);
    }
  }

  /**
   * Get stream health metrics
   */
  async getStreamHealth(streamId: string): Promise<{
    bitrate: number;
    fps: number;
    resolution: string;
    droppedFrames: number;
    latency: number;
    bufferHealth: number;
  }> {
    try {
      const response = await api.get(`/streaming/${streamId}/health`);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get stream health');
      } else {
        throw new Error('Failed to get stream health');
      }
    }
  }

  /**
   * Update stream configuration during live stream
   */
  async updateStreamConfig(streamId: string, config: Partial<StreamConfig>): Promise<void> {
    try {
      await api.patch(`/streaming/${streamId}/config`, config);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update stream config');
      } else {
        throw new Error('Failed to update stream config');
      }
    }
  }

  /**
   * Generate stream key for OBS
   */
  async generateStreamKey(config: { eventId: string }): Promise<{ 
    streamKey: string; 
    rtmpUrl: string; 
    eventId: string;
    generatedAt: string;
    validFor: string;
  }> {
    try {
      const response = await api.post('/streaming/keys/generate', config);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to generate stream key');
      } else {
        throw new Error('Failed to generate stream key');
      }
    }
  }

  /**
   * Revoke stream key
   */
  async revokeStreamKey(streamKey: string): Promise<{
    streamKey: string;
    revokedAt: string;
    revokedBy: string;
  }> {
    try {
      const response = await api.delete(`/streaming/keys/${streamKey}`);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to revoke stream key');
      } else {
        throw new Error('Failed to revoke stream key');
      }
    }
  }

  /**
   * Get OBS Studio configuration
   */
  async getOBSConfig(streamKey: string): Promise<{
    server: string;
    streamKey: string;
    settings: {
      keyframeInterval: number;
      videoCodec: string;
      audioCodec: string;
      recommendedBitrate: number;
    };
    instructions: string[];
  }> {
    try {
      const response = await api.get(`/streaming/obs-config/${streamKey}`);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get OBS configuration');
      } else {
        throw new Error('Failed to get OBS configuration');
      }
    }
  }

  /**
   * Get streaming system health
   */
  async getSystemHealth(): Promise<{
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
  }> {
    try {
      const response = await api.get('/streaming/health');
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get system health');
      } else {
        throw new Error('Failed to get system health');
      }
    }
  }

  /**
   * Get available stream qualities
   */
  async getAvailableQualities(streamId: string): Promise<Array<{
    label: string;
    src: string;
    bitrate: number;
    resolution: string;
  }>> {
    try {
      const response = await api.get(`/streaming/${streamId}/qualities`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get stream qualities');
    }
  }

  /**
   * Subscribe to stream events via WebSocket
   */
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
    const intervalId: NodeJS.Timeout = setInterval(poll, 5000); // Poll every 5 seconds

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

    // Return cleanup function
    return () => {
      polling = false;
      clearInterval(intervalId);
    };
  }

  /**
   * Get stream recording status
   */
  async getRecordingStatus(streamId: string): Promise<{
    isRecording: boolean;
    recordingId?: string;
    duration: number;
    fileSize: number;
  }> {
    try {
      const response = await api.get(`/streaming/${streamId}/recording`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get recording status');
    }
  }

  /**
   * Start/stop stream recording
   */
  async toggleRecording(streamId: string, start: boolean): Promise<void> {
    try {
      await api.post(`/streaming/${streamId}/recording`, { action: start ? 'start' : 'stop' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle recording');
    }
  }

  /**
   * Get stream thumbnail/preview image
   */
  async getStreamThumbnail(streamId: string): Promise<string> {
    try {
      const response = await api.get(`/streaming/${streamId}/thumbnail`);
      return response.data.data.thumbnailUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get stream thumbnail');
    }
  }

  /**
   * Test RTMP connection
   */
  async testRTMPConnection(rtmpUrl: string, streamKey: string): Promise<{
    connected: boolean;
    latency: number;
    bitrate: number;
    errors?: string[];
  }> {
    try {
      const response = await api.post('/streaming/test-connection', {
        rtmpUrl,
        streamKey
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to test RTMP connection');
    }
  }
}

// Create singleton instance
export const streamingService = new StreamingService();

// Export for use in other components
export default streamingService;