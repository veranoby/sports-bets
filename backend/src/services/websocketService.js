"use strict";
/**
 * Minimal WebSocket Service for PAGO/DOY Proposals
 *
 * This service handles ONLY PAGO/DOY proposal communications with 3-minute timeout.
 * All other real-time communication should use SSE service.
 *
 * Architecture Decision:
 * - SSE: Admin updates, fight status, general real-time data
 * - WebSocket: ONLY for PAGO/DOY proposals (requires immediate user interaction)
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = void 0;
var socket_io_1 = require("socket.io");
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var User_1 = require("../models/User");
var logger_1 = require("../config/logger");
var zlib_1 = require("zlib");
var util_1 = require("util");
var deflateAsync = (0, util_1.promisify)(zlib_1.deflate);
var MinimalWebSocketService = /** @class */ (function () {
    function MinimalWebSocketService() {
        this.io = null;
        this.connectedUsers = new Map();
        this.activeProposals = new Map();
        this.proposalTimeouts = new Map();
        // Configuration
        this.PROPOSAL_TIMEOUT = 180000; // 3 minutes
        this.MAX_PROPOSALS_PER_USER = 5;
        this.CONNECTION_TIMEOUT = 300000; // 5 minutes idle timeout
        // Compression Configuration
        this.COMPRESSION_THRESHOLD = 1024; // Only compress messages larger than 1KB
        this.USE_COMPRESSION = process.env.WEBSOCKET_COMPRESSION === 'true'; // Toggle for message compression
        logger_1.logger.info('🔌 Minimal WebSocket Service initialized (PAGO/DOY only)');
    }
    /**
     * Initialize WebSocket server
     */
    MinimalWebSocketService.prototype.initialize = function (httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                credentials: true
            },
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });
        this.setupAuthentication();
        this.setupEventHandlers();
        logger_1.logger.info('🔌 WebSocket server initialized for PAGO/DOY proposals');
    };
    /**
     * Setup authentication middleware
     */
    MinimalWebSocketService.prototype.setupAuthentication = function () {
        var _this = this;
        if (!this.io)
            return;
        this.io.use(function (socket, next) { return __awaiter(_this, void 0, void 0, function () {
            var token, decoded, user, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        token = socket.handshake.auth.token || socket.handshake.query.token;
                        if (!token) {
                            throw new Error('No authentication token provided');
                        }
                        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                        return [4 /*yield*/, User_1.User.findByPk(decoded.userId)];
                    case 1:
                        user = _a.sent();
                        if (!user || !user.isActive) {
                            throw new Error('Invalid user or inactive account');
                        }
                        // Attach user to socket
                        socket.data.user = {
                            id: user.id,
                            username: user.username,
                            role: user.role
                        };
                        next();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.warn('WebSocket authentication failed:', error_1);
                        next(new Error('Authentication failed'));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Setup WebSocket event handlers
     */
    MinimalWebSocketService.prototype.setupEventHandlers = function () {
        var _this = this;
        if (!this.io)
            return;
        this.io.on('connection', function (socket) {
            var user = socket.data.user;
            // Register connected user
            _this.connectedUsers.set(user.id, {
                id: user.id,
                username: user.username,
                role: user.role,
                socketId: socket.id,
                connectedAt: new Date()
            });
            logger_1.logger.info("\uD83D\uDD0C User connected to WebSocket: ".concat(user.username, " (").concat(socket.id, ")"));
            // Send any pending proposals for this user
            _this.sendPendingProposals(user.id);
            // Handle PAGO proposal
            socket.on('create_pago_proposal', function (data) {
                _this.handlePagoProposal(socket, data);
            });
            // Handle DOY proposal
            socket.on('create_doy_proposal', function (data) {
                _this.handleDoyProposal(socket, data);
            });
            // Handle proposal response
            socket.on('respond_to_proposal', function (data) {
                _this.handleProposalResponse(socket, data);
            });
            // Handle proposal cancellation
            socket.on('cancel_proposal', function (data) {
                _this.handleProposalCancellation(socket, data);
            });
            // Handle disconnection
            socket.on('disconnect', function () {
                _this.connectedUsers.delete(user.id);
                logger_1.logger.info("\uD83D\uDD0C User disconnected from WebSocket: ".concat(user.username, " (").concat(socket.id, ")"));
            });
            // Handle ping/pong for connection health
            socket.on('ping', function () {
                socket.emit('pong', { timestamp: new Date() });
            });
        });
    };
    /**
     * Handle PAGO proposal creation
     */
    MinimalWebSocketService.prototype.handlePagoProposal = function (socket, data) {
        var _this = this;
        try {
            var user_1 = socket.data.user;
            var fightId = data.fightId, betId = data.betId, proposedTo = data.proposedTo, pagoAmount = data.pagoAmount, side = data.side, amount = data.amount;
            // Validate proposal data
            if (!fightId || !betId || !proposedTo || !pagoAmount || !side || !amount) {
                socket.emit('proposal_error', { message: 'Missing required proposal data' });
                return;
            }
            // Check if user has too many active proposals
            var userProposals = Array.from(this.activeProposals.values())
                .filter(function (p) { return p.proposedBy === user_1.id && p.status === 'pending'; });
            if (userProposals.length >= this.MAX_PROPOSALS_PER_USER) {
                socket.emit('proposal_error', { message: 'Too many active proposals' });
                return;
            }
            // Create proposal
            var proposalId_1 = "pago_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
            var expiresAt = new Date(Date.now() + this.PROPOSAL_TIMEOUT);
            var proposal = {
                id: proposalId_1,
                type: 'PAGO',
                fightId: fightId,
                betId: betId,
                proposedBy: user_1.id,
                proposedTo: proposedTo,
                amount: amount,
                proposalAmount: pagoAmount,
                side: side,
                expiresAt: expiresAt,
                status: 'pending'
            };
            this.activeProposals.set(proposalId_1, proposal);
            // Set timeout for proposal
            var timeout = setTimeout(function () {
                _this.handleProposalTimeout(proposalId_1);
            }, this.PROPOSAL_TIMEOUT);
            this.proposalTimeouts.set(proposalId_1, timeout);
            // Send proposal to target user
            this.sendProposalToUser(proposedTo, proposal);
            // Confirm to proposer
            this.sendCompressedMessage(socket, 'proposal_created', {
                proposalId: proposalId_1,
                type: 'PAGO',
                expiresAt: expiresAt.toISOString(),
                status: 'pending'
            });
            logger_1.logger.info("\uD83D\uDD0C PAGO proposal created: ".concat(proposalId_1, " by ").concat(user_1.username, " to user ").concat(proposedTo));
        }
        catch (error) {
            logger_1.logger.error('Error handling PAGO proposal:', error);
            socket.emit('proposal_error', { message: 'Failed to create PAGO proposal' });
        }
    };
    /**
     * Handle DOY proposal creation
     */
    MinimalWebSocketService.prototype.handleDoyProposal = function (socket, data) {
        var _this = this;
        try {
            var user_2 = socket.data.user;
            var fightId = data.fightId, betId = data.betId, proposedTo = data.proposedTo, doyAmount = data.doyAmount, side = data.side, amount = data.amount;
            // Validate proposal data
            if (!fightId || !betId || !proposedTo || !doyAmount || !side || !amount) {
                socket.emit('proposal_error', { message: 'Missing required proposal data' });
                return;
            }
            // Check active proposals limit
            var userProposals = Array.from(this.activeProposals.values())
                .filter(function (p) { return p.proposedBy === user_2.id && p.status === 'pending'; });
            if (userProposals.length >= this.MAX_PROPOSALS_PER_USER) {
                socket.emit('proposal_error', { message: 'Too many active proposals' });
                return;
            }
            // Create proposal
            var proposalId_2 = "doy_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
            var expiresAt = new Date(Date.now() + this.PROPOSAL_TIMEOUT);
            var proposal = {
                id: proposalId_2,
                type: 'DOY',
                fightId: fightId,
                betId: betId,
                proposedBy: user_2.id,
                proposedTo: proposedTo,
                amount: amount,
                proposalAmount: doyAmount,
                side: side,
                expiresAt: expiresAt,
                status: 'pending'
            };
            this.activeProposals.set(proposalId_2, proposal);
            // Set timeout
            var timeout = setTimeout(function () {
                _this.handleProposalTimeout(proposalId_2);
            }, this.PROPOSAL_TIMEOUT);
            this.proposalTimeouts.set(proposalId_2, timeout);
            // Send to target user
            this.sendProposalToUser(proposedTo, proposal);
            // Confirm to proposer
            this.sendCompressedMessage(socket, 'proposal_created', {
                proposalId: proposalId_2,
                type: 'DOY',
                expiresAt: expiresAt.toISOString(),
                status: 'pending'
            });
            logger_1.logger.info("\uD83D\uDD0C DOY proposal created: ".concat(proposalId_2, " by ").concat(user_2.username, " to user ").concat(proposedTo));
        }
        catch (error) {
            logger_1.logger.error('Error handling DOY proposal:', error);
            this.sendCompressedMessage(socket, 'proposal_error', { message: 'Failed to create DOY proposal' });
        }
    };
    /**
     * Handle proposal response (accept/reject)
     */
    MinimalWebSocketService.prototype.handleProposalResponse = function (socket, data) {
        var _this = this;
        try {
            var user = socket.data.user;
            var proposalId_3 = data.proposalId, response = data.response; // response: 'accept' | 'reject'
            var proposal = this.activeProposals.get(proposalId_3);
            if (!proposal) {
                socket.emit('proposal_error', { message: 'Proposal not found' });
                return;
            }
            // Verify user is the target of the proposal
            if (proposal.proposedTo !== user.id) {
                socket.emit('proposal_error', { message: 'Not authorized to respond to this proposal' });
                return;
            }
            // Check if proposal is still pending
            if (proposal.status !== 'pending') {
                socket.emit('proposal_error', { message: 'Proposal is no longer active' });
                return;
            }
            // Update proposal status
            proposal.status = response === 'accept' ? 'accepted' : 'rejected';
            this.activeProposals.set(proposalId_3, proposal);
            // Clear timeout
            var timeout = this.proposalTimeouts.get(proposalId_3);
            if (timeout) {
                clearTimeout(timeout);
                this.proposalTimeouts.delete(proposalId_3);
            }
            // Notify both users
            this.notifyProposalResult(proposal, response === 'accept' ? 'accepted' : 'rejected');
            // Clean up proposal after notification
            setTimeout(function () {
                _this.activeProposals.delete(proposalId_3);
            }, 5000); // 5 second delay for clients to process
            logger_1.logger.info("\uD83D\uDD0C Proposal ".concat(response, ": ").concat(proposalId_3, " by user ").concat(user.username));
        }
        catch (error) {
            logger_1.logger.error('Error handling proposal response:', error);
            this.sendCompressedMessage(socket, 'proposal_error', { message: 'Failed to process proposal response' });
        }
    };
    /**
     * Handle proposal cancellation by proposer
     */
    MinimalWebSocketService.prototype.handleProposalCancellation = function (socket, data) {
        var _this = this;
        try {
            var user = socket.data.user;
            var proposalId_4 = data.proposalId;
            var proposal = this.activeProposals.get(proposalId_4);
            if (!proposal) {
                socket.emit('proposal_error', { message: 'Proposal not found' });
                return;
            }
            // Verify user is the proposer
            if (proposal.proposedBy !== user.id) {
                socket.emit('proposal_error', { message: 'Not authorized to cancel this proposal' });
                return;
            }
            // Update status
            proposal.status = 'timeout'; // Use timeout status for cancellation
            this.activeProposals.set(proposalId_4, proposal);
            // Clear timeout
            var timeout = this.proposalTimeouts.get(proposalId_4);
            if (timeout) {
                clearTimeout(timeout);
                this.proposalTimeouts.delete(proposalId_4);
            }
            // Notify both users
            this.notifyProposalResult(proposal, 'cancelled');
            // Clean up
            setTimeout(function () {
                _this.activeProposals.delete(proposalId_4);
            }, 2000);
            logger_1.logger.info("\uD83D\uDD0C Proposal cancelled: ".concat(proposalId_4, " by user ").concat(user.username));
        }
        catch (error) {
            logger_1.logger.error('Error handling proposal cancellation:', error);
            socket.emit('proposal_error', { message: 'Failed to cancel proposal' });
        }
    };
    /**
     * Handle proposal timeout
     */
    MinimalWebSocketService.prototype.handleProposalTimeout = function (proposalId) {
        var _this = this;
        try {
            var proposal = this.activeProposals.get(proposalId);
            if (!proposal)
                return;
            proposal.status = 'timeout';
            this.activeProposals.set(proposalId, proposal);
            // Notify users about timeout
            this.notifyProposalResult(proposal, 'timeout');
            // Clean up
            this.proposalTimeouts.delete(proposalId);
            setTimeout(function () {
                _this.activeProposals.delete(proposalId);
            }, 5000);
            logger_1.logger.info("\uD83D\uDD0C Proposal timeout: ".concat(proposalId));
        }
        catch (error) {
            logger_1.logger.error('Error handling proposal timeout:', error);
        }
    };
    /**
     * Send proposal to specific user
     */
    MinimalWebSocketService.prototype.sendProposalToUser = function (userId, proposal) {
        var _a;
        var user = this.connectedUsers.get(userId);
        if (!user) {
            logger_1.logger.warn("Cannot send proposal to offline user: ".concat(userId));
            return;
        }
        var socket = (_a = this.io) === null || _a === void 0 ? void 0 : _a.sockets.sockets.get(user.socketId);
        if (socket) {
            this.sendCompressedMessage(socket, 'proposal_received', {
                proposalId: proposal.id,
                type: proposal.type,
                fightId: proposal.fightId,
                betId: proposal.betId,
                proposedBy: proposal.proposedBy,
                amount: proposal.amount,
                proposalAmount: proposal.proposalAmount,
                side: proposal.side,
                expiresAt: proposal.expiresAt.toISOString()
            });
        }
    };
    /**
     * Send pending proposals to user on connection
     */
    MinimalWebSocketService.prototype.sendPendingProposals = function (userId) {
        var _a;
        var pendingProposals = Array.from(this.activeProposals.values())
            .filter(function (p) { return p.proposedTo === userId && p.status === 'pending'; });
        if (pendingProposals.length > 0) {
            var user = this.connectedUsers.get(userId);
            if (user) {
                var socket = (_a = this.io) === null || _a === void 0 ? void 0 : _a.sockets.sockets.get(user.socketId);
                if (socket) {
                    socket.emit('pending_proposals', pendingProposals.map(function (p) { return ({
                        proposalId: p.id,
                        type: p.type,
                        fightId: p.fightId,
                        betId: p.betId,
                        proposedBy: p.proposedBy,
                        amount: p.amount,
                        proposalAmount: p.proposalAmount,
                        side: p.side,
                        expiresAt: p.expiresAt.toISOString()
                    }); }));
                }
            }
        }
    };
    /**
     * Notify both users about proposal result
     */
    MinimalWebSocketService.prototype.notifyProposalResult = function (proposal, result) {
        var _a, _b;
        var proposer = this.connectedUsers.get(proposal.proposedBy);
        var target = this.connectedUsers.get(proposal.proposedTo);
        var resultData = {
            proposalId: proposal.id,
            type: proposal.type,
            result: result,
            fightId: proposal.fightId,
            betId: proposal.betId,
            timestamp: new Date().toISOString()
        };
        // Notify proposer
        if (proposer) {
            var proposerSocket = (_a = this.io) === null || _a === void 0 ? void 0 : _a.sockets.sockets.get(proposer.socketId);
            if (proposerSocket) {
                this.sendCompressedMessage(proposerSocket, 'proposal_result', __assign(__assign({}, resultData), { role: 'proposer' }));
            }
        }
        // Notify target
        if (target) {
            var targetSocket = (_b = this.io) === null || _b === void 0 ? void 0 : _b.sockets.sockets.get(target.socketId);
            if (targetSocket) {
                this.sendCompressedMessage(targetSocket, 'proposal_result', __assign(__assign({}, resultData), { role: 'target' }));
            }
        }
    };
    /**
     * Get service statistics
     */
    MinimalWebSocketService.prototype.getStats = function () {
        return {
            connectedUsers: this.connectedUsers.size,
            activeProposals: this.activeProposals.size,
            proposalsByType: {
                PAGO: Array.from(this.activeProposals.values()).filter(function (p) { return p.type === 'PAGO'; }).length,
                DOY: Array.from(this.activeProposals.values()).filter(function (p) { return p.type === 'DOY'; }).length
            },
            proposalsByStatus: {
                pending: Array.from(this.activeProposals.values()).filter(function (p) { return p.status === 'pending'; }).length,
                accepted: Array.from(this.activeProposals.values()).filter(function (p) { return p.status === 'accepted'; }).length,
                rejected: Array.from(this.activeProposals.values()).filter(function (p) { return p.status === 'rejected'; }).length,
                timeout: Array.from(this.activeProposals.values()).filter(function (p) { return p.status === 'timeout'; }).length
            },
            uptime: process.uptime()
        };
    };
    /**
     * Shutdown service gracefully
     */
    MinimalWebSocketService.prototype.shutdown = function () {
        logger_1.logger.info('🔌 Shutting down WebSocket service...');
        // Clear all timeouts
        for (var _i = 0, _a = this.proposalTimeouts.values(); _i < _a.length; _i++) {
            var timeout = _a[_i];
            clearTimeout(timeout);
        }
        // Close all connections
        if (this.io) {
            this.io.close();
        }
        this.connectedUsers.clear();
        this.activeProposals.clear();
        this.proposalTimeouts.clear();
        logger_1.logger.info('✅ WebSocket service shutdown completed');
    };
    /**
     * Compress message data if it exceeds threshold
     */
    MinimalWebSocketService.prototype.compressMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var messageString, compressedData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.USE_COMPRESSION) {
                            return [2 /*return*/, { compressed: false, data: message }];
                        }
                        messageString = JSON.stringify(message);
                        if (!(messageString.length > this.COMPRESSION_THRESHOLD)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, deflateAsync(messageString)];
                    case 2:
                        compressedData = _a.sent();
                        logger_1.logger.debug("\uD83D\uDCE6 Compressed message: ".concat(messageString.length, " -> ").concat(compressedData.length, " bytes (").concat(Math.round((compressedData.length / messageString.length) * 100), "%)"));
                        return [2 /*return*/, {
                                compressed: true,
                                data: compressedData.toString('base64') // Convert to base64 for transmission
                            }];
                    case 3:
                        error_2 = _a.sent();
                        logger_1.logger.error("Compression failed:", error_2);
                        // Return original message if compression fails
                        return [2 /*return*/, { compressed: false, data: message }];
                    case 4: return [2 /*return*/, { compressed: false, data: message }];
                }
            });
        });
    };
    /**
     * Send message with optional compression
     */
    MinimalWebSocketService.prototype.sendCompressedMessage = function (socket, event, message) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, compressed, data, messageToSend;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.compressMessage(message)];
                    case 1:
                        _a = _b.sent(), compressed = _a.compressed, data = _a.data;
                        messageToSend = compressed
                            ? {
                                compressed: true,
                                data: data,
                                originalSize: JSON.stringify(message).length
                            }
                            : message;
                        socket.emit(event, messageToSend);
                        return [2 /*return*/];
                }
            });
        });
    };
    return MinimalWebSocketService;
}());
// Export singleton instance
exports.websocketService = new MinimalWebSocketService();
exports.default = exports.websocketService;
