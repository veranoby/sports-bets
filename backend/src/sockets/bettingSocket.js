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
exports.forceCancelBet = exports.getBettingStats = exports.setupBettingSocket = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var logger_1 = require("../config/logger");
var Bet_1 = require("../models/Bet");
var Fight_1 = require("../models/Fight");
var database_1 = __importDefault(require("../config/database"));
// WebSocket connection management
var activeConnections = new Map();
var MAX_CONNECTIONS = 100;
var CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
// Store active betting connections and pending bets
var activeBettors = new Map();
var pendingBets = new Map();
var setupBettingSocket = function (io) {
    // Middleware for betting authentication
    io.of('/betting').use(function (socket, next) { return __awaiter(void 0, void 0, void 0, function () {
        var token, decoded;
        return __generator(this, function (_a) {
            try {
                token = socket.handshake.auth.token || socket.handshake.query.token;
                if (!token) {
                    return [2 /*return*/, next(new Error('Authentication token required'))];
                }
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                socket.data = {
                    userId: decoded.userId,
                    fightId: decoded.fightId,
                    role: decoded.role || 'user'
                };
                next();
            }
            catch (error) {
                logger_1.logger.error('Betting socket authentication error:', error);
                next(new Error('Invalid authentication token'));
            }
            return [2 /*return*/];
        });
    }); });
    // Handle betting namespace connections
    io.of('/betting').on('connection', function (socket) {
        var connectionId = socket.id;
        // Check connection limit
        if (activeConnections.size >= MAX_CONNECTIONS) {
            console.warn("\uD83D\uDEA8 WebSocket connection limit reached: ".concat(activeConnections.size));
            socket.emit('error', { message: 'Server capacity reached, please try again later' });
            socket.disconnect();
            return;
        }
        // Register connection
        activeConnections.set(connectionId, {
            socket: socket,
            lastActivity: new Date(),
            userId: undefined
        });
        console.log("\u2705 WebSocket connected: ".concat(connectionId, " (Total: ").concat(activeConnections.size, ")"));
        // Update last activity on any event
        socket.onAny(function () {
            var conn = activeConnections.get(connectionId);
            if (conn) {
                conn.lastActivity = new Date();
            }
        });
        var _a = socket.data, userId = _a.userId, fightId = _a.fightId, role = _a.role;
        logger_1.logger.info("Betting user connected: ".concat(userId, " for fight ").concat(fightId || 'none'));
        // Join user to fight-specific betting room
        if (fightId) {
            socket.join("fight:".concat(fightId));
        }
        socket.join("user:".concat(userId));
        // Track active bettor
        if (userId) {
            activeBettors.set(socket.id, {
                socketId: socket.id,
                userId: userId,
                fightId: fightId,
                joinedAt: new Date(),
                lastActivity: new Date()
            });
            // Update connection with userId
            var conn = activeConnections.get(connectionId);
            if (conn) {
                conn.userId = userId;
            }
        }
        // Handle PAGO bet creation (bidirectional timeout workflow)
        socket.on('create_pago_bet', function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var fight, betId_1, MAX_TIMEOUT, timeout, pendingBet, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Check if user has permission to bet (only 'user' and 'gallera' roles)
                        if (!['user', 'gallera'].includes(socket.data.role)) {
                            return [2 /*return*/, socket.emit('bet_error', {
                                    message: 'Your role cannot place bets',
                                    code: 'ROLE_FORBIDDEN'
                                })];
                        }
                        return [4 /*yield*/, Fight_1.Fight.findByPk(data.fightId)];
                    case 1:
                        fight = _a.sent();
                        if (!fight || fight.status !== 'betting') {
                            return [2 /*return*/, socket.emit('bet_error', { message: 'Betting window is closed for this fight' })];
                        }
                        betId_1 = "pago_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        MAX_TIMEOUT = 180000;
                        timeout = Math.min(data.timeoutMs || MAX_TIMEOUT, MAX_TIMEOUT);
                        pendingBet = {
                            betId: betId_1,
                            userId: userId,
                            fightId: data.fightId,
                            type: 'PAGO',
                            amount: data.amount,
                            details: data.details,
                            timestamp: new Date()
                        };
                        // Set timeout for auto-cancellation
                        pendingBet.timeout = setTimeout(function () {
                            pendingBets.delete(betId_1);
                            // Notify user of timeout
                            socket.emit('bet_timeout', {
                                betId: betId_1,
                                message: 'PAGO bet offer expired'
                            });
                            // Notify other users in fight room
                            socket.to("fight:".concat(data.fightId)).emit('pago_bet_expired', {
                                betId: betId_1,
                                userId: userId,
                                timestamp: new Date()
                            });
                            logger_1.logger.info("PAGO bet ".concat(betId_1, " expired due to timeout"));
                        }, timeout);
                        pendingBets.set(betId_1, pendingBet);
                        // Emit to all users in fight room about new PAGO bet
                        io.of('/betting').to("fight:".concat(data.fightId)).emit('new_pago_bet', {
                            betId: betId_1,
                            userId: userId,
                            amount: data.amount,
                            details: data.details,
                            expiresAt: new Date(Date.now() + timeout),
                            timestamp: new Date()
                        });
                        // Confirm creation to betting user
                        socket.emit('pago_bet_created', {
                            betId: betId_1,
                            fightId: data.fightId,
                            expiresAt: new Date(Date.now() + timeout)
                        });
                        logger_1.logger.info("PAGO bet ".concat(betId_1, " created by user ").concat(userId));
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.error('Error creating PAGO bet:', error_1);
                        socket.emit('bet_error', { message: 'Failed to create PAGO bet' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // Handle DOY bet response (accepting a PAGO bet)
        socket.on('accept_pago_bet', function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var pendingBet_1, fight, pagoBetId, doyBetId, result, dbError_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        // Check if user has permission to bet (only 'user' and 'gallera' roles)
                        if (!['user', 'gallera'].includes(socket.data.role)) {
                            socket.emit('bet_error', {
                                message: 'Your role cannot place bets',
                                code: 'ROLE_FORBIDDEN'
                            });
                            return [2 /*return*/];
                        }
                        pendingBet_1 = pendingBets.get(data.betId);
                        if (!pendingBet_1) {
                            socket.emit('bet_error', { message: 'PAGO bet not found or expired' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Fight_1.Fight.findByPk(pendingBet_1.fightId)];
                    case 1:
                        fight = _a.sent();
                        if (!fight || fight.status !== 'betting') {
                            socket.emit('bet_error', { message: 'Betting window is closed for this fight' });
                            return [2 /*return*/];
                        }
                        if (pendingBet_1.userId === userId) {
                            socket.emit('bet_error', { message: 'Cannot accept your own PAGO bet' });
                            return [2 /*return*/];
                        }
                        // Remove from pending (this acts as a lock to prevent multiple accepts)
                        if (!pendingBets.delete(data.betId)) {
                            // Bet was already removed by another accept, user loses
                            socket.emit('bet_error', { message: 'Bet no longer available' });
                            return [2 /*return*/];
                        }
                        // Clear timeout
                        if (pendingBet_1.timeout) {
                            clearTimeout(pendingBet_1.timeout);
                        }
                        pagoBetId = void 0;
                        doyBetId = void 0;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, database_1.default.transaction(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                                var pagoBet, doyBet;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, Bet_1.Bet.create({
                                                fightId: pendingBet_1.fightId,
                                                userId: pendingBet_1.userId,
                                                side: pendingBet_1.details.side,
                                                amount: pendingBet_1.amount,
                                                potentialWin: pendingBet_1.amount * 2, // Simplified calculation
                                                status: 'active',
                                                betType: 'doy',
                                                proposalStatus: 'accepted',
                                                terms: {
                                                    ratio: pendingBet_1.details.ratio || 1,
                                                    isOffer: true,
                                                    pagoAmount: pendingBet_1.amount,
                                                    proposedBy: pendingBet_1.userId
                                                }
                                            }, { transaction: t })];
                                        case 1:
                                            pagoBet = _a.sent();
                                            return [4 /*yield*/, Bet_1.Bet.create({
                                                    fightId: pendingBet_1.fightId,
                                                    userId: userId,
                                                    side: pendingBet_1.details.side === 'red' ? 'blue' : 'red', // Opposite side
                                                    amount: pendingBet_1.amount,
                                                    potentialWin: pendingBet_1.amount * 2,
                                                    status: 'active',
                                                    betType: 'doy',
                                                    proposalStatus: 'accepted',
                                                    matchedWith: pagoBet.id,
                                                    terms: {
                                                        ratio: pendingBet_1.details.ratio || 1,
                                                        isOffer: false,
                                                        doyAmount: pendingBet_1.amount,
                                                        proposedBy: pendingBet_1.userId
                                                    }
                                                }, { transaction: t })];
                                        case 2:
                                            doyBet = _a.sent();
                                            // Link bets bidirectionally
                                            return [4 /*yield*/, pagoBet.update({ matchedWith: doyBet.id }, { transaction: t })];
                                        case 3:
                                            // Link bets bidirectionally
                                            _a.sent();
                                            return [2 /*return*/, { pagoBetId: pagoBet.id, doyBetId: doyBet.id }];
                                    }
                                });
                            }); })];
                    case 3:
                        result = _a.sent();
                        pagoBetId = result.pagoBetId;
                        doyBetId = result.doyBetId;
                        logger_1.logger.info("PAGO/DOY match persisted: PAGO=".concat(pagoBetId, ", DOY=").concat(doyBetId, ", fight=").concat(pendingBet_1.fightId));
                        return [3 /*break*/, 5];
                    case 4:
                        dbError_1 = _a.sent();
                        logger_1.logger.error('Failed to persist matched bets:', dbError_1);
                        socket.emit('bet_error', { message: 'Failed to save bet match' });
                        return [2 /*return*/];
                    case 5:
                        // Notify both users about successful match
                        io.of('/betting').to("user:".concat(pendingBet_1.userId)).emit('pago_bet_accepted', {
                            betId: data.betId,
                            doyUserId: userId,
                            matchedAt: new Date()
                        });
                        socket.emit('doy_bet_confirmed', {
                            betId: data.betId,
                            pagoUserId: pendingBet_1.userId,
                            matchedAt: new Date()
                        });
                        // Notify fight room about matched bet
                        io.of('/betting').to("fight:".concat(pendingBet_1.fightId)).emit('bet_matched', {
                            betId: data.betId,
                            pagoUserId: pendingBet_1.userId,
                            doyUserId: userId,
                            amount: pendingBet_1.amount,
                            timestamp: new Date()
                        });
                        logger_1.logger.info("PAGO bet ".concat(data.betId, " accepted by user ").concat(userId));
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error accepting PAGO bet:', error_2);
                        socket.emit('bet_error', { message: 'Failed to accept PAGO bet' });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        }); });
        // Handle bet cancellation
        socket.on('cancel_bet', function (data) {
            var pendingBet = pendingBets.get(data.betId);
            if (pendingBet && pendingBet.userId === userId) {
                // Clear timeout
                if (pendingBet.timeout) {
                    clearTimeout(pendingBet.timeout);
                }
                pendingBets.delete(data.betId);
                // Notify fight room
                socket.to("fight:".concat(pendingBet.fightId)).emit('bet_cancelled', {
                    betId: data.betId,
                    userId: userId,
                    timestamp: new Date()
                });
                socket.emit('bet_cancelled_confirmed', {
                    betId: data.betId
                });
                logger_1.logger.info("Bet ".concat(data.betId, " cancelled by user ").concat(userId));
            }
            else {
                socket.emit('bet_error', { message: 'Cannot cancel this bet' });
            }
        });
        // Handle heartbeat for active betting
        socket.on('betting_heartbeat', function () {
            var bettor = activeBettors.get(socket.id);
            if (bettor) {
                bettor.lastActivity = new Date();
            }
        });
        // Handle fight room joins
        socket.on('join_fight_betting', function (data) {
            socket.join("fight:".concat(data.fightId));
            var bettor = activeBettors.get(socket.id);
            if (bettor) {
                bettor.fightId = data.fightId;
            }
            // Send current pending bets for this fight
            var fightPendingBets = Array.from(pendingBets.values())
                .filter(function (bet) { return bet.fightId === data.fightId && bet.userId !== userId; })
                .map(function (bet) { return ({
                betId: bet.betId,
                userId: bet.userId,
                amount: bet.amount,
                details: bet.details,
                timestamp: bet.timestamp
            }); });
            socket.emit('fight_pending_bets', {
                fightId: data.fightId,
                pendingBets: fightPendingBets
            });
        });
        // Handle disconnection
        socket.on('disconnect', function (reason) {
            logger_1.logger.info("Betting user disconnected: ".concat(userId, " - ").concat(reason));
            var bettor = activeBettors.get(socket.id);
            if (bettor) {
                // Cancel any pending bets from this user
                for (var _i = 0, _a = pendingBets.entries(); _i < _a.length; _i++) {
                    var _b = _a[_i], betId = _b[0], bet = _b[1];
                    if (bet.userId === userId) {
                        if (bet.timeout) {
                            clearTimeout(bet.timeout);
                        }
                        pendingBets.delete(betId);
                        // Notify fight room
                        if (bet.fightId) {
                            socket.to("fight:".concat(bet.fightId)).emit('bet_cancelled', {
                                betId: betId,
                                userId: userId,
                                reason: 'user_disconnected',
                                timestamp: new Date()
                            });
                        }
                    }
                }
                activeBettors.delete(socket.id);
            }
            activeConnections.delete(connectionId);
            console.log("\u274C WebSocket disconnected: ".concat(connectionId, " (Total: ").concat(activeConnections.size, ")"));
        });
    });
    // Cleanup inactive connections every 5 minutes
    setInterval(function () {
        var now = new Date();
        var cleanedUp = 0;
        activeConnections.forEach(function (conn, connectionId) {
            var inactiveTime = now.getTime() - conn.lastActivity.getTime();
            if (inactiveTime > 10 * 60 * 1000) { // 10 minutes inactive
                conn.socket.disconnect();
                activeConnections.delete(connectionId);
                cleanedUp++;
            }
        });
        if (cleanedUp > 0) {
            console.log("\uD83E\uDDF9 Cleaned up ".concat(cleanedUp, " inactive WebSocket connections"));
        }
    }, CLEANUP_INTERVAL);
};
exports.setupBettingSocket = setupBettingSocket;
// Export functions for external use
var getBettingStats = function () { return ({
    activeBettors: activeBettors.size,
    pendingBets: pendingBets.size,
    bettorsByFight: Array.from(activeBettors.values()).reduce(function (acc, bettor) {
        if (bettor.fightId) {
            acc[bettor.fightId] = (acc[bettor.fightId] || 0) + 1;
        }
        return acc;
    }, {})
}); };
exports.getBettingStats = getBettingStats;
var forceCancelBet = function (betId, reason) {
    if (reason === void 0) { reason = 'admin_action'; }
    var bet = pendingBets.get(betId);
    if (bet) {
        if (bet.timeout) {
            clearTimeout(bet.timeout);
        }
        pendingBets.delete(betId);
        return true;
    }
    return false;
};
exports.forceCancelBet = forceCancelBet;
