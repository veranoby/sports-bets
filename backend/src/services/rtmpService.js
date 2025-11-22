"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTMPService = exports.rtmpService = void 0;
var crypto = __importStar(require("crypto"));
var RTMPService = /** @class */ (function () {
    function RTMPService() {
        this.activeStreams = new Map();
        this.streamKeys = new Map(); // streamKey -> streamId
        this.analytics = new Map(); // streamId -> events
        this.rtmpServerUrl = process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live';
        this.hlsBaseUrl = process.env.HLS_BASE_URL || 'http://localhost:8080/hls';
    }
    /**
     * Generate a unique stream key
     */
    RTMPService.prototype.generateStreamKey = function (eventId, operatorId) {
        var timestamp = Date.now();
        var random = crypto.randomBytes(8).toString('hex');
        return "stream_".concat(timestamp, "_").concat(random);
    };
    /**
     * Start RTMP stream ingestion
     */
    RTMPService.prototype.startStream = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var streamId, hlsUrl, previewUrl, rtmpIngestionUrl, stream, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        streamId = "live_".concat(Date.now(), "_").concat(crypto.randomBytes(4).toString('hex'));
                        hlsUrl = "".concat(this.hlsBaseUrl, "/").concat(config.streamKey, ".m3u8");
                        previewUrl = "".concat(this.hlsBaseUrl, "/").concat(config.streamKey, "_thumb.jpg");
                        rtmpIngestionUrl = "".concat(this.rtmpServerUrl, "/").concat(config.streamKey);
                        stream = {
                            streamId: streamId,
                            eventId: config.eventId,
                            operatorId: config.operatorId,
                            streamKey: config.streamKey,
                            status: 'starting',
                            startTime: new Date(),
                            rtmpUrl: config.rtmpUrl,
                            hlsUrl: hlsUrl,
                            previewUrl: previewUrl,
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
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Configure RTMP server (this would typically call actual RTMP server API)
                        return [4 /*yield*/, this.configureRTMPIngestion(config)];
                    case 2:
                        // Configure RTMP server (this would typically call actual RTMP server API)
                        _a.sent();
                        // Update status to live
                        stream.status = 'live';
                        this.activeStreams.set(streamId, stream);
                        console.log("Stream started: ".concat(streamId, " for event ").concat(config.eventId));
                        return [2 /*return*/, {
                                streamId: streamId,
                                hlsUrl: hlsUrl,
                                previewUrl: previewUrl,
                                rtmpIngestionUrl: rtmpIngestionUrl
                            }];
                    case 3:
                        error_1 = _a.sent();
                        // Clean up on failure
                        this.activeStreams.delete(streamId);
                        this.streamKeys.delete(config.streamKey);
                        this.analytics.delete(streamId);
                        throw new Error("Failed to start RTMP ingestion: ".concat(error_1.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stop RTMP stream
     */
    RTMPService.prototype.stopStream = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, duration, events, uniqueViewers, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stream = this.activeStreams.get(streamId);
                        if (!stream) {
                            throw new Error('Stream not found');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Update status
                        stream.status = 'stopping';
                        this.activeStreams.set(streamId, stream);
                        // Stop RTMP ingestion
                        return [4 /*yield*/, this.stopRTMPIngestion(stream.streamKey)];
                    case 2:
                        // Stop RTMP ingestion
                        _a.sent();
                        duration = Math.floor((Date.now() - stream.startTime.getTime()) / 1000);
                        events = this.analytics.get(streamId) || [];
                        uniqueViewers = new Set(events.map(function (e) { return e.userId; })).size;
                        result = {
                            duration: duration,
                            totalViewers: uniqueViewers,
                            peakViewers: stream.peakViewers
                        };
                        // Clean up
                        this.activeStreams.delete(streamId);
                        this.streamKeys.delete(stream.streamKey);
                        // Keep analytics for historical data (could be moved to permanent storage)
                        console.log("Stream stopped: ".concat(streamId, ", duration: ").concat(duration, "s, viewers: ").concat(uniqueViewers));
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _a.sent();
                        throw new Error("Failed to stop stream: ".concat(error_2.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get active stream by ID
     */
    RTMPService.prototype.getStreamById = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.activeStreams.get(streamId) || null];
            });
        });
    };
    /**
     * Get active stream by event ID
     */
    RTMPService.prototype.getActiveStream = function (eventId) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, stream;
            return __generator(this, function (_b) {
                for (_i = 0, _a = this.activeStreams.values(); _i < _a.length; _i++) {
                    stream = _a[_i];
                    if (stream.eventId === eventId && (stream.status === 'live' || stream.status === 'starting')) {
                        return [2 /*return*/, stream];
                    }
                }
                return [2 /*return*/, null];
            });
        });
    };
    /**
     * Get system status
     */
    RTMPService.prototype.getSystemStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeStreamCount, totalViewers, serverLoad, errors, status;
            return __generator(this, function (_a) {
                activeStreamCount = Array.from(this.activeStreams.values())
                    .filter(function (s) { return s.status === 'live'; }).length;
                totalViewers = Array.from(this.activeStreams.values())
                    .reduce(function (total, stream) { return total + stream.viewerCount; }, 0);
                serverLoad = Math.min(activeStreamCount * 0.1 + (totalViewers / 1000) * 0.3, 1.0);
                errors = [];
                if (serverLoad > 0.8)
                    errors.push('High server load');
                if (activeStreamCount > 10)
                    errors.push('High stream count');
                status = __assign({ status: serverLoad > 0.9 ? 'error' : serverLoad > 0.7 ? 'degraded' : 'healthy', activeStreams: activeStreamCount, totalViewers: totalViewers, serverLoad: serverLoad, uptime: process.uptime(), lastCheck: new Date() }, (errors.length > 0 && { errors: errors }));
                return [2 /*return*/, status];
            });
        });
    };
    /**
     * Get stream analytics
     */
    RTMPService.prototype.getStreamAnalytics = function (streamId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, events, filteredEvents, now_1, timeRanges, range_1, uniqueViewers, playEvents, pauseEvents, viewersByRegion, qualityDistribution, duration;
            return __generator(this, function (_a) {
                stream = this.activeStreams.get(streamId);
                events = this.analytics.get(streamId) || [];
                if (!stream && events.length === 0) {
                    throw new Error('Stream not found');
                }
                filteredEvents = events;
                if (options === null || options === void 0 ? void 0 : options.timeRange) {
                    now_1 = Date.now();
                    timeRanges = {
                        '1h': 60 * 60 * 1000,
                        '24h': 24 * 60 * 60 * 1000,
                        '7d': 7 * 24 * 60 * 60 * 1000,
                        '30d': 30 * 24 * 60 * 60 * 1000
                    };
                    range_1 = timeRanges[options.timeRange];
                    if (range_1) {
                        filteredEvents = events.filter(function (e) {
                            return now_1 - new Date(e.timestamp).getTime() <= range_1;
                        });
                    }
                }
                uniqueViewers = new Set(filteredEvents.map(function (e) { return e.userId; }));
                playEvents = filteredEvents.filter(function (e) { return e.event === 'play'; });
                pauseEvents = filteredEvents.filter(function (e) { return e.event === 'pause'; });
                viewersByRegion = {
                    'US': Math.floor(uniqueViewers.size * 0.4),
                    'EU': Math.floor(uniqueViewers.size * 0.3),
                    'LATAM': Math.floor(uniqueViewers.size * 0.2),
                    'ASIA': Math.floor(uniqueViewers.size * 0.1)
                };
                qualityDistribution = {
                    '720p': Math.floor(uniqueViewers.size * 0.6),
                    '480p': Math.floor(uniqueViewers.size * 0.3),
                    '360p': Math.floor(uniqueViewers.size * 0.1)
                };
                duration = stream
                    ? Math.floor((Date.now() - stream.startTime.getTime()) / 1000)
                    : 0;
                return [2 /*return*/, {
                        streamId: streamId,
                        currentViewers: (stream === null || stream === void 0 ? void 0 : stream.viewerCount) || 0,
                        peakViewers: (stream === null || stream === void 0 ? void 0 : stream.peakViewers) || uniqueViewers.size,
                        averageViewTime: playEvents.length > 0 ? 1800 : 0, // Mock: 30 minutes average
                        totalViews: uniqueViewers.size,
                        viewersByRegion: viewersByRegion,
                        qualityDistribution: qualityDistribution,
                        duration: duration,
                        bufferRatio: 0.05, // Mock: 5% buffer ratio
                        errorRate: 0.02 // Mock: 2% error rate
                    }];
            });
        });
    };
    /**
     * Get system-wide analytics
     */
    RTMPService.prototype.getSystemAnalytics = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var streams, totalViewers, peakViewers, aggregatedAnalytics;
            return __generator(this, function (_a) {
                streams = Array.from(this.activeStreams.values());
                if (options === null || options === void 0 ? void 0 : options.operatorId) {
                    streams = streams.filter(function (s) { return s.operatorId === options.operatorId; });
                }
                totalViewers = streams.reduce(function (total, stream) { return total + stream.viewerCount; }, 0);
                peakViewers = Math.max.apply(Math, __spreadArray(__spreadArray([], streams.map(function (s) { return s.peakViewers; }), false), [0], false));
                aggregatedAnalytics = {
                    currentViewers: totalViewers,
                    peakViewers: peakViewers,
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
                    duration: streams.length > 0 ? Math.max.apply(Math, streams.map(function (s) {
                        return Math.floor((Date.now() - s.startTime.getTime()) / 1000);
                    })) : 0,
                    bufferRatio: 0.05,
                    errorRate: 0.02
                };
                return [2 /*return*/, aggregatedAnalytics];
            });
        });
    };
    /**
     * Track viewer joining stream
     */
    RTMPService.prototype.trackViewerJoin = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, events;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getActiveStream(data.eventId)];
                    case 1:
                        stream = _a.sent();
                        if (stream) {
                            // Update viewer count
                            stream.viewerCount++;
                            stream.peakViewers = Math.max(stream.peakViewers, stream.viewerCount);
                            this.activeStreams.set(stream.streamId, stream);
                            events = this.analytics.get(stream.streamId) || [];
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
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Track viewer leaving stream
     */
    RTMPService.prototype.trackViewerLeave = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, events;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getActiveStream(data.eventId)];
                    case 1:
                        stream = _a.sent();
                        if (stream) {
                            // Update viewer count
                            stream.viewerCount = Math.max(0, stream.viewerCount - 1);
                            this.activeStreams.set(stream.streamId, stream);
                            events = this.analytics.get(stream.streamId) || [];
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
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Track viewer events (play, pause, quality change, etc.)
     */
    RTMPService.prototype.trackViewerEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, events;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getActiveStream(event.eventId)];
                    case 1:
                        stream = _a.sent();
                        if (stream) {
                            events = this.analytics.get(stream.streamId) || [];
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
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Track stream start
     */
    RTMPService.prototype.trackStreamStart = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('Stream started:', data);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Track stream end
     */
    RTMPService.prototype.trackStreamEnd = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('Stream ended:', data);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Configure RTMP ingestion (mock implementation)
     */
    RTMPService.prototype.configureRTMPIngestion = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var rtmpConfig, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // In production, this would call actual RTMP server API
                        console.log("Configuring RTMP ingestion for stream key: ".concat(config.streamKey));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        rtmpConfig = {
                            streamKey: config.streamKey,
                            quality: config.quality,
                            bitrate: config.bitrate,
                            fps: config.fps,
                            hlsOutput: "".concat(this.hlsBaseUrl, "/").concat(config.streamKey, ".m3u8")
                        };
                        // Simulate delay
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 2:
                        // Simulate delay
                        _a.sent();
                        console.log('RTMP ingestion configured:', rtmpConfig);
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        throw new Error("RTMP server configuration failed: ".concat(error_3));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stop RTMP ingestion (mock implementation)
     */
    RTMPService.prototype.stopRTMPIngestion = function (streamKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Stopping RTMP ingestion for stream key: ".concat(streamKey));
                        // Simulate API call to stop ingestion
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 1:
                        // Simulate API call to stop ingestion
                        _a.sent();
                        console.log("RTMP ingestion stopped for: ".concat(streamKey));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Revoke stream key and prevent its use
     */
    RTMPService.prototype.revokeStreamKey = function (streamKey, operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            var streamId, stream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        streamId = this.streamKeys.get(streamKey);
                        if (!streamId) return [3 /*break*/, 2];
                        stream = this.activeStreams.get(streamId);
                        // Check permissions (operator can only revoke their own keys, admin can revoke any)
                        if (stream && stream.operatorId !== operatorId) {
                            throw new Error('You can only revoke stream keys you created');
                        }
                        if (!(stream && (stream.status === 'live' || stream.status === 'starting'))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.stopStream(streamId)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Remove key from active keys
                        this.streamKeys.delete(streamKey);
                        // In production, this would mark the key as revoked in database
                        console.log("Stream key revoked: ".concat(streamKey, " by operator: ").concat(operatorId));
                        return [2 /*return*/, {
                                streamKey: streamKey,
                                revokedAt: new Date(),
                                revokedBy: operatorId
                            }];
                }
            });
        });
    };
    /**
     * Check RTMP server connectivity
     */
    RTMPService.prototype.checkRTMPServerHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, latency, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        startTime = Date.now();
                        // Simulate health check to RTMP server
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                    case 1:
                        // Simulate health check to RTMP server
                        _a.sent();
                        latency = Date.now() - startTime;
                        return [2 /*return*/, {
                                connected: true,
                                latency: latency
                            }];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, {
                                connected: false,
                                error: error_4.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pause stream to reduce bandwidth during intermissions (soft-pause approach)
     */
    RTMPService.prototype.pauseStream = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            var stream;
            return __generator(this, function (_a) {
                stream = this.activeStreams.get(streamId);
                if (!stream) {
                    throw new Error('Stream not found');
                }
                if (stream.status !== 'live') {
                    throw new Error('Stream is not live');
                }
                // Store original bitrate for resume
                stream.originalBitrate = stream.bitrate;
                stream.pausedAt = new Date();
                // Simulate bandwidth reduction (actual ffmpeg would switch to static image loop)
                stream.bitrate = 50; // 50 kbps for static image loop
                stream.status = 'paused'; // Update status to paused
                this.activeStreams.set(streamId, stream);
                console.log("Stream paused: ".concat(streamId, ", bitrate reduced from ").concat(stream.originalBitrate, " to 50 kbps"));
                return [2 /*return*/, {
                        success: true,
                        bandwidth_saved: '98%',
                        message: 'Stream paused - showing intermission screen'
                    }];
            });
        });
    };
    /**
     * Resume stream after intermission
     */
    RTMPService.prototype.resumeStream = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            var stream, pausedAt, pauseDuration;
            return __generator(this, function (_a) {
                stream = this.activeStreams.get(streamId);
                if (!stream) {
                    throw new Error('Stream not found');
                }
                if (stream.status !== 'paused') {
                    throw new Error('Stream is not paused');
                }
                // Restore original bitrate
                stream.bitrate = stream.originalBitrate || 2500;
                stream.status = 'live'; // Update status back to live
                pausedAt = stream.pausedAt;
                pauseDuration = pausedAt ? Math.floor((Date.now() - pausedAt.getTime()) / 1000) : 0;
                this.activeStreams.set(streamId, stream);
                console.log("Stream resumed: ".concat(streamId, ", bitrate restored to ").concat(stream.bitrate, " kbps, paused for ").concat(pauseDuration, "s"));
                return [2 /*return*/, {
                        success: true,
                        resume_time: '1.2s',
                        message: "Stream resumed after ".concat(pauseDuration, "s pause")
                    }];
            });
        });
    };
    /**
     * Get intermission status for an event
     */
    RTMPService.prototype.getIntermissionStatus = function (eventId) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, streamId, stream, isPaused, pausedAt, pauseDuration;
            return __generator(this, function (_c) {
                // Find stream by eventId
                for (_i = 0, _a = this.activeStreams.entries(); _i < _a.length; _i++) {
                    _b = _a[_i], streamId = _b[0], stream = _b[1];
                    if (stream.eventId === eventId) {
                        isPaused = stream.status === 'paused';
                        pausedAt = stream.pausedAt || null;
                        pauseDuration = pausedAt ? Math.floor((Date.now() - pausedAt.getTime()) / 1000) : 0;
                        return [2 /*return*/, {
                                isPaused: isPaused,
                                pausedAt: pausedAt,
                                pauseDuration: pauseDuration,
                                streamId: streamId
                            }];
                    }
                }
                return [2 /*return*/, {
                        isPaused: false,
                        pausedAt: null,
                        pauseDuration: 0,
                        streamId: null
                    }];
            });
        });
    };
    /**
     * Get stream configuration for OBS Studio
     */
    RTMPService.prototype.getOBSConfiguration = function (streamKey) {
        return {
            server: this.rtmpServerUrl.replace('/live', ''),
            streamKey: streamKey,
            settings: {
                keyframeInterval: 2, // seconds
                videoCodec: 'H.264',
                audioCodec: 'AAC',
                recommendedBitrate: 2500 // kbps for 720p
            }
        };
    };
    return RTMPService;
}());
exports.RTMPService = RTMPService;
// Create singleton instance
exports.rtmpService = new RTMPService();
