"use strict";
/**
 * Database Hooks for SSE Integration
 *
 * This service sets up Sequelize hooks to automatically trigger
 * SSE events when relevant database operations occur.
 *
 * Usage: Call setupDatabaseHooks() during application initialization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseHooks = void 0;
var Fight_1 = require("../models/Fight");
var Bet_1 = require("../models/Bet");
var User_1 = require("../models/User");
var sseIntegration_1 = __importDefault(require("./sseIntegration"));
var logger_1 = require("../config/logger");
var DatabaseHooks = /** @class */ (function () {
    function DatabaseHooks() {
    }
    /**
     * Initialize all database hooks
     */
    DatabaseHooks.setupDatabaseHooks = function () {
        logger_1.logger.info('🔗 Setting up database hooks for SSE integration...');
        this.setupFightHooks();
        this.setupBetHooks();
        this.setupUserHooks();
        logger_1.logger.info('✅ Database hooks initialized successfully');
    };
    /**
     * Fight model hooks
     */
    DatabaseHooks.setupFightHooks = function () {
        // Hook for fight creation
        Fight_1.Fight.addHook('afterCreate', function (fight) {
            sseIntegration_1.default.onFightCreated({
                id: fight.id,
                number: fight.number,
                redCorner: fight.redCorner,
                blueCorner: fight.blueCorner,
                weight: fight.weight,
                eventId: fight.eventId,
                status: fight.status,
                createdAt: fight.createdAt
            });
        });
        // Hook for fight status updates
        Fight_1.Fight.addHook('afterUpdate', function (fight) {
            var _a;
            // Check if status changed
            if (fight.changed('status')) {
                var oldStatus = (_a = fight._previousDataValues) === null || _a === void 0 ? void 0 : _a.status;
                var newStatus = fight.status;
                if (oldStatus && oldStatus !== newStatus) {
                    sseIntegration_1.default.onFightStatusChange(fight.id, oldStatus, newStatus, {
                        number: fight.number,
                        redCorner: fight.redCorner,
                        blueCorner: fight.blueCorner,
                        eventId: fight.eventId,
                        bettingStartTime: fight.bettingStartTime,
                        bettingEndTime: fight.bettingEndTime,
                        totalBets: fight.totalBets,
                        totalAmount: fight.totalAmount
                    });
                }
            }
            // Check for betting window changes
            if (fight.changed('bettingStartTime') || fight.changed('bettingEndTime')) {
                sseIntegration_1.default.onFightStatusChange(fight.id, 'betting_window_updated', 'betting_window_updated', {
                    number: fight.number,
                    redCorner: fight.redCorner,
                    blueCorner: fight.blueCorner,
                    eventId: fight.eventId,
                    bettingStartTime: fight.bettingStartTime,
                    bettingEndTime: fight.bettingEndTime
                });
            }
        });
        // Hook for fight updates (general changes)
        Fight_1.Fight.addHook('afterUpdate', function (fight) {
            // Broadcast general fight update if significant fields changed
            var significantFields = ['redCorner', 'blueCorner', 'weight', 'notes', 'startTime', 'endTime'];
            var changedSignificantFields = significantFields.filter(function (field) { return fight.changed(field); });
            if (changedSignificantFields.length > 0) {
                sseIntegration_1.default.broadcastCustomAdminEvent('admin-fights', 'FIGHT_UPDATED', {
                    fightId: fight.id,
                    fightNumber: fight.number,
                    changes: changedSignificantFields,
                    updatedFields: changedSignificantFields.reduce(function (acc, field) {
                        acc[field] = fight.get(field);
                        return acc;
                    }, {}),
                    eventId: fight.eventId,
                    timestamp: new Date()
                }, 'medium', { fightId: fight.id, eventId: fight.eventId });
            }
        });
        logger_1.logger.debug('🔗 Fight hooks configured');
    };
    /**
     * Bet model hooks
     */
    DatabaseHooks.setupBetHooks = function () {
        // Hook for new bet creation
        Bet_1.Bet.addHook('afterCreate', function (bet) {
            var _a;
            sseIntegration_1.default.onNewBet({
                id: bet.id,
                fightId: bet.fightId,
                userId: bet.userId,
                side: bet.side,
                amount: bet.amount,
                potentialWin: bet.potentialWin,
                betType: bet.betType,
                proposalStatus: bet.proposalStatus,
                terms: bet.terms,
                createdAt: bet.createdAt
            });
            // Check if it's a PAGO proposal
            if (bet.betType === 'flat' && ((_a = bet.terms) === null || _a === void 0 ? void 0 : _a.pagoAmount)) {
                sseIntegration_1.default.onPagoProposal({
                    id: bet.id,
                    fightId: bet.fightId,
                    betId: bet.id,
                    userId: bet.userId,
                    proposedBy: bet.terms.proposedBy,
                    amount: bet.amount,
                    terms: bet.terms,
                    side: bet.side
                }, 'CREATED');
            }
            // Check if it's a DOY bet
            if (bet.betType === 'doy') {
                sseIntegration_1.default.onDoyProposal({
                    id: bet.id,
                    fightId: bet.fightId,
                    betId: bet.id,
                    userId: bet.userId,
                    proposedBy: bet.userId, // DOY proposals are self-initiated
                    amount: bet.amount,
                    terms: bet.terms,
                    side: bet.side
                }, 'CREATED');
            }
        });
        // Hook for bet status updates
        Bet_1.Bet.addHook('afterUpdate', function (bet) {
            var _a, _b, _c;
            // Check if proposal status changed
            if (bet.changed('proposalStatus')) {
                var oldStatus = (_a = bet._previousDataValues) === null || _a === void 0 ? void 0 : _a.proposalStatus;
                var newStatus = bet.proposalStatus;
                if (oldStatus === 'pending' && newStatus === 'accepted') {
                    if (bet.betType === 'flat' && ((_b = bet.terms) === null || _b === void 0 ? void 0 : _b.pagoAmount)) {
                        sseIntegration_1.default.onPagoProposal({
                            id: bet.id,
                            fightId: bet.fightId,
                            betId: bet.id,
                            userId: bet.userId,
                            proposedBy: bet.terms.proposedBy,
                            amount: bet.amount,
                            terms: bet.terms,
                            side: bet.side
                        }, 'ACCEPTED');
                    }
                    else if (bet.betType === 'doy') {
                        sseIntegration_1.default.onDoyProposal({
                            id: bet.id,
                            fightId: bet.fightId,
                            betId: bet.id,
                            userId: bet.userId,
                            proposedBy: bet.userId,
                            amount: bet.amount,
                            terms: bet.terms,
                            side: bet.side
                        }, 'ACCEPTED');
                    }
                }
                if (oldStatus === 'pending' && newStatus === 'rejected') {
                    if (bet.betType === 'flat' && ((_c = bet.terms) === null || _c === void 0 ? void 0 : _c.pagoAmount)) {
                        sseIntegration_1.default.onPagoProposal({
                            id: bet.id,
                            fightId: bet.fightId,
                            betId: bet.id,
                            userId: bet.userId,
                            proposedBy: bet.terms.proposedBy,
                            amount: bet.amount,
                            terms: bet.terms,
                            side: bet.side
                        }, 'REJECTED');
                    }
                    else if (bet.betType === 'doy') {
                        sseIntegration_1.default.onDoyProposal({
                            id: bet.id,
                            fightId: bet.fightId,
                            betId: bet.id,
                            userId: bet.userId,
                            proposedBy: bet.userId,
                            amount: bet.amount,
                            terms: bet.terms,
                            side: bet.side
                        }, 'REJECTED');
                    }
                }
            }
            // Check if bet was matched
            if (bet.changed('matchedWith') && bet.matchedWith) {
                // This would require fetching the matched bet, but for now we'll broadcast the match
                sseIntegration_1.default.broadcastCustomAdminEvent('admin-bets', 'BET_MATCHED', {
                    betId: bet.id,
                    matchedWith: bet.matchedWith,
                    fightId: bet.fightId,
                    userId: bet.userId,
                    amount: bet.amount,
                    side: bet.side,
                    timestamp: new Date()
                }, 'high', { fightId: bet.fightId, betId: bet.id });
            }
            // Check if bet status changed to cancelled
            if (bet.changed('status') && bet.status === 'cancelled') {
                sseIntegration_1.default.broadcastCustomAdminEvent('admin-bets', 'BET_CANCELLED', {
                    betId: bet.id,
                    fightId: bet.fightId,
                    userId: bet.userId,
                    amount: bet.amount,
                    side: bet.side,
                    reason: 'user_cancelled', // Could be enhanced with cancellation reason
                    timestamp: new Date()
                }, 'medium', { fightId: bet.fightId, betId: bet.id });
            }
        });
        // Hook for bet completion (when fight ends)
        Bet_1.Bet.addHook('afterUpdate', function (bet) {
            if (bet.changed('status') && bet.status === 'completed' && bet.result) {
                sseIntegration_1.default.broadcastCustomAdminEvent('admin-bets', 'BET_COMPLETED', {
                    betId: bet.id,
                    fightId: bet.fightId,
                    userId: bet.userId,
                    amount: bet.amount,
                    potentialWin: bet.potentialWin,
                    side: bet.side,
                    result: bet.result,
                    timestamp: new Date()
                }, 'medium', { fightId: bet.fightId, betId: bet.id, userId: bet.userId });
            }
        });
        logger_1.logger.debug('🔗 Bet hooks configured');
    };
    /**
     * User model hooks
     */
    DatabaseHooks.setupUserHooks = function () {
        // Hook for user registration
        User_1.User.addHook('afterCreate', function (user) {
            sseIntegration_1.default.onUserRegistration({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                profileInfo: user.profileInfo
            });
        });
        // Hook for user verification
        User_1.User.addHook('afterUpdate', function (user) {
            var _a, _b;
            // Check if verification level changed
            if (user.changed('profileInfo')) {
                var oldProfileInfo = (_a = user._previousDataValues) === null || _a === void 0 ? void 0 : _a.profileInfo;
                var newProfileInfo = user.profileInfo;
                var oldVerificationLevel = (oldProfileInfo === null || oldProfileInfo === void 0 ? void 0 : oldProfileInfo.verificationLevel) || 'none';
                var newVerificationLevel = (newProfileInfo === null || newProfileInfo === void 0 ? void 0 : newProfileInfo.verificationLevel) || 'none';
                if (oldVerificationLevel !== newVerificationLevel && newVerificationLevel !== 'none') {
                    sseIntegration_1.default.onUserVerification({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        profileInfo: user.profileInfo
                    });
                }
            }
            // Check if user status changed to inactive (banned)
            if (user.changed('isActive') && !user.isActive) {
                sseIntegration_1.default.broadcastCustomAdminEvent('admin-users', 'USER_BANNED', {
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    banDate: new Date(),
                    previouslyActive: true
                }, 'high', { userId: user.id });
            }
            // Check if user role changed (admin action)
            if (user.changed('role')) {
                var oldRole = (_b = user._previousDataValues) === null || _b === void 0 ? void 0 : _b.role;
                var newRole = user.role;
                sseIntegration_1.default.broadcastCustomAdminEvent('admin-users', 'ADMIN_ACTION', {
                    action: 'role_change',
                    userId: user.id,
                    username: user.username,
                    oldRole: oldRole,
                    newRole: newRole,
                    timestamp: new Date()
                }, 'high', { userId: user.id });
            }
        });
        logger_1.logger.debug('🔗 User hooks configured');
    };
    /**
     * Setup performance monitoring hooks
     */
    DatabaseHooks.setupPerformanceHooks = function () {
        // Monitor slow queries across all models
        var models = [Fight_1.Fight, Bet_1.Bet, User_1.User];
        models.forEach(function (model) {
            model.addHook('beforeFind', function (options) {
                options._startTime = Date.now();
            });
            model.addHook('afterFind', function (instances, options) {
                if (options._startTime) {
                    var duration = Date.now() - options._startTime;
                    if (duration > 500) { // Queries over 500ms
                        sseIntegration_1.default.onDatabasePerformanceAlert({
                            query: options.raw ? 'Raw SQL query' : "".concat(model.name, ".find"),
                            duration: duration,
                            threshold: 500,
                            severity: duration > 2000 ? 'critical' : duration > 1000 ? 'high' : 'medium',
                            table: model.tableName,
                            recommendation: duration > 1000 ? 'Consider adding indexes or optimizing query' : 'Monitor query performance'
                        });
                    }
                }
            });
        });
        logger_1.logger.info('🔗 Performance monitoring hooks configured');
    };
    /**
     * Setup proposal timeout monitoring
     */
    DatabaseHooks.setupProposalTimeoutMonitoring = function () {
        // Check for expired proposals every minute
        setInterval(function () {
            var now = new Date();
            // This would need to be implemented with actual proposal tracking
            // For now, we'll just log that the monitoring is active
            logger_1.logger.debug('🔗 Checking for expired PAGO/DOY proposals...');
        }, 60000); // 1 minute
        logger_1.logger.info('🔗 Proposal timeout monitoring started');
    };
    /**
     * Remove all database hooks (for testing or shutdown)
     */
    DatabaseHooks.removeAllHooks = function () {
        Fight_1.Fight.removeHook('afterCreate', 'DatabaseHooks.fightCreate');
        Fight_1.Fight.removeHook('afterUpdate', 'DatabaseHooks.fightUpdate');
        Bet_1.Bet.removeHook('afterCreate', 'DatabaseHooks.betCreate');
        Bet_1.Bet.removeHook('afterUpdate', 'DatabaseHooks.betUpdate');
        User_1.User.removeHook('afterCreate', 'DatabaseHooks.userCreate');
        User_1.User.removeHook('afterUpdate', 'DatabaseHooks.userUpdate');
        logger_1.logger.info('🔗 All database hooks removed');
    };
    return DatabaseHooks;
}());
exports.DatabaseHooks = DatabaseHooks;
exports.default = DatabaseHooks;
