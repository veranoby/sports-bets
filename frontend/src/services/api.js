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
exports.fightAPI = exports.eventAPI = exports.usersAPI = exports.gallerasAPI = exports.venuesAPI = exports.membershipRequestsAPI = exports.uploadsAPI = exports.notificationsAPI = exports.walletAPI = exports.articlesAPI = exports.betsAPI = exports.streamingAPI = exports.systemAPI = exports.eventsAPI = exports.authAPI = exports.rawApiClient = exports.apiClient = exports.userAPI = exports.adminAPI = exports.fightsAPI = void 0;
var axios_1 = __importDefault(require("axios"));
var api = axios_1.default.create({
    baseURL: "/api", // The vite proxy in vite.config.ts will handle this
    headers: {
        "Content-Type": "application/json",
    },
});
// Optional: Add interceptors for handling tokens or errors globally.
api.interceptors.request.use(function (config) {
    var token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = "Bearer ".concat(token);
    }
    return config;
});
exports.default = api;
var apiCall = function (method, endpoint, data, headers) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1, err, backendResponse, apiError;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
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
                response = _c.sent();
                // Return backend response directly (it already has success/data structure)
                return [2 /*return*/, response.data];
            case 2:
                error_1 = _c.sent();
                console.error("Error at ".concat(endpoint, ":"), error_1);
                err = error_1;
                backendResponse = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data;
                console.error("Backend response:", backendResponse);
                apiError = {
                    name: "ApiError",
                    message: (backendResponse === null || backendResponse === void 0 ? void 0 : backendResponse.message) ||
                        (backendResponse === null || backendResponse === void 0 ? void 0 : backendResponse.error) ||
                        err.message ||
                        "An error occurred",
                    status: (_b = err.response) === null || _b === void 0 ? void 0 : _b.status,
                };
                console.error("Extracted error message:", apiError.message);
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
exports.fightsAPI = {
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/fights", data)];
        });
    }); },
    openBetting: function (fightId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/fights/".concat(fightId, "/open-betting"))];
        });
    }); },
    closeBetting: function (fightId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/fights/".concat(fightId, "/close-betting"))];
        });
    }); },
    recordResult: function (fightId, result) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/fights/".concat(fightId, "/result"), result)];
        });
    }); },
    // Admin component methods
    getFightsByEvent: function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/events/".concat(eventId, "/fights"))];
        });
    }); },
    createFight: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/fights", data)];
        });
    }); },
    updateFightStatus: function (fightId, status) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/fights/".concat(fightId, "/status"), { status: status })];
        });
    }); },
    assignFightResult: function (fightId, result) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/fights/".concat(fightId, "/result"), result)];
        });
    }); },
    delete: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/fights/".concat(id))];
        });
    }); },
};
exports.adminAPI = {
    updateUserMembership: function (userId, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/subscriptions/admin/".concat(userId, "/membership"), data)];
        });
    }); },
    forceLogoutUser: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/admin/sessions/".concat(userId))];
        });
    }); },
    getActiveUsers: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/admin/sessions/active-users")];
        });
    }); },
};
exports.userAPI = {
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/users", data)];
        });
    }); },
    uploadPaymentProof: function (formData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/users/upload-payment-proof", formData, {
                    "Content-Type": "multipart/form-data",
                })];
        });
    }); },
    getProfile: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/users/profile")];
        });
    }); },
    getAll: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/users", params)];
        });
    }); },
    getById: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/users/".concat(id))];
        });
    }); },
    delete: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/users/".concat(id))];
        });
    }); },
    update: function (id, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/users/".concat(id), data)];
        });
    }); },
    updatePassword: function (id, newPassword) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/users/".concat(id, "/password"), { password: newPassword })];
        });
    }); },
    updateRole: function (id, role) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/users/".concat(id), { role: role })];
        });
    }); },
    updateStatus: function (id, isActive) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/users/".concat(id), { isActive: isActive })];
        });
    }); },
    updateProfile: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/users/profile", {
                    profileInfo: data.profileInfo,
                })];
        });
    }); },
    updateProfileInfo: function (userId, profileInfo) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/users/".concat(userId, "/profile-info"), profileInfo)];
        });
    }); },
};
// Wrap the axios client to return ApiResponse format
exports.apiClient = {
    get: function (endpoint, config) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", endpoint, config === null || config === void 0 ? void 0 : config.params)];
        });
    }); },
    post: function (endpoint, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", endpoint, data)];
        });
    }); },
    put: function (endpoint, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", endpoint, data)];
        });
    }); },
    delete: function (endpoint) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", endpoint)];
        });
    }); },
};
// Keep raw axios client for internal use
exports.rawApiClient = api;
exports.authAPI = {
    login: function (credentials) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/auth/login", credentials)];
        });
    }); },
    logout: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/auth/logout")];
        });
    }); },
    checkMembershipStatus: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/auth/check-membership-status")];
        });
    }); },
    register: function (userData) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/auth/register", userData)];
        });
    }); },
};
exports.eventsAPI = {
    getAll: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/events", params)];
        });
    }); },
    getById: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/events/".concat(id))];
        });
    }); },
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/events", data)];
        });
    }); },
    update: function (id, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/events/".concat(id), data)];
        });
    }); },
    delete: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/events/".concat(id))];
        });
    }); },
    // Admin component methods
    updateEventStatus: function (eventId, status) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/events/".concat(eventId, "/status"), { status: status })];
        });
    }); },
    assignOperator: function (eventId, operatorId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/events/".concat(eventId, "/operator"), { operatorId: operatorId })];
        });
    }); },
    generateStreamKey: function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/events/".concat(eventId, "/stream-key"))];
        });
    }); },
    getCurrentBetting: function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/events/".concat(eventId, "/current-betting"))];
        });
    }); },
    // Note: pauseStream/resumeStream are in streamingAPI (unified endpoint)
    // Using streamingAPI.pauseStream(eventId) and streamingAPI.resumeStream(eventId)
};
// Monitoring API - System alerts and live statistics
exports.systemAPI = {
    getAlerts: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Get consolidated alerts from database, memory, and connection pool
            return [2 /*return*/, apiCall("get", "/monitoring/alerts")];
        });
    }); },
    getLiveStats: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Get live system statistics (connections, memory, etc.)
            return [2 /*return*/, apiCall("get", "/monitoring/stats")];
        });
    }); },
};
// Add streamingAPI for missing methods
exports.streamingAPI = {
    getStatus: function (streamId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/streaming/".concat(streamId, "/status"))];
        });
    }); },
    updateStatus: function (streamId, status) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/streaming/".concat(streamId, "/status"), { status: status })];
        });
    }); },
    startStream: function (streamId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/streaming/".concat(streamId, "/start"))];
        });
    }); },
    stopStream: function (streamId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/streaming/".concat(streamId, "/stop"))];
        });
    }); },
    getStreamAnalytics: function (streamId, params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/streaming/analytics/".concat(streamId || ""), { params: params })];
        });
    }); },
    trackViewerEvent: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/streaming/analytics/event", data)];
        });
    }); },
    pauseStream: function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/streaming/pause", { eventId: eventId })];
        });
    }); },
    resumeStream: function (eventId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/streaming/resume", { eventId: eventId })];
        });
    }); },
};
// Add missing APIs and aliases for components
exports.betsAPI = {
    getMyBets: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/bets")];
        });
    }); },
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/bets", data)];
        });
    }); },
    cancel: function (betId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/bets/".concat(betId))];
        });
    }); },
    accept: function (betId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/bets/".concat(betId, "/accept"))];
        });
    }); },
    getCompatibleBets: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/bets/compatible", params)];
        });
    }); },
    acceptProposal: function (betId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/bets/".concat(betId, "/accept-proposal"))];
        });
    }); },
    rejectProposal: function (betId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/bets/".concat(betId, "/reject-proposal"))];
        });
    }); },
    getPendingProposals: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/bets/pending-proposals")];
        });
    }); },
    // Admin-specific function to get all bets (not just user's bets)
    getAllAdmin: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/bets/all", params)];
        });
    }); },
};
exports.articlesAPI = {
    getAll: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/articles", params)];
        });
    }); },
    getFeatured: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/articles/featured", params)];
        });
    }); },
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/articles", data)];
        });
    }); },
    update: function (id, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/articles/".concat(id), data)];
        });
    }); },
    delete: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/articles/".concat(id))];
        });
    }); },
};
exports.walletAPI = {
    getBalance: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/wallet/balance")];
        });
    }); },
    addFunds: function (amount) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/wallet/add-funds", { amount: amount })];
        });
    }); },
    getTransactions: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/wallet/transactions", params)];
        });
    }); },
    getStats: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/wallet/stats", params)];
        });
    }); },
    // Add missing withdrawal request methods
    getWithdrawalRequests: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/wallet/withdrawal-requests", params)];
        });
    }); },
    processWithdrawalRequest: function (requestId, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/wallet/withdrawal-requests/".concat(requestId, "/process"), data)];
        });
    }); },
    // Admin financial endpoints
    getFinancialMetrics: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/wallet/financial-metrics", params)];
        });
    }); },
    getRevenueBySource: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/wallet/revenue-by-source", params)];
        });
    }); },
    getRevenueTrends: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/wallet/revenue-trends", params)];
        });
    }); },
};
// Add notifications API
exports.notificationsAPI = {
    getAll: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/notifications", params)];
        });
    }); },
    create: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/notifications", data)];
        });
    }); },
    markAsRead: function (notificationId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/notifications/".concat(notificationId, "/read"))];
        });
    }); },
    markAllAsRead: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("put", "/notifications/mark-all-read")];
        });
    }); },
    delete: function (notificationId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/notifications/".concat(notificationId))];
        });
    }); },
    getUnreadCount: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/notifications/unread-count")];
        });
    }); },
};
// Upload API for image handling
exports.uploadsAPI = {
    uploadImage: function (file) { return __awaiter(void 0, void 0, void 0, function () {
        var formData;
        return __generator(this, function (_a) {
            formData = new FormData();
            formData.append("image", file);
            return [2 /*return*/, apiCall("post", "/uploads/image", formData, {
                    "Content-Type": "multipart/form-data",
                })];
        });
    }); },
    deleteImage: function (filename) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/uploads/image/".concat(filename))];
        });
    }); },
};
// Membership Requests API
exports.membershipRequestsAPI = {
    createRequest: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("post", "/membership-requests", data)];
        });
    }); },
    getMyRequests: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/membership-requests/my-requests", params)];
        });
    }); },
    getPendingRequests: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/membership-requests/pending", params)];
        });
    }); },
    completeRequest: function (requestId, adminNotes) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("patch", "/membership-requests/".concat(requestId, "/complete"), {
                    adminNotes: adminNotes,
                })];
        });
    }); },
    rejectRequest: function (requestId, rejectionReason, adminNotes) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("patch", "/membership-requests/".concat(requestId, "/reject"), {
                    rejectionReason: rejectionReason,
                    adminNotes: adminNotes,
                })];
        });
    }); },
    deleteRequest: function (requestId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("delete", "/membership-requests/".concat(requestId))];
        });
    }); },
};
// Public listing APIs for venues and galleras
exports.venuesAPI = {
    getAll: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/venues", params)];
        });
    }); },
    getById: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/venues/".concat(id))];
        });
    }); },
};
exports.gallerasAPI = {
    getAll: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/galleras", params)];
        });
    }); },
    getById: function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, apiCall("get", "/galleras/".concat(id))];
        });
    }); },
};
// API aliases for backward compatibility
exports.usersAPI = exports.userAPI;
exports.eventAPI = exports.eventsAPI;
exports.fightAPI = exports.fightsAPI;
