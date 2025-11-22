"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var useSSE_1 = __importDefault(require("./useSSE"));
var useStreamStatus = function (eventId) {
    var _a = (0, react_1.useState)(false), isLive = _a[0], setIsLive = _a[1];
    var _b = (0, react_1.useState)(0), viewers = _b[0], setViewers = _b[1];
    var _c = (0, react_1.useState)(null), streamUrl = _c[0], setStreamUrl = _c[1];
    // Connect to the admin streaming SSE channel
    var _d = (0, useSSE_1.default)("/api/sse/admin/streaming"), lastEvent = _d.lastEvent, status = _d.status, error = _d.error;
    (0, react_1.useEffect)(function () {
        if (lastEvent && lastEvent.type === "STREAM_STATUS_UPDATE") {
            var data = lastEvent.data;
            if (data.eventId === eventId) {
                setIsLive(data.isLive);
                setViewers(data.viewers);
                setStreamUrl(data.streamUrl);
            }
        }
    }, [lastEvent, eventId]);
    return {
        isLive: isLive,
        viewers: viewers,
        streamUrl: streamUrl,
        status: status,
        error: error,
    };
};
exports.default = useStreamStatus;
