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
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = void 0;
var sequelize_1 = require("sequelize");
var SystemSetting_1 = require("../models/SystemSetting");
var redis_1 = require("../config/redis");
var SETTINGS_CACHE_KEY = 'system_settings';
var SETTINGS_CACHE_TTL = 600; // ⚡ INCREASED to 10 minutes for better performance
var SettingsService = /** @class */ (function () {
    function SettingsService() {
        this.cache = {};
        this.cacheTimeout = 10 * 60 * 1000; // ⚡ INCREASED to 10 minutes for performance
        // ⚡ MEGA OPTIMIZED: Feature toggles with local memory cache
        this.featureCache = new Map();
        this.featureCacheTimeout = 2 * 60 * 1000; // 2 minutes for feature flags
        this.initCacheCleanup();
    }
    // ⚡ OPTIMIZED: Aggressive caching for single settings
    SettingsService.prototype.getSetting = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, parsedCache, setting, parsedValue, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, (0, redis_1.getCache)("".concat(SETTINGS_CACHE_KEY, ":").concat(key))];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            parsedCache = JSON.parse(cached);
                            // ⚡ REDUCED LOGGING: Only debug logs to reduce noise
                            return [2 /*return*/, this.parseValue(parsedCache.value, parsedCache.type)];
                        }
                        // Fallback to memory cache
                        if (this.cache[key] && Date.now() < this.cache[key].expires) {
                            return [2 /*return*/, this.parseValue(this.cache[key].value, this.cache[key].type)];
                        }
                        return [4 /*yield*/, SystemSetting_1.SystemSetting.findOne({ where: { key: key } })];
                    case 2:
                        setting = _a.sent();
                        if (!setting) {
                            return [2 /*return*/, null];
                        }
                        parsedValue = this.parseValue(setting.value, setting.type);
                        // ⚡ OPTIMIZATION: Longer cache TTL for settings
                        return [4 /*yield*/, (0, redis_1.setCache)("".concat(SETTINGS_CACHE_KEY, ":").concat(key), JSON.stringify({ value: setting.value, type: setting.type }), SETTINGS_CACHE_TTL)];
                    case 3:
                        // ⚡ OPTIMIZATION: Longer cache TTL for settings
                        _a.sent();
                        // Cache in memory as fallback
                        this.cache[key] = {
                            value: setting.value,
                            type: setting.type,
                            expires: Date.now() + this.cacheTimeout
                        };
                        return [2 /*return*/, parsedValue];
                    case 4:
                        error_1 = _a.sent();
                        console.error("\u274C Error getting setting '".concat(key, "':"), error_1);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // ⚡ OPTIMIZED: Batch settings loading with longer cache
    SettingsService.prototype.getByCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, settings, result_1, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        cacheKey = "".concat(SETTINGS_CACHE_KEY, ":category:").concat(category);
                        return [4 /*yield*/, (0, redis_1.getCache)(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            return [2 /*return*/, JSON.parse(cached)];
                        }
                        return [4 /*yield*/, SystemSetting_1.SystemSetting.findAll({
                                where: { category: category }
                            })];
                    case 2:
                        settings = _a.sent();
                        result_1 = {};
                        settings.forEach(function (setting) {
                            result_1[setting.key] = _this.parseValue(setting.value, setting.type);
                        });
                        // ⚡ OPTIMIZATION: Longer cache for categories
                        return [4 /*yield*/, (0, redis_1.setCache)(cacheKey, JSON.stringify(result_1), SETTINGS_CACHE_TTL)];
                    case 3:
                        // ⚡ OPTIMIZATION: Longer cache for categories
                        _a.sent();
                        return [2 /*return*/, result_1];
                    case 4:
                        error_2 = _a.sent();
                        console.error("\u274C Error getting settings for category '".concat(category, "':"), error_2);
                        return [2 /*return*/, {}];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // ⚡ ULTRA OPTIMIZED: Public settings with extended caching
    SettingsService.prototype.getPublicSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, settings, result_2, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        cacheKey = "".concat(SETTINGS_CACHE_KEY, ":public");
                        return [4 /*yield*/, (0, redis_1.getCache)(cacheKey)];
                    case 1:
                        cached = _a.sent();
                        if (cached) {
                            return [2 /*return*/, JSON.parse(cached)];
                        }
                        return [4 /*yield*/, SystemSetting_1.SystemSetting.findAll({
                                where: { is_public: true }
                            })];
                    case 2:
                        settings = _a.sent();
                        result_2 = {};
                        settings.forEach(function (setting) {
                            result_2[setting.key] = _this.parseValue(setting.value, setting.type);
                        });
                        // ⚡ CRITICAL OPTIMIZATION: 15 minute cache for public settings (requested frequently)
                        return [4 /*yield*/, (0, redis_1.setCache)(cacheKey, JSON.stringify(result_2), 900)];
                    case 3:
                        // ⚡ CRITICAL OPTIMIZATION: 15 minute cache for public settings (requested frequently)
                        _a.sent(); // 15 minutes
                        return [2 /*return*/, result_2];
                    case 4:
                        error_3 = _a.sent();
                        console.error("\u274C Error getting public settings:", error_3);
                        return [2 /*return*/, {}];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // ⚡ MEGA OPTIMIZED: All settings with ultra-aggressive caching
    SettingsService.prototype.getAllSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cachedSettings, dbSettings, defaults, settingsMap, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, (0, redis_1.getCache)(SETTINGS_CACHE_KEY)];
                    case 1:
                        cachedSettings = _a.sent();
                        if (cachedSettings) {
                            return [2 /*return*/, JSON.parse(cachedSettings)];
                        }
                        return [4 /*yield*/, SystemSetting_1.SystemSetting.findAll()];
                    case 2:
                        dbSettings = _a.sent();
                        if (!(!dbSettings || dbSettings.length === 0)) return [3 /*break*/, 4];
                        defaults = {
                            maintenance_mode: false,
                            enable_streaming: true,
                            enable_wallets: true,
                            enable_betting: true,
                            enable_push_notifications: true,
                            commission_percentage: 5,
                            max_bet_amount: 10000,
                            min_bet_amount: 1,
                            auto_approval_threshold: 100
                        };
                        // ⚡ OPTIMIZATION: Cache defaults for 5 minutes to avoid repeated DB hits
                        return [4 /*yield*/, (0, redis_1.setCache)(SETTINGS_CACHE_KEY, JSON.stringify(defaults), 300)];
                    case 3:
                        // ⚡ OPTIMIZATION: Cache defaults for 5 minutes to avoid repeated DB hits
                        _a.sent();
                        return [2 /*return*/, defaults];
                    case 4:
                        settingsMap = dbSettings.reduce(function (acc, setting) {
                            acc[setting.key] = _this.parseValue(setting.value, setting.type);
                            return acc;
                        }, {});
                        // ⚡ OPTIMIZATION: Longer cache for all settings (loaded frequently)
                        return [4 /*yield*/, (0, redis_1.setCache)(SETTINGS_CACHE_KEY, JSON.stringify(settingsMap), SETTINGS_CACHE_TTL)];
                    case 5:
                        // ⚡ OPTIMIZATION: Longer cache for all settings (loaded frequently)
                        _a.sent();
                        return [2 /*return*/, settingsMap];
                    case 6:
                        error_4 = _a.sent();
                        console.error('❌ Error getting all settings:', error_4);
                        // ⚡ FALLBACK: Return cached defaults on error
                        return [2 /*return*/, {
                                maintenance_mode: false,
                                enable_streaming: true,
                                enable_wallets: true,
                                enable_betting: true,
                                enable_push_notifications: true
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SettingsService.prototype.updateSetting = function (key, value, updatedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var setting, result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, SystemSetting_1.SystemSetting.findOne({ where: { key: key } })];
                    case 1:
                        setting = _a.sent();
                        if (!setting) {
                            throw new Error("Setting '".concat(key, "' not found"));
                        }
                        // Validate value type
                        this.validateValue(value, setting.type);
                        return [4 /*yield*/, SystemSetting_1.SystemSetting.update({
                                value: this.serializeValue(value, setting.type),
                                updated_by: updatedBy
                            }, { where: { key: key } })];
                    case 2:
                        result = _a.sent();
                        // ⚡ OPTIMIZATION: Smart cache invalidation
                        return [4 /*yield*/, this.invalidateCache(key, setting.category)];
                    case 3:
                        // ⚡ OPTIMIZATION: Smart cache invalidation
                        _a.sent();
                        return [2 /*return*/, result];
                    case 4:
                        error_5 = _a.sent();
                        console.error("\u274C Error updating setting '".concat(key, "':"), error_5);
                        throw error_5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    SettingsService.prototype.createSetting = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var newSetting;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, SystemSetting_1.SystemSetting.create(data)];
                    case 1:
                        newSetting = _a.sent();
                        return [4 /*yield*/, (0, redis_1.delCache)(SETTINGS_CACHE_KEY)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, newSetting];
                }
            });
        });
    };
    SettingsService.prototype.deleteSetting = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, SystemSetting_1.SystemSetting.destroy({ where: { key: key } })];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, (0, redis_1.delCache)(SETTINGS_CACHE_KEY)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    SettingsService.prototype.isFeatureEnabled = function (featureKey) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, value, enabled, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        cached = this.featureCache.get(featureKey);
                        if (cached && Date.now() < cached.expires) {
                            return [2 /*return*/, cached.value];
                        }
                        return [4 /*yield*/, this.getSetting(featureKey)];
                    case 1:
                        value = _a.sent();
                        enabled = value === null || value === undefined ? true : Boolean(value);
                        // ⚡ OPTIMIZATION: Cache feature flags in memory for ultra-fast access
                        this.featureCache.set(featureKey, {
                            value: enabled,
                            expires: Date.now() + this.featureCacheTimeout
                        });
                        return [2 /*return*/, enabled];
                    case 2:
                        error_6 = _a.sent();
                        console.warn("\u26A0\uFE0F Feature check failed for '".concat(featureKey, "', defaulting to true"));
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ⚡ OPTIMIZED: Batch feature checks to reduce database calls
    SettingsService.prototype.checkMultipleFeatures = function (features) {
        return __awaiter(this, void 0, void 0, function () {
            var results, uncachedFeatures, _i, features_1, feature, cached, settings, _loop_1, this_1, _a, uncachedFeatures_1, feature, error_7, _b, uncachedFeatures_2, feature;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        results = {};
                        uncachedFeatures = [];
                        for (_i = 0, features_1 = features; _i < features_1.length; _i++) {
                            feature = features_1[_i];
                            cached = this.featureCache.get(feature);
                            if (cached && Date.now() < cached.expires) {
                                results[feature] = cached.value;
                            }
                            else {
                                uncachedFeatures.push(feature);
                            }
                        }
                        if (!(uncachedFeatures.length > 0)) return [3 /*break*/, 4];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, SystemSetting_1.SystemSetting.findAll({
                                where: { key: (_c = {}, _c[sequelize_1.Op.in] = uncachedFeatures, _c) }
                            })];
                    case 2:
                        settings = _d.sent();
                        _loop_1 = function (feature) {
                            var setting = settings.find(function (s) { return s.key === feature; });
                            var enabled = setting ? Boolean(this_1.parseValue(setting.value, setting.type)) : false;
                            results[feature] = enabled;
                            this_1.featureCache.set(feature, {
                                value: enabled,
                                expires: Date.now() + this_1.featureCacheTimeout
                            });
                        };
                        this_1 = this;
                        for (_a = 0, uncachedFeatures_1 = uncachedFeatures; _a < uncachedFeatures_1.length; _a++) {
                            feature = uncachedFeatures_1[_a];
                            _loop_1(feature);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _d.sent();
                        console.warn('⚠️ Batch feature check failed:', error_7);
                        // Set defaults for uncached features
                        for (_b = 0, uncachedFeatures_2 = uncachedFeatures; _b < uncachedFeatures_2.length; _b++) {
                            feature = uncachedFeatures_2[_b];
                            results[feature] = false;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    // Quick feature checks with enhanced caching
    SettingsService.prototype.areWalletsEnabled = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.isFeatureEnabled('enable_wallets')];
            });
        });
    };
    SettingsService.prototype.isBettingEnabled = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.isFeatureEnabled('enable_betting')];
            });
        });
    };
    SettingsService.prototype.isStreamingEnabled = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.isFeatureEnabled('enable_streaming')];
            });
        });
    };
    SettingsService.prototype.isMaintenanceMode = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.isFeatureEnabled('maintenance_mode')];
            });
        });
    };
    // Private helper methods
    SettingsService.prototype.parseValue = function (value, type) {
        switch (type) {
            case 'boolean':
                return value === 'true' || value === true;
            case 'number':
                return typeof value === 'string' ? parseFloat(value) : value;
            case 'string':
                return value.toString();
            case 'json':
                return typeof value === 'string' ? JSON.parse(value) : value;
            default:
                return value;
        }
    };
    SettingsService.prototype.serializeValue = function (value, type) {
        switch (type) {
            case 'boolean':
                return Boolean(value);
            case 'number':
                return Number(value);
            case 'string':
                return String(value);
            case 'json':
                return typeof value === 'object' ? value : JSON.parse(value);
            default:
                return value;
        }
    };
    SettingsService.prototype.validateValue = function (value, type) {
        switch (type) {
            case 'boolean':
                if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                    throw new Error("Value must be boolean for type '".concat(type, "'"));
                }
                break;
            case 'number':
                if (isNaN(Number(value))) {
                    throw new Error("Value must be a valid number for type '".concat(type, "'"));
                }
                break;
            case 'string':
                if (typeof value !== 'string') {
                    throw new Error("Value must be string for type '".concat(type, "'"));
                }
                break;
            case 'json':
                try {
                    if (typeof value === 'string') {
                        JSON.parse(value);
                    }
                }
                catch (_a) {
                    throw new Error("Value must be valid JSON for type '".concat(type, "'"));
                }
                break;
        }
    };
    // ⚡ OPTIMIZED: Smart cache invalidation with reduced impact
    SettingsService.prototype.invalidateCache = function (key, category) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Clear memory caches
                        delete this.cache[key];
                        this.featureCache.delete(key);
                        // Clear Redis cache strategically
                        return [4 /*yield*/, Promise.all([
                                (0, redis_1.delCache)("".concat(SETTINGS_CACHE_KEY, ":").concat(key)),
                                (0, redis_1.delCache)("".concat(SETTINGS_CACHE_KEY, ":category:").concat(category)),
                                (0, redis_1.delCache)("".concat(SETTINGS_CACHE_KEY, ":public")),
                                (0, redis_1.delCache)(SETTINGS_CACHE_KEY)
                            ])];
                    case 1:
                        // Clear Redis cache strategically
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // ⚡ PERFORMANCE: Clear memory caches periodically to prevent memory leaks
    SettingsService.prototype.clearExpiredCaches = function () {
        var now = Date.now();
        // Clear expired memory cache
        for (var _i = 0, _a = Object.entries(this.cache); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], cached = _b[1];
            if (now >= cached.expires) {
                delete this.cache[key];
            }
        }
        // Clear expired feature cache
        for (var _c = 0, _d = this.featureCache.entries(); _c < _d.length; _c++) {
            var _e = _d[_c], key = _e[0], cached = _e[1];
            if (now >= cached.expires) {
                this.featureCache.delete(key);
            }
        }
    };
    // Initialize cache cleanup interval
    SettingsService.prototype.initCacheCleanup = function () {
        var _this = this;
        // ⚡ OPTIMIZATION: Clean up expired caches every 5 minutes
        setInterval(function () {
            _this.clearExpiredCaches();
        }, 5 * 60 * 1000);
    };
    return SettingsService;
}());
exports.settingsService = new SettingsService();
exports.default = exports.settingsService;
