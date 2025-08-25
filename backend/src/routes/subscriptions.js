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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const Subscription_1 = require("../models/Subscription");
const PaymentTransaction_1 = require("../models/PaymentTransaction");
const User_1 = require("../models/User");
const paymentService_1 = require("../services/paymentService");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// Rate limiting for subscription operations
const subscriptionRateLimit = (0, express_rate_limit_1.default)({
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
const createSubscriptionRateLimit = (0, express_rate_limit_1.default)({
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
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors.array()
        });
    }
    const { planType, paymentToken, autoRenew = true } = req.body;
    const userId = req.user.id;
    try {
        // Check for existing active subscription
        const existingSubscription = yield Subscription_1.Subscription.findOne({
            where: {
                userId,
                status: 'active',
                expiresAt: {
                    [sequelize_1.Op.gt]: new Date()
                }
            }
        });
        if (existingSubscription) {
            return res.status(409).json({
                success: false,
                message: 'You already have an active subscription. Cancel it first to create a new one.',
                code: 'SUBSCRIPTION_EXISTS'
            });
        }
        // Get user details
        const user = yield User_1.User.findByPk(userId);
        if (!user) {
            throw errorHandler_1.errors.notFound('User not found');
        }
        // Get plan configuration
        const planConfig = paymentService_1.paymentService.getSubscriptionPlans()
            .find(plan => plan.id === planType);
        if (!planConfig) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription plan'
            });
        }
        // Create subscription with Kushki
        const kushkiResponse = yield paymentService_1.paymentService.createSubscription({
            token: paymentToken,
            planType,
            userId,
            userEmail: user.email
        });
        // Calculate expiry date
        const now = new Date();
        const expiresAt = planType === 'daily'
            ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
            : new Date(now.setMonth(now.getMonth() + 1));
        // Create subscription record
        const subscription = yield Subscription_1.Subscription.create({
            userId,
            type: planType,
            status: 'active',
            kushkiSubscriptionId: kushkiResponse.subscriptionId,
            paymentMethod: 'card',
            autoRenew,
            amount: planConfig.price * 100, // Convert to cents
            currency: planConfig.currency,
            expiresAt,
            nextBillingDate: autoRenew ? kushkiResponse.nextPaymentDate : null,
            metadata: {
                planName: planConfig.name,
                createdVia: 'web'
            }
        });
        // Create initial payment transaction
        yield PaymentTransaction_1.PaymentTransaction.create({
            subscriptionId: subscription.id,
            type: 'subscription_payment',
            status: 'completed',
            amount: planConfig.price * 100,
            currency: planConfig.currency,
            paymentMethod: 'card',
            processedAt: new Date(),
            metadata: {
                planType,
                initialPayment: true
            }
        });
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
    }
    catch (error) {
        console.error('Subscription creation failed:', error);
        // Handle specific payment errors
        if (error.message.includes('declined') || error.message.includes('insufficient')) {
            return res.status(400).json({
                success: false,
                message: 'Your payment was declined. Please check your card details and try again.',
                code: 'PAYMENT_DECLINED'
            });
        }
        if (error.message.includes('token')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment token. Please try again.',
                code: 'INVALID_TOKEN'
            });
        }
        throw errorHandler_1.errors.internal(`Failed to create subscription: ${error.message}`);
    }
})));
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
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reason = 'User requested cancellation' } = req.body;
    const userId = req.user.id;
    try {
        // Find active subscription
        const subscription = yield Subscription_1.Subscription.findOne({
            where: {
                userId,
                status: 'active',
                expiresAt: {
                    [sequelize_1.Op.gt]: new Date()
                }
            }
        });
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found',
                code: 'NO_ACTIVE_SUBSCRIPTION'
            });
        }
        // Cancel with Kushki if it has a Kushki subscription ID
        if (subscription.kushkiSubscriptionId) {
            try {
                yield paymentService_1.paymentService.cancelSubscription(subscription.kushkiSubscriptionId);
            }
            catch (kushkiError) {
                console.warn('Kushki cancellation failed:', kushkiError);
                // Continue with local cancellation even if Kushki fails
            }
        }
        // Update subscription status
        yield subscription.update({
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelReason: reason,
            autoRenew: false,
            nextBillingDate: null
        });
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
    }
    catch (error) {
        console.error('Subscription cancellation failed:', error);
        throw errorHandler_1.errors.internal(`Failed to cancel subscription: ${error.message}`);
    }
})));
/**
 * GET /api/subscriptions/current
 * Get current active subscription
 */
