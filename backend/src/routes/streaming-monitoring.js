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
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var database_1 = require("../config/database");
var safetyLimits_1 = require("../utils/safetyLimits");
var EventConnection_1 = require("../models/EventConnection");
var Bet_1 = require("../models/Bet");
var sequelize_1 = require("sequelize");
var logger_1 = require("../config/logger");
var router = (0, express_1.Router)();
// Note: This route will be mounted at /api/sse/streaming
/**
 * GET /api/sse/streaming?token=<jwt>
 * SSE endpoint for unified streaming monitoring
 * Provides connectionCount and activeBets data every 2 seconds
 */
router.get('/sse/streaming', auth_1.authenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no'
    });
    // Send initial connection established message
    res.write("event: connection_established\ndata: ".concat(JSON.stringify({
        message: 'SSE streaming monitoring connection established',
        timestamp: new Date().toISOString()
    }), "\n\n"));
    // Function to send data
    var sendStreamingData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var poolStats, safetyMetrics, fiveMinutesAgo, connectionCount, activeBets, data, error_1, errorData;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    poolStats = (0, database_1.getPoolStats)();
                    safetyMetrics = safetyLimits_1.SafetyLimits.getHealthMetrics();
                    fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    return [4 /*yield*/, EventConnection_1.EventConnection.count({
                            where: {
                                disconnected_at: null, // Still connected
                                connected_at: (_a = {},
                                    _a[sequelize_1.Op.gte] = fiveMinutesAgo,
                                    _a)
                            }
                        })];
                case 1:
                    connectionCount = _b.sent();
                    return [4 /*yield*/, Bet_1.Bet.count({
                            where: {
                                status: 'active'
                            }
                        })];
                case 2:
                    activeBets = _b.sent();
                    data = {
                        connectionCount: connectionCount,
                        activeBets: activeBets,
                        streamStatus: {
                            isLive: true, // This could be dynamic based on actual stream status
                            timestamp: new Date().toISOString(),
                            memory: {
                                currentMB: safetyMetrics.memory.currentMB,
                                limitMB: safetyMetrics.memory.limitMB,
                                percentUsed: Math.round((safetyMetrics.memory.currentMB / safetyMetrics.memory.limitMB) * 100)
                            },
                            database: {
                                activeConnections: poolStats.using,
                                availableConnections: poolStats.free,
                                queuedRequests: poolStats.queue,
                                totalConnections: poolStats.total,
                                status: poolStats.status
                            }
                        }
                    };
                    res.write("data: ".concat(JSON.stringify(data), "\n\n"));
                    logger_1.logger.debug('SSE: Sent streaming monitoring data');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    logger_1.logger.error('SSE: Error sending streaming monitoring data:', error_1);
                    errorData = {
                        error: 'Failed to fetch streaming metrics',
                        timestamp: new Date().toISOString()
                    };
                    res.write("event: error\ndata: ".concat(JSON.stringify(errorData), "\n\n"));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Send initial data immediately
    sendStreamingData();
    // Set up interval to send data every 2 seconds
    var interval = setInterval(sendStreamingData, 2000);
    // Handle connection close
    req.on('close', function () {
        clearInterval(interval);
        logger_1.logger.info('SSE: Streaming monitoring connection closed');
    });
    req.on('error', function (error) {
        logger_1.logger.error('SSE: Streaming monitoring connection error:', error);
        clearInterval(interval);
    });
});
exports.default = router;
