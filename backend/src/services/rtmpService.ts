import axios from 'axios';
import crypto from 'crypto';

interface StreamConfig {
  eventId: string;
  operatorId: string;
  streamKey: string;
  title: string;
  description?: string;
  quality: '360p' | '480p' | '720p';
  bitrate: number;
  fps: number;
  rtmpUrl: string;
}

interface ActiveStream {
  streamId: string;
  eventId: string;
  operatorId: string;
  streamKey: string;
  status: 'starting' | 'live' | 'stopping' | 'stopped';
  startTime: Date;
  rtmpUrl: string;
  hlsUrl: string;
  previewUrl?: string;
  viewerCount: number;
  peakViewers: number;
  quality: string;
  bitrate: number;
  fps: number;
}

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'error';
  activeStreams: number;
  totalViewers: number;
  serverLoad: number;
  uptime: number;
  errors?: string[];
  lastCheck: Date;
}

interface StreamAnalytics {
  streamId?: string;
  currentViewers: number;
  peakViewers: number;
  averageViewTime: number;
  totalViews: number;
  viewersByRegion: Record<string, number>;
  qualityDistribution: Record<string, number>;
  duration: number;
  bufferRatio: number;
  errorRate: number;
}

interface ViewerEvent {
  eventId: string;
  userId: string;
  event: string;
  data?: any;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

class RTMPService {
  private activeStreams = new Map<string, ActiveStream>();
  private streamKeys = new Map<string, string>(); // streamKey -> streamId
  private analytics = new Map<string, any[]>(); // streamId -> events
  private rtmpServerUrl: string;
  private hlsBaseUrl: string;

  constructor() {
    this.rtmpServerUrl = process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live';
    this.hlsBaseUrl = process.env.HLS_BASE_URL || 'http://localhost:8080/hls';
  }

  /**
   * Generate a unique stream key
   */
  generateStreamKey(eventId: string, operatorId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `stream_${timestamp}_${random}`;
  }

