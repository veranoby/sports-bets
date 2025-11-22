"use strict";
// frontend/src/hooks/useApi.ts - IMPLEMENTACIÓN DEFINITIVA V4
// ============================================================
// CORREGIDO: Estructura parsing wallet response.data.wallet
// ELIMINADO: Implementaciones duplicadas/fragmentadas
// SOLUCIONADO: Balance $0 con estructura backend real
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWallet = useWallet;
exports.useBets = useBets;
exports.useEvents = useEvents;
exports.useFights = useFights;
exports.useVenues = useVenues;
exports.useNotifications = useNotifications;
exports.useSubscriptions = useSubscriptions;
exports.useUsers = useUsers;
exports.useAuthOperations = useAuthOperations;
var react_1 = require("react");
var api_1 = require("../services/api");
// ====================== BASE HOOK ======================
function useAsyncOperation() {
    var _this = this;
    var _a = (0, react_1.useState)(null), data = _a[0], setData = _a[1];
    var _b = (0, react_1.useState)(false), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var mountedRef = (0, react_1.useRef)(true);
    var execute = (0, react_1.useCallback)(function (asyncFunction) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_1, axiosError;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    setError(null);
                    return [4 /*yield*/, asyncFunction()];
                case 1:
                    result = _c.sent();
                    if (mountedRef.current) {
                        setData(result.data);
                    }
                    return [2 /*return*/, result];
                case 2:
                    err_1 = _c.sent();
                    if (mountedRef.current) {
                        if (err_1 instanceof Error) {
                            axiosError = err_1;
                            setError(((_b = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) ||
                                err_1.message ||
                                "An error occurred");
                        }
                        else {
                            setError("An unknown error occurred");
                        }
                    }
                    throw err_1;
                case 3:
                    if (mountedRef.current) {
                        setLoading(false);
                    }
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
        };
    }, []);
    return {
        data: data,
        loading: loading,
        error: error,
        execute: execute,
        setData: setData,
        setLoading: setLoading,
        setError: setError,
    };
}
// ====================== WALLET HOOK - CORREGIDO ======================
function useWallet() {
    var _this = this;
    var _a = (0, react_1.useState)({
        balance: 0,
        frozenAmount: 0,
    }), wallet = _a[0], setWallet = _a[1];
    var _b = (0, react_1.useState)([]), transactions = _b[0], setTransactions = _b[1];
    var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var mountedRef = (0, react_1.useRef)(true);
    var fetchWallet = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, walletData, transactionsData, newWallet, err_2, axiosError;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    setError(null);
                    console.log("🔍 Fetching wallet from /wallet endpoint...");
                    return [4 /*yield*/, api_1.apiClient.get("/wallet")];
                case 1:
                    response = _e.sent();
                    if (response.success) {
                        console.log("📦 Raw wallet response:", response.data);
                        walletData = (_a = response.data) === null || _a === void 0 ? void 0 : _a.wallet;
                        transactionsData = ((_b = response.data) === null || _b === void 0 ? void 0 : _b.recentTransactions) || [];
                        console.log("💰 Parsed wallet data:", walletData);
                        if (mountedRef.current && walletData) {
                            newWallet = {
                                balance: Number(walletData.balance || 0),
                                frozenAmount: Number(walletData.frozenAmount || 0),
                                availableBalance: Number(walletData.availableBalance || walletData.balance || 0),
                            };
                            console.log("✅ Setting wallet state:", newWallet);
                            setWallet(newWallet);
                            setTransactions(transactionsData);
                        }
                        return [2 /*return*/, response.data];
                    }
                    else {
                        throw new Error(response.error || "Error loading wallet");
                    }
                    return [3 /*break*/, 4];
                case 2:
                    err_2 = _e.sent();
                    console.error("❌ Error fetching wallet:", err_2);
                    if (mountedRef.current) {
                        if (err_2 instanceof Error) {
                            axiosError = err_2;
                            setError(((_d = (_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) ||
                                err_2.message ||
                                "Error loading wallet");
                        }
                        else {
                            setError("An unknown error occurred");
                        }
                    }
                    throw err_2;
                case 3:
                    if (mountedRef.current) {
                        setLoading(false);
                    }
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, []);
    var fetchTransactions = (0, react_1.useCallback)(function (params) { return __awaiter(_this, void 0, void 0, function () {
        var response, transactionsData, err_3, axiosError;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, api_1.apiClient.get("/wallet/transactions", {
                            params: params,
                        })];
                case 1:
                    response = _e.sent();
                    if (response.success) {
                        transactionsData = ((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.transactions) || [];
                        if (mountedRef.current) {
                            setTransactions(transactionsData);
                        }
                        return [2 /*return*/, response.data];
                    }
                    else {
                        throw new Error(response.error || "Error loading transactions");
                    }
                    return [3 /*break*/, 4];
                case 2:
                    err_3 = _e.sent();
                    if (mountedRef.current) {
                        if (err_3 instanceof Error) {
                            axiosError = err_3;
                            setError(((_d = (_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) ||
                                "Error loading transactions");
                        }
                        else {
                            setError("An unknown error occurred");
                        }
                    }
                    throw err_3;
                case 3:
                    if (mountedRef.current) {
                        setLoading(false);
                    }
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, []);
    var deposit = (0, react_1.useCallback)(function (amount, paymentMethod, paymentData) { return __awaiter(_this, void 0, void 0, function () {
        var response, err_4, axiosError;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    return [4 /*yield*/, api_1.apiClient.post("/wallet/deposit", {
                            amount: amount,
                            paymentMethod: paymentMethod,
                            paymentData: paymentData,
                        })];
                case 1:
                    response = _c.sent();
                    return [4 /*yield*/, fetchWallet()];
                case 2:
                    _c.sent();
                    return [2 /*return*/, response.data];
                case 3:
                    err_4 = _c.sent();
                    if (mountedRef.current) {
                        if (err_4 instanceof Error) {
                            axiosError = err_4;
                            setError(((_b = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Error processing deposit");
                        }
                        else {
                            setError("An unknown error occurred");
                        }
                    }
                    throw err_4;
                case 4:
                    if (mountedRef.current) {
                        setLoading(false);
                    }
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [fetchWallet]);
    var withdraw = (0, react_1.useCallback)(function (amount, accountNumber, accountType, bankName) { return __awaiter(_this, void 0, void 0, function () {
        var response, err_5, axiosError;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    return [4 /*yield*/, api_1.apiClient.post("/wallet/withdraw", {
                            amount: amount,
                            accountNumber: accountNumber,
                            accountType: accountType,
                            bankName: bankName,
                        })];
                case 1:
                    response = _c.sent();
                    return [4 /*yield*/, fetchWallet()];
                case 2:
                    _c.sent();
                    return [2 /*return*/, response.data];
                case 3:
                    err_5 = _c.sent();
                    if (mountedRef.current) {
                        if (err_5 instanceof Error) {
                            axiosError = err_5;
                            setError(((_b = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) ||
                                "Error processing withdrawal");
                        }
                        else {
                            setError("An unknown error occurred");
                        }
                    }
                    throw err_5;
                case 4:
                    if (mountedRef.current) {
                        setLoading(false);
                    }
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [fetchWallet]);
    (0, react_1.useEffect)(function () {
        mountedRef.current = true;
        fetchWallet();
        return function () {
            mountedRef.current = false;
        };
    }, [fetchWallet]);
    return {
        wallet: wallet,
        transactions: transactions,
        loading: loading,
        error: error,
        fetchWallet: fetchWallet,
        fetchTransactions: fetchTransactions,
        deposit: deposit,
        withdraw: withdraw,
    };
}
// ====================== BETS HOOK ======================
function useBets() {
    var _this = this;
    var _a = useAsyncOperation(), data = _a.data, loading = _a.loading, error = _a.error, execute = _a.execute, setData = _a.setData;
    var fetchMyBets = (0, react_1.useCallback)(function (params) {
        return execute(function () { return api_1.apiClient.get("/bets", { params: params }); });
    }, [execute]);
    var fetchAvailableBets = (0, react_1.useCallback)(function (fightId) {
        return execute(function () { return api_1.apiClient.get("/bets/available/".concat(fightId)); });
    }, [execute]);
    var createBet = (0, react_1.useCallback)(function (betData) {
        return execute(function () { return api_1.apiClient.post("/bets", betData); });
    }, [execute]);
    var acceptBet = (0, react_1.useCallback)(function (betId) { return __awaiter(_this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, execute(function () {
                        return api_1.apiClient.post("/bets/".concat(betId, "/accept"));
                    })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, fetchMyBets()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, response];
            }
        });
    }); }, [execute, fetchMyBets]);
    var cancelBet = (0, react_1.useCallback)(function (betId) { return __awaiter(_this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, execute(function () {
                        return api_1.apiClient.put("/bets/".concat(betId, "/cancel"));
                    })];
                case 1:
                    response = _a.sent();
                    setData(function (prev) {
                        return prev
                            ? __assign(__assign({}, prev), { bets: prev.bets.filter(function (bet) { return bet.id !== betId; }) }) : null;
                    });
                    return [2 /*return*/, response];
            }
        });
    }); }, [execute, setData]);
    var getBetsStats = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.get("/bets/stats"); });
    }, [execute]);
    var getCompatibleBets = (0, react_1.useCallback)(function (params) {
        return execute(function () {
            return api_1.apiClient.get("/bets/available/".concat(params.fightId), { params: params });
        });
    }, [execute]);
    var acceptProposal = (0, react_1.useCallback)(function (betId) {
        return execute(function () { return api_1.apiClient.put("/bets/".concat(betId, "/accept-proposal")); });
    }, [execute]);
    var rejectProposal = (0, react_1.useCallback)(function (betId) {
        return execute(function () { return api_1.apiClient.put("/bets/".concat(betId, "/reject-proposal")); });
    }, [execute]);
    var getPendingProposals = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.get("/bets/pending-proposals"); });
    }, [execute]);
    return {
        bets: (data === null || data === void 0 ? void 0 : data.bets) || [],
        total: (data === null || data === void 0 ? void 0 : data.total) || 0,
        loading: loading,
        error: error,
        fetchMyBets: fetchMyBets,
        fetchAvailableBets: fetchAvailableBets,
        createBet: createBet,
        acceptBet: acceptBet,
        cancelBet: cancelBet,
        getBetsStats: getBetsStats,
        getCompatibleBets: getCompatibleBets,
        getPendingProposals: getPendingProposals,
        acceptProposal: acceptProposal,
        rejectProposal: rejectProposal,
    };
}
// ====================== EVENTS HOOK ======================
function useEvents() {
    var _this = this;
    var _a = useAsyncOperation(), data = _a.data, loading = _a.loading, error = _a.error, execute = _a.execute;
    var fetchEvents = (0, react_1.useCallback)(function (params) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execute(function () { return api_1.apiClient.get("/events", { params: params }); })];
        });
    }); }, [execute]);
    var fetchEventById = (0, react_1.useCallback)(function (eventId) {
        return execute(function () { return api_1.apiClient.get("/events/".concat(eventId)); });
    }, [execute]);
    var createEvent = (0, react_1.useCallback)(function (eventData) {
        return execute(function () { return api_1.apiClient.post("/events", eventData); });
    }, [execute]);
    var updateEvent = (0, react_1.useCallback)(function (eventId, eventData) {
        return execute(function () { return api_1.apiClient.put("/events/".concat(eventId), eventData); });
    }, [execute]);
    var activateEvent = (0, react_1.useCallback)(function (eventId) {
        return execute(function () { return api_1.apiClient.post("/events/".concat(eventId, "/activate")); });
    }, [execute]);
    (0, react_1.useEffect)(function () {
        fetchEvents();
    }, [fetchEvents]);
    return {
        events: (data === null || data === void 0 ? void 0 : data.events) || [],
        total: (data === null || data === void 0 ? void 0 : data.total) || 0,
        loading: loading,
        error: error,
        fetchEvents: fetchEvents,
        fetchEventById: fetchEventById,
        createEvent: createEvent,
        updateEvent: updateEvent,
        activateEvent: activateEvent,
    };
}
// ====================== FIGHTS HOOK ======================
function useFights(eventId) {
    var _this = this;
    var _a = useAsyncOperation(), data = _a.data, loading = _a.loading, error = _a.error, execute = _a.execute;
    var fetchFights = (0, react_1.useCallback)(function (params) { return __awaiter(_this, void 0, void 0, function () {
        var queryParams;
        return __generator(this, function (_a) {
            queryParams = params || (eventId ? { eventId: eventId } : {});
            return [2 /*return*/, execute(function () { return api_1.apiClient.get("/fights", { params: queryParams }); })];
        });
    }); }, [execute, eventId]);
    var fetchFightById = (0, react_1.useCallback)(function (fightId) {
        return execute(function () { return api_1.apiClient.get("/fights/".concat(fightId)); });
    }, [execute]);
    var createFight = (0, react_1.useCallback)(function (fightData) {
        return execute(function () { return api_1.apiClient.post("/fights", fightData); });
    }, [execute]);
    var updateFight = (0, react_1.useCallback)(function (fightId, fightData) {
        return execute(function () { return api_1.apiClient.put("/fights/".concat(fightId), fightData); });
    }, [execute]);
    var openBetting = (0, react_1.useCallback)(function (fightId) {
        return execute(function () { return api_1.apiClient.post("/fights/".concat(fightId, "/open-betting")); });
    }, [execute]);
    var closeBetting = (0, react_1.useCallback)(function (fightId) {
        return execute(function () { return api_1.apiClient.post("/fights/".concat(fightId, "/close-betting")); });
    }, [execute]);
    var recordResult = (0, react_1.useCallback)(function (fightId, result) {
        return execute(function () {
            return api_1.apiClient.post("/fights/".concat(fightId, "/result"), { result: result });
        });
    }, [execute]);
    (0, react_1.useEffect)(function () {
        fetchFights();
    }, [fetchFights]);
    return {
        fights: data || [],
        loading: loading,
        error: error,
        fetchFights: fetchFights,
        fetchFightById: fetchFightById,
        createFight: createFight,
        updateFight: updateFight,
        openBetting: openBetting,
        closeBetting: closeBetting,
        recordResult: recordResult,
    };
}
// ====================== VENUES HOOK ======================
function useVenues() {
    var _this = this;
    var _a = useAsyncOperation(), data = _a.data, loading = _a.loading, error = _a.error, execute = _a.execute;
    var fetchVenues = (0, react_1.useCallback)(function (params) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execute(function () { return api_1.apiClient.get("/venues", { params: params }); })];
        });
    }); }, [execute]);
    var fetchVenueById = (0, react_1.useCallback)(function (venueId) {
        return execute(function () { return api_1.apiClient.get("/venues/".concat(venueId)); });
    }, [execute]);
    var createVenue = (0, react_1.useCallback)(function (venueData) {
        return execute(function () { return api_1.apiClient.post("/venues", venueData); });
    }, [execute]);
    var updateVenue = (0, react_1.useCallback)(function (venueId, venueData) {
        return execute(function () { return api_1.apiClient.put("/venues/".concat(venueId), venueData); });
    }, [execute]);
    var updateVenueStatus = (0, react_1.useCallback)(function (venueId, status, reason) {
        return execute(function () {
            return api_1.apiClient.put("/venues/".concat(venueId, "/status"), { status: status, reason: reason });
        });
    }, [execute]);
    var getMyVenues = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.get("/venues/my/venues"); });
    }, [execute]);
    (0, react_1.useEffect)(function () {
        fetchVenues();
    }, [fetchVenues]);
    return {
        venues: (data === null || data === void 0 ? void 0 : data.venues) || [],
        total: (data === null || data === void 0 ? void 0 : data.total) || 0,
        loading: loading,
        error: error,
        fetchVenues: fetchVenues,
        fetchVenueById: fetchVenueById,
        createVenue: createVenue,
        updateVenue: updateVenue,
        updateVenueStatus: updateVenueStatus,
        getMyVenues: getMyVenues,
    };
}
// ====================== NOTIFICATIONS HOOK ======================
function useNotifications() {
    var _this = this;
    var _a = useAsyncOperation(), data = _a.data, loading = _a.loading, error = _a.error, execute = _a.execute, setData = _a.setData;
    var fetchNotifications = (0, react_1.useCallback)(function (params) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execute(function () { return api_1.apiClient.get("/notifications", { params: params }); })];
        });
    }); }, [execute]);
    var markAsRead = (0, react_1.useCallback)(function (notificationId) { return __awaiter(_this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, execute(function () {
                        return api_1.apiClient.put("/notifications/".concat(notificationId, "/read"));
                    })];
                case 1:
                    response = _a.sent();
                    setData(function (prev) {
                        return prev
                            ? __assign(__assign({}, prev), { notifications: prev.notifications.map(function (notif) {
                                    return notif.id === notificationId
                                        ? __assign(__assign({}, notif), { isRead: true }) : notif;
                                }) }) : null;
                    });
                    return [2 /*return*/, response];
            }
        });
    }); }, [execute, setData]);
    var markAllAsRead = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, execute(function () {
                        return api_1.apiClient.post("/notifications/mark-all-read");
                    })];
                case 1:
                    response = _a.sent();
                    setData(function (prev) {
                        return prev
                            ? __assign(__assign({}, prev), { notifications: prev.notifications.map(function (notif) { return (__assign(__assign({}, notif), { isRead: true })); }) }) : null;
                    });
                    return [2 /*return*/, response];
            }
        });
    }); }, [execute, setData]);
    var archiveNotification = (0, react_1.useCallback)(function (notificationId) { return __awaiter(_this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, execute(function () {
                        return api_1.apiClient.put("/notifications/".concat(notificationId, "/archive"));
                    })];
                case 1:
                    response = _a.sent();
                    setData(function (prev) {
                        return prev
                            ? __assign(__assign({}, prev), { notifications: prev.notifications.filter(function (notif) { return notif.id !== notificationId; }) }) : null;
                    });
                    return [2 /*return*/, response];
            }
        });
    }); }, [execute, setData]);
    (0, react_1.useEffect)(function () {
        fetchNotifications();
    }, [fetchNotifications]);
    return {
        notifications: (data === null || data === void 0 ? void 0 : data.notifications) || [],
        total: (data === null || data === void 0 ? void 0 : data.total) || 0,
        loading: loading,
        error: error,
        fetchNotifications: fetchNotifications,
        markAsRead: markAsRead,
        markAllAsRead: markAllAsRead,
        archiveNotification: archiveNotification,
    };
}
// ====================== SUBSCRIPTIONS HOOK ======================
function useSubscriptions() {
    var _a = useAsyncOperation(), data = _a.data, loading = _a.loading, error = _a.error, execute = _a.execute;
    var fetchPlans = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.get("/subscriptions/plans"); });
    }, [execute]);
    var fetchCurrent = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.get("/subscriptions/current"); });
    }, [execute]);
    var fetchMy = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.get("/subscriptions"); });
    }, [execute]);
    var createSubscription = (0, react_1.useCallback)(function (subscriptionData) {
        return execute(function () {
            return api_1.apiClient.post("/subscriptions/create", subscriptionData);
        });
    }, [execute]);
    var cancelSubscription = (0, react_1.useCallback)(function (subscriptionId) {
        return execute(function () {
            return api_1.apiClient.put("/subscriptions/".concat(subscriptionId, "/cancel"));
        });
    }, [execute]);
    var toggleAutoRenew = (0, react_1.useCallback)(function (subscriptionId, autoRenew) {
        return execute(function () {
            return api_1.apiClient.put("/subscriptions/".concat(subscriptionId, "/auto-renew"), {
                autoRenew: autoRenew,
            });
        });
    }, [execute]);
    var checkAccess = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.post("/subscriptions/check-access"); });
    }, [execute]);
    return {
        subscription: data,
        loading: loading,
        error: error,
        fetchPlans: fetchPlans,
        fetchCurrent: fetchCurrent,
        fetchMy: fetchMy,
        createSubscription: createSubscription,
        cancelSubscription: cancelSubscription,
        toggleAutoRenew: toggleAutoRenew,
        checkAccess: checkAccess,
    };
}
// ====================== USERS HOOK (ADMIN) ======================
function useUsers() {
    var _this = this;
    var _a = useAsyncOperation(), data = _a.data, loading = _a.loading, error = _a.error, execute = _a.execute;
    var fetchUsers = (0, react_1.useCallback)(function (params) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execute(function () { return api_1.apiClient.get("/users", { params: params }); })];
        });
    }); }, [execute]);
    var fetchUserById = (0, react_1.useCallback)(function (userId) {
        return execute(function () { return api_1.apiClient.get("/users/".concat(userId)); });
    }, [execute]);
    var updateUserStatus = (0, react_1.useCallback)(function (userId, isActive, reason) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execute(function () {
                    return api_1.apiClient.put("/users/".concat(userId, "/status"), { isActive: isActive, reason: reason });
                })];
        });
    }); }, [execute]);
    var updateUserRole = (0, react_1.useCallback)(function (userId, role, reason) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execute(function () {
                    return api_1.apiClient.put("/users/".concat(userId, "/role"), { role: role, reason: reason });
                })];
        });
    }); }, [execute]);
    var getProfile = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.get("/users/profile"); });
    }, [execute]);
    var updateProfile = (0, react_1.useCallback)(function (profileData) {
        return execute(function () { return api_1.apiClient.put("/users/profile", profileData); });
    }, [execute]);
    var getAvailableOperators = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.get("/users/operators/available"); });
    }, [execute]);
    return {
        users: (data === null || data === void 0 ? void 0 : data.users) || [],
        total: (data === null || data === void 0 ? void 0 : data.total) || 0,
        loading: loading,
        error: error,
        fetchUsers: fetchUsers,
        fetchUserById: fetchUserById,
        updateUserStatus: updateUserStatus,
        updateUserRole: updateUserRole,
        getProfile: getProfile,
        updateProfile: updateProfile,
        getAvailableOperators: getAvailableOperators,
    };
}
// ====================== AUTH UTILITIES ======================
function useAuthOperations() {
    var _this = this;
    var _a = useAsyncOperation(), loading = _a.loading, error = _a.error, execute = _a.execute;
    var changePassword = (0, react_1.useCallback)(function (passwordData) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, execute(function () {
                    return api_1.apiClient.post("/auth/change-password", passwordData);
                })];
        });
    }); }, [execute]);
    var refreshToken = (0, react_1.useCallback)(function () {
        return execute(function () { return api_1.apiClient.post("/auth/refresh"); });
    }, [execute]);
    return {
        loading: loading,
        error: error,
        changePassword: changePassword,
        refreshToken: refreshToken,
    };
}
