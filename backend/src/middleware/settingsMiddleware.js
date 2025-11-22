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
exports.injectCommissionSettings = exports.enforceStreamingLimits = exports.enforceBetLimits = exports.settingsAwareRateLimit = exports.requireStreaming = exports.requireBetting = exports.requireWallets = exports.checkMaintenanceMode = exports.requireFeature = exports.injectPublicSettings = exports.injectSettings = void 0;
var settingsService_1 = __importDefault(require("../services/settingsService"));
/**
 * Middleware to inject settings into request object
 * Makes settings available as req.settings throughout the request lifecycle
 */
var injectSettings = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, settingsService_1.default.getAllSettings()];
            case 1:
                settings = _a.sent();
                req.settings = settings || {};
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('❌ Error injecting settings:', error_1);
                // Continue without settings rather than blocking the request
                req.settings = {};
                next();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.injectSettings = injectSettings;
// ⚡ CRITICAL OPTIMIZATION: Ultra-aggressive caching for public settings middleware
var cachedPublicSettings = null;
var publicSettingsCacheExpires = 0;
var PUBLIC_SETTINGS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in memory
/**
 * Middleware to inject only public settings
 * Used for endpoints accessible to non-admin users
 * ⚡ OPTIMIZED: Ultra-fast memory cache to prevent database hits on every request
 */
var injectPublicSettings = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var now, publicSettings, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                now = Date.now();
                if (cachedPublicSettings && now < publicSettingsCacheExpires) {
                    req.settings = cachedPublicSettings;
                    next();
                    return [2 /*return*/];
                }
                return [4 /*yield*/, settingsService_1.default.getPublicSettings()];
            case 1:
                publicSettings = _a.sent();
                // ⚡ CRITICAL: Cache in memory for 5 minutes to avoid repeated DB calls
                cachedPublicSettings = publicSettings;
                publicSettingsCacheExpires = now + PUBLIC_SETTINGS_CACHE_DURATION;
                req.settings = publicSettings;
                next();
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('❌ Error injecting public settings:', error_2);
                // ⚡ FALLBACK: Use cached settings if available, even if expired
                req.settings = cachedPublicSettings || {};
                next();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.injectPublicSettings = injectPublicSettings;
/**
 * Feature gate middleware - blocks requests if feature is disabled
 */
var requireFeature = function (featureKey, errorMessage) {
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var isEnabled, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, settingsService_1.default.isFeatureEnabled(featureKey)];
                case 1:
                    isEnabled = _a.sent();
                    if (!isEnabled) {
                        return [2 /*return*/, res.status(503).json({
                                success: false,
                                message: errorMessage || "Feature '".concat(featureKey, "' is currently disabled"),
                                code: 'FEATURE_DISABLED'
                            })];
                    }
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("\u274C Error checking feature '".concat(featureKey, "':"), error_3);
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            message: 'Error checking feature availability',
                            code: 'FEATURE_CHECK_ERROR'
                        })];
                case 3: return [2 /*return*/];
            }
        });
    }); };
};
exports.requireFeature = requireFeature;
// ⚡ CRITICAL OPTIMIZATION: Ultra-aggressive caching for maintenance mode check
var cachedMaintenanceMode = null;
var maintenanceModeCacheExpires = 0;
var MAINTENANCE_MODE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in memory
/**
 * Maintenance mode middleware - blocks all requests during maintenance
 * ⚡ OPTIMIZED: Ultra-fast memory cache to prevent database hits on every request
 */
var checkMaintenanceMode = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var now, isMaintenanceMode, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                // Skip maintenance check for health endpoint and settings management
                if (req.path === '/health' || req.path.startsWith('/api/settings')) {
                    return [2 /*return*/, next()];
                }
                now = Date.now();
                isMaintenanceMode = void 0;
                if (!(cachedMaintenanceMode !== null && now < maintenanceModeCacheExpires)) return [3 /*break*/, 1];
                isMaintenanceMode = cachedMaintenanceMode;
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, settingsService_1.default.isMaintenanceMode()];
            case 2:
                // Only fetch from database/cache if memory cache is expired
                isMaintenanceMode = _a.sent();
                // ⚡ CRITICAL: Cache in memory for 2 minutes to avoid repeated DB calls
                cachedMaintenanceMode = isMaintenanceMode;
                maintenanceModeCacheExpires = now + MAINTENANCE_MODE_CACHE_DURATION;
                _a.label = 3;
            case 3:
                if (isMaintenanceMode) {
                    return [2 /*return*/, res.status(503).json({
                            success: false,
                            message: 'Platform is currently under maintenance. Please try again later.',
                            code: 'MAINTENANCE_MODE'
                        })];
                }
                next();
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                console.error('❌ Error checking maintenance mode:', error_4);
                // ⚡ FALLBACK: Continue on error to avoid blocking all requests (assume not in maintenance)
                next();
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.checkMaintenanceMode = checkMaintenanceMode;
/**
 * Specific feature gate middlewares for common features
 */
