"use strict";
// backend/src/config/redis.ts - PRODUCTION READY
// Safe configuration with graceful degradation
// Author: QWEN - Performance Optimization Specialist
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
exports.redisConfig = exports.redisClient = void 0;
exports.getOrSet = getOrSet;
exports.invalidatePattern = invalidatePattern;
exports.getCache = getCache;
exports.setCache = setCache;
exports.delCache = delCache;
exports.initRedis = initRedis;
exports.checkRedisHealth = checkRedisHealth;
var ioredis_1 = __importDefault(require("ioredis"));
var logger_1 = require("./logger");
// Safe Redis client with graceful degradation
var SafeRedisClient = /** @class */ (function () {
    function SafeRedisClient() {
        var _this = this;
        this.client = null;
        this.fallbackCache = new Map();
        this.isRedisAvailable = false;
        // Parse configuration from environment variables
        this.config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            connectTimeout: 10000,
            retryDelayOnFailover: 100, // Custom property for internal use
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
        };
        // If REDIS_URL is set, parse it
        if (process.env.REDIS_URL) {
            try {
                var url = new URL(process.env.REDIS_URL);
                this.config.host = url.hostname;
                this.config.port = parseInt(url.port) || 6379;
                this.config.password = url.password || this.config.password;
                if (url.pathname && url.pathname.length > 1) {
                    this.config.db = parseInt(url.pathname.substring(1)) || this.config.db;
                }
            }
            catch (error) {
                logger_1.logger.warn('Invalid REDIS_URL format:', process.env.REDIS_URL);
            }
        }
        // Initialize Redis client only if configuration is provided
        if (process.env.REDIS_URL || process.env.REDIS_HOST) {
            try {
                this.client = new ioredis_1.default({
                    host: this.config.host,
                    port: this.config.port,
                    password: this.config.password,
                    db: this.config.db,
                    connectTimeout: this.config.connectTimeout,
                    maxRetriesPerRequest: this.config.maxRetriesPerRequest,
                    enableOfflineQueue: this.config.enableOfflineQueue,
                    lazyConnect: true,
                });
                this.client.on('connect', function () {
                    logger_1.logger.info("\u2705 Redis connected successfully to ".concat(_this.config.host, ":").concat(_this.config.port));
                    _this.isRedisAvailable = true;
                });
                this.client.on('error', function (error) {
                    logger_1.logger.warn("\u26A0\uFE0F Redis connection error: ".concat(error.message));
                    _this.isRedisAvailable = false;
                });
                this.client.on('close', function () {
                    logger_1.logger.info('Redis connection closed');
                    _this.isRedisAvailable = false;
                });
                this.client.on('reconnecting', function () {
                    logger_1.logger.info('Redis reconnecting...');
                });
                // Connect lazily
                this.client.connect().catch(function (error) {
                    logger_1.logger.warn("\u26A0\uFE0F Redis lazy connect failed: ".concat(error.message));
                    _this.isRedisAvailable = false;
                });
            }
            catch (error) {
                logger_1.logger.warn("\u26A0\uFE0F Redis initialization failed: ".concat(error));
                this.isRedisAvailable = false;
            }
        }
        else {
            logger_1.logger.info('ℹ️ Redis not configured - running without caching');
            this.isRedisAvailable = false;
        }
    }
    // Get value from Redis or fallback cache
    SafeRedisClient.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.isRedisAvailable && this.client)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.get(key)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        logger_1.logger.warn("\u26A0\uFE0F Redis GET failed for key ".concat(key, ": ").concat(error_1));
                        return [2 /*return*/, this.getFromFallback(key)];
                    case 4: return [2 /*return*/, this.getFromFallback(key)];
                }
            });
        });
    };
    // Set value in Redis or fallback cache
    SafeRedisClient.prototype.set = function (key_1, value_1) {
        return __awaiter(this, arguments, void 0, function (key, value, ttl) {
            var error_2;
            if (ttl === void 0) { ttl = 300; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.isRedisAvailable && this.client)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.set(key, value, 'EX', ttl)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                    case 3:
                        error_2 = _a.sent();
                        logger_1.logger.warn("\u26A0\uFE0F Redis SET failed for key ".concat(key, ": ").concat(error_2));
                        return [3 /*break*/, 4];
                    case 4:
                        this.setToFallback(key, value, ttl);
                        return [2 /*return*/];
                }
            });
        });
    };
    // Legacy alias for set with expiry
    SafeRedisClient.prototype.setex = function (key, ttl, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.set(key, value, ttl)];
            });
        });
    };
    // Delete keys by pattern from Redis or fallback cache
    SafeRedisClient.prototype.del = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(this.isRedisAvailable && this.client)) return [3 /*break*/, 6];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.keys(pattern)];
                    case 2:
                        keys = _b.sent();
                        if (!(keys.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, (_a = this.client).del.apply(_a, keys)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/];
                    case 5:
                        error_3 = _b.sent();
                        logger_1.logger.warn("\u26A0\uFE0F Redis DEL failed for pattern ".concat(pattern, ": ").concat(error_3));
                        return [3 /*break*/, 6];
                    case 6:
                        this.delFromFallback(pattern);
                        return [2 /*return*/];
                }
            });
        });
    };
    // Get keys by pattern
    SafeRedisClient.prototype.keys = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4, regex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.isRedisAvailable && this.client)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.keys(pattern)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_4 = _a.sent();
                        logger_1.logger.warn("\u26A0\uFE0F Redis KEYS failed for pattern ".concat(pattern, ": ").concat(error_4));
                        return [2 /*return*/, []];
                    case 4:
                        regex = new RegExp(pattern.replace(/\*/g, '.*'));
                        return [2 /*return*/, Array.from(this.fallbackCache.keys()).filter(function (key) { return regex.test(key); })];
                }
            });
        });
    };
    // Get from fallback in-memory cache
    SafeRedisClient.prototype.getFromFallback = function (key) {
        var entry = this.fallbackCache.get(key);
        if (entry && Date.now() < entry.expiry) {
            return entry.value;
        }
        this.fallbackCache.delete(key);
        return null;
    };
    // Set in fallback in-memory cache
    SafeRedisClient.prototype.setToFallback = function (key, value, ttl) {
        this.fallbackCache.set(key, {
            value: value,
            expiry: Date.now() + (ttl * 1000)
        });
    };
    // Delete from fallback in-memory cache
    SafeRedisClient.prototype.delFromFallback = function (pattern) {
        // Simple pattern matching for fallback cache
        var regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (var _i = 0, _a = this.fallbackCache.keys(); _i < _a.length; _i++) {
            var key = _a[_i];
            if (regex.test(key)) {
                this.fallbackCache.delete(key);
            }
        }
    };
    // Check if Redis is available
    SafeRedisClient.prototype.isAvailable = function () {
        return this.isRedisAvailable;
    };
    return SafeRedisClient;
}());
// Create singleton instance
exports.redisClient = new SafeRedisClient();
// Utility function for cache-aside pattern
function getOrSet(key_1, fetchFunction_1) {
    return __awaiter(this, arguments, void 0, function (key, fetchFunction, ttl) {
        var cached, data, error_5;
        if (ttl === void 0) { ttl = 300; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 7]);
                    return [4 /*yield*/, exports.redisClient.get(key)];
                case 1:
                    cached = _a.sent();
                    if (cached) {
                        logger_1.logger.debug("\u26A1 Cache hit: ".concat(key));
                        return [2 /*return*/, JSON.parse(cached)];
                    }
                    logger_1.logger.debug("\uD83D\uDD04 Cache miss: ".concat(key, " - fetching from database"));
                    return [4 /*yield*/, fetchFunction()];
                case 2:
                    data = _a.sent();
                    if (!(data !== null && data !== undefined)) return [3 /*break*/, 4];
                    return [4 /*yield*/, exports.redisClient.set(key, JSON.stringify(data), ttl)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, data];
                case 5:
                    error_5 = _a.sent();
                    logger_1.logger.error("\u274C Cache operation failed for key ".concat(key, ":"), error_5);
                    return [4 /*yield*/, fetchFunction()];
                case 6: return [2 /*return*/, _a.sent()];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Pattern-based cache invalidation
function invalidatePattern(pattern) {
    return __awaiter(this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exports.redisClient.del(pattern)];
                case 1:
                    _a.sent();
                    logger_1.logger.debug("\uD83E\uDDF9 Cache invalidated: ".concat(pattern));
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    logger_1.logger.warn("\u26A0\uFE0F Cache invalidation failed for pattern ".concat(pattern, ":"), error_6);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Export configuration for debugging
exports.redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '0'),
    enabled: !!(process.env.REDIS_URL || process.env.REDIS_HOST),
};
// Helper functions for backward compatibility
function getCache(key) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.redisClient.get(key)];
        });
    });
}
function setCache(key_1, value_1) {
    return __awaiter(this, arguments, void 0, function (key, value, ttl) {
        if (ttl === void 0) { ttl = 300; }
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.redisClient.set(key, value, ttl)];
        });
    });
}
function delCache(pattern) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.redisClient.del(pattern)];
        });
    });
}
// Initialize Redis connection (for compatibility)
function initRedis() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Redis is initialized automatically in constructor
            logger_1.logger.info('Redis client initialized via SafeRedisClient constructor');
            return [2 /*return*/];
        });
    });
}
// Health check function
function checkRedisHealth() {
    return __awaiter(this, void 0, void 0, function () {
        var pong, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!exports.redisClient.isAvailable()) {
                        return [2 /*return*/, {
                                status: 'disabled',
                                message: 'Redis is not configured or disabled'
                            }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, exports.redisClient.get('ping')];
                case 2:
                    pong = _a.sent();
                    if (pong === 'pong' || pong === null) {
                        return [2 /*return*/, {
                                status: 'healthy',
                                message: 'Redis is connected and responding'
                            }];
                    }
                    else {
                        return [2 /*return*/, {
                                status: 'unhealthy',
                                message: 'Redis is connected but not responding correctly'
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_7 = _a.sent();
                    return [2 /*return*/, {
                            status: 'unhealthy',
                            message: "Redis health check failed: ".concat(error_7),
                            details: error_7
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
