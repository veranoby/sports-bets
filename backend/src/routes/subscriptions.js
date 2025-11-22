"use strict";
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
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var Subscription_1 = require("../models/Subscription");
var PaymentTransaction_1 = require("../models/PaymentTransaction");
var User_1 = require("../models/User");
var paymentService_1 = require("../services/paymentService");
var sequelize_1 = require("sequelize");
var router = (0, express_1.Router)();
// Rate limiting for subscription operations
var subscriptionRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 subscription operations per window
    message: {
        success: false,
        message: 'Too many subscription requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Rate limiting for subscription creation (more restrictive)
var createSubscriptionRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit to 3 subscription creations per hour
    message: {
        success: false,
        message: 'Too many subscription creation attempts, please try again in an hour'
    }
});
/**
 * POST /api/subscriptions/create
 * Create new subscription with payment
 */
router.post('/create', createSubscriptionRateLimit, auth_1.authenticate, [
    (0, express_validator_1.body)('planType')
        .isIn(['daily', 'monthly'])
        .withMessage('Plan type must be daily or monthly'),
    (0, express_validator_1.body)('paymentToken')
        .isString()
        .isLength({ min: 10 })
        .withMessage('Valid payment token is required'),
    (0, express_validator_1.body)('autoRenew')
        .optional()
        .isBoolean()
        .withMessage('Auto renew must be boolean')
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, planType, paymentToken, _b, autoRenew, userId, existingSubscription, user, planConfig, kushkiResponse, now, expiresAt, subscription, error_1;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Validation failed',
                            errors: validationErrors.array()
                        })];
                }
                _a = req.body, planType = _a.planType, paymentToken = _a.paymentToken, _b = _a.autoRenew, autoRenew = _b === void 0 ? true : _b;
                userId = req.user.id;
                _d.label = 1;
            case 1:
                _d.trys.push([1, 7, , 8]);
                return [4 /*yield*/, Subscription_1.Subscription.findOne({
                        where: {
                            userId: userId,
                            status: 'active',
                            expiresAt: (_c = {},
                                _c[sequelize_1.Op.gt] = new Date(),
                                _c)
                        }
                    })];
            case 2:
                existingSubscription = _d.sent();
                if (existingSubscription) {
                    return [2 /*return*/, res.status(409).json({
                            success: false,
                            message: 'You already have an active subscription. Cancel it first to create a new one.',
                            code: 'SUBSCRIPTION_EXISTS'
                        })];
                }
                return [4 /*yield*/, User_1.User.findByPk(userId)];
            case 3:
                user = _d.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound('User not found');
                }
                planConfig = paymentService_1.paymentService.getSubscriptionPlans()
                    .find(function (plan) { return plan.id === planType; });
                if (!planConfig) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid subscription plan'
                        })];
                }
                return [4 /*yield*/, paymentService_1.paymentService.createSubscription({
                        token: paymentToken,
                        planType: planType,
                        userId: userId,
                        userEmail: user.email
                    })];
            case 4:
                kushkiResponse = _d.sent();
                now = new Date();
                expiresAt = planType === 'daily'
                    ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
                    : new Date(now.setMonth(now.getMonth() + 1));
                return [4 /*yield*/, Subscription_1.Subscription.create({
                        userId: userId,
                        type: planType,
                        status: 'active',
                        kushkiSubscriptionId: kushkiResponse.subscriptionId,
                        paymentMethod: 'card',
                        autoRenew: autoRenew,
                        amount: planConfig.price * 100, // Convert to cents
                        currency: planConfig.currency,
                        expiresAt: expiresAt,
                        nextBillingDate: autoRenew ? kushkiResponse.nextPaymentDate : null,
                        metadata: {
                            planName: planConfig.name,
                            createdVia: 'web'
                        }
                    })];
            case 5:
                subscription = _d.sent();
                // Create initial payment transaction
                return [4 /*yield*/, PaymentTransaction_1.PaymentTransaction.create({
                        subscriptionId: subscription.id,
                        type: 'subscription_payment',
                        status: 'completed',
                        amount: planConfig.price * 100,
                        currency: planConfig.currency,
                        paymentMethod: 'card',
                        processedAt: new Date(),
                        metadata: {
                            planType: planType,
                            initialPayment: true
                        }
                    })];
            case 6:
                // Create initial payment transaction
                _d.sent();
                res.status(201).json({
                    success: true,
                    message: 'Subscription created successfully',
                    data: {
                        id: subscription.id,
                        type: subscription.type,
                        status: subscription.status,
                        expiresAt: subscription.expiresAt,
                        autoRenew: subscription.autoRenew,
                        features: subscription.features,
                        amount: subscription.amount,
                        currency: subscription.currency,
                        nextBillingDate: subscription.nextBillingDate,
                        createdAt: subscription.createdAt
                    }
                });
                return [3 /*break*/, 8];
            case 7:
                error_1 = _d.sent();
                console.error('Subscription creation failed:', error_1);
                // Handle specific payment errors
                if (error_1.message.includes('declined') || error_1.message.includes('insufficient')) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Your payment was declined. Please check your card details and try again.',
                            code: 'PAYMENT_DECLINED'
                        })];
                }
                if (error_1.message.includes('token')) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid payment token. Please try again.',
                            code: 'INVALID_TOKEN'
                        })];
                }
                throw errorHandler_1.errors.internal("Failed to create subscription: ".concat(error_1.message));
            case 8: return [2 /*return*/];
        }
    });
}); }));
/**
 * POST /api/subscriptions/cancel
 * Cancel active subscription
 */