exports.requireWallets = (0, exports.requireFeature)('enable_wallets', 'Wallet system is currently disabled');
exports.requireBetting = (0, exports.requireFeature)('enable_betting', 'Betting system is currently disabled');
exports.requireStreaming = (0, exports.requireFeature)('enable_streaming', 'Streaming system is currently disabled');
/**
 * Settings-aware rate limiting
 * Uses settings to dynamically adjust rate limits
 */
var settingsAwareRateLimit = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var rateLimitSetting, rateLimit, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, settingsService_1.default.getSetting('api_rate_limit')];
            case 1:
                rateLimitSetting = _a.sent();
                rateLimit = rateLimitSetting || 100;
                // Add rate limit info to headers
                res.set('X-RateLimit-Limit', rateLimit.toString());
                // Note: Actual rate limiting logic would need to be implemented
                // This is just a placeholder for settings-aware rate limiting
                next();
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('❌ Error in settings-aware rate limit:', error_5);
                next();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.settingsAwareRateLimit = settingsAwareRateLimit;
/**
 * Business rules middleware
 * Enforces business rules based on settings
 */
var enforceBetLimits = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var minBetAmount, maxBetAmount, betAmount, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (!(req.method === 'POST' && req.body.amount)) return [3 /*break*/, 3];
                return [4 /*yield*/, settingsService_1.default.getSetting('min_bet_amount')];
            case 1:
                minBetAmount = (_a.sent()) || 1;
                return [4 /*yield*/, settingsService_1.default.getSetting('max_bet_amount')];
            case 2:
                maxBetAmount = (_a.sent()) || 10000;
                betAmount = parseFloat(req.body.amount);
                if (betAmount < minBetAmount) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Minimum bet amount is ".concat(minBetAmount),
                            code: 'BET_AMOUNT_TOO_LOW'
                        })];
                }
                if (betAmount > maxBetAmount) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "Maximum bet amount is ".concat(maxBetAmount),
                            code: 'BET_AMOUNT_TOO_HIGH'
                        })];
                }
                _a.label = 3;
            case 3:
                next();
                return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                console.error('❌ Error enforcing bet limits:', error_6);
                next();
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.enforceBetLimits = enforceBetLimits;
/**
 * Streaming limits middleware
 * Enforces streaming-related limits from settings
 */
var enforceStreamingLimits = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var maxViewers, maxStreams, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, settingsService_1.default.getSetting('max_viewers_per_stream')];
            case 1:
                maxViewers = (_a.sent()) || 1000;
                return [4 /*yield*/, settingsService_1.default.getSetting('max_concurrent_streams')];
            case 2:
                maxStreams = (_a.sent()) || 10;
                // Add streaming limits to request for use by streaming services
                req.settings = req.settings || {};
                req.settings.maxViewersPerStream = maxViewers;
                req.settings.maxConcurrentStreams = maxStreams;
                next();
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                console.error('❌ Error enforcing streaming limits:', error_7);
                next();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.enforceStreamingLimits = enforceStreamingLimits;
/**
 * Commission calculation middleware
 * Adds commission settings to request for payment processing
 */
var injectCommissionSettings = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var commissionPercentage, autoApprovalThreshold, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, settingsService_1.default.getSetting('commission_percentage')];
            case 1:
                commissionPercentage = (_a.sent()) || 5;
                return [4 /*yield*/, settingsService_1.default.getSetting('auto_approval_threshold')];
            case 2:
                autoApprovalThreshold = (_a.sent()) || 100;
                req.settings = req.settings || {};
                req.settings.commissionPercentage = commissionPercentage;
                req.settings.autoApprovalThreshold = autoApprovalThreshold;
                next();
                return [3 /*break*/, 4];
            case 3:
                error_8 = _a.sent();
                console.error('❌ Error injecting commission settings:', error_8);
                next();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.injectCommissionSettings = injectCommissionSettings;
exports.default = {
    injectSettings: exports.injectSettings,
    injectPublicSettings: exports.injectPublicSettings,
    requireFeature: exports.requireFeature,
    checkMaintenanceMode: exports.checkMaintenanceMode,
    requireWallets: exports.requireWallets,
    requireBetting: exports.requireBetting,
    requireStreaming: exports.requireStreaming,
    settingsAwareRateLimit: exports.settingsAwareRateLimit,
    enforceBetLimits: exports.enforceBetLimits,
    enforceStreamingLimits: exports.enforceStreamingLimits,
    injectCommissionSettings: exports.injectCommissionSettings
};
