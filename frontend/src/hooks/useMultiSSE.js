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
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var MAX_RECONNECT_DELAY = 30000; // 30 seconds
var useMultiSSE = function (channels) {
    var _a = (0, react_1.useState)(function () {
        var initialState = {};
        Object.keys(channels).forEach(function (key) {
            initialState[key] = {
                lastEvent: null,
                status: "disconnected",
                error: null,
            };
        });
        return initialState;
    }), states = _a[0], setStates = _a[1];
    var eventSourcesRef = (0, react_1.useRef)({});
    var reconnectTimeoutsRef = (0, react_1.useRef)({});
    var retryCountsRef = (0, react_1.useRef)({});
    var connect = (0, react_1.useCallback)(function (key, url) {
        // Retrieve token for auth
        var token = localStorage.getItem("token");
        if (!token) {
            setStates(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[key] = {
                    lastEvent: null,
                    status: "error",
                    error: new Error("Authentication token not found."),
                }, _a)));
            });
            return;
        }
        setStates(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = { lastEvent: null, status: "connecting", error: null }, _a)));
        });
        var fullUrl = "".concat(url, "?token=").concat(token);
        var es = new EventSource(fullUrl);
        eventSourcesRef.current[key] = es;
        es.onopen = function () {
            console.log("[SSE] Connection established to ".concat(url, " for channel [").concat(key, "]"));
            retryCountsRef.current[key] = 0;
            setStates(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[key] = __assign(__assign({}, prev[key]), { status: "connected", error: null }), _a)));
            });
            if (reconnectTimeoutsRef.current[key]) {
                clearTimeout(reconnectTimeoutsRef.current[key]);
            }
        };
        es.onmessage = function (event) {
            try {
                var parsedData_1 = JSON.parse(event.data);
                setStates(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), (_a = {}, _a[key] = __assign(__assign({}, prev[key]), { lastEvent: parsedData_1 }), _a)));
                });
            }
            catch (e) {
                console.error("[SSE] Failed to parse event data for channel [".concat(key, "]:"), event.data);
            }
        };
        es.onerror = function () {
            console.error("[SSE] Error with connection to ".concat(url, " for channel [").concat(key, "]. Attempting to reconnect."));
            es.close();
            setStates(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[key] = __assign(__assign({}, prev[key]), { status: "error" }), _a)));
            });
            var retryCount = retryCountsRef.current[key] || 0;
            var delay = Math.min(MAX_RECONNECT_DELAY, 1000 * Math.pow(2, retryCount));
            retryCountsRef.current[key] = retryCount + 1;
            console.log("[SSE] Reconnecting channel [".concat(key, "] in ").concat(delay, "ms..."));
            reconnectTimeoutsRef.current[key] = setTimeout(function () { return connect(key, url); }, delay);
        };
    }, []);
    (0, react_1.useEffect)(function () {
        Object.entries(channels).forEach(function (_a) {
            var key = _a[0], url = _a[1];
            if (url) {
                retryCountsRef.current[key] = 0;
                connect(key, url);
            }
        });
        return function () {
            Object.values(eventSourcesRef.current).forEach(function (es) { return es.close(); });
            Object.values(reconnectTimeoutsRef.current).forEach(function (timeout) {
                return clearTimeout(timeout);
            });
        };
    }, [channels, connect]);
    return states;
};
exports.default = useMultiSSE;