router.post('/cancel', subscriptionRateLimit, auth_1.authenticate, [
    (0, express_validator_1.body)('reason')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Cancel reason must be a string under 500 characters')
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, reason, userId, subscription, kushkiError_1, error_2;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body.reason, reason = _a === void 0 ? 'User requested cancellation' : _a;
                userId = req.user.id;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 8, , 9]);
                return [4 /*yield*/, Subscription_1.Subscription.findOne({
                        where: {
                            userId: userId,
                            status: 'active',
                            expiresAt: (_b = {},
                                _b[sequelize_1.Op.gt] = new Date(),
                                _b)
                        }
                    })];
            case 2:
                subscription = _c.sent();
                if (!subscription) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'No active subscription found',
                            code: 'NO_ACTIVE_SUBSCRIPTION'
                        })];
                }
                if (!subscription.kushkiSubscriptionId) return [3 /*break*/, 6];
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, paymentService_1.paymentService.cancelSubscription(subscription.kushkiSubscriptionId)];
            case 4:
                _c.sent();
                return [3 /*break*/, 6];
            case 5:
                kushkiError_1 = _c.sent();
                console.warn('Kushki cancellation failed:', kushkiError_1);
                return [3 /*break*/, 6];
            case 6: 
            // Update subscription status
            return [4 /*yield*/, subscription.update({
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelReason: reason,
                    autoRenew: false,
                    nextBillingDate: null
                })];
            case 7:
                // Update subscription status
                _c.sent();
                res.json({
                    success: true,
                    message: 'Subscription cancelled successfully',
                    data: {
                        id: subscription.id,
                        status: subscription.status,
                        cancelledAt: subscription.cancelledAt,
                        expiresAt: subscription.expiresAt, // Subscription remains active until expiry
                        refund: null // No immediate refund, service continues until expiry
                    }
                });
                return [3 /*break*/, 9];
            case 8:
                error_2 = _c.sent();
                console.error('Subscription cancellation failed:', error_2);
                throw errorHandler_1.errors.internal("Failed to cancel subscription: ".concat(error_2.message));
            case 9: return [2 /*return*/];
        }
    });
}); }));
/**
 * GET /api/subscriptions/current
 * Get current active subscription
 */
