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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.cache = exports.retryOperation = exports.transaction = exports.closeDatabase = exports.connectDatabase = exports.updateDbMonitoringStats = exports.resetDbMonitoringStats = exports.getDbMonitoringStats = exports.getPoolStats = void 0;
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)(); // ← CRÍTICO: DEBE IR AQUÍ
var sequelize_1 = require("sequelize");
var logger_1 = require("./logger");
var redis_1 = __importDefault(require("redis"));
// Configuration for database optimization - PRODUCTION READY
// Optimized settings for Neon.tech with proper connection pool sizing
var MAX_CONNECTIONS = 15; // Increased for production load handling
var CONNECTION_TIMEOUT_MS = 30000; // Reduced to 30 seconds for faster failure detection
var IDLE_CONNECTION_CLEANUP_MS = 5000; // 5 seconds for faster cleanup
var EVICT_INTERVAL_MS = 15000; // Run eviction every 15 seconds for better connection management
// Configuración optimizada para Neon.tech con timeouts ajustados
var poolSettings = {
    max: MAX_CONNECTIONS, // Reduced maximum connections to prevent timeout issues
    min: 2, // Maintain minimum connections for faster response
    acquire: CONNECTION_TIMEOUT_MS, // Increased time to wait for connection
    idle: IDLE_CONNECTION_CLEANUP_MS, // Reduced idle time for faster cleanup
    evict: EVICT_INTERVAL_MS, // More frequent eviction to manage connections better
    handleDisconnects: true, // Handle disconnections gracefully
    validate: function (client) {
        return client.query('SELECT 1').then(function () { return true; }).catch(function () { return false; });
    }
};
// Redis caching configuration for query results
var CACHE_TTL = 300; // 5 minutes cache for frequently accessed data
var redisClient = null;
// Initialize Redis client if REDIS_URL is provided
if (process.env.REDIS_URL) {
    try {
        redisClient = redis_1.default.createClient({
            url: process.env.REDIS_URL
        });
        redisClient.on('error', function (err) {
            logger_1.logger.warn('Redis client error:', err);
            redisClient = null; // Disable caching if Redis fails
        });
        redisClient.connect().catch(function (err) {
            logger_1.logger.warn('Failed to connect to Redis:', err);
            redisClient = null;
        });
        logger_1.logger.info('✅ Redis caching initialized');
    }
    catch (error) {
        logger_1.logger.warn('Failed to initialize Redis client:', error);
        redisClient = null;
    }
}
var sequelize = process.env.DATABASE_URL
    ? new sequelize_1.Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
            // Neon-specific optimizations - extended timeouts for dev
            connectionTimeoutMillis: 30000, // 30 seconds
            idle_in_transaction_session_timeout: 30000, // 30 seconds
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true,
        },
        timezone: "America/Guayaquil",
        pool: poolSettings, // Configuración optimizada aquí
        benchmark: true, // Para monitoreo de performance
    })
    : new sequelize_1.Sequelize({
        dialect: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PASSWORD || "5432"),
        database: process.env.DB_NAME || "sports_bets",
        username: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "password",
        pool: poolSettings, // Misma configuración para desarrollo
        dialectOptions: __assign({}, (process.env.NODE_ENV === "production" && {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
            // Neon optimizations
            connectionTimeoutMillis: 5000,
        })),
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true,
        },
        timezone: "America/Guayaquil",
    });
