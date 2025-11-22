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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBSOCKET_URL = exports.adminAPI = exports.settingsAPI = exports.systemAPI = exports.articlesAPI = exports.usersAPI = exports.streamingAPI = exports.gallerasAPI = exports.venuesAPI = exports.subscriptionsAPI = exports.subscriptionAPI = exports.walletAPI = exports.betsAPI = exports.fightsAPI = exports.eventsAPI = exports.authAPI = exports.apiClient = exports.API_BASE_URL = void 0;
var axios_1 = __importDefault(require("axios"));
// Configuración base de la API
exports.API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
// Crear instancia de axios con configuración base
exports.apiClient = axios_1.default.create({
    baseURL: exports.API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});
// Interceptor para agregar token automáticamente
exports.apiClient.interceptors.request.use(function (config) {
    var token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = "Bearer ".concat(token);
    }
    return config;
}, function (error) { return Promise.reject(error); });
// Interceptor para manejar respuestas y errores
exports.apiClient.interceptors.response.use(function (response) { return response.data; }, function (error) {
    var _a, _b, _c, _d, _e, _f;
    console.error("API Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
    if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
    }
    // Extraer mensaje de error del backend
    var errorMessage = ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) ||
        ((_f = (_e = error.response) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.error) ||
        error.message ||
        "Error desconocido";
    return Promise.reject(new Error(errorMessage));
});
// Servicios API organizados por categoría
exports.authAPI = {
    register: function (data) {
        return exports.apiClient.post("/auth/register", data);
    },
    login: function (data) {
        return exports.apiClient.post("/auth/login", data);
    },
    me: function () { return exports.apiClient.get("/auth/me"); },
    refreshToken: function () { return exports.apiClient.post("/auth/refresh"); },
    changePassword: function (data) {
        return exports.apiClient.post("/auth/change-password", data);
    },
    logout: function () { return exports.apiClient.post("/auth/logout"); },
};
exports.eventsAPI = {
    getAll: function (params) { return exports.apiClient.get("/events", { params: params }); },
    getById: function (id) { return exports.apiClient.get("/events/".concat(id)); },
    create: function (data) { return exports.apiClient.post("/events", data); },
    update: function (id, data) {
        return exports.apiClient.put("/events/".concat(id), data);
    },
    activate: function (id) { return exports.apiClient.post("/events/".concat(id, "/activate")); },
    startStream: function (id) { return exports.apiClient.post("/events/".concat(id, "/stream/start")); },
    stopStream: function (id) { return exports.apiClient.post("/events/".concat(id, "/stream/stop")); },
    getStreamStatus: function (id) { return exports.apiClient.get("/events/".concat(id, "/stream/status")); },
    complete: function (id) { return exports.apiClient.post("/events/".concat(id, "/complete")); },
    getStats: function (id) { return exports.apiClient.get("/events/".concat(id, "/stats")); },
    getCurrentBetting: function (id) {
        return exports.apiClient.get("/events/".concat(id, "/current-betting"));
    },
    delete: function (id) { return exports.apiClient.delete("/events/".concat(id)); },
    cancel: function (id) { return exports.apiClient.post("/events/".concat(id, "/cancel")); },
};
exports.fightsAPI = {
    getAll: function (params) {
        return exports.apiClient.get("/fights", { params: params });
    },
    getById: function (id) { return exports.apiClient.get("/fights/".concat(id)); },
    create: function (data) { return exports.apiClient.post("/fights", data); },
    update: function (id, data) { return exports.apiClient.put("/fights/".concat(id), data); },
    openBetting: function (id) { return exports.apiClient.post("/fights/".concat(id, "/open-betting")); },
    closeBetting: function (id) { return exports.apiClient.post("/fights/".concat(id, "/close-betting")); },
    recordResult: function (id, data) { return exports.apiClient.post("/fights/".concat(id, "/result"), data); },
};
// ✅ BETS API COMPLETA CON MÉTODOS PAGO/DOY
exports.betsAPI = {
    getMyBets: function (params) { return exports.apiClient.get("/bets", { params: params }); },
    getAvailable: function (fightId) {
        return exports.apiClient.get("/bets/available/".concat(fightId));
    },
    create: function (data) { return exports.apiClient.post("/bets", data); },
    accept: function (betId) { return exports.apiClient.post("/bets/".concat(betId, "/accept")); },
    cancel: function (betId) { return exports.apiClient.put("/bets/".concat(betId, "/cancel")); },
    getStats: function () { return exports.apiClient.get("/bets/stats"); },
    // 🎯 MÉTODOS PAGO/DOY AÑADIDOS
    proposePago: function (betId, pagoAmount) {
        return exports.apiClient.post("/bets/".concat(betId, "/propose-pago"), { pagoAmount: pagoAmount });
    },
    acceptProposal: function (betId) {
        return exports.apiClient.put("/bets/".concat(betId, "/accept-proposal"));
    },
    rejectProposal: function (betId) {
        return exports.apiClient.put("/bets/".concat(betId, "/reject-proposal"));
    },
    getPendingProposals: function () { return exports.apiClient.get("/bets/pending-proposals"); },
    getCompatibleBets: function (params) { return exports.apiClient.get("/bets/available/".concat(params.fightId), { params: params }); },
};
exports.walletAPI = {
    getWallet: function () { return exports.apiClient.get("/wallet"); },
    getTransactions: function (params) { return exports.apiClient.get("/wallet/transactions", { params: params }); },
    deposit: function (data) { return exports.apiClient.post("/wallet/deposit", data); },
    withdraw: function (data) { return exports.apiClient.post("/wallet/withdraw", data); },
    getBalance: function () { return exports.apiClient.get("/wallet/balance"); },
    getStats: function () { return exports.apiClient.get("/wallet/stats"); },
    // ✅ Funciones nuevas para retiros y métricas financieras
    getWithdrawalRequests: function (params) { return exports.apiClient.get("/wallet/withdrawal-requests", { params: params }); },
    processWithdrawalRequest: function (id, data) { return exports.apiClient.put("/wallet/withdrawal-requests/".concat(id), data); },
    getFinancialMetrics: function (params) { return exports.apiClient.get("/wallet/financial-metrics", { params: params }); },
    getRevenueBySource: function (params) {
        return exports.apiClient.get("/wallet/revenue-by-source", { params: params });
    },
    getRevenueTrends: function (params) {
        return exports.apiClient.get("/wallet/revenue-trends", { params: params });
    },
    // Get wallet for specific user (admin only)
    getUserWallet: function (userId) { return exports.apiClient.get("/wallet/user/".concat(userId)); },
};
exports.subscriptionAPI = {
    // Get current active subscription
    getCurrentSubscription: function () { return exports.apiClient.get("/subscriptions/current"); },
    // Create new subscription with payment
    createSubscription: function (data) { return exports.apiClient.post("/subscriptions/create", data); },
    // Cancel active subscription
    cancelSubscription: function (data) {
        return exports.apiClient.post("/subscriptions/cancel", data);
    },
    // Get payment history
    getPaymentHistory: function (params) { return exports.apiClient.get("/subscriptions/history", { params: params }); },
    // Check subscription access
    checkAccess: function (data) {
        return exports.apiClient.post("/subscriptions/check-access", data);
    },
    // Get available subscription plans
    getPlans: function () { return exports.apiClient.get("/subscriptions/plans"); },
    // Toggle auto-renew setting
    updateAutoRenew: function (id, data) {
        return exports.apiClient.put("/subscriptions/".concat(id, "/auto-renew"), data);
    },
};
// Legacy alias for compatibility
exports.subscriptionsAPI = exports.subscriptionAPI;
exports.venuesAPI = {
    getAll: function (params) {
        return exports.apiClient.get("/venues", { params: params });
    },
    getById: function (id) { return exports.apiClient.get("/venues/".concat(id)); },
    create: function (data) { return exports.apiClient.post("/venues", data); },
    update: function (id, data) {
        return exports.apiClient.put("/venues/".concat(id), data);
    },
    updateStatus: function (id, status, reason) {
        return exports.apiClient.put("/venues/".concat(id, "/status"), { status: status, reason: reason });
    },
    delete: function (id) { return exports.apiClient.delete("/venues/".concat(id)); },
    getMyVenues: function () { return exports.apiClient.get("/venues/my/venues"); },
};
exports.gallerasAPI = {
    getAll: function (params) {
        return exports.apiClient.get("/galleras", { params: params });
    },
    getById: function (id) { return exports.apiClient.get("/galleras/".concat(id)); },
    create: function (data) { return exports.apiClient.post("/galleras", data); },
    update: function (id, data) {
        return exports.apiClient.put("/galleras/".concat(id), data);
    },
    updateStatus: function (id, status, reason) {
        return exports.apiClient.put("/galleras/".concat(id, "/status"), { status: status, reason: reason });
    },
    delete: function (id) { return exports.apiClient.delete("/galleras/".concat(id)); },
};
exports.streamingAPI = {
    // Stream access
    getStreamAccess: function (eventId) {
        return exports.apiClient.get("/streaming/events/".concat(eventId, "/stream-access"));
    },
    validateToken: function (token) {
        return exports.apiClient.post("/streaming/validate-token", { token: token });
    },
    // Stream control
    startStream: function (config) { return exports.apiClient.post("/streaming/start", config); },
    stopStream: function (data) {
        return exports.apiClient.post("/streaming/stop", data);
    },
    // System status and analytics
    getSystemStatus: function () { return exports.apiClient.get("/streaming/status"); },
    getStreamAnalytics: function (streamId, params) { return exports.apiClient.get("/streaming/analytics/".concat(streamId || ""), { params: params }); },
    // Stream keys and RTMP
    generateStreamKey: function (data) {
        return exports.apiClient.post("/streaming/keys/generate", data);
    },
    revokeStreamKey: function (streamKey) {
        return exports.apiClient.delete("/streaming/keys/".concat(streamKey));
    },
    getOBSConfig: function (streamKey) {
        return exports.apiClient.get("/streaming/obs-config/".concat(streamKey));
    },
    // System health
    getSystemHealth: function () { return exports.apiClient.get("/streaming/health"); },
    // Analytics events
    trackViewerEvent: function (data) { return exports.apiClient.post("/streaming/analytics/event", data); },
};
exports.usersAPI = {
    getProfile: function () { return exports.apiClient.get("/users/profile"); },
    updateProfile: function (data) { return exports.apiClient.put("/users/profile", data); },
    getAll: function (params) { return exports.apiClient.get("/users", { params: params }); },
    getById: function (id) { return exports.apiClient.get("/users/".concat(id)); },
    create: function (data) { return exports.apiClient.post("/users", data); },
    updateStatus: function (id, status, reason) {
        return exports.apiClient.put("/users/".concat(id, "/status"), { status: status, reason: reason });
    },
    updateRole: function (id, role, reason) {
        return exports.apiClient.put("/users/".concat(id, "/role"), { role: role, reason: reason });
    },
    // General update method (admin only)
    update: function (id, data) { return exports.apiClient.put("/users/".concat(id), data); },
    getAvailableOperators: function () { return exports.apiClient.get("/users/operators/available"); },
    // Get operators with active status
    getOperators: function () { return exports.apiClient.get("/users?role=operator&isActive=true"); },
    // Delete/deactivate user (admin only)
    delete: function (id) { return exports.apiClient.delete("/users/".concat(id)); },
};
exports.articlesAPI = {
    getAll: function (params) { return exports.apiClient.get("/articles", { params: params }); },
    getFeatured: function (params) {
        return exports.apiClient.get("/articles", {
            params: __assign({ status: "published", featured: true, limit: (params === null || params === void 0 ? void 0 : params.limit) || 5 }, params),
        });
    },
    getById: function (id) { return exports.apiClient.get("/articles/".concat(id)); },
    create: function (data) { return exports.apiClient.post("/articles", data); },
    update: function (id, data) { return exports.apiClient.put("/articles/".concat(id), data); },
    updateStatus: function (id, status) {
        return exports.apiClient.put("/articles/".concat(id, "/status"), { status: status });
    },
    delete: function (id) { return exports.apiClient.delete("/articles/".concat(id)); },
};
// System API for monitoring and health
exports.systemAPI = {
    getMetrics: function () { return exports.apiClient.get("/system/metrics"); },
    getHealth: function () { return exports.apiClient.get("/system/health"); },
    getLogs: function () { return exports.apiClient.get("/system/logs"); },
};
// Settings API for system configuration
exports.settingsAPI = {
    getAll: function () { return exports.apiClient.get("/settings"); },
    update: function (data) { return exports.apiClient.put("/settings", data); },
    get: function (key) { return exports.apiClient.get("/settings/".concat(key)); },
    set: function (key, value) {
        return exports.apiClient.put("/settings/".concat(key), { value: value });
    },
};
// Admin API for membership management
exports.adminAPI = {
    updateUserMembership: function (userId, data) { return exports.apiClient.put("/subscriptions/admin/".concat(userId, "/membership"), data); },
    getUserMembership: function (userId) {
        return exports.apiClient.get("/subscriptions/admin/".concat(userId, "/membership"));
    },
    getMembershipStats: function () { return exports.apiClient.get("/admin/membership/stats"); },
};
// WebSocket configuration
exports.WEBSOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";
