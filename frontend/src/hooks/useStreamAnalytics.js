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
exports.useStreamAnalytics = void 0;
var react_1 = require("react");
var api_1 = require("../services/api");
var WebSocketContext_1 = require("../contexts/WebSocketContext");
var useStreamAnalytics = function (options) {
    if (options === void 0) { options = {}; }
    var streamId = options.streamId, eventId = options.eventId, _a = options.autoRefresh, autoRefresh = _a === void 0 ? true : _a, _b = options.refreshInterval, refreshInterval = _b === void 0 ? 30000 : _b, _c = options.realtime, realtime = _c === void 0 ? true : _c;
    var _d = (0, react_1.useState)(null), analytics = _d[0], setAnalytics = _d[1];
    var _e = (0, react_1.useState)(true), loading = _e[0], setLoading = _e[1];
    var _f = (0, react_1.useState)(null), error = _f[0], setError = _f[1];
    var _g = (0, WebSocketContext_1.useWebSocketContext)(), isConnected = _g.isConnected, emit = _g.emit, addListener = _g.addListener;
    var refreshIntervalRef = (0, react_1.useRef)(null);
    var eventBuffer = (0, react_1.useRef)([]);
    var componentMountedRef = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(function () {
        return function () {
            componentMountedRef.current = false;
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);
    var fetchAnalytics = (0, react_1.useCallback)(function (timeRange) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!componentMountedRef.current)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    setLoading(true);
                    setError(null);
                    return [4 /*yield*/, api_1.streamingAPI.getStreamAnalytics(streamId, {
                            timeRange: timeRange || "1h",
                        })];
                case 2:
                    response = _a.sent();
                    if (componentMountedRef.current && response.success) {
                        setAnalytics(response.data);
                    }
                    else if (componentMountedRef.current) {
                        setError(response.error || "Failed to load analytics");
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    if (componentMountedRef.current) {
                        if (err_1 instanceof Error) {
                            setError(err_1.message || "Failed to load analytics");
                        }
                        else {
                            setError("Failed to load analytics");
                        }
                        console.error("Analytics fetch error:", err_1);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    if (componentMountedRef.current) {
                        setLoading(false);
                    }
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [streamId]);
    var trackEvent = (0, react_1.useCallback)(function (eventData) { return __awaiter(void 0, void 0, void 0, function () {
        var viewerEvent, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!eventId) {
                        console.warn("Event ID required for tracking");
                        return [2 /*return*/];
                    }
                    viewerEvent = {
                        eventId: eventId,
                        event: eventData.event,
                        data: eventData.data,
                        timestamp: new Date().toISOString(),
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    if (!isConnected) {
                        eventBuffer.current.push(viewerEvent);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, api_1.streamingAPI.trackViewerEvent(viewerEvent)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    console.error("Event tracking failed:", err_2);
                    eventBuffer.current.push(viewerEvent);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [eventId, isConnected]);
    var flushEventBuffer = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var events, _i, events_1, event_1, res, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (eventBuffer.current.length === 0)
                        return [2 /*return*/];
                    events = __spreadArray([], eventBuffer.current, true);
                    eventBuffer.current = [];
                    _i = 0, events_1 = events;
                    _a.label = 1;
                case 1:
                    if (!(_i < events_1.length)) return [3 /*break*/, 6];
                    event_1 = events_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, api_1.streamingAPI.trackViewerEvent(event_1)];
                case 3:
                    res = _a.sent();
                    if (!res.success) {
                        console.error("Failed to send buffered event:", res.error);
                        eventBuffer.current.push(event_1);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    err_3 = _a.sent();
                    console.error("Failed to send buffered event:", err_3);
                    eventBuffer.current.push(event_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () {
        if (!realtime || !addListener || !emit || !eventId)
            return;
        var handleAnalyticsUpdate = function (data) {
            if (componentMountedRef.current) {
                setAnalytics(function (prev) { return (prev ? __assign(__assign({}, prev), data) : null); });
            }
        };
        var handleViewerJoin = function (data) {
            if (componentMountedRef.current) {
                setAnalytics(function (prev) {
                    return prev
                        ? __assign(__assign({}, prev), { currentViewers: data.viewerCount, peakViewers: Math.max(prev.peakViewers, data.viewerCount) }) : null;
                });
            }
        };
        var handleViewerLeave = function (data) {
            if (componentMountedRef.current) {
                setAnalytics(function (prev) {
                    return prev
                        ? __assign(__assign({}, prev), { currentViewers: data.viewerCount }) : null;
                });
            }
        };
        var handleQualityChange = function (data) {
            if (componentMountedRef.current) {
                setAnalytics(function (prev) {
                    var _a;
                    return prev
                        ? __assign(__assign({}, prev), { qualityDistribution: __assign(__assign({}, prev.qualityDistribution), (_a = {}, _a[data.quality] = (prev.qualityDistribution[data.quality] || 0) + 1, _a)) }) : null;
                });
            }
        };
        var handleStreamStatus = function (data) {
            if (data.duration !== undefined && componentMountedRef.current) {
                setAnalytics(function (prev) {
                    return prev ? __assign(__assign({}, prev), { duration: data.duration }) : null;
                });
            }
        };
        var handleConnection = function () {
            if (componentMountedRef.current) {
                emit("join_stream", { eventId: eventId, streamId: streamId });
                flushEventBuffer();
            }
        };
        var handleDisconnection = function () {
            // Context handles this
        };
        var cleanup = [
            addListener("connect", handleConnection),
            addListener("disconnect", handleDisconnection),
            addListener("stream:".concat(eventId, ":analytics"), handleAnalyticsUpdate),
            addListener("stream:".concat(eventId, ":viewer_join"), handleViewerJoin),
            addListener("stream:".concat(eventId, ":viewer_leave"), handleViewerLeave),
            addListener("stream:".concat(eventId, ":quality_change"), handleQualityChange),
            addListener("stream:".concat(eventId, ":status"), handleStreamStatus),
        ];
        if (isConnected) {
            handleConnection();
        }
        return function () {
            cleanup.forEach(function (fn) { return fn(); });
            if (eventId) {
                emit("leave_stream", { eventId: eventId, streamId: streamId });
            }
        };
    }, [
        addListener,
        emit,
        eventId,
        streamId,
        realtime,
        flushEventBuffer,
        isConnected,
    ]);
    (0, react_1.useEffect)(function () {
        if (!autoRefresh)
            return;
        fetchAnalytics();
        var intervalId = setInterval(function () {
            fetchAnalytics();
        }, refreshInterval);
        refreshIntervalRef.current = intervalId;
        return function () {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [autoRefresh, refreshInterval, fetchAnalytics]);
    var trackPlay = (0, react_1.useCallback)(function () { return trackEvent({ event: "play" }); }, [trackEvent]);
    var trackPause = (0, react_1.useCallback)(function () { return trackEvent({ event: "pause" }); }, [trackEvent]);
    var trackBuffer = (0, react_1.useCallback)(function (duration) { return trackEvent({ event: "buffer", data: { duration: duration } }); }, [trackEvent]);
    var trackError = (0, react_1.useCallback)(function (error) { return trackEvent({ event: "error", data: { error: error } }); }, [trackEvent]);
    var trackQualityChange = (0, react_1.useCallback)(function (quality) {
        return trackEvent({ event: "quality_change", data: { quality: quality } });
    }, [trackEvent]);
    var trackViewTime = (0, react_1.useCallback)(function (seconds) { return trackEvent({ event: "view_time", data: { seconds: seconds } }); }, [trackEvent]);
    return {
        analytics: analytics,
        loading: loading,
        error: error,
        isConnected: isConnected,
        hasBufferedEvents: eventBuffer.current.length > 0,
        fetchAnalytics: fetchAnalytics,
        trackEvent: trackEvent,
        flushEventBuffer: flushEventBuffer,
        trackPlay: trackPlay,
        trackPause: trackPause,
        trackBuffer: trackBuffer,
        trackError: trackError,
        trackQualityChange: trackQualityChange,
        trackViewTime: trackViewTime,
        refresh: function () { return fetchAnalytics(); },
        clearError: function () { return setError(null); },
    };
};
exports.useStreamAnalytics = useStreamAnalytics;
exports.default = exports.useStreamAnalytics;
