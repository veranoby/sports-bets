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
exports.AdminChannel = exports.SSEEventType = void 0;
exports.useAdminSSE = useAdminSSE;
exports.useFightSSE = useFightSSE;
var react_1 = require("react");
var AuthContext_1 = require("../contexts/AuthContext");
// Enhanced SSE Event Types matching backend service
var SSEEventType;
(function (SSEEventType) {
    // System Events
    SSEEventType["SYSTEM_STATUS"] = "SYSTEM_STATUS";
    SSEEventType["SYSTEM_MAINTENANCE"] = "SYSTEM_MAINTENANCE";
    SSEEventType["DATABASE_PERFORMANCE"] = "DATABASE_PERFORMANCE";
    SSEEventType["STREAM_STATUS_UPDATE"] = "STREAM_STATUS_UPDATE";
    SSEEventType["NOTIFICATION"] = "NOTIFICATION";
    SSEEventType["USER_NOTIFICATION"] = "USER_NOTIFICATION";
    // Fight Management Events
    SSEEventType["FIGHT_STATUS_UPDATE"] = "FIGHT_STATUS_UPDATE";
    SSEEventType["FIGHT_CREATED"] = "FIGHT_CREATED";
    SSEEventType["FIGHT_UPDATED"] = "FIGHT_UPDATED";
    SSEEventType["FIGHT_DELETED"] = "FIGHT_DELETED";
    SSEEventType["BETTING_WINDOW_OPENED"] = "BETTING_WINDOW_OPENED";
    SSEEventType["BETTING_WINDOW_CLOSED"] = "BETTING_WINDOW_CLOSED";
    // Betting Events
    SSEEventType["NEW_BET"] = "NEW_BET";
    SSEEventType["BET_MATCHED"] = "BET_MATCHED";
    SSEEventType["BET_CANCELLED"] = "BET_CANCELLED";
    SSEEventType["PAGO_PROPOSAL"] = "PAGO_PROPOSAL";
    SSEEventType["DOY_PROPOSAL"] = "DOY_PROPOSAL";
    SSEEventType["PROPOSAL_ACCEPTED"] = "PROPOSAL_ACCEPTED";
    SSEEventType["PROPOSAL_REJECTED"] = "PROPOSAL_REJECTED";
    SSEEventType["PROPOSAL_TIMEOUT"] = "PROPOSAL_TIMEOUT";
    // Financial Events
    SSEEventType["WALLET_TRANSACTION"] = "WALLET_TRANSACTION";
    SSEEventType["PAYMENT_PROCESSED"] = "PAYMENT_PROCESSED";
    SSEEventType["PAYOUT_PROCESSED"] = "PAYOUT_PROCESSED";
    SSEEventType["SUBSCRIPTION_UPDATED"] = "SUBSCRIPTION_UPDATED";
    // User Activity Events
    SSEEventType["USER_REGISTERED"] = "USER_REGISTERED";
    SSEEventType["USER_VERIFIED"] = "USER_VERIFIED";
    SSEEventType["USER_BANNED"] = "USER_BANNED";
    SSEEventType["ADMIN_ACTION"] = "ADMIN_ACTION";
    // Streaming Events
    SSEEventType["STREAM_STARTED"] = "STREAM_STARTED";
    SSEEventType["STREAM_ENDED"] = "STREAM_ENDED";
    SSEEventType["STREAM_ERROR"] = "STREAM_ERROR";
    SSEEventType["VIEWER_COUNT_UPDATE"] = "VIEWER_COUNT_UPDATE";
    // Connection Events
    SSEEventType["CONNECTION_ESTABLISHED"] = "CONNECTION_ESTABLISHED";
    SSEEventType["HEARTBEAT"] = "HEARTBEAT";
    SSEEventType["ERROR"] = "ERROR";
})(SSEEventType || (exports.SSEEventType = SSEEventType = {}));
// Admin Channels matching backend
var AdminChannel;
(function (AdminChannel) {
    AdminChannel["SYSTEM_MONITORING"] = "admin-system";
    AdminChannel["FIGHT_MANAGEMENT"] = "admin-fights";
    AdminChannel["BET_MONITORING"] = "admin-bets";
    AdminChannel["USER_MANAGEMENT"] = "admin-users";
    AdminChannel["FINANCIAL_MONITORING"] = "admin-finance";
    AdminChannel["STREAMING_MONITORING"] = "admin-streaming";
    AdminChannel["NOTIFICATIONS"] = "admin-notifications";
    AdminChannel["GLOBAL"] = "admin-global";
})(AdminChannel || (exports.AdminChannel = AdminChannel = {}));
var MAX_RECONNECT_DELAY = 30000; // 30 seconds, as per connection_management
var useSSE = function (url) {
    var _a = (0, AuthContext_1.useAuth)(), user = _a.user, token = _a.token;
    var _b = (0, react_1.useState)(null), lastEvent = _b[0], setLastEvent = _b[1];
    var _c = (0, react_1.useState)("disconnected"), status = _c[0], setStatus = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(null), data = _e[0], setData = _e[1];
    var eventSourceRef = (0, react_1.useRef)(null);
    var reconnectTimeoutRef = (0, react_1.useRef)(null);
    var retryCountRef = (0, react_1.useRef)(0);
    var eventHandlersRef = (0, react_1.useRef)(new Map());
    var mountedRef = (0, react_1.useRef)(true);
    var connect = (0, react_1.useCallback)(function () {
        if (!url || !user || !token || !mountedRef.current) {
            setStatus("disconnected");
            return;
        }
        // Ensure no parallel connections
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        setStatus("connecting");
        setError(null);
        try {
            // Build SSE URL with auth token matching backend expectations
            var fullUrl = "".concat(url, "?token=").concat(encodeURIComponent(token));
            console.log("\uD83D\uDD04 SSE: Connecting to ".concat(fullUrl));
            var es_1 = new EventSource(fullUrl);
            eventSourceRef.current = es_1;
            es_1.onopen = function () {
                if (!mountedRef.current)
                    return;
                console.log("\u2705 SSE: Connection established to ".concat(url));
                setStatus("connected");
                retryCountRef.current = 0; // Reset on successful connection
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
            };
            es_1.onmessage = function (event) {
                if (!mountedRef.current)
                    return;
                try {
                    var parsedData_1 = JSON.parse(event.data);
                    setLastEvent(parsedData_1);
                    setData(parsedData_1.data);
                    // Call registered event handlers
                    var handlers = eventHandlersRef.current.get(parsedData_1.type);
                    if (handlers) {
                        handlers.forEach(function (handler) {
                            try {
                                handler(parsedData_1);
                            }
                            catch (error) {
                                console.error("\u274C SSE: Error in event handler for ".concat(parsedData_1.type, ":"), error);
                            }
                        });
                    }
                    // Log high priority events
                    if (parsedData_1.priority === "high" ||
                        parsedData_1.priority === "critical") {
                        console.log("\uD83D\uDD14 SSE: ".concat(parsedData_1.priority.toUpperCase(), " event received:"), parsedData_1.type);
                    }
                }
                catch (e) {
                    console.error("❌ SSE: Failed to parse event data:", event.data);
                }
            };
            // Handle specific event types
            Object.values(SSEEventType).forEach(function (eventType) {
                es_1.addEventListener(eventType, function (event) {
                    if (!mountedRef.current)
                        return;
                    try {
                        var parsedData_2 = __assign(__assign({}, JSON.parse(event.data)), { id: event.lastEventId || "unknown", type: eventType });
                        setLastEvent(parsedData_2);
                        setData(parsedData_2.data);
                        // Call registered handlers
                        var handlers = eventHandlersRef.current.get(eventType);
                        handlers === null || handlers === void 0 ? void 0 : handlers.forEach(function (handler) {
                            try {
                                handler(parsedData_2);
                            }
                            catch (error) {
                                console.error("\u274C SSE: Error in event handler for ".concat(eventType, ":"), error);
                            }
                        });
                    }
                    catch (error) {
                        console.error("\u274C SSE: Error parsing ".concat(eventType, " event:"), error);
                    }
                });
            });
            es_1.onerror = function () {
                if (!mountedRef.current)
                    return;
                console.warn("\u26A0\uFE0F SSE: Connection error for ".concat(url, ". Attempting to reconnect."));
                es_1.close();
                setStatus("error");
                // Exponential backoff as required
                var delay = Math.min(MAX_RECONNECT_DELAY, 1000 * Math.pow(2, retryCountRef.current));
                retryCountRef.current++;
                console.log("\uD83D\uDD04 SSE: Reconnecting in ".concat(delay, "ms (attempt ").concat(retryCountRef.current, ")"));
                reconnectTimeoutRef.current = setTimeout(function () {
                    if (mountedRef.current) {
                        connect();
                    }
                }, delay);
            };
        }
        catch (e) {
            console.error("❌ SSE: Could not create EventSource:", e);
            setStatus("error");
            setError(e);
        }
    }, [url, user, token]);
    // Manual reconnect
    var reconnect = (0, react_1.useCallback)(function () {
        console.log("\uD83D\uDD04 SSE: Manual reconnect requested for ".concat(url));
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        retryCountRef.current = 0; // Reset retry count for manual reconnect
        setTimeout(function () {
            if (mountedRef.current) {
                connect();
            }
        }, 1000);
    }, [connect, url]);
    // Subscribe to specific event types
    var subscribe = (0, react_1.useCallback)(function (eventType, handler) {
        if (!eventHandlersRef.current.has(eventType)) {
            eventHandlersRef.current.set(eventType, new Set());
        }
        eventHandlersRef.current.get(eventType).add(handler);
        // Return unsubscribe function
        return function () {
            var handlers = eventHandlersRef.current.get(eventType);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    eventHandlersRef.current.delete(eventType);
                }
            }
        };
    }, []);
    // Subscribe to multiple event types at once
    var subscribeToEvents = (0, react_1.useCallback)(function (eventHandlers) {
        var unsubscribeFunctions = Object.entries(eventHandlers).map(function (_a) {
            var eventType = _a[0], handler = _a[1];
            if (handler) {
                return subscribe(eventType, handler);
            }
            return function () { };
        });
        // Return function to unsubscribe from all
        return function () {
            unsubscribeFunctions.forEach(function (unsubscribe) { return unsubscribe(); });
        };
    }, [subscribe]);
    (0, react_1.useEffect)(function () {
        if (user && token) {
            connect();
        }
        return function () {
            mountedRef.current = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (eventSourceRef.current) {
                console.log("\uD83D\uDD0C SSE: Closing connection to ".concat(url));
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [connect, url, user, token]);
    return {
        lastEvent: lastEvent,
        status: status,
        error: error,
        eventSourceInstance: eventSourceRef.current,
        data: data,
        subscribe: subscribe,
        subscribeToEvents: subscribeToEvents,
        reconnect: reconnect,
    };
};
/**
 * Specialized hook for admin-specific SSE connections
 * Automatically determines the appropriate admin channel based on user role
 */
function useAdminSSE(specificChannel, eventFilters) {
    var user = (0, AuthContext_1.useAuth)().user;
    // Determine default channel based on user role and current page
    var defaultChannel = specificChannel || AdminChannel.GLOBAL;
    // Only connect if user is admin or operator
    var shouldConnect = user && ["admin", "operator"].includes(user.role);
    // Build URL for admin SSE endpoint
    var url = shouldConnect
        ? "".concat(process.env.NODE_ENV === "production" ? "https://your-production-domain.com" : "http://localhost:3001", "/api/sse/").concat(defaultChannel)
        : null;
    var sse = useSSE(url);
    // Filter events if specified
    var filteredEventHandlers = (0, react_1.useCallback)(function (eventHandlers) {
        if (!eventFilters)
            return eventHandlers;
        var filtered = {};
        eventFilters.forEach(function (eventType) {
            if (eventHandlers[eventType]) {
                filtered[eventType] = eventHandlers[eventType];
            }
        });
        return filtered;
    }, [eventFilters]);
    return __assign(__assign({}, sse), { subscribeToEvents: function (eventHandlers) { return sse.subscribeToEvents(filteredEventHandlers(eventHandlers)); }, isAdminConnection: shouldConnect, channel: defaultChannel });
}
/**
 * Hook for fight-specific SSE events
 * Subscribes to fight updates, betting events, and proposals
 */
function useFightSSE(fightId) {
    var sse = useAdminSSE(AdminChannel.FIGHT_MANAGEMENT, [
        SSEEventType.FIGHT_STATUS_UPDATE,
        SSEEventType.BETTING_WINDOW_OPENED,
        SSEEventType.BETTING_WINDOW_CLOSED,
        SSEEventType.NEW_BET,
        SSEEventType.PAGO_PROPOSAL,
        SSEEventType.DOY_PROPOSAL,
    ]);
    var _a = (0, react_1.useState)(null), fightData = _a[0], setFightData = _a[1];
    var _b = (0, react_1.useState)(false), bettingWindow = _b[0], setBettingWindow = _b[1];
    var _c = (0, react_1.useState)([]), proposals = _c[0], setProposals = _c[1];
    (0, react_1.useEffect)(function () {
        if (sse.status !== "connected")
            return;
        var unsubscribers = [
            sse.subscribe(SSEEventType.FIGHT_STATUS_UPDATE, function (event) {
                var _a;
                if (!fightId || ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.fightId) === fightId) {
                    setFightData(event.data);
                    setBettingWindow(event.data.status === "betting");
                }
            }),
            sse.subscribe(SSEEventType.BETTING_WINDOW_OPENED, function (event) {
                var _a;
                if (!fightId || ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.fightId) === fightId) {
                    setBettingWindow(true);
                }
            }),
            sse.subscribe(SSEEventType.BETTING_WINDOW_CLOSED, function (event) {
                var _a;
                if (!fightId || ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.fightId) === fightId) {
                    setBettingWindow(false);
                }
            }),
            sse.subscribe(SSEEventType.PAGO_PROPOSAL, function (event) {
                var _a;
                if (!fightId || ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.fightId) === fightId) {
                    setProposals(function (prev) { return __spreadArray(__spreadArray([], prev, true), [__assign(__assign({}, event.data), { type: "PAGO" })], false); });
                }
            }),
            sse.subscribe(SSEEventType.DOY_PROPOSAL, function (event) {
                var _a;
                if (!fightId || ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.fightId) === fightId) {
                    setProposals(function (prev) { return __spreadArray(__spreadArray([], prev, true), [__assign(__assign({}, event.data), { type: "DOY" })], false); });
                }
            }),
        ];
        return function () {
            unsubscribers.forEach(function (unsubscribe) { return unsubscribe(); });
        };
    }, [sse.status, sse.subscribe, fightId]);
    return __assign(__assign({}, sse), { fightData: fightData, bettingWindow: bettingWindow, proposals: proposals, clearProposals: function () { return setProposals([]); } });
}
exports.default = useSSE;