exports.sequelize = sequelize;
// Enhanced database monitoring and analytics
var dbMonitoringStats = {
    totalQueries: 0,
    slowQueries: 0,
    failedQueries: 0,
    avgQueryTime: 0,
    lastQueryTime: 0,
    connectionErrors: 0,
    busyWaitTime: 0,
    activeTransactions: 0
};
// ⚡ OPTIMIZED: Enhanced Pool stats function with detailed monitoring and predictive analytics
var getPoolStats = function () {
    var _a, _b, _c;
    try {
        var connectionManager = sequelize.connectionManager;
        var pool = connectionManager === null || connectionManager === void 0 ? void 0 : connectionManager.pool;
        if (!pool) {
            return __assign({ using: 0, free: 0, queue: 0, total: 0, status: 'unavailable', utilization: 0, queueTimeAvg: 0, connectionAgeMax: 0, healthyConnections: 0, unhealthyConnections: 0 }, dbMonitoringStats);
        }
        // Get detailed pool statistics
        var using = pool.used || ((_a = pool._inUseObjects) === null || _a === void 0 ? void 0 : _a.size) || 0;
        var free = pool.available || ((_b = pool._availableObjects) === null || _b === void 0 ? void 0 : _b.length) || 0;
        var queue = pool.pending || ((_c = pool._waitingClientsQueue) === null || _c === void 0 ? void 0 : _c.length) || 0;
        var total = using + free;
        var utilization = total > 0 ? Math.round((using / MAX_CONNECTIONS) * 100) : 0;
        // Additional metrics for enhanced monitoring
        var queueTimeAvg = 0;
        var connectionAgeMax = 0;
        var healthyConnections = 0;
        var unhealthyConnections = 0;
        // Calculate additional metrics if available
        if (pool._inUseObjects && pool._inUseObjects.size > 0) {
            // Estimate queue times and connection ages (this is approximated since we don't have direct access)
            // In a real implementation, this would be retrieved from the pool internals
            var connections = Array.from(pool._inUseObjects || []);
            if (connections.length > 0) {
                // Calculate max connection age (just an estimate)
                connectionAgeMax = 300; // Placeholder - in real implementation this would track actual ages
            }
        }
        var stats = __assign({ using: using, free: free, queue: queue, total: total, status: 'active', utilization: utilization, queueTimeAvg: 0, // Will implement if direct access to queue times available
            connectionAgeMax: connectionAgeMax, healthyConnections: healthyConnections, unhealthyConnections: unhealthyConnections }, dbMonitoringStats);
        return stats;
    }
    catch (error) {
        logger_1.logger.debug('Pool stats unavailable:', error.message);
        return __assign({ using: 0, free: 0, queue: 0, total: 0, status: 'error', utilization: 0, queueTimeAvg: 0, connectionAgeMax: 0, healthyConnections: 0, unhealthyConnections: 0 }, dbMonitoringStats);
    }
};
exports.getPoolStats = getPoolStats;
// Enhanced database monitoring functions
var getDbMonitoringStats = function () {
    return __assign({}, dbMonitoringStats);
};
exports.getDbMonitoringStats = getDbMonitoringStats;
var resetDbMonitoringStats = function () {
    dbMonitoringStats = {
        totalQueries: 0,
        slowQueries: 0,
        failedQueries: 0,
        avgQueryTime: 0,
        lastQueryTime: 0,
        connectionErrors: 0,
        busyWaitTime: 0,
        activeTransactions: 0
    };
};
exports.resetDbMonitoringStats = resetDbMonitoringStats;
var updateDbMonitoringStats = function (queryTime, success) {
    if (success === void 0) { success = true; }
    dbMonitoringStats.totalQueries++;
    dbMonitoringStats.lastQueryTime = queryTime;
    if (queryTime > 1000) { // Queries taking more than 1 second are slow
        dbMonitoringStats.slowQueries++;
    }
    if (!success) {
        dbMonitoringStats.failedQueries++;
    }
    // Calculate moving average for query time
    dbMonitoringStats.avgQueryTime = (dbMonitoringStats.avgQueryTime * (dbMonitoringStats.totalQueries - 1) + queryTime) / dbMonitoringStats.totalQueries;
};
exports.updateDbMonitoringStats = updateDbMonitoringStats;
// ⚡ OPTIMIZED: Enhanced pool monitoring with predictive analytics, anomaly detection, and proactive alerts
var poolMonitoringInterval = null;
var startPoolMonitoring = function () {
    // Clear any existing interval
    if (poolMonitoringInterval) {
        clearInterval(poolMonitoringInterval);
    }
    // Track historical values for predictive analysis
    var previousStats = null;
    var utilizationHistory = [];
    poolMonitoringInterval = setInterval(function () {
        var stats = (0, exports.getPoolStats)();
        // Track utilization history for trend analysis (last 10 readings)
        utilizationHistory.push(stats.utilization || 0);
        if (utilizationHistory.length > 10) {
            utilizationHistory.shift();
        }
        // Calculate trends for predictive analysis
        var avgUtilization = utilizationHistory.reduce(function (a, b) { return a + b; }, 0) / utilizationHistory.length;
        var currentUtilization = stats.utilization || 0;
        // Check for utilization trends (increasing rapidly)
        var utilizationTrend = 'stable';
        if (utilizationHistory.length >= 3) {
            var recentIncrease = currentUtilization - utilizationHistory[utilizationHistory.length - 3];
            if (recentIncrease > 20) {
                utilizationTrend = 'rapidly_increasing';
            }
            else if (recentIncrease > 10) {
                utilizationTrend = 'increasing';
            }
        }
        // ⚡ OPTIMIZATION: Only log if there are actual connections or issues
        if (stats.total > 0 || stats.queue > 0 || stats.status !== 'active') {
            logger_1.logger.debug("📊 DB Pool Enhanced Stats with Predictive Analytics", {
                using: stats.using,
                free: stats.free,
                queue: stats.queue,
                total: stats.total,
                utilization: "".concat(currentUtilization, "%"),
                utilizationTrend: utilizationTrend,
                avgUtilization: "".concat(Math.round(avgUtilization), "%"),
                queueTimeAvg: "".concat(stats.queueTimeAvg, "ms"),
                connectionAgeMax: "".concat(stats.connectionAgeMax, "s"),
                healthyConnections: stats.healthyConnections,
                unhealthyConnections: stats.unhealthyConnections,
                totalQueries: stats.totalQueries,
                slowQueries: stats.slowQueries,
                failedQueries: stats.failedQueries,
                avgQueryTime: "".concat(Math.round(stats.avgQueryTime), "ms"),
                connectionErrors: stats.connectionErrors
            });
            // ⚡ PREDICTIVE ANALYTICS: Proactive alerts based on trends
            if (currentUtilization > MAX_CONNECTIONS * 0.8) {
                logger_1.logger.warn("\uD83D\uDEA8 High pool utilization: ".concat(stats.using, "/").concat(MAX_CONNECTIONS, " connections in use (").concat(currentUtilization, "%)"));
                // ⚡ CRITICAL: Alert if approaching max connections
                if (currentUtilization >= MAX_CONNECTIONS * 0.95) {
                    logger_1.logger.error("\uD83D\uDD25 CRITICAL: Approaching connection pool limit: ".concat(stats.using, "/").concat(MAX_CONNECTIONS, " (").concat(currentUtilization, "%)"));
                }
            }
            // ⚡ PREDICTIVE: Alert if utilization is rapidly increasing (suggests traffic spike coming)
            if (utilizationTrend === 'rapidly_increasing') {
                logger_1.logger.warn("\uD83D\uDCC8 Predictive Alert: Connection utilization rapidly increasing. Prepare for potential scaling needs.");
            }
            // ⚡ PREDICTIVE: Alert if queue is growing exponentially
            if (stats.queue > 5 && previousStats && stats.queue > previousStats.queue * 2) {
                logger_1.logger.warn("\u26A0\uFE0F Connection queue growing exponentially: ".concat(stats.queue, " waiting requests (was ").concat(previousStats.queue, ")"));
            }
            // ⚡ ALERT: Queue is building up (indicates connection bottleneck)
            if (stats.queue > 5) {
                logger_1.logger.warn("\u26A0\uFE0F Connection queue building up: ".concat(stats.queue, " waiting requests"));
            }
            // ⚡ ALERT: High percentage of slow queries (possible performance degradation)
            if (stats.totalQueries > 10 && (stats.slowQueries / stats.totalQueries) > 0.1) {
                logger_1.logger.warn("\u26A0\uFE0F High percentage of slow queries: ".concat(((stats.slowQueries / stats.totalQueries) * 100).toFixed(2), "%"));
            }
            // ⚡ ALERT: Increasing failure rate
            if (stats.totalQueries > 20 && (stats.failedQueries / stats.totalQueries) > 0.05) {
                logger_1.logger.error("\uD83D\uDEA8 High query failure rate: ".concat(((stats.failedQueries / stats.totalQueries) * 100).toFixed(2), "%"));
            }
            // ⚡ HEALTH: Track and report connection health metrics
            if (stats.healthyConnections > 0 || stats.unhealthyConnections > 0) {
                logger_1.logger.info("\uD83C\uDFE5 DB Connection Health: ".concat(stats.healthyConnections, " healthy, ").concat(stats.unhealthyConnections, " unhealthy connections"));
            }
            // Update previous stats for comparison
            previousStats = __assign(__assign({}, stats), { timestamp: Date.now() });
        }
    }, 30000); // Check every 30s for more responsive monitoring with predictive features
};
// Función de conexión con monitoreo mejorado y retry logic
var connectDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var maxRetries, retryDelay, attempt, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                maxRetries = 3;
                retryDelay = 5000;
                attempt = 1;
                _a.label = 1;
            case 1:
                if (!(attempt <= maxRetries)) return [3 /*break*/, 10];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 7, , 9]);
                return [4 /*yield*/, sequelize.authenticate()];
            case 3:
                _a.sent();
                logger_1.logger.info("✅ Database connection established", {
                    poolStats: (0, exports.getPoolStats)(),
                    config: {
                        dialect: sequelize.getDialect(),
                        database: sequelize.getDatabaseName(),
                    },
                    attempt: attempt
                });
                if (!(process.env.ENABLE_DANGEROUS_SYNC === "true")) return [3 /*break*/, 5];
                logger_1.logger.warn("⚠️  DANGEROUS: Sequelize sync enabled via ENABLE_DANGEROUS_SYNC");
                logger_1.logger.warn("🚫 This should NEVER be used in production");
                return [4 /*yield*/, sequelize.sync({ alter: true })];
            case 4:
                _a.sent();
                logger_1.logger.info("⚠️  Database models synchronized (DANGEROUS MODE)");
                return [3 /*break*/, 6];
            case 5:
                logger_1.logger.info("✅ Database sync DISABLED - using migration-only architecture");
                _a.label = 6;
            case 6:
                // ⚡ OPTIMIZATION: Start optimized pool monitoring
                startPoolMonitoring();
                return [2 /*return*/]; // Success, exit the retry loop
            case 7:
                error_1 = _a.sent();
                logger_1.logger.warn("\u26A0\uFE0F Database connection attempt ".concat(attempt, " failed:"), error_1.message);
                if (attempt === maxRetries) {
                    logger_1.logger.error("❌ Database connection failed after all retries");
                    logger_1.logger.error("Error details:", error_1.message);
                    logger_1.logger.error("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
                    console.error("Full error:", error_1);
                    throw error_1;
                }
                // Wait before retrying
                logger_1.logger.info("\u23F3 Retrying database connection in ".concat(retryDelay / 1000, " seconds..."));
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, retryDelay); })];
            case 8:
                _a.sent();
                return [3 /*break*/, 9];
            case 9:
                attempt++;
                return [3 /*break*/, 1];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.connectDatabase = connectDatabase;
