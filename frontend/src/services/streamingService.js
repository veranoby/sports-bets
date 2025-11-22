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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamingService = void 0;
var axios_1 = __importDefault(require("axios"));
var API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
// Create axios instance with base configuration
var api = axios_1.default.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});
// Add auth token to requests
api.interceptors.request.use(function (config) {
    var token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = "Bearer ".concat(token);
    }
    return config;
}, function (error) { return Promise.reject(error); });
// Handle response errors
api.interceptors.response.use(function (response) { return response; }, function (error) {
    var _a;
    if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
    }
    return Promise.reject(error);
});
// Local, typed apiCall function for this service
var apiCall = function (method, endpoint, data, headers) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1, err, apiError;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                return [4 /*yield*/, api.request({
                        method: method,
                        url: endpoint,
                        data: method.toLowerCase() !== "get" && method.toLowerCase() !== "delete"
                            ? data
                            : undefined,
                        params: method.toLowerCase() === "get" || method.toLowerCase() === "delete"
                            ? data
                            : undefined,
                        headers: headers,
                    })];
            case 1:
                response = _d.sent();
                return [2 /*return*/, { success: true, data: response.data }];
            case 2:
                error_1 = _d.sent();
                console.error("Error at ".concat(endpoint, ":"), error_1);
                err = error_1;
                apiError = {
                    name: "ApiError",
                    message: ((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) ||
                        err.message ||
                        "An error occurred",
                    status: (_c = err.response) === null || _c === void 0 ? void 0 : _c.status,
                };
                return [2 /*return*/, {
                        success: false,
                        data: null,
                        error: apiError.message,
                        code: apiError.status,
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
var StreamingService = /** @class */ (function () {
    function StreamingService() {
    }
    StreamingService.prototype.startStream = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("post", "/streaming/start", config)];
            });
        });
    };
    StreamingService.prototype.stopStream = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("post", "/streaming/stop", { streamId: streamId })];
            });
        });
    };
    StreamingService.prototype.getStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("get", "/streaming/status")];
            });
        });
    };
    StreamingService.prototype.getAnalytics = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                url = streamId
                    ? "/streaming/analytics/".concat(streamId)
                    : "/streaming/analytics";
                return [2 /*return*/, apiCall("get", url)];
            });
        });
    };
    StreamingService.prototype.getStreamAccess = function (eventId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("get", "/events/".concat(eventId, "/stream-access"))];
            });
        });
    };
    StreamingService.prototype.validateStreamToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("post", "/streaming/validate-token", { token: token })];
            });
        });
    };
    StreamingService.prototype.reportViewingEvent = function (eventId, event, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("post", "/streaming/analytics/event", {
                        eventId: eventId,
                        event: event,
                        data: data,
                        timestamp: new Date().toISOString(),
                    })];
            });
        });
    };
    StreamingService.prototype.getStreamHealth = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("get", "/streaming/".concat(streamId, "/health"))];
            });
        });
    };
    StreamingService.prototype.updateStreamConfig = function (streamId, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("patch", "/streaming/".concat(streamId, "/config"), config)];
            });
        });
    };
    StreamingService.prototype.generateStreamKey = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("post", "/streaming/keys/generate", config)];
            });
        });
    };
    StreamingService.prototype.revokeStreamKey = function (streamKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("delete", "/streaming/keys/".concat(streamKey))];
            });
        });
    };
    StreamingService.prototype.getOBSConfig = function (streamKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("get", "/streaming/obs-config/".concat(streamKey))];
            });
        });
    };
    StreamingService.prototype.getSystemHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("get", "/streaming/health")];
            });
        });
    };
    StreamingService.prototype.getAvailableQualities = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("get", "/streaming/".concat(streamId, "/qualities"))];
            });
        });
    };
    StreamingService.prototype.subscribeToStreamEvents = function (streamId, callbacks) {
        var _this = this;
        // This would typically use WebSocket or Server-Sent Events
        // For now, we'll implement polling as fallback
        var polling = true;
        var poll = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                if (!polling)
                    return [2 /*return*/];
                try {
                    // const analytics = await this.getAnalytics(streamId);
                    // Trigger callbacks based on analytics changes
                    // This is simplified - in production we'd use real-time events
                }
                catch (error) {
                    (_a = callbacks.onError) === null || _a === void 0 ? void 0 : _a.call(callbacks, error);
                }
                return [2 /*return*/];
            });
        }); };
        var intervalId = setInterval(poll, 5000); // Poll every 5 seconds
        // Return cleanup function
        return function () {
            polling = false;
            clearInterval(intervalId);
        };
    };
    StreamingService.prototype.getRecordingStatus = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("get", "/streaming/".concat(streamId, "/recording"))];
            });
        });
    };
    StreamingService.prototype.toggleRecording = function (streamId, start) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("post", "/streaming/".concat(streamId, "/recording"), {
                        action: start ? "start" : "stop",
                    })];
            });
        });
    };
    StreamingService.prototype.getStreamThumbnail = function (streamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("get", "/streaming/".concat(streamId, "/thumbnail"))];
            });
        });
    };
    StreamingService.prototype.testRTMPConnection = function (rtmpUrl, streamKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiCall("post", "/streaming/test-connection", {
                        rtmpUrl: rtmpUrl,
                        streamKey: streamKey,
                    })];
            });
        });
    };
    return StreamingService;
}());
// Create singleton instance
exports.streamingService = new StreamingService();
// Export for use in other components
exports.default = exports.streamingService;
