"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTMPService = exports.rtmpService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class RTMPService {
    constructor() {
        this.activeStreams = new Map();
        this.streamKeys = new Map(); // streamKey -> streamId
        this.analytics = new Map(); // streamId -> events
        this.rtmpServerUrl = process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live';
        this.hlsBaseUrl = process.env.HLS_BASE_URL || 'http://localhost:8080/hls';
    }
    /**
     * Generate a unique stream key
     */
    generateStreamKey(eventId, operatorId) {
        const timestamp = Date.now();
        const random = crypto_1.default.randomBytes(8).toString('hex');
        return `stream_${timestamp}_${random}`;
    }
    /**
     * Start RTMP stream ingestion
     */
    startStream(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const streamId = `live_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`;
            // Generate HLS URL
            const hlsUrl = `${this.hlsBaseUrl}/${config.streamKey}.m3u8`;
            const previewUrl = `${this.hlsBaseUrl}/${config.streamKey}_thumb.jpg`;
            const rtmpIngestionUrl = `${this.rtmpServerUrl}/${config.streamKey}`;
            const stream = {
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
                yield this.configureRTMPIngestion(config);
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
            }
            catch (error) {
                // Clean up on failure
                this.activeStreams.delete(streamId);
                this.streamKeys.delete(config.streamKey);
                this.analytics.delete(streamId);
                throw new Error(`Failed to start RTMP ingestion: ${error.message}`);
            }
        });
    }
    /**
     * Stop RTMP stream
     */
    stopStream(streamId) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = this.activeStreams.get(streamId);
            if (!stream) {
                throw new Error('Stream not found');
            }
            try {
                // Update status
                stream.status = 'stopping';
                this.activeStreams.set(streamId, stream);
                // Stop RTMP ingestion
                yield this.stopRTMPIngestion(stream.streamKey);
                // Calculate statistics
                const duration = Math.floor((Date.now() - stream.startTime.getTime()) / 1000);
                const events = this.analytics.get(streamId) || [];
                const uniqueViewers = new Set(events.map((e) => e.userId)).size;
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
            }
            catch (error) {
                throw new Error(`Failed to stop stream: ${error.message}`);
            }
        });
    }
    /**
     * Get active stream by ID
     */
    getStreamById(streamId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activeStreams.get(streamId) || null;
        });
    }
    /**
     * Get active stream by event ID
     */
    getActiveStream(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const stream of this.activeStreams.values()) {
                if (stream.eventId === eventId && (stream.status === 'live' || stream.status === 'starting')) {
                    return stream;
                }
            }
            return null;
        });
    }
    /**
     * Get system status
     */
    getSystemStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const activeStreamCount = Array.from(this.activeStreams.values())
                .filter(s => s.status === 'live').length;
            const totalViewers = Array.from(this.activeStreams.values())
                .reduce((total, stream) => total + stream.viewerCount, 0);
            // Simulate server load calculation
            const serverLoad = Math.min(activeStreamCount * 0.1 + (totalViewers / 1000) * 0.3, 1.0);
            const errors = [];
            if (serverLoad > 0.8)
                errors.push('High server load');
            if (activeStreamCount > 10)
                errors.push('High stream count');
            const status = Object.assign({ status: serverLoad > 0.9 ? 'error' : serverLoad > 0.7 ? 'degraded' : 'healthy', activeStreams: activeStreamCount, totalViewers,
                serverLoad, uptime: process.uptime(), lastCheck: new Date() }, (errors.length > 0 && { errors }));
            return status;
        });
    }
    /**
     * Get stream analytics
     */
    getStreamAnalytics(streamId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = this.activeStreams.get(streamId);
            const events = this.analytics.get(streamId) || [];
            if (!stream && events.length === 0) {
                throw new Error('Stream not found');
            }
            // Filter events by time range if specified
            let filteredEvents = events;
            if (options === null || options === void 0 ? void 0 : options.timeRange) {
                const now = Date.now();
                const timeRanges = {
                    '1h': 60 * 60 * 1000,
                    '24h': 24 * 60 * 60 * 1000,
                    '7d': 7 * 24 * 60 * 60 * 1000,
                    '30d': 30 * 24 * 60 * 60 * 1000
                };
                const range = timeRanges[options.timeRange];
                if (range) {
                    filteredEvents = events.filter((e) => now - new Date(e.timestamp).getTime() <= range);
                }
            }
            // Calculate analytics
            const uniqueViewers = new Set(filteredEvents.map((e) => e.userId));
            const playEvents = filteredEvents.filter((e) => e.event === 'play');
            const pauseEvents = filteredEvents.filter((e) => e.event === 'pause');
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
                currentViewers: (stream === null || stream === void 0 ? void 0 : stream.viewerCount) || 0,
                peakViewers: (stream === null || stream === void 0 ? void 0 : stream.peakViewers) || uniqueViewers.size,
                averageViewTime: playEvents.length > 0 ? 1800 : 0, // Mock: 30 minutes average
                totalViews: uniqueViewers.size,
                viewersByRegion,
                qualityDistribution,
                duration,
                bufferRatio: 0.05, // Mock: 5% buffer ratio
                errorRate: 0.02 // Mock: 2% error rate
            };
        });
    }
    /**
     * Get system-wide analytics
     */
    getSystemAnalytics(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let streams = Array.from(this.activeStreams.values());
            if (options === null || options === void 0 ? void 0 : options.operatorId) {
                streams = streams.filter(s => s.operatorId === options.operatorId);
            }
            const totalViewers = streams.reduce((total, stream) => total + stream.viewerCount, 0);
            const peakViewers = Math.max(...streams.map(s => s.peakViewers), 0);
            // Aggregate analytics from all streams
            const aggregatedAnalytics = {
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
                duration: streams.length > 0 ? Math.max(...streams.map(s => Math.floor((Date.now() - s.startTime.getTime()) / 1000))) : 0,
                bufferRatio: 0.05,
                errorRate: 0.02
            };
            return aggregatedAnalytics;
        });
    }
    /**
     * Track viewer joining stream
     */
    trackViewerJoin(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield this.getActiveStream(data.eventId);
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
        });
    }
    /**
     * Track viewer leaving stream
     */
    trackViewerLeave(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield this.getActiveStream(data.eventId);
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
        });
    }
    /**
     * Track viewer events (play, pause, quality change, etc.)
     */
    trackViewerEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield this.getActiveStream(event.eventId);
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
        });
    }
    /**
     * Track stream start
     */
    trackStreamStart(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Stream started:', data);
            // In production, this would save to database or external analytics service
        });
    }
    /**
     * Track stream end
     */
    trackStreamEnd(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Stream ended:', data);
            // In production, this would save to database or external analytics service
        });
    }
    /**
     * Configure RTMP ingestion (mock implementation)
     */
    configureRTMPIngestion(config) {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield new Promise(resolve => setTimeout(resolve, 100));
                console.log('RTMP ingestion configured:', rtmpConfig);
            }
            catch (error) {
                throw new Error(`RTMP server configuration failed: ${error}`);
            }
        });
    }
    /**
     * Stop RTMP ingestion (mock implementation)
     */
    stopRTMPIngestion(streamKey) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Stopping RTMP ingestion for stream key: ${streamKey}`);
            // Simulate API call to stop ingestion
            yield new Promise(resolve => setTimeout(resolve, 100));
            console.log(`RTMP ingestion stopped for: ${streamKey}`);
        });
    }
    /**
     * Revoke stream key and prevent its use
     */
    revokeStreamKey(streamKey, operatorId) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    yield this.stopStream(streamId);
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
        });
    }
    /**
     * Check RTMP server connectivity
     */
    checkRTMPServerHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const startTime = Date.now();
                // Simulate health check to RTMP server
                yield new Promise(resolve => setTimeout(resolve, 50));
                const latency = Date.now() - startTime;
                return {
                    connected: true,
                    latency
                };
            }
            catch (error) {
                return {
                    connected: false,
                    error: error.message
                };
            }
        });
    }
    /**
     * Get stream configuration for OBS Studio
     */
    getOBSConfiguration(streamKey) {
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
exports.RTMPService = RTMPService;
// Create singleton instance
exports.rtmpService = new RTMPService();