router.get('/current', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, subscription, error_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.user.id;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, Subscription_1.Subscription.findOne({
                        where: {
                            userId: userId,
                            status: 'active',
                            expiresAt: (_a = {},
                                _a[sequelize_1.Op.gt] = new Date(),
                                _a)
                        },
                        order: [['createdAt', 'DESC']]
                    })];
            case 2:
                subscription = _b.sent();
                if (!subscription) {
                    return [2 /*return*/, res.json({
                            success: true,
                            data: { type: 'free', status: 'active', features: [], plan: 'free', isActive: true, id: 'free-plan' }
                        })];
                }
                if (!subscription.isExpired()) return [3 /*break*/, 4];
                return [4 /*yield*/, subscription.markAsExpired()];
            case 3:
                _b.sent();
                return [2 /*return*/, res.json({
                        success: true,
                        data: { type: 'free', status: 'active', features: [], plan: 'free', isActive: true, id: 'free-plan' }
                    })];
            case 4:
                res.json({
                    success: true,
                    data: {
                        id: subscription.id,
                        type: subscription.type,
                        status: subscription.status,
                        expiresAt: subscription.expiresAt,
                        remainingDays: subscription.getRemainingDays(),
                        autoRenew: subscription.autoRenew,
                        features: subscription.features,
                        amount: subscription.amount,
                        currency: subscription.currency,
                        nextBillingDate: subscription.nextBillingDate,
                        createdAt: subscription.createdAt
                    }
                });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _b.sent();
                console.error('Failed to get current subscription:', error_3);
                throw errorHandler_1.errors.internal('Failed to retrieve subscription information');
            case 6: return [2 /*return*/];
        }
    });
}); }));
/**
 * GET /api/subscriptions/history
 * Get payment history
 */
router.get('/history', auth_1.authenticate, [
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be non-negative'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['completed', 'failed', 'refunded'])
        .withMessage('Invalid status filter')
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, _b, limit, _c, offset, status, userSubscriptions, subscriptionIds, whereClause, _d, transactions, total, formattedTransactions, error_4;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                userId = req.user.id;
                _a = req.query, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c, status = _a.status;
                _e.label = 1;
            case 1:
                _e.trys.push([1, 4, , 5]);
                return [4 /*yield*/, Subscription_1.Subscription.findAll({
                        where: { userId: userId },
                        attributes: ['id']
                    })];
            case 2:
                userSubscriptions = _e.sent();
                subscriptionIds = userSubscriptions.map(function (sub) { return sub.id; });
                if (subscriptionIds.length === 0) {
                    return [2 /*return*/, res.json({
                            success: true,
                            data: [],
                            pagination: {
                                total: 0,
                                limit: Number(limit),
                                offset: Number(offset)
                            }
                        })];
                }
                whereClause = {
                    subscriptionId: subscriptionIds
                };
                if (status) {
                    whereClause.status = status;
                }
                return [4 /*yield*/, PaymentTransaction_1.PaymentTransaction.findAndCountAll({
                        where: whereClause,
                        order: [['createdAt', 'DESC']],
                        limit: Number(limit),
                        offset: Number(offset)
                    })];
            case 3:
                _d = _e.sent(), transactions = _d.rows, total = _d.count;
                formattedTransactions = transactions.map(function (transaction) { return ({
                    id: transaction.id,
                    type: transaction.type,
                    status: transaction.status,
                    amount: transaction.amount,
                    formattedAmount: transaction.getFormattedAmount(),
                    currency: transaction.currency,
                    paymentMethod: transaction.paymentMethod,
                    cardLast4: transaction.cardLast4,
                    cardBrand: transaction.cardBrand,
                    processedAt: transaction.processedAt,
                    failedAt: transaction.failedAt,
                    errorMessage: transaction.errorMessage,
                    createdAt: transaction.createdAt
                }); });
                res.json({
                    success: true,
                    data: formattedTransactions,
                    pagination: {
                        total: total,
                        limit: Number(limit),
                        offset: Number(offset),
                        hasMore: Number(offset) + Number(limit) < total
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _e.sent();
                console.error('Failed to get payment history:', error_4);
                throw errorHandler_1.errors.internal('Failed to retrieve payment history');
            case 5: return [2 /*return*/];
        }
    });
}); }));
/**
 * POST /api/subscriptions/check-access
 * Check if user has access to specific features
 */
