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
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var useSettings = function (adminMode) {
    if (adminMode === void 0) { adminMode = false; }
    var _a = (0, react_1.useState)({}), settings = _a[0], setSettings = _a[1];
    var _b = (0, react_1.useState)({}), publicSettings = _b[0], setPublicSettings = _b[1];
    var _c = (0, react_1.useState)({
        wallets_enabled: false,
        betting_enabled: false,
        streaming_enabled: false,
        maintenance_mode: false,
    }), featureStatus = _c[0], setFeatureStatus = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    var getAuthHeaders = (0, react_1.useCallback)(function () {
        var token = localStorage.getItem("token");
        return {
            Authorization: "Bearer ".concat(token),
            "Content-Type": "application/json",
        };
    }, []);
    var fetchFeatureStatus = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/settings/features/status", {
                            headers: getAuthHeaders(),
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setFeatureStatus(data.data);
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error fetching feature status:", error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [getAuthHeaders]);
    var fetchSettings = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var publicResponse, publicData, adminResponse, adminData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, 9, 10]);
                    setLoading(true);
                    setError(null);
                    return [4 /*yield*/, fetch("/api/settings/public", {
                            headers: getAuthHeaders(),
                        })];
                case 1:
                    publicResponse = _a.sent();
                    if (!publicResponse.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, publicResponse.json()];
                case 2:
                    publicData = _a.sent();
                    setPublicSettings(publicData.data || {});
                    _a.label = 3;
                case 3:
                    if (!adminMode) return [3 /*break*/, 6];
                    return [4 /*yield*/, fetch("/api/settings", {
                            headers: getAuthHeaders(),
                        })];
                case 4:
                    adminResponse = _a.sent();
                    if (!adminResponse.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, adminResponse.json()];
                case 5:
                    adminData = _a.sent();
                    setSettings(adminData.data || {});
                    _a.label = 6;
                case 6: 
                // Fetch feature status
                return [4 /*yield*/, fetchFeatureStatus()];
                case 7:
                    // Fetch feature status
                    _a.sent();
                    return [3 /*break*/, 10];
                case 8:
                    error_2 = _a.sent();
                    console.error("Error fetching settings:", error_2);
                    setError(error_2 instanceof Error ? error_2.message : "Error desconocido");
                    return [3 /*break*/, 10];
                case 9:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); }, [
        setLoading,
        setError,
        getAuthHeaders,
        adminMode,
        setPublicSettings,
        setSettings,
        fetchFeatureStatus,
    ]);
    var updateSetting = function (key, value) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, fetch("/api/settings/".concat(key), {
                            method: "PUT",
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ value: value }),
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (!data.success) return [3 /*break*/, 5];
                    // Update local state
                    setSettings(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
                    });
                    if (!(key.startsWith("enable_") || key === "maintenance_mode")) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchFeatureStatus()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, true];
                case 5: throw new Error("Error updating setting");
                case 6:
                    error_3 = _a.sent();
                    console.error("Error updating setting:", error_3);
                    setError(error_3 instanceof Error ? error_3.message : "Error updating setting");
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var bulkUpdateSettings = function (updates) { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, hasFeatureUpdates, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, fetch("/api/settings", {
                            method: "PUT",
                            headers: getAuthHeaders(),
                            body: JSON.stringify(updates),
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (!data.success) return [3 /*break*/, 5];
                    // Update local state
                    setSettings(function (prev) { return (__assign(__assign({}, prev), updates)); });
                    hasFeatureUpdates = Object.keys(updates).some(function (key) { return key.startsWith("enable_") || key === "maintenance_mode"; });
                    if (!hasFeatureUpdates) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchFeatureStatus()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, true];
                case 5: throw new Error("Error updating settings");
                case 6:
                    error_4 = _a.sent();
                    console.error("Error bulk updating settings:", error_4);
                    setError(error_4 instanceof Error ? error_4.message : "Error updating settings");
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var getSetting = function (key, defaultValue) {
        if (defaultValue === void 0) { defaultValue = null; }
        // Try admin settings first, then public settings
        if (key in settings) {
            return settings[key];
        }
        if (key in publicSettings) {
            return publicSettings[key];
        }
        return defaultValue;
    };
    var isFeatureEnabled = function (featureKey) {
        // Check feature status first
        if (featureKey in featureStatus) {
            return featureStatus[featureKey];
        }
        // Fallback to settings check
        var value = getSetting(featureKey, false);
        return Boolean(value);
    };
    var refreshSettings = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchSettings()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    // Initial load
    (0, react_1.useEffect)(function () {
        fetchSettings();
    }, [adminMode, fetchSettings]);
    return {
        settings: settings,
        publicSettings: publicSettings,
        featureStatus: featureStatus,
        loading: loading,
        error: error,
        refreshSettings: refreshSettings,
        updateSetting: updateSetting,
        bulkUpdateSettings: bulkUpdateSettings,
        getSetting: getSetting,
        isFeatureEnabled: isFeatureEnabled,
    };
};
exports.default = useSettings;
