"use strict";
// backend/src/services/sessionService.ts - PRODUCTION READY
// Session management service for concurrent login prevention
// Author: QWEN - Security Enhancement Specialist
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
exports.SessionService = void 0;
var crypto_1 = __importDefault(require("crypto"));
var models_1 = require("../models");
var sequelize_1 = require("sequelize");
var logger_1 = require("../config/logger");
var SessionService = /** @class */ (function () {
    function SessionService() {
    }
    /**
     * Generate device fingerprint from request information
     * @param userAgent - User agent string
     * @param ipAddress - IP address
     * @returns Device fingerprint hash
     */
    SessionService.generateDeviceFingerprint = function (userAgent, ipAddress) {
        // Create a hash of user agent and IP address for device fingerprinting
        return crypto_1.default
            .createHash('sha256')
            .update("".concat(userAgent, ":").concat(ipAddress))
            .digest('hex')
            .substring(0, 64);
    };
    /**
     * Create new session ONLY if no active session exists
     * Implements concurrent login prevention by REJECTING login attempts
     * @param userId - User ID
     * @param sessionToken - JWT session token
     * @param req - Request object containing user agent and IP
     * @returns Created ActiveSession instance
     * @throws Error if active session already exists
     */
    SessionService.createSession = function (userId, sessionToken, req) {
        return __awaiter(this, void 0, void 0, function () {
            var sequelize, userAgent_1, ipAddress_1, deviceFingerprint_1, session, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sequelize = require('../config/database').sequelize;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        userAgent_1 = req.get('User-Agent') || 'unknown';
                        ipAddress_1 = req.ip || req.connection.remoteAddress || 'unknown';
                        deviceFingerprint_1 = this.generateDeviceFingerprint(userAgent_1, ipAddress_1);
                        return [4 /*yield*/, sequelize.transaction(function (t) { return __awaiter(_this, void 0, void 0, function () {
                                var existingSessions, staleThreshold, staleSessions, staleIds, activeSessions, lastSession, error, expiresAt, newSession;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, models_1.ActiveSession.findAll({
                                                where: {
                                                    userId: userId,
                                                    isActive: true,
                                                    expiresAt: (_a = {}, _a[sequelize_1.Op.gt] = new Date(), _a)
                                                },
                                                lock: sequelize_1.Transaction.LOCK.UPDATE,
                                                transaction: t
                                            })];
                                        case 1:
                                            existingSessions = _b.sent();
                                            staleThreshold = new Date(Date.now() - 30 * 60 * 1000);
                                            staleSessions = existingSessions.filter(function (s) { return s.lastActivity < staleThreshold; });
                                            if (!(staleSessions.length > 0)) return [3 /*break*/, 3];
                                            staleIds = staleSessions.map(function (s) { return s.id; });
                                            return [4 /*yield*/, models_1.ActiveSession.destroy({
                                                    where: { id: staleIds },
                                                    transaction: t
                                                })];
                                        case 2:
                                            _b.sent();
                                            logger_1.logger.info("Auto-cleaned ".concat(staleSessions.length, " stale sessions for user ").concat(userId));
                                            _b.label = 3;
                                        case 3:
                                            activeSessions = existingSessions.filter(function (s) { return s.lastActivity >= staleThreshold; });
                                            // ❌ REJECT login if active session exists (not stale)
                                            if (activeSessions.length > 0) {
                                                lastSession = activeSessions[0];
                                                error = new Error('Ya existe una sesión activa para este usuario. Cierra la sesión anterior antes de iniciar una nueva.');
                                                error.code = 'SESSION_CONFLICT';
                                                error.statusCode = 409;
                                                error.existingSession = {
                                                    deviceFingerprint: lastSession.deviceFingerprint,
                                                    ipAddress: lastSession.ipAddress,
                                                    lastActivity: lastSession.lastActivity
                                                };
                                                throw error;
                                            }
                                            expiresAt = new Date();
                                            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours TTL
                                            return [4 /*yield*/, models_1.ActiveSession.create({
                                                    userId: userId,
                                                    sessionToken: sessionToken,
                                                    deviceFingerprint: deviceFingerprint_1,
                                                    ipAddress: ipAddress_1,
                                                    userAgent: userAgent_1,
                                                    expiresAt: expiresAt,
                                                    isActive: true
                                                }, { transaction: t })];
                                        case 4:
                                            newSession = _b.sent();
                                            return [2 /*return*/, newSession];
                                    }
                                });
                            }); })];
                    case 2:
                        session = _a.sent();
                        logger_1.logger.info("Created new active session for user ".concat(userId));
                        return [2 /*return*/, session];
                    case 3:
                        error_1 = _a.sent();
                        logger_1.logger.error('Error creating session:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate if session is active and not expired
     * @param sessionToken - JWT session token to validate
     * @returns ActiveSession if valid, null otherwise
     */
    SessionService.validateSession = function (sessionToken) {
        return __awaiter(this, void 0, void 0, function () {
            var session, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, models_1.ActiveSession.findOne({
                                where: {
                                    sessionToken: sessionToken,
                                    isActive: true,
                                    expiresAt: (_a = {}, _a[sequelize_1.Op.gt] = new Date(), _a) // Not expired
                                }
                            })];
                    case 1:
                        session = _b.sent();
                        if (!session) return [3 /*break*/, 3];
                        // Update last activity timestamp
                        return [4 /*yield*/, session.updateActivity()];
                    case 2:
                        // Update last activity timestamp
                        _b.sent();
                        return [2 /*return*/, session];
                    case 3: return [2 /*return*/, null];
                    case 4:
                        error_2 = _b.sent();
                        logger_1.logger.error('Error validating session:', error_2);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invalidate specific session (logout)
     * CHANGED: DELETE session instead of UPDATE to ensure immediate cleanup
     * @param sessionToken - Session token to invalidate
     */
    SessionService.invalidateSession = function (sessionToken) {
        return __awaiter(this, void 0, void 0, function () {
            var deleted, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ActiveSession.destroy({
                                where: { sessionToken: sessionToken }
                            })];
                    case 1:
                        deleted = _a.sent();
                        if (deleted > 0) {
                            logger_1.logger.info("Deleted session on logout: ".concat(sessionToken));
                        }
                        else {
                            logger_1.logger.warn("Session not found for deletion: ".concat(sessionToken));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.logger.error('Error invalidating session:', error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invalidate all sessions for a specific user
     * Used for forced logout or security purposes
     * CHANGED: DELETE sessions instead of UPDATE to ensure immediate logout
     * @param userId - User ID whose sessions to invalidate
     * @returns Success status with number of sessions invalidated
     */
    SessionService.invalidateAllUserSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var count, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ActiveSession.destroy({
                                where: {
                                    userId: userId,
                                    isActive: true
                                }
                            })];
                    case 1:
                        count = _a.sent();
                        logger_1.logger.info("Deleted all ".concat(count, " sessions for user ").concat(userId, " (forced logout)"));
                        return [2 /*return*/, {
                                success: true,
                                message: "".concat(count, " session(s) invalidated for user ").concat(userId),
                                count: count
                            }];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.logger.error('Error invalidating all user sessions:', error_4);
                        return [2 /*return*/, {
                                success: false,
                                message: error_4 instanceof Error ? error_4.message : 'Unknown error occurred'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all active sessions for a user
     * Used for session management UI
     * @param userId - User ID
     * @returns Array of active sessions
     */
    SessionService.getUserActiveSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ActiveSession.findAll({
                                where: {
                                    userId: userId,
                                    isActive: true,
                                    expiresAt: (_a = {}, _a[sequelize_1.Op.gt] = new Date(), _a)
                                },
                                order: [['lastActivity', 'DESC']],
                                limit: 10 // Limit to prevent excessive data transfer
                            })];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        error_5 = _b.sent();
                        logger_1.logger.error('Error getting user active sessions:', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cleanup expired sessions (periodic maintenance)
     * DELETES sessions that are expired or inactive for >30 days
     * @returns Number of sessions deleted
     */
    SessionService.cleanupExpiredSessions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var thirtyDaysAgo, deleted, error_6;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return [4 /*yield*/, models_1.ActiveSession.destroy({
                                where: (_a = {},
                                    _a[sequelize_1.Op.or] = [
                                        { expiresAt: (_b = {}, _b[sequelize_1.Op.lt] = new Date(), _b) },
                                        {
                                            isActive: false,
                                            createdAt: (_c = {}, _c[sequelize_1.Op.lt] = thirtyDaysAgo, _c)
                                        }
                                    ],
                                    _a)
                            })];
                    case 1:
                        deleted = _d.sent();
                        logger_1.logger.info("Deleted ".concat(deleted, " expired/old sessions (reduces table bloat)"));
                        return [2 /*return*/, deleted];
                    case 2:
                        error_6 = _d.sent();
                        logger_1.logger.error('Error cleaning up expired sessions:', error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check for suspicious activity patterns
     * Detects potential account sharing or unauthorized access
     * @param userId - User ID to check
     * @returns Object with suspicious activity information
     */
    SessionService.checkSuspiciousActivity = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var recentSessions, reasons, ipAddresses, fingerprints, concurrentCount, i, timeDiff, error_7;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ActiveSession.findAll({
                                where: {
                                    userId: userId,
                                    isActive: true,
                                    lastActivity: (_a = {},
                                        _a[sequelize_1.Op.gt] = new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                                    ,
                                        _a)
                                },
                                order: [['lastActivity', 'DESC']]
                            })];
                    case 1:
                        recentSessions = _b.sent();
                        reasons = [];
                        ipAddresses = new Set(recentSessions.map(function (s) { return s.ipAddress; }));
                        if (ipAddresses.size > 1) {
                            reasons.push("Active sessions from ".concat(ipAddresses.size, " different IP addresses"));
                        }
                        fingerprints = new Set(recentSessions.map(function (s) { return s.deviceFingerprint; }));
                        if (fingerprints.size > 1) {
                            reasons.push("Active sessions from ".concat(fingerprints.size, " different devices"));
                        }
                        // Check for sessions with very close activity times (potential automation)
                        if (recentSessions.length > 1) {
                            concurrentCount = 0;
                            for (i = 0; i < recentSessions.length - 1; i++) {
                                timeDiff = recentSessions[i].lastActivity.getTime() -
                                    recentSessions[i + 1].lastActivity.getTime();
                                if (Math.abs(timeDiff) < 5000) { // Within 5 seconds
                                    concurrentCount++;
                                }
                            }
                            if (concurrentCount > 0) {
                                reasons.push("Possible concurrent automated sessions (".concat(concurrentCount, " within 5 seconds)"));
                            }
                        }
                        return [2 /*return*/, {
                                isSuspicious: reasons.length > 0,
                                reasons: reasons,
                                sessions: recentSessions
                            }];
                    case 2:
                        error_7 = _b.sent();
                        logger_1.logger.error('Error checking suspicious activity:', error_7);
                        return [2 /*return*/, {
                                isSuspicious: false,
                                reasons: ['Error checking suspicious activity'],
                                sessions: []
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get session statistics for monitoring
     * @returns Session statistics
     */
    SessionService.getSessionStatistics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var totalSessions, activeSessions, expiredSessions, usersWithMultipleSessionsResult, usersWithMultipleSessions, error_8;
            var _a, _b, _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, models_1.ActiveSession.count()];
                    case 1:
                        totalSessions = _e.sent();
                        return [4 /*yield*/, models_1.ActiveSession.count({
                                where: {
                                    isActive: true,
                                    expiresAt: (_a = {}, _a[sequelize_1.Op.gt] = new Date(), _a)
                                }
                            })];
                    case 2:
                        activeSessions = _e.sent();
                        return [4 /*yield*/, models_1.ActiveSession.count({
                                where: (_b = {},
                                    _b[sequelize_1.Op.or] = [
                                        { isActive: false },
                                        { expiresAt: (_c = {}, _c[sequelize_1.Op.lt] = new Date(), _c) }
                                    ],
                                    _b)
                            })];
                    case 3:
                        expiredSessions = _e.sent();
                        return [4 /*yield*/, ((_d = models_1.ActiveSession.sequelize) === null || _d === void 0 ? void 0 : _d.query("\n        SELECT COUNT(*) as count\n        FROM (\n          SELECT user_id\n          FROM active_sessions\n          WHERE is_active = true AND expires_at > NOW()\n          GROUP BY user_id\n          HAVING COUNT(*) > 1\n        ) multiple_sessions\n      ", {
                                type: 'SELECT'
                            }))];
                    case 4:
                        usersWithMultipleSessionsResult = _e.sent();
                        usersWithMultipleSessions = usersWithMultipleSessionsResult && usersWithMultipleSessionsResult.length > 0
                            ? usersWithMultipleSessionsResult[0].count
                            : 0;
                        return [2 /*return*/, {
                                totalSessions: totalSessions,
                                activeSessions: activeSessions,
                                expiredSessions: expiredSessions,
                                usersWithMultipleSessions: usersWithMultipleSessions
                            }];
                    case 5:
                        error_8 = _e.sent();
                        logger_1.logger.error('Error getting session statistics:', error_8);
                        return [2 /*return*/, {
                                totalSessions: 0,
                                activeSessions: 0,
                                expiredSessions: 0,
                                usersWithMultipleSessions: 0
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return SessionService;
}());
exports.SessionService = SessionService;
exports.default = SessionService;
