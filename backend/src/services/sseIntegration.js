"use strict";
/**
 * SSE Integration Service
 *
 * This service provides integration points for triggering SSE events
 * from various parts of the GalloBets application (fights, bets, users, etc.)
 *
 * Usage: Import and call these functions when relevant events occur
 * in controllers, services, or model hooks.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEIntegration = void 0;
var sseService_1 = require("./sseService");
var logger_1 = require("../config/logger");
var SSEIntegration = /** @class */ (function () {
    function SSEIntegration() {
    }
    /**
     * FIGHT MANAGEMENT INTEGRATIONS
     */
    // Trigger when fight status changes
    SSEIntegration.onFightStatusChange = function (fightId, oldStatus, newStatus, fightData) {
        try {
            sseService_1.sseService.broadcastFightUpdate(fightId, newStatus, {
                oldStatus: oldStatus,
                newStatus: newStatus,
                fightNumber: fightData.number,
                redCorner: fightData.redCorner,
                blueCorner: fightData.blueCorner,
                eventId: fightData.eventId,
                timestamp: new Date()
            });
            // Specific event types for betting windows
            if (oldStatus === 'upcoming' && newStatus === 'betting') {
                sseService_1.sseService.broadcastToAllAdmin({
                    id: Date.now().toString(),
                    type: sseService_1.SSEEventType.BETTING_WINDOW_OPENED,
                    data: {
                        fightId: fightId,
                        fightNumber: fightData.number,
                        redCorner: fightData.redCorner,
                        blueCorner: fightData.blueCorner,
                        bettingStartTime: fightData.bettingStartTime,
                        bettingEndTime: fightData.bettingEndTime
                    },
                    timestamp: new Date(),
                    priority: 'high',
                    metadata: { fightId: fightId, eventId: fightData.eventId }
                });
            }
            if (oldStatus === 'betting' && newStatus === 'live') {
                sseService_1.sseService.broadcastToAllAdmin({
                    id: Date.now().toString(),
                    type: sseService_1.SSEEventType.BETTING_WINDOW_CLOSED,
                    data: {
                        fightId: fightId,
                        fightNumber: fightData.number,
                        finalBetCount: fightData.totalBets,
                        finalAmount: fightData.totalAmount
                    },
                    timestamp: new Date(),
                    priority: 'high',
                    metadata: { fightId: fightId, eventId: fightData.eventId }
                });
            }
            logger_1.logger.info("\uD83D\uDCE1 SSE: Fight status change broadcasted - ".concat(fightId, ": ").concat(oldStatus, " \u2192 ").concat(newStatus));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast fight status change:', error);
        }
    };
    // Trigger when new fight is created
    SSEIntegration.onFightCreated = function (fightData) {
        try {
            sseService_1.sseService.broadcastToAllAdmin({
                id: Date.now().toString(),
                type: sseService_1.SSEEventType.FIGHT_CREATED,
                data: {
                    fightId: fightData.id,
                    fightNumber: fightData.number,
                    redCorner: fightData.redCorner,
                    blueCorner: fightData.blueCorner,
                    weight: fightData.weight,
                    eventId: fightData.eventId,
                    status: fightData.status,
                    createdAt: fightData.createdAt
                },
                timestamp: new Date(),
                priority: 'medium',
                metadata: { fightId: fightData.id, eventId: fightData.eventId }
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: New fight created - ".concat(fightData.id, " (Fight #").concat(fightData.number, ")"));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast fight creation:', error);
        }
    };
    /**
     * BETTING INTEGRATIONS
     */
    // Trigger when new bet is placed
    SSEIntegration.onNewBet = function (betData) {
        try {
            sseService_1.sseService.broadcastBettingEvent(sseService_1.SSEEventType.NEW_BET, {
                betId: betData.id,
                fightId: betData.fightId,
                userId: betData.userId,
                side: betData.side,
                amount: betData.amount,
                potentialWin: betData.potentialWin,
                betType: betData.betType,
                timestamp: new Date()
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: New bet placed - ".concat(betData.id, " (").concat(betData.side, ", $").concat(betData.amount, ")"));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast new bet:', error);
        }
    };
    // Trigger when bets are matched
    SSEIntegration.onBetMatched = function (bet1Data, bet2Data) {
        try {
            sseService_1.sseService.broadcastBettingEvent(sseService_1.SSEEventType.BET_MATCHED, {
                bet1Id: bet1Data.id,
                bet2Id: bet2Data.id,
                fightId: bet1Data.fightId,
                totalAmount: bet1Data.amount + bet2Data.amount,
                sides: [bet1Data.side, bet2Data.side],
                timestamp: new Date()
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: Bets matched - ".concat(bet1Data.id, " \u2194 ").concat(bet2Data.id));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast bet match:', error);
        }
    };
    // Trigger PAGO/DOY proposal events
    SSEIntegration.onPagoProposal = function (proposalData, action) {
        var _a;
        if (action === void 0) { action = 'CREATED'; }
        try {
            sseService_1.sseService.broadcastProposalEvent('PAGO', action, {
                proposalId: proposalData.id || Date.now().toString(),
                fightId: proposalData.fightId,
                betId: proposalData.betId || proposalData.id,
                userId: proposalData.userId,
                proposedBy: proposalData.proposedBy,
                pagoAmount: ((_a = proposalData.terms) === null || _a === void 0 ? void 0 : _a.pagoAmount) || proposalData.pagoAmount,
                originalAmount: proposalData.amount,
                side: proposalData.side,
                action: action,
                timestamp: new Date()
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: PAGO proposal ".concat(action, " - ").concat(proposalData.id));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast PAGO proposal:', error);
        }
    };
    SSEIntegration.onDoyProposal = function (proposalData, action) {
        var _a;
        if (action === void 0) { action = 'CREATED'; }
        try {
            sseService_1.sseService.broadcastProposalEvent('DOY', action, {
                proposalId: proposalData.id || Date.now().toString(),
                fightId: proposalData.fightId,
                betId: proposalData.betId || proposalData.id,
                userId: proposalData.userId,
                proposedBy: proposalData.proposedBy,
                doyAmount: ((_a = proposalData.terms) === null || _a === void 0 ? void 0 : _a.doyAmount) || proposalData.doyAmount,
                originalAmount: proposalData.amount,
                side: proposalData.side,
                action: action,
                timestamp: new Date()
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: DOY proposal ".concat(action, " - ").concat(proposalData.id));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast DOY proposal:', error);
        }
    };
    /**
     * USER MANAGEMENT INTEGRATIONS
     */
    // Trigger when new user registers
    SSEIntegration.onUserRegistration = function (userData) {
        var _a;
        try {
            sseService_1.sseService.sendToAdminChannel(sseService_1.AdminChannel.USER_MANAGEMENT, {
                id: Date.now().toString(),
                type: sseService_1.SSEEventType.USER_REGISTERED,
                data: {
                    userId: userData.id,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    registrationDate: userData.createdAt || new Date(),
                    verificationLevel: ((_a = userData.profileInfo) === null || _a === void 0 ? void 0 : _a.verificationLevel) || 'none'
                },
                timestamp: new Date(),
                priority: 'low',
                metadata: { userId: userData.id }
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: User registration - ".concat(userData.username));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast user registration:', error);
        }
    };
    // Trigger when user is verified
    SSEIntegration.onUserVerification = function (userData) {
        var _a;
        try {
            sseService_1.sseService.sendToAdminChannel(sseService_1.AdminChannel.USER_MANAGEMENT, {
                id: Date.now().toString(),
                type: sseService_1.SSEEventType.USER_VERIFIED,
                data: {
                    userId: userData.id,
                    username: userData.username,
                    email: userData.email,
                    verificationLevel: (_a = userData.profileInfo) === null || _a === void 0 ? void 0 : _a.verificationLevel,
                    verificationDate: new Date()
                },
                timestamp: new Date(),
                priority: 'medium',
                metadata: { userId: userData.id }
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: User verified - ".concat(userData.username));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast user verification:', error);
        }
    };
    /**
     * FINANCIAL INTEGRATIONS
     */
    // Trigger on wallet transactions
    SSEIntegration.onWalletTransaction = function (transactionData) {
        try {
            sseService_1.sseService.sendToAdminChannel(sseService_1.AdminChannel.FINANCIAL_MONITORING, {
                id: Date.now().toString(),
                type: sseService_1.SSEEventType.WALLET_TRANSACTION,
                data: {
                    transactionId: transactionData.id,
                    userId: transactionData.userId,
                    type: transactionData.type,
                    amount: transactionData.amount,
                    status: transactionData.status,
                    description: transactionData.description,
                    timestamp: new Date()
                },
                timestamp: new Date(),
                priority: transactionData.amount > 1000 ? 'high' : 'medium',
                metadata: {
                    userId: transactionData.userId,
                    amount: transactionData.amount
                }
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: Wallet transaction - ".concat(transactionData.type, " $").concat(transactionData.amount));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast wallet transaction:', error);
        }
    };
    // Trigger on payment processing
    SSEIntegration.onPaymentProcessed = function (paymentData) {
        try {
            sseService_1.sseService.sendToAdminChannel(sseService_1.AdminChannel.FINANCIAL_MONITORING, {
                id: Date.now().toString(),
                type: sseService_1.SSEEventType.PAYMENT_PROCESSED,
                data: {
                    paymentId: paymentData.id,
                    userId: paymentData.userId,
                    method: paymentData.method,
                    amount: paymentData.amount,
                    status: paymentData.status,
                    provider: paymentData.provider || 'kushki',
                    timestamp: new Date()
                },
                timestamp: new Date(),
                priority: paymentData.amount > 500 ? 'high' : 'medium',
                metadata: {
                    userId: paymentData.userId,
                    amount: paymentData.amount
                }
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: Payment processed - $".concat(paymentData.amount, " via ").concat(paymentData.method));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast payment processing:', error);
        }
    };
    /**
     * SYSTEM MONITORING INTEGRATIONS
     */
    // Trigger on database performance issues
    SSEIntegration.onDatabasePerformanceAlert = function (alertData) {
        try {
            var priority = alertData.severity === 'critical' ? 'critical' :
                alertData.severity === 'high' ? 'high' : 'medium';
            sseService_1.sseService.broadcastSystemEvent(sseService_1.SSEEventType.DATABASE_PERFORMANCE, {
                query: alertData.query,
                duration: alertData.duration,
                threshold: alertData.threshold,
                severity: alertData.severity,
                table: alertData.table,
                timestamp: new Date(),
                recommendation: alertData.recommendation
            }, priority);
            logger_1.logger.warn("\uD83D\uDCE1 SSE: Database performance alert - ".concat(alertData.query, " (").concat(alertData.duration, "ms)"));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast database performance alert:', error);
        }
    };
    // Trigger on system maintenance mode
    SSEIntegration.onSystemMaintenance = function (maintenanceData) {
        try {
            sseService_1.sseService.broadcastSystemEvent(sseService_1.SSEEventType.SYSTEM_MAINTENANCE, {
                status: maintenanceData.status, // 'enabled' | 'disabled'
                message: maintenanceData.message,
                estimatedDuration: maintenanceData.estimatedDuration,
                scheduledBy: maintenanceData.scheduledBy,
                timestamp: new Date()
            }, 'critical');
            logger_1.logger.info("\uD83D\uDCE1 SSE: System maintenance ".concat(maintenanceData.status));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast system maintenance:', error);
        }
    };
    /**
     * STREAMING INTEGRATIONS
     */
    // Trigger when stream starts/stops
    SSEIntegration.onStreamStatusChange = function (streamData) {
        try {
            var eventType = streamData.status === 'live' ? sseService_1.SSEEventType.STREAM_STARTED :
                streamData.status === 'ended' ? sseService_1.SSEEventType.STREAM_ENDED :
                    sseService_1.SSEEventType.STREAM_ERROR;
            sseService_1.sseService.sendToAdminChannel(sseService_1.AdminChannel.STREAMING_MONITORING, {
                id: Date.now().toString(),
                type: eventType,
                data: {
                    streamId: streamData.id,
                    eventId: streamData.eventId,
                    status: streamData.status,
                    quality: streamData.quality,
                    viewerCount: streamData.viewerCount || 0,
                    streamUrl: streamData.streamUrl,
                    timestamp: new Date()
                },
                timestamp: new Date(),
                priority: eventType === sseService_1.SSEEventType.STREAM_ERROR ? 'high' : 'medium',
                metadata: {
                    eventId: streamData.eventId,
                    streamId: streamData.id
                }
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: Stream status change - ".concat(streamData.status));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast stream status:', error);
        }
    };
    /**
     * UTILITY METHODS
     */
    // Generic method to broadcast custom admin events
    SSEIntegration.broadcastCustomAdminEvent = function (channel, eventType, data, priority, metadata) {
        if (priority === void 0) { priority = 'medium'; }
        try {
            sseService_1.sseService.sendToAdminChannel(channel, {
                id: Date.now().toString(),
                type: eventType,
                data: data,
                timestamp: new Date(),
                priority: priority,
                metadata: metadata
            });
            logger_1.logger.info("\uD83D\uDCE1 SSE: Custom admin event - ".concat(eventType, " to ").concat(channel));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast custom admin event:', error);
        }
    };
    // Send critical system alert to all admin channels
    SSEIntegration.broadcastCriticalAlert = function (message, data) {
        try {
            sseService_1.sseService.broadcastToAllAdmin({
                id: Date.now().toString(),
                type: sseService_1.SSEEventType.ERROR,
                data: __assign(__assign({ level: 'critical', message: message }, data), { timestamp: new Date() }),
                timestamp: new Date(),
                priority: 'critical'
            });
            logger_1.logger.error("\uD83D\uDCE1 SSE: Critical alert broadcasted - ".concat(message));
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast critical alert:', error);
        }
    };
    return SSEIntegration;
}());
exports.SSEIntegration = SSEIntegration;
exports.default = SSEIntegration;
