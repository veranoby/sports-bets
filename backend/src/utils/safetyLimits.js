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
exports.SafetyLimits = void 0;
var logger_1 = require("../config/logger");
// Track active intervals for cleanup
var activeIntervals = new Map();
// Track memory usage
var peakMemoryUsage = 0;
var MEMORY_LIMIT_MB = 400; // 400MB limit as specified in qwen-prompt.json
// Graceful shutdown handler
var shutdownHandlers = [];
var isShuttingDown = false;
/**
 * SafetyLimits utility class for preventing memory leaks and infinite loops
 *
 * Features:
 * - Circuit breaker for setInterval operations
 * - Memory usage monitoring (max 400MB)
 * - Error count tracking with automatic stopping
 * - Graceful cleanup of all intervals on SIGTERM
 * - Health metrics endpoint for Railway monitoring
 */
var SafetyLimits = /** @class */ (function () {
    function SafetyLimits() {
    }
    /**
     * Create a safe interval with error limits and automatic cleanup
     *
     * @param fn Function to execute
     * @param intervalMs Interval in milliseconds
     * @param maxErrors Maximum consecutive errors before stopping (default: 3)
     * @param id Optional identifier for debugging
     * @returns Cleanup function to clear the interval
     */
    SafetyLimits.createSafeInterval = function (fn, intervalMs, maxErrors, id) {
        var _this = this;
        if (maxErrors === void 0) { maxErrors = 3; }
        // Validate parameters
        if (typeof fn !== 'function') {
            throw new TypeError('fn must be a function');
        }
        if (intervalMs <= 0) {
            throw new Error('intervalMs must be positive');
        }
        if (maxErrors <= 0) {
            throw new Error('maxErrors must be positive');
        }
        // Generate ID if not provided
        if (!id) {
            id = "interval_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        }
        // Check memory before creating interval
        if (this.getCurrentMemoryUsageMB() > MEMORY_LIMIT_MB) {
            logger_1.logger.warn("Memory limit exceeded (".concat(MEMORY_LIMIT_MB, "MB). Skipping interval creation."), { id: id });
            throw new Error("Memory limit exceeded (".concat(MEMORY_LIMIT_MB, "MB)"));
        }
        var errorCount = 0;
        var wrappedFn = function () {
            try {
                fn();
                errorCount = 0; // Reset on success
            }
            catch (error) {
                errorCount++;
                logger_1.logger.error("SafeInterval error (".concat(id, "):"), { error: error, errorCount: errorCount, maxErrors: maxErrors });
                // Store error info
                var intervalInfo = activeIntervals.get(intervalId);
                if (intervalInfo) {
                    intervalInfo.errorCount = errorCount;
                    intervalInfo.lastError = error;
                }
                // Stop if too many errors
                if (errorCount >= maxErrors) {
                    logger_1.logger.error("SafeInterval stopping due to too many errors (".concat(id, ")"));
                    _this.clearInterval(intervalId);
                }
            }
        };
        var intervalId = setInterval(wrappedFn, intervalMs);
        // Store interval info
        activeIntervals.set(intervalId, {
            id: id,
            fn: wrappedFn,
            interval: intervalMs,
            errorCount: 0,
            maxErrors: maxErrors
        });
        // Return cleanup function
        return function () { return _this.clearInterval(intervalId); };
    };
    /**
     * Clear a safe interval and remove it from tracking
     * @param intervalId Interval ID returned by createSafeInterval
     */
    SafetyLimits.clearInterval = function (intervalId) {
        clearInterval(intervalId);
        activeIntervals.delete(intervalId);
    };
    /**
     * Get current memory usage in MB
     * @returns Memory usage in MB
     */
    SafetyLimits.getCurrentMemoryUsageMB = function () {
        var used = process.memoryUsage().heapUsed / 1024 / 1024;
        peakMemoryUsage = Math.max(peakMemoryUsage, used);
        return Math.round(used * 100) / 100;
    };
    /**
     * Get peak memory usage in MB
     * @returns Peak memory usage in MB
     */
    SafetyLimits.getPeakMemoryUsageMB = function () {
        return Math.round(peakMemoryUsage * 100) / 100;
    };
    /**
     * Check if memory usage is within safe limits
     * @returns True if within limits, false otherwise
     */
    SafetyLimits.isMemoryUsageSafe = function () {
        return this.getCurrentMemoryUsageMB() <= MEMORY_LIMIT_MB;
    };
    /**
     * Get health metrics for Railway monitoring
     * @returns Health metrics object
     */
    SafetyLimits.getHealthMetrics = function () {
        return {
            memory: {
                currentMB: this.getCurrentMemoryUsageMB(),
                peakMB: this.getPeakMemoryUsageMB(),
                limitMB: MEMORY_LIMIT_MB,
                safe: this.isMemoryUsageSafe()
            },
            intervals: {
                activeCount: activeIntervals.size,
                details: Array.from(activeIntervals.values()).map(function (info) { return ({
                    id: info.id,
                    intervalMs: info.interval,
                    errorCount: info.errorCount,
                    maxErrors: info.maxErrors
                }); })
            }
        };
    };
    /**
     * Register a shutdown handler for graceful cleanup
     * @param handler Cleanup function
     */
    SafetyLimits.registerShutdownHandler = function (handler) {
        shutdownHandlers.push(handler);
    };
    /**
     * Execute all shutdown handlers
     */
    SafetyLimits.executeShutdownHandlers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, intervalId, _b, shutdownHandlers_1, handler, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (isShuttingDown)
                            return [2 /*return*/];
                        isShuttingDown = true;
                        logger_1.logger.info('Executing shutdown handlers...', { handlerCount: shutdownHandlers.length });
                        // Clear all intervals
                        for (_i = 0, _a = activeIntervals.keys(); _i < _a.length; _i++) {
                            intervalId = _a[_i];
                            this.clearInterval(intervalId);
                        }
                        _b = 0, shutdownHandlers_1 = shutdownHandlers;
                        _c.label = 1;
                    case 1:
                        if (!(_b < shutdownHandlers_1.length)) return [3 /*break*/, 6];
                        handler = shutdownHandlers_1[_b];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, handler()];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _c.sent();
                        logger_1.logger.error('Shutdown handler error:', { error: error_1 });
                        return [3 /*break*/, 5];
                    case 5:
                        _b++;
                        return [3 /*break*/, 1];
                    case 6:
                        shutdownHandlers = [];
                        logger_1.logger.info('Shutdown handlers completed');
                        return [2 /*return*/];
                }
            });
        });
    };
    return SafetyLimits;
}());
exports.SafetyLimits = SafetyLimits;
// Handle graceful shutdown
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.info('Received SIGTERM signal');
                return [4 /*yield*/, SafetyLimits.executeShutdownHandlers()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.info('Received SIGINT signal');
                return [4 /*yield*/, SafetyLimits.executeShutdownHandlers()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// Handle uncaught exceptions
process.on('uncaughtException', function (error) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.error('Uncaught exception:', { error: error });
                return [4 /*yield*/, SafetyLimits.executeShutdownHandlers()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
// Handle unhandled rejections
process.on('unhandledRejection', function (reason, promise) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.error('Unhandled rejection:', { reason: reason, promise: promise });
                return [4 /*yield*/, SafetyLimits.executeShutdownHandlers()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
exports.default = SafetyLimits;
