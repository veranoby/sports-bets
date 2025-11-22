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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseOptimizer = void 0;
var models_1 = require("../models");
var logger_1 = require("../config/logger");
// Configuration
var BATCH_FLUSH_INTERVAL_MS = 5000; // 5 seconds
var BATCH_MAX_SIZE = 50;
var QUERY_TIMEOUT_MS = 10000; // 10 seconds
var MAX_CONNECTIONS = 15;
var CONNECTION_TIMEOUT_MS = 30000; // 30 seconds
var IDLE_CONNECTION_CLEANUP_MS = 10000; // 10 seconds
// Batch queue for analytics events
var analyticsBatch = [];
// Active connections counter
var activeConnections = 0;
// Circuit breaker for database errors
var consecutiveErrors = 0;
var MAX_CONSECUTIVE_ERRORS = 5;
var circuitBreakerTripped = false;
var circuitBreakerResetTimer = null;
/**
 * DatabaseOptimizer for implementing batch operations and connection limits
 *
 * Features:
 * - Queue analytics events for batch processing
 * - Flush batches every 5 seconds or 50 records
 * - Single bulkCreate instead of individual inserts
 * - Retry logic for failed batches
 * - Connection pooling with max 15 connections
 * - Query timeouts to prevent long-running operations
 * - Circuit breaker for consecutive failures
 */
var DatabaseOptimizer = /** @class */ (function () {
    function DatabaseOptimizer() {
    }
    /**
     * Queue an analytics event for batch processing
     *
     * @param eventData Event connection data
     */
    DatabaseOptimizer.queueAnalyticsEvent = function (eventData) {
        // Check circuit breaker
        if (circuitBreakerTripped) {
            logger_1.logger.warn('Circuit breaker tripped, dropping analytics event');
            return;
        }
        // Add to batch
        analyticsBatch.push(eventData);
        // Flush if batch is full
        if (analyticsBatch.length >= BATCH_MAX_SIZE) {
            this.flushAnalyticsBatch().catch(function (err) {
                logger_1.logger.error('Failed to flush analytics batch:', { error: err });
            });
        }
    };
    /**
     * Flush the analytics batch to the database
     */
    DatabaseOptimizer.flushAnalyticsBatch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var batchToProcess, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Clear any existing flush timeout
                        if (this.batchFlushTimeout) {
                            clearTimeout(this.batchFlushTimeout);
                            this.batchFlushTimeout = null;
                        }
                        // If batch is empty, nothing to do
                        if (analyticsBatch.length === 0) {
                            return [2 /*return*/];
                        }
                        batchToProcess = __spreadArray([], analyticsBatch, true);
                        analyticsBatch = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Reset consecutive errors on successful operation
                        consecutiveErrors = 0;
                        // Perform bulk insert with timeout
                        return [4 /*yield*/, Promise.race([
                                models_1.EventConnection.bulkCreate(batchToProcess),
                                new Promise(function (_, reject) {
                                    return setTimeout(function () { return reject(new Error('Bulk create timeout')); }, QUERY_TIMEOUT_MS);
                                })
                            ])];
                    case 2:
                        // Perform bulk insert with timeout
                        _a.sent();
                        logger_1.logger.info("Flushed analytics batch of ".concat(batchToProcess.length, " records"));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        // Increment consecutive errors
                        consecutiveErrors++;
                        // Trip circuit breaker if too many errors
                        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                            circuitBreakerTripped = true;
                            logger_1.logger.error('Circuit breaker tripped due to consecutive database errors');
                            // Reset circuit breaker after a delay
                            if (circuitBreakerResetTimer) {
                                clearTimeout(circuitBreakerResetTimer);
                            }
                            circuitBreakerResetTimer = setTimeout(function () {
                                circuitBreakerTripped = false;
                                consecutiveErrors = 0;
                                logger_1.logger.info('Circuit breaker reset');
                            }, 60000); // 1 minute
                        }
                        // Re-queue failed batch
                        analyticsBatch.unshift.apply(analyticsBatch, batchToProcess);
                        logger_1.logger.error('Failed to flush analytics batch:', { error: error_1 });
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get current batch size
     *
     * @returns Current batch size
     */
    DatabaseOptimizer.getCurrentBatchSize = function () {
        return analyticsBatch.length;
    };
    /**
     * Get connection pool status
     *
     * @returns Connection pool status
     */
    DatabaseOptimizer.getConnectionPoolStatus = function () {
        return {
            active: activeConnections,
            max: MAX_CONNECTIONS,
            available: MAX_CONNECTIONS - activeConnections
        };
    };
    /**
     * Acquire a database connection
     *
     * @returns Connection token
     */
    DatabaseOptimizer.acquireConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            var _this = this;
            return __generator(this, function (_a) {
                // Check if we're at the connection limit
                if (activeConnections >= MAX_CONNECTIONS) {
                    throw new Error('Maximum database connections reached');
                }
                // Increment active connections
                activeConnections++;
                token = "conn_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                // Set up automatic connection cleanup
                setTimeout(function () {
                    _this.releaseConnection(token);
                }, CONNECTION_TIMEOUT_MS);
                return [2 /*return*/, token];
            });
        });
    };
    /**
     * Release a database connection
     *
     * @param token Connection token
     */
    DatabaseOptimizer.releaseConnection = function (token) {
        if (activeConnections > 0) {
            activeConnections--;
        }
    };
    /**
     * Get database health metrics
     *
     * @returns Health metrics
     */
    DatabaseOptimizer.getHealthMetrics = function () {
        return {
            batching: {
                currentBatchSize: this.getCurrentBatchSize(),
                maxBatchSize: BATCH_MAX_SIZE,
                flushIntervalMs: BATCH_FLUSH_INTERVAL_MS
            },
            connections: this.getConnectionPoolStatus(),
            circuitBreaker: {
                tripped: circuitBreakerTripped,
                consecutiveErrors: consecutiveErrors,
                maxConsecutiveErrors: MAX_CONSECUTIVE_ERRORS
            }
        };
    };
    /**
     * Initialize the database optimizer
     */
    DatabaseOptimizer.initialize = function () {
        var _this = this;
        // Set up periodic batch flushing
        this.batchFlushTimeout = setInterval(function () {
            if (analyticsBatch.length > 0) {
                _this.flushAnalyticsBatch().catch(function (err) {
                    logger_1.logger.error('Failed to flush analytics batch in periodic flush:', { error: err });
                });
            }
        }, BATCH_FLUSH_INTERVAL_MS);
        logger_1.logger.info('DatabaseOptimizer initialized');
    };
    // Batch flush timeout reference
    DatabaseOptimizer.batchFlushTimeout = null;
    return DatabaseOptimizer;
}());
exports.DatabaseOptimizer = DatabaseOptimizer;
// Initialize the optimizer
DatabaseOptimizer.initialize();
// Handle graceful shutdown
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.info('Flushing remaining analytics batch on shutdown...');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, DatabaseOptimizer.flushAnalyticsBatch()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                logger_1.logger.error('Failed to flush analytics batch on shutdown:', { error: error_2 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.info('Flushing remaining analytics batch on shutdown...');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, DatabaseOptimizer.flushAnalyticsBatch()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                logger_1.logger.error('Failed to flush analytics batch on shutdown:', { error: error_3 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = DatabaseOptimizer;
