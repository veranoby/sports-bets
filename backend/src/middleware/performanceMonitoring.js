"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceMetrics = exports.performanceMonitoring = void 0;
var perf_hooks_1 = require("perf_hooks");
// Track slow queries and performance metrics
var queryMetrics = new Map();
var performanceMonitoring = function (req, res, next) {
    var startTime = perf_hooks_1.performance.now();
    var originalUrl = req.originalUrl;
    // Variable to track if headers have been sent
    var headersSent = false;
    // Hook into response finish to calculate total time
    res.on('finish', function () {
        var endTime = perf_hooks_1.performance.now();
        var duration = endTime - startTime;
        // Track metrics by route
        var metrics = queryMetrics.get(originalUrl) || { count: 0, totalTime: 0, slowQueries: 0 };
        metrics.count++;
        metrics.totalTime += duration;
        // Flag slow queries (>200ms)
        if (duration > 200) {
            metrics.slowQueries++;
            console.warn("\u26A0\uFE0F Slow query detected: ".concat(originalUrl, " took ").concat(duration.toFixed(2), "ms"));
        }
        // Alert on very slow queries (>500ms)
        if (duration > 500) {
            console.error("\uD83D\uDEA8 CRITICAL: Very slow query: ".concat(originalUrl, " took ").concat(duration.toFixed(2), "ms"));
        }
        queryMetrics.set(originalUrl, metrics);
        // Add performance headers for monitoring only if headers haven't been sent
        if (!headersSent && !res.headersSent) {
            res.set('X-Response-Time', "".concat(duration.toFixed(2), "ms"));
            headersSent = true;
        }
    });
    // Also check on close event
    res.on('close', function () {
        headersSent = true;
    });
    next();
};
exports.performanceMonitoring = performanceMonitoring;
// Export metrics for admin monitoring
var getPerformanceMetrics = function () {
    var metrics = [];
    queryMetrics.forEach(function (data, route) {
        metrics.push({
            route: route,
            avgTime: data.totalTime / data.count,
            totalRequests: data.count,
            slowQueries: data.slowQueries,
            slowQueryPercentage: ((data.slowQueries / data.count) * 100).toFixed(2)
        });
    });
    return metrics.sort(function (a, b) { return b.avgTime - a.avgTime; });
};
exports.getPerformanceMetrics = getPerformanceMetrics;