router.post('/check-access', auth_1.authenticate, [
    (0, express_validator_1.body)('feature')
        .optional()
        .isString()
        .withMessage('Feature must be a string')
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, feature, subscription, hasAccess, accessDetails, error_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.user.id;
                feature = req.body.feature;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, Subscription_1.Subscription.findOne({
                        where: {
                            userId: userId,
                            status: 'active',
                            expiresAt: (_a = {},
                                _a[sequelize_1.Op.gt] = new Date(),
                                _a)
                        }
                    })];
            case 2:
                subscription = _b.sent();
                hasAccess = false;
                accessDetails = {
                    hasSubscription: false,
                    isActive: false,
                    isExpired: false,
                    features: []
                };
                if (!subscription) return [3 /*break*/, 4];
                accessDetails.hasSubscription = true;
                accessDetails.isActive = subscription.status === 'active';
                accessDetails.isExpired = subscription.isExpired();
                accessDetails.features = subscription.features;
                accessDetails.expiresAt = subscription.expiresAt;
                accessDetails.remainingDays = subscription.getRemainingDays();
                // Check specific feature access
                if (feature) {
                    hasAccess = subscription.isActive() && subscription.hasFeature(feature);
                }
                else {
                    // General access check
                    hasAccess = subscription.isActive();
                }
                if (!(subscription.isExpired() && subscription.status === 'active')) return [3 /*break*/, 4];
                return [4 /*yield*/, subscription.markAsExpired()];
            case 3:
                _b.sent();
                accessDetails.isActive = false;
                hasAccess = false;
                _b.label = 4;
            case 4:
                res.json({
                    success: true,
                    data: __assign({ hasAccess: hasAccess }, accessDetails)
                });
                return [3 /*break*/, 6];
            case 5:
                error_5 = _b.sent();
                console.error('Access check failed:', error_5);
                throw errorHandler_1.errors.internal('Failed to check subscription access');
            case 6: return [2 /*return*/];
        }
    });
}); }));
/**
 * GET /api/subscriptions/plans
 * Get available subscription plans (kept for compatibility)
 */
router.get('/plans/info', (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var plans;
    return __generator(this, function (_a) {
        try {
            plans = paymentService_1.paymentService.getSubscriptionPlans();
            res.json({
                success: true,
                data: Array.isArray(plans) ? plans : [plans]
            });
        }
        catch (error) {
            console.error('Failed to get subscription plans:', error);
            throw errorHandler_1.errors.internal('Failed to retrieve subscription plans');
        }
        return [2 /*return*/];
    });
}); }));
/**
 * GET /api/subscriptions/plans
 * Get available subscription plans (new endpoint)
 */
router.get('/plans', (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var plans;
    return __generator(this, function (_a) {
        try {
            plans = paymentService_1.paymentService.getSubscriptionPlans();
            res.json({
                success: true,
                data: Array.isArray(plans) ? plans : [plans]
            });
        }
        catch (error) {
            console.error('Failed to get subscription plans:', error);
            throw errorHandler_1.errors.internal('Failed to retrieve subscription plans');
        }
        return [2 /*return*/];
    });
}); }));
/**
 * PUT /api/subscriptions/:id/auto-renew
 * Toggle auto-renew setting
 */
router.put('/:id/auto-renew', subscriptionRateLimit, auth_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid subscription ID'),
    (0, express_validator_1.body)('autoRenew').isBoolean().withMessage('Auto renew must be boolean')
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, subscriptionId, autoRenew, userId, subscription, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Validation failed',
                            errors: validationErrors.array()
                        })];
                }
                subscriptionId = req.params.id;
                autoRenew = req.body.autoRenew;
                userId = req.user.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, Subscription_1.Subscription.findOne({
                        where: {
                            id: subscriptionId,
                            userId: userId
                        }
                    })];
            case 2:
                subscription = _a.sent();
                if (!subscription) {
                    throw errorHandler_1.errors.notFound('Subscription not found');
                }
                if (subscription.status !== 'active') {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Can only modify active subscriptions'
                        })];
                }
                return [4 /*yield*/, subscription.update({
                        autoRenew: autoRenew,
                        nextBillingDate: autoRenew ? subscription.expiresAt : null
                    })];
            case 3:
                _a.sent();
                res.json({
                    success: true,
                    message: "Auto-renew ".concat(autoRenew ? 'enabled' : 'disabled', " successfully"),
                    data: {
                        id: subscription.id,
                        autoRenew: subscription.autoRenew,
                        nextBillingDate: subscription.nextBillingDate
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                console.error('Auto-renew toggle failed:', error_6);
                throw errorHandler_1.errors.internal('Failed to update auto-renew setting');
            case 5: return [2 /*return*/];
        }
    });
}); }));
/**
 * PUT /api/subscriptions/admin/:userId/membership
 * Admin: Update user membership manually (direct change without membership request)
 *
 * ⚡ NOTE: For membership requests workflow, use PATCH /api/membership-requests/:id/complete instead.
 * This endpoint is for direct membership changes that don't go through the request approval process.
 * Both endpoints now share the same subscription creation/update logic.
 */