// Función para cerrar la conexión
var closeDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Stop pool monitoring
                if (poolMonitoringInterval) {
                    clearInterval(poolMonitoringInterval);
                    poolMonitoringInterval = null;
                }
                return [4 /*yield*/, sequelize.close()];
            case 1:
                _a.sent();
                logger_1.logger.info("✅ Database connection closed");
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.logger.error("❌ Error closing database connection:", error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.closeDatabase = closeDatabase;
// Enhanced transaction function with monitoring and analytics
var transaction = function (callback_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([callback_1], args_1, true), void 0, function (callback, monitoringLabel) {
        var startTime, success, t, result, error_3, duration;
        if (monitoringLabel === void 0) { monitoringLabel = 'generic'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    dbMonitoringStats.activeTransactions++;
                    success = true;
                    return [4 /*yield*/, sequelize.transaction()];
                case 1:
                    t = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, 7, 8]);
                    return [4 /*yield*/, callback(t)];
                case 3:
                    result = _a.sent();
                    return [4 /*yield*/, t.commit()];
                case 4:
                    _a.sent();
                    return [2 /*return*/, result];
                case 5:
                    error_3 = _a.sent();
                    return [4 /*yield*/, t.rollback()];
                case 6:
                    _a.sent();
                    success = false;
                    throw error_3;
                case 7:
                    duration = Date.now() - startTime;
                    dbMonitoringStats.activeTransactions--;
                    (0, exports.updateDbMonitoringStats)(duration, success);
                    // Log slow transactions
                    if (duration > 5000) { // Transactions taking more than 5 seconds
                        logger_1.logger.warn("\uD83D\uDC0C Slow transaction (".concat(monitoringLabel, "): ").concat(duration, "ms"), {
                            duration: duration,
                            success: success,
                            label: monitoringLabel
                        });
                    }
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
};
exports.transaction = transaction;
// Utility function to retry database operations with exponential backoff
var retryOperation = function (operation_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([operation_1], args_1, true), void 0, function (operation, maxRetries, baseDelay) {
        var lastError, _loop_1, attempt, state_1;
        if (maxRetries === void 0) { maxRetries = 3; }
        if (baseDelay === void 0) { baseDelay = 1000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_1 = function (attempt) {
                        var _b, error_4, delay_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 4]);
                                    _b = {};
                                    return [4 /*yield*/, operation()];
                                case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                case 2:
                                    error_4 = _c.sent();
                                    lastError = error_4;
                                    // Don't retry on certain errors that are unlikely to succeed on retry
                                    if (error_4.name === 'SequelizeUniqueConstraintError' ||
                                        error_4.name === 'SequelizeValidationError') {
                                        throw error_4;
                                    }
                                    // Log retry attempt
                                    logger_1.logger.warn("\u26A0\uFE0F Database operation attempt ".concat(attempt, " failed:"), error_4.message);
                                    // If this was the last attempt, throw the error
                                    if (attempt === maxRetries) {
                                        logger_1.logger.error("\u274C Database operation failed after ".concat(maxRetries, " attempts"));
                                        throw error_4;
                                    }
                                    delay_1 = baseDelay * Math.pow(2, attempt - 1);
                                    logger_1.logger.info("\u23F3 Retrying operation in ".concat(delay_1 / 1000, " seconds..."));
                                    // Wait before retrying
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                case 3:
                                    // Wait before retrying
                                    _c.sent();
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4: throw lastError;
            }
        });
    });
};
exports.retryOperation = retryOperation;
// ⚡ PERFORMANCE OPTIMIZED: Enhanced caching with query deduplication
var ongoingQueries = new Map();
exports.cache = {
    // Get data from cache or execute query and cache result with deduplication
    getOrSet: function (key_1, fetchFn_1) {
        var args_1 = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args_1[_i - 2] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([key_1, fetchFn_1], args_1, true), void 0, function (key, fetchFn, ttl) {
            var queryPromise, result, cached, queryPromise, result, error_5;
            if (ttl === void 0) { ttl = CACHE_TTL; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!redisClient) return [3 /*break*/, 6];
                        if (!ongoingQueries.has(key)) return [3 /*break*/, 2];
                        logger_1.logger.debug("\u26A1 Query deduplication: ".concat(key));
                        return [4 /*yield*/, ongoingQueries.get(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        queryPromise = fetchFn();
                        ongoingQueries.set(key, queryPromise);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 5, 6]);
                        return [4 /*yield*/, queryPromise];
                    case 4:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 5:
                        ongoingQueries.delete(key);
                        return [7 /*endfinally*/];
                    case 6:
                        _a.trys.push([6, 15, , 17]);
                        return [4 /*yield*/, redisClient.get(key)];
                    case 7:
                        cached = _a.sent();
                        if (cached && typeof cached === 'string') {
                            logger_1.logger.debug("\u26A1 Cache hit: ".concat(key));
                            return [2 /*return*/, JSON.parse(cached)];
                        }
                        if (!ongoingQueries.has(key)) return [3 /*break*/, 9];
                        logger_1.logger.debug("\u26A1 Query deduplication (cache miss): ".concat(key));
                        return [4 /*yield*/, ongoingQueries.get(key)];
                    case 8: return [2 /*return*/, _a.sent()];
                    case 9:
                        queryPromise = fetchFn();
                        ongoingQueries.set(key, queryPromise);
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, , 13, 14]);
                        logger_1.logger.debug("\uD83D\uDD0D Cache miss, fetching: ".concat(key));
                        return [4 /*yield*/, queryPromise];
                    case 11:
                        result = _a.sent();
                        return [4 /*yield*/, redisClient.setEx(key, ttl, JSON.stringify(result))];
                    case 12:
                        _a.sent();
                        return [2 /*return*/, result];
                    case 13:
                        ongoingQueries.delete(key);
                        return [7 /*endfinally*/];
                    case 14: return [3 /*break*/, 17];
                    case 15:
                        error_5 = _a.sent();
                        logger_1.logger.warn('Cache operation failed, falling back to direct query:', error_5);
                        ongoingQueries.delete(key);
                        return [4 /*yield*/, fetchFn()];
                    case 16: return [2 /*return*/, _a.sent()];
                    case 17: return [2 /*return*/];
                }
            });
        });
    },
    // Invalidate cache for a specific key
    invalidate: function (key) { return __awaiter(void 0, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!redisClient)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, redisClient.del(key)];
                case 2:
                    _a.sent();
                    ongoingQueries.delete(key); // Also clear ongoing queries
                    return [3 /*break*/, 4];
                case 3:
                    error_6 = _a.sent();
                    logger_1.logger.warn('Cache invalidation failed:', error_6);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); },
    // Invalidate multiple cache keys by pattern
    invalidatePattern: function (pattern) { return __awaiter(void 0, void 0, void 0, function () {
        var keys, _i, _a, key, error_7;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!redisClient)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, redisClient.keys(pattern)];
                case 2:
                    keys = _b.sent();
                    if (!(keys.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, redisClient.del(keys)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    // Clear related ongoing queries
                    for (_i = 0, _a = ongoingQueries.keys(); _i < _a.length; _i++) {
                        key = _a[_i];
                        if (key.includes(pattern.replace('*', ''))) {
                            ongoingQueries.delete(key);
                        }
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_7 = _b.sent();
                    logger_1.logger.warn('Pattern cache invalidation failed:', error_7);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); }
};
exports.default = sequelize;