router.get('/current', auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    try {
        const subscription = yield Subscription_1.Subscription.findOne({
            where: {
                userId,
                status: 'active',
                expiresAt: {
                    [sequelize_1.Op.gt]: new Date()
                }
            },
            order: [['createdAt', 'DESC']]
        });
        if (!subscription) {
            return res.json({
                success: true,
                data: { type: 'free', status: 'active', features: [], plan: 'free', isActive: true, id: 'free-plan' }
            });
        }
        // Check if subscription is actually expired
        if (subscription.isExpired()) {
            yield subscription.markAsExpired();
            return res.json({
                success: true,
                data: { type: 'free', status: 'active', features: [], plan: 'free', isActive: true, id: 'free-plan' }
            });
        }
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
    }
    catch (error) {
        console.error('Failed to get current subscription:', error);
        throw errorHandler_1.errors.internal('Failed to retrieve subscription information');
    }
})));
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
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { limit = 20, offset = 0, status } = req.query;
    try {
        // Get user's subscriptions
        const userSubscriptions = yield Subscription_1.Subscription.findAll({
            where: { userId },
            attributes: ['id']
        });
        const subscriptionIds = userSubscriptions.map(sub => sub.id);
        if (subscriptionIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                pagination: {
                    total: 0,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            });
        }
        // Build where clause
        const whereClause = {
            subscriptionId: subscriptionIds
        };
        if (status) {
            whereClause.status = status;
        }
        // Get transactions with pagination
        const { rows: transactions, count: total } = yield PaymentTransaction_1.PaymentTransaction.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: Number(limit),
            offset: Number(offset)
        });
        const formattedTransactions = transactions.map(transaction => ({
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
        }));
        res.json({
            success: true,
            data: formattedTransactions,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
                hasMore: Number(offset) + Number(limit) < total
            }
        });
    }
    catch (error) {
        console.error('Failed to get payment history:', error);
        throw errorHandler_1.errors.internal('Failed to retrieve payment history');
    }
})));
/**
 * POST /api/subscriptions/check-access
 * Check if user has access to specific features
 */
router.post('/check-access', auth_1.authenticate, [
    (0, express_validator_1.body)('feature')
        .optional()
        .isString()
        .withMessage('Feature must be a string')
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { feature } = req.body;
    try {
        const subscription = yield Subscription_1.Subscription.findOne({
            where: {
                userId,
                status: 'active',
                expiresAt: {
                    [sequelize_1.Op.gt]: new Date()
                }
            }
        });
        let hasAccess = false;
        let accessDetails = {
            hasSubscription: false,
            isActive: false,
            isExpired: false,
            features: []
        };
        if (subscription) {
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
            // Mark as expired if needed
            if (subscription.isExpired() && subscription.status === 'active') {
                yield subscription.markAsExpired();
                accessDetails.isActive = false;
                hasAccess = false;
            }
        }
        res.json({
            success: true,
            data: Object.assign({ hasAccess }, accessDetails)
        });
    }
    catch (error) {
        console.error('Access check failed:', error);
        throw errorHandler_1.errors.internal('Failed to check subscription access');
    }
})));
/**
 * GET /api/subscriptions/plans
 * Get available subscription plans (kept for compatibility)
 */
router.get('/plans/info', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plans = paymentService_1.paymentService.getSubscriptionPlans();
        res.json({
            success: true,
            data: Array.isArray(plans) ? plans : [plans]
        });
    }
    catch (error) {
        console.error('Failed to get subscription plans:', error);
        throw errorHandler_1.errors.internal('Failed to retrieve subscription plans');
    }
})));
/**
 * GET /api/subscriptions/plans
 * Get available subscription plans (new endpoint)
 */
router.get('/plans', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plans = paymentService_1.paymentService.getSubscriptionPlans();
        res.json({
            success: true,
            data: Array.isArray(plans) ? plans : [plans]
        });
    }
    catch (error) {
        console.error('Failed to get subscription plans:', error);
        throw errorHandler_1.errors.internal('Failed to retrieve subscription plans');
    }
})));
/**
 * PUT /api/subscriptions/:id/auto-renew
 * Toggle auto-renew setting
 */
router.put('/:id/auto-renew', subscriptionRateLimit, auth_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid subscription ID'),
    (0, express_validator_1.body)('autoRenew').isBoolean().withMessage('Auto renew must be boolean')
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors.array()
        });
    }
    const { id: subscriptionId } = req.params;
    const { autoRenew } = req.body;
    const userId = req.user.id;
    try {
        const subscription = yield Subscription_1.Subscription.findOne({
            where: {
                id: subscriptionId,
                userId
            }
        });
        if (!subscription) {
            throw errorHandler_1.errors.notFound('Subscription not found');
        }
        if (subscription.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Can only modify active subscriptions'
            });
        }
        yield subscription.update({
            autoRenew,
            nextBillingDate: autoRenew ? subscription.expiresAt : null
        });
        res.json({
            success: true,
            message: `Auto-renew ${autoRenew ? 'enabled' : 'disabled'} successfully`,
            data: {
                id: subscription.id,
                autoRenew: subscription.autoRenew,
                nextBillingDate: subscription.nextBillingDate
            }
        });
    }
    catch (error) {
        console.error('Auto-renew toggle failed:', error);
        throw errorHandler_1.errors.internal('Failed to update auto-renew setting');
    }
})));
exports.default = router;
