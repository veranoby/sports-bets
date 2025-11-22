"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var AuthContext_1 = require("../contexts/AuthContext");
var useSSEConnection = function () {
    var _a = (0, AuthContext_1.useAuth)(), user = _a.user, token = _a.token;
    var _b = (0, react_1.useState)(null), data = _b[0], setData = _b[1];
    var _c = (0, react_1.useState)(false), isConnected = _c[0], setIsConnected = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var eventSourceRef = (0, react_1.useRef)(null);
    var reconnectTimeoutRef = (0, react_1.useRef)(null);
    var retryCountRef = (0, react_1.useRef)(0);
    var mountedRef = (0, react_1.useRef)(true);
    var MAX_RECONNECT_DELAY = 30000; // 30 seconds max delay
    var connect = (0, react_1.useCallback)(function () {
        if (!user || !token || !mountedRef.current) {
            setIsConnected(false);
            return;
        }
        // Ensure no parallel connections
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        try {
            // Use the new SSE endpoint for streaming monitoring
            var url = "".concat(process.env.VITE_API_BASE_URL || "http://localhost:3001", "/api/sse/streaming?token=").concat(encodeURIComponent(token));
            console.log("\uD83D\uDD04 SSE: Connecting to ".concat(url));
            var es = new EventSource(url);
            eventSourceRef.current = es;
            es.onopen = function () {
                if (!mountedRef.current)
                    return;
                console.log("\u2705 SSE: Streaming monitoring connection established");
                setIsConnected(true);
                setError(null);
                retryCountRef.current = 0; // Reset on successful connection
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
            };
            es.onmessage = function (event) {
                if (!mountedRef.current)
                    return;
                try {
                    // The data should be in event.data directly since our backend sends "data: {json}"
                    var parsedData = JSON.parse(event.data);
                    setData(parsedData);
                    console.log("📈 SSE: Received streaming monitoring data:", parsedData);
                }
                catch (parseError) {
                    console.error("❌ SSE: Failed to parse streaming monitoring data:", event.data, parseError);
                    setError(new Error("Failed to parse SSE data: ".concat(parseError)));
                }
            };
            es.onerror = function () {
                var _a;
                if (!mountedRef.current)
                    return;
                console.warn("⚠️ SSE: Streaming monitoring connection error. Attempting to reconnect.");
                setIsConnected(false);
                (_a = eventSourceRef.current) === null || _a === void 0 ? void 0 : _a.close();
                // Exponential backoff for reconnection
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
            console.error("❌ SSE: Could not create streaming monitoring EventSource:", e);
            setError(e);
            setIsConnected(false);
        }
    }, [user, token]);
    var reconnect = (0, react_1.useCallback)(function () {
        console.log("🔄 SSE: Manual reconnect requested for streaming monitoring");
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        retryCountRef.current = 0; // Reset retry count for manual reconnect
        setIsConnected(false);
        setTimeout(function () {
            if (mountedRef.current) {
                connect();
            }
        }, 1000);
    }, [connect]);
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
                console.log("🔌 SSE: Closing streaming monitoring connection");
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [connect, user, token]);
    return {
        data: data,
        isConnected: isConnected,
        error: error,
        reconnect: reconnect,
    };
};
exports.default = useSSEConnection;
