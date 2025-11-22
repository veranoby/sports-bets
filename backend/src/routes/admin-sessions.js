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
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var sessionService_1 = require("../services/sessionService");
var ActiveSession_1 = require("../models/ActiveSession");
var User_1 = require("../models/User");
var sequelize_1 = require("sequelize");
var router = (0, express_1.Router)();
/**
 * GET /api/admin/sessions/active-users
 * Get list of currently active users (with valid sessions)
 * Returns: { activeUserIds: string[], userSessions: Array<{userId, username, lastActivity}> }
 */
router.get('/sessions/active-users', auth_1.authenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var activeSessions, activeUserIds, userSessions, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ActiveSession_1.ActiveSession.findAll({
                        where: {
                            isActive: true,
                            expiresAt: (_a = {},
                                _a[sequelize_1.Op.gt] = new Date(),
                                _a)
                        },
                        include: [
                            {
                                model: User_1.User,
                                as: 'user',
                                attributes: ['id', 'username'],
                                required: true
                            }
                        ],
                        attributes: ['userId', 'lastActivity', 'createdAt'],
                        raw: false
                    })];
            case 1:
                activeSessions = _b.sent();
                activeUserIds = __spreadArray([], new Set(activeSessions.map(function (s) { return s.userId; })), true);
                userSessions = activeSessions.map(function (session) {
                    var _a;
                    return ({
                        userId: session.userId,
                        username: (_a = session.user) === null || _a === void 0 ? void 0 : _a.username,
                        lastActivity: session.lastActivity,
                        connectedAt: session.createdAt
                    });
                });
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            activeUserIds: activeUserIds,
                            userSessions: userSessions,
                            totalActiveSessions: activeSessions.length
                        }
                    })];
            case 2:
                error_1 = _b.sent();
                console.error('Error fetching active users:', error_1);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Internal server error while fetching active users'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * DELETE /api/admin/sessions/:userId
 * Force logout all sessions for a specific user
 */
router.delete('/sessions/:userId', auth_1.authenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'User ID is required'
                        })];
                }
                return [4 /*yield*/, sessionService_1.SessionService.invalidateAllUserSessions(userId)];
            case 1:
                result = _a.sent();
                if (result.success) {
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            message: result.message,
                            userId: userId,
                            count: result.count
                        })];
                }
                else {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: result.message || 'Failed to invalidate user sessions'
                        })];
                }
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error invalidating user sessions:', error_2);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Internal server error occurred while invalidating user sessions'
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