router.put('/admin/:userId/membership', auth_1.authenticate, [
    (0, express_validator_1.param)('userId').isUUID().withMessage('Invalid user ID'),
    (0, express_validator_1.body)('membership_type')
        .isIn(['free', '24-hour', 'monthly'])
        .withMessage('Invalid membership type'),
    (0, express_validator_1.body)('assigned_username')
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Assigned username is required')
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, userId, _a, membership_type, assigned_username, user, now, expiresAt, _b, subscription, created, error_7;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Validation failed',
                            errors: validationErrors.array()
                        })];
                }
                // Check admin permission
                if (req.user.role !== 'admin') {
                    throw errorHandler_1.errors.forbidden('Only admins can update user memberships');
                }
                userId = req.params.userId;
                _a = req.body, membership_type = _a.membership_type, assigned_username = _a.assigned_username;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 8, , 9]);
                return [4 /*yield*/, User_1.User.findByPk(userId)];
            case 2:
                user = _c.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound('User not found');
                }
                now = new Date();
                expiresAt = null;
                if (membership_type === '24-hour') {
                    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                }
                else if (membership_type === 'monthly') {
                    expiresAt = new Date(now);
                    expiresAt.setMonth(expiresAt.getMonth() + 1);
                }
                if (!(membership_type === 'free')) return [3 /*break*/, 4];
                return [4 /*yield*/, Subscription_1.Subscription.update({ status: 'cancelled', cancelledAt: new Date(), cancelReason: "Admin cancelled - ".concat(assigned_username) }, { where: { userId: userId, status: 'active' } })];
            case 3:
                _c.sent();
                return [2 /*return*/, res.json({
                        success: true,
                        message: 'Membership updated to free',
                        data: { membership_type: 'free', status: 'active' }
                    })];
            case 4: return [4 /*yield*/, Subscription_1.Subscription.findOrCreate({
                    where: { userId: userId, status: 'active' },
                    defaults: {
                        userId: userId,
                        type: membership_type === '24-hour' ? 'daily' : 'monthly',
                        status: 'active',
                        manual_expires_at: expiresAt,
                        expiresAt: expiresAt,
                        paymentMethod: 'cash', // Admin manual assignment
                        autoRenew: false,
                        amount: 0,
                        currency: 'USD',
                        metadata: {
                            assignedBy: assigned_username,
                            assignedAt: new Date().toISOString(),
                            manualAssignment: true
                        }
                    }
                })];
            case 5:
                _b = _c.sent(), subscription = _b[0], created = _b[1];
                if (!!created) return [3 /*break*/, 7];
                return [4 /*yield*/, subscription.update({
                        type: membership_type === '24-hour' ? 'daily' : 'monthly',
                        status: 'active',
                        manual_expires_at: expiresAt,
                        expiresAt: expiresAt,
                        metadata: __assign(__assign({}, subscription.metadata), { lastAssignedBy: assigned_username, lastAssignedAt: new Date().toISOString() })
                    })];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7:
                res.json({
                    success: true,
                    message: 'Membership updated successfully',
                    data: {
                        id: subscription.id,
                        type: subscription.type,
                        status: subscription.status,
                        expiresAt: subscription.expiresAt,
                        manual_expires_at: subscription.manual_expires_at
                    }
                });
                return [3 /*break*/, 9];
            case 8:
                error_7 = _c.sent();
                console.error('Admin membership update failed:', error_7);
                throw errorHandler_1.errors.internal("Failed to update membership: ".concat(error_7.message));
            case 9: return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