  /**
   * Start RTMP stream ingestion
   */
  async startStream(config: StreamConfig): Promise<{
    streamId: string;
    hlsUrl: string;
    previewUrl?: string;
    rtmpIngestionUrl: string;
  }> {
    const streamId = `live_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Generate HLS URL
    const hlsUrl = `${this.hlsBaseUrl}/${config.streamKey}.m3u8`;
    const previewUrl = `${this.hlsBaseUrl}/${config.streamKey}_thumb.jpg`;
    const rtmpIngestionUrl = `${this.rtmpServerUrl}/${config.streamKey}`;

    const stream: ActiveStream = {
      streamId,
      eventId: config.eventId,
      operatorId: config.operatorId,
      streamKey: config.streamKey,
      status: 'starting',
      startTime: new Date(),
      rtmpUrl: config.rtmpUrl,
      hlsUrl,
      previewUrl,
      viewerCount: 0,
      peakViewers: 0,
      quality: config.quality,
      bitrate: config.bitrate,
      fps: config.fps
    };

    // Store active stream
    this.activeStreams.set(streamId, stream);
    this.streamKeys.set(config.streamKey, streamId);

    // Initialize analytics for this stream
    this.analytics.set(streamId, []);

    try {
      // Configure RTMP server (this would typically call actual RTMP server API)
      await this.configureRTMPIngestion(config);

      // Update status to live
      stream.status = 'live';
      this.activeStreams.set(streamId, stream);

      console.log(`Stream started: ${streamId} for event ${config.eventId}`);

      return {
        streamId,
        hlsUrl,
        previewUrl,
        rtmpIngestionUrl
      };
    } catch (error: any) {
      // Clean up on failure
      this.activeStreams.delete(streamId);
      this.streamKeys.delete(config.streamKey);
      this.analytics.delete(streamId);
      
      throw new Error(`Failed to start RTMP ingestion: ${error.message}`);
    }
  }

  /**
   * Stop RTMP stream
   */
  async stopStream(streamId: string): Promise<{
    duration: number;
    totalViewers: number;
    peakViewers: number;
  }> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error('Stream not found');
    }

    try {
      // Update status
      stream.status = 'stopping';
      this.activeStreams.set(streamId, stream);

      // Stop RTMP ingestion
      await this.stopRTMPIngestion(stream.streamKey);

      // Calculate statistics
      const duration = Math.floor((Date.now() - stream.startTime.getTime()) / 1000);
      const events = this.analytics.get(streamId) || [];
      const uniqueViewers = new Set(events.map((e: any) => e.userId)).size;

      const result = {
        duration,
        totalViewers: uniqueViewers,
        peakViewers: stream.peakViewers
      };

      // Clean up
      this.activeStreams.delete(streamId);
      this.streamKeys.delete(stream.streamKey);
      // Keep analytics for historical data (could be moved to permanent storage)

      console.log(`Stream stopped: ${streamId}, duration: ${duration}s, viewers: ${uniqueViewers}`);

      return result;
    } catch (error: any) {
      throw new Error(`Failed to stop stream: ${error.message}`);
    }
  }

  /**
   * Get active stream by ID
   */
  async getStreamById(streamId: string): Promise<ActiveStream | null> {
    return this.activeStreams.get(streamId) || null;
  }

  /**
   * Get active stream by event ID
   */
  async getActiveStream(eventId: string): Promise<ActiveStream | null> {
    for (const stream of this.activeStreams.values()) {
      if (stream.eventId === eventId && (stream.status === 'live' || stream.status === 'starting')) {
        return stream;
      }
    }
    return null;
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const activeStreamCount = Array.from(this.activeStreams.values())
      .filter(s => s.status === 'live').length;
    
    const totalViewers = Array.from(this.activeStreams.values())
      .reduce((total, stream) => total + stream.viewerCount, 0);

    // Simulate server load calculation
    const serverLoad = Math.min(activeStreamCount * 0.1 + (totalViewers / 1000) * 0.3, 1.0);
    
    const errors: string[] = [];
    if (serverLoad > 0.8) errors.push('High server load');
    if (activeStreamCount > 10) errors.push('High stream count');

    const status: SystemStatus = {
      status: serverLoad > 0.9 ? 'error' : serverLoad > 0.7 ? 'degraded' : 'healthy',
      activeStreams: activeStreamCount,
      totalViewers,
      serverLoad,
      uptime: process.uptime(),
      lastCheck: new Date(),
      ...(errors.length > 0 && { errors })
    };

    return status;
  }

  /**
   * Get stream analytics
   */
  async getStreamAnalytics(streamId: string, options?: {
    timeRange?: string;
    metrics?: string[];
  }): Promise<StreamAnalytics> {
    const stream = this.activeStreams.get(streamId);
    const events = this.analytics.get(streamId) || [];

    if (!stream && events.length === 0) {
      throw new Error('Stream not found');
    }

    // Filter events by time range if specified
    let filteredEvents = events;
    if (options?.timeRange) {
      const now = Date.now();
      const timeRanges: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      const range = timeRanges[options.timeRange];
      if (range) {
        filteredEvents = events.filter((e: any) => 
          now - new Date(e.timestamp).getTime() <= range
        );
      }
    }

    // Calculate analytics
    const uniqueViewers = new Set(filteredEvents.map((e: any) => e.userId));
    const playEvents = filteredEvents.filter((e: any) => e.event === 'play');
    const pauseEvents = filteredEvents.filter((e: any) => e.event === 'pause');

    // Viewer regions (mock data - would come from IP geolocation)
    const viewersByRegion = {
      'US': Math.floor(uniqueViewers.size * 0.4),
      'EU': Math.floor(uniqueViewers.size * 0.3),
      'LATAM': Math.floor(uniqueViewers.size * 0.2),
      'ASIA': Math.floor(uniqueViewers.size * 0.1)
    };

    // Quality distribution (mock data - would come from actual player analytics)
    const qualityDistribution = {
      '720p': Math.floor(uniqueViewers.size * 0.6),
      '480p': Math.floor(uniqueViewers.size * 0.3),
      '360p': Math.floor(uniqueViewers.size * 0.1)
    };

    const duration = stream 
      ? Math.floor((Date.now() - stream.startTime.getTime()) / 1000)
      : 0;

    return {
      streamId,
      currentViewers: stream?.viewerCount || 0,
      peakViewers: stream?.peakViewers || uniqueViewers.size,
      averageViewTime: playEvents.length > 0 ? 1800 : 0, // Mock: 30 minutes average
      totalViews: uniqueViewers.size,
      viewersByRegion,
      qualityDistribution,
      duration,
      bufferRatio: 0.05, // Mock: 5% buffer ratio
      errorRate: 0.02 // Mock: 2% error rate
    };
  }

  /**
   * Get system-wide analytics
   */
  async getSystemAnalytics(options?: {
    timeRange?: string;
    operatorId?: string;
  }): Promise<StreamAnalytics> {
    let streams = Array.from(this.activeStreams.values());
    
    if (options?.operatorId) {
      streams = streams.filter(s => s.operatorId === options.operatorId);
    }

    const totalViewers = streams.reduce((total, stream) => total + stream.viewerCount, 0);
    const peakViewers = Math.max(...streams.map(s => s.peakViewers), 0);

    // Aggregate analytics from all streams
    const aggregatedAnalytics: StreamAnalytics = {
      currentViewers: totalViewers,
      peakViewers,
      averageViewTime: 1800, // Mock data
      totalViews: streams.length * 100, // Mock data
      viewersByRegion: {
        'US': Math.floor(totalViewers * 0.4),
        'EU': Math.floor(totalViewers * 0.3),
        'LATAM': Math.floor(totalViewers * 0.2),
        'ASIA': Math.floor(totalViewers * 0.1)
      },
      qualityDistribution: {
        '720p': Math.floor(totalViewers * 0.6),
        '480p': Math.floor(totalViewers * 0.3),
        '360p': Math.floor(totalViewers * 0.1)
      },
      duration: streams.length > 0 ? Math.max(...streams.map(s => 
        Math.floor((Date.now() - s.startTime.getTime()) / 1000)
      )) : 0,
      bufferRatio: 0.05,
      errorRate: 0.02
    };

    return aggregatedAnalytics;
  }

  /**
   * Track viewer joining stream
   */
  async trackViewerJoin(data: {
    eventId: string;
    userId: string;
    subscriptionType: string;
    userAgent?: string;
    ip?: string;
    timestamp: Date;
  }): Promise<void> {
    const stream = await this.getActiveStream(data.eventId);
    if (stream) {
      // Update viewer count
      stream.viewerCount++;
      stream.peakViewers = Math.max(stream.peakViewers, stream.viewerCount);
      this.activeStreams.set(stream.streamId, stream);

      // Track in analytics
      const events = this.analytics.get(stream.streamId) || [];
      events.push({
        event: 'viewer_join',
        userId: data.userId,
        timestamp: data.timestamp,
        data: {
          subscriptionType: data.subscriptionType,
          userAgent: data.userAgent,
          ip: data.ip
        }
      });
      this.analytics.set(stream.streamId, events);
    }
  }

  /**
   * Track viewer leaving stream
   */
  async trackViewerLeave(data: {
    eventId: string;
    userId: string;
    watchTime: number;
    timestamp: Date;
  }): Promise<void> {
    const stream = await this.getActiveStream(data.eventId);
    if (stream) {
      // Update viewer count
      stream.viewerCount = Math.max(0, stream.viewerCount - 1);
      this.activeStreams.set(stream.streamId, stream);

      // Track in analytics
      const events = this.analytics.get(stream.streamId) || [];
      events.push({
        event: 'viewer_leave',
        userId: data.userId,
        timestamp: data.timestamp,
        data: {
          watchTime: data.watchTime
        }
      });
      this.analytics.set(stream.streamId, events);
    }
  }

  /**
   * Track viewer events (play, pause, quality change, etc.)
   */
  async trackViewerEvent(event: ViewerEvent): Promise<void> {
    const stream = await this.getActiveStream(event.eventId);
    if (stream) {
      const events = this.analytics.get(stream.streamId) || [];
      events.push({
        event: event.event,
        userId: event.userId,
        timestamp: event.timestamp,
        data: event.data,
        userAgent: event.userAgent,
        ip: event.ip
      });
      this.analytics.set(stream.streamId, events);
    }
  }

  /**
   * Track stream start
   */
  async trackStreamStart(data: {
    streamId: string;
    eventId: string;
    operatorId: string;
    quality: string;
    bitrate: number;
    fps: number;
    timestamp: Date;
  }): Promise<void> {
    console.log('Stream started:', data);
    // In production, this would save to database or external analytics service
  }

  /**
   * Track stream end
   */
  async trackStreamEnd(data: {
    streamId: string;
    duration: number;
    totalViewers: number;
    peakViewers: number;
    endReason: string;
    operatorId: string;
    timestamp: Date;
  }): Promise<void> {
    console.log('Stream ended:', data);
    // In production, this would save to database or external analytics service
  }

  /**
   * Configure RTMP ingestion (mock implementation)
   */
  private async configureRTMPIngestion(config: StreamConfig): Promise<void> {
    // In production, this would call actual RTMP server API
    console.log(`Configuring RTMP ingestion for stream key: ${config.streamKey}`);
    
    // Simulate API call
    try {
      // Mock external RTMP server configuration
      const rtmpConfig = {
        streamKey: config.streamKey,
        quality: config.quality,
        bitrate: config.bitrate,
        fps: config.fps,
        hlsOutput: `${this.hlsBaseUrl}/${config.streamKey}.m3u8`
      };

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('RTMP ingestion configured:', rtmpConfig);
    } catch (error) {
      throw new Error(`RTMP server configuration failed: ${error}`);
    }
  }

  /**
   * Stop RTMP ingestion (mock implementation)
   */
  private async stopRTMPIngestion(streamKey: string): Promise<void> {
    console.log(`Stopping RTMP ingestion for stream key: ${streamKey}`);
    
    // Simulate API call to stop ingestion
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`RTMP ingestion stopped for: ${streamKey}`);
  }

  /**
   * Revoke stream key and prevent its use
   */
  async revokeStreamKey(streamKey: string, operatorId: string): Promise<{
    streamKey: string;
    revokedAt: Date;
    revokedBy: string;
  }> {
    // Find stream using this key
    const streamId = this.streamKeys.get(streamKey);
    
    if (streamId) {
      const stream = this.activeStreams.get(streamId);
      
      // Check permissions (operator can only revoke their own keys, admin can revoke any)
      if (stream && stream.operatorId !== operatorId) {
        throw new Error('You can only revoke stream keys you created');
      }
      
      // Stop active stream if using this key
      if (stream && (stream.status === 'live' || stream.status === 'starting')) {
        await this.stopStream(streamId);
      }
    }
    
    // Remove key from active keys
    this.streamKeys.delete(streamKey);
    
    // In production, this would mark the key as revoked in database
    console.log(`Stream key revoked: ${streamKey} by operator: ${operatorId}`);
    
    return {
      streamKey,
      revokedAt: new Date(),
      revokedBy: operatorId
    };
  }

  /**
   * Check RTMP server connectivity
   */
  async checkRTMPServerHealth(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      // Simulate health check to RTMP server
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        latency
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Get stream configuration for OBS Studio
   */
  getOBSConfiguration(streamKey: string): {
    server: string;
    streamKey: string;
    settings: {
      keyframeInterval: number;
      videoCodec: string;
      audioCodec: string;
      recommendedBitrate: number;
    };
  } {
    return {
      server: this.rtmpServerUrl.replace('/live', ''),
      streamKey,
      settings: {
        keyframeInterval: 2, // seconds
        videoCodec: 'H.264',
        audioCodec: 'AAC',
        recommendedBitrate: 2500 // kbps for 720p
      }
    };
  }
}

// Create singleton instance
export const rtmpService = new RTMPService();

// Export class for testing
export { RTMPService };