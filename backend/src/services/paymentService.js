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
exports.PaymentService = exports.paymentService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const Subscription_1 = require("../models/Subscription");
const PaymentTransaction_1 = require("../models/PaymentTransaction");
class PaymentService {
    constructor() {
        this.kushkiApiUrl = process.env.KUSHKI_API_URL || 'https://api-uat.kushkipagos.com';
        this.kushkiPrivateKey = process.env.KUSHKI_PRIVATE_KEY || '';
        this.kushkiWebhookSecret = process.env.KUSHKI_WEBHOOK_SECRET || '';
        if (!this.kushkiPrivateKey) {
            console.warn('KUSHKI_PRIVATE_KEY not configured');
        }
    }
    /**
     * Create subscription with Kushki
     */
    createSubscription(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get plan configuration
                const planConfig = this.getPlanConfig(params.planType);
                const requestData = {
                    token: params.token,
                    amount: planConfig.amount,
                    currency: planConfig.currency,
                    planId: planConfig.planId,
                    email: params.userEmail,
                    description: `${planConfig.name} subscription for user ${params.userId}`,
                    metadata: {
                        userId: params.userId,
                        planType: params.planType
                    }
                };
                const response = yield this.makeKushkiRequest('/subscriptions', 'POST', requestData);
                return {
                    subscriptionId: response.data.subscription_id,
                    status: response.data.status,
                    nextPaymentDate: new Date(response.data.next_payment_date),
                    customerId: response.data.customer_id
                };
            }
            catch (error) {
                console.error('Kushki subscription creation failed:', error);
                this.handleKushkiError(error);
                throw error;
            }
        });
    }
    /**
     * Cancel subscription with Kushki
     */
    cancelSubscription(kushkiSubscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.makeKushkiRequest(`/subscriptions/${kushkiSubscriptionId}`, 'DELETE');
                return {
                    cancelled: response.data.cancelled,
                    refundAmount: response.data.refund_amount || 0
                };
            }
            catch (error) {
                console.error('Kushki subscription cancellation failed:', error);
                this.handleKushkiError(error);
                throw error;
            }
        });
    }
    /**
     * Process one-time payment
     */
    processPayment(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requestData = {
                    token: params.token,
                    amount: params.amount,
                    currency: params.currency,
                    description: params.description,
                    metadata: params.metadata
                };
                const response = yield this.makeKushkiRequest('/charges', 'POST', requestData);
                return {
                    transactionId: response.data.transaction_id,
                    status: response.data.status,
                    authCode: response.data.auth_code,
                    responseText: response.data.response_text,
                    responseCode: response.data.response_code
                };
            }
            catch (error) {
                console.error('Kushki payment processing failed:', error);
                this.handleKushkiError(error);
                throw error;
            }
        });
    }
    /**
     * Validate webhook signature
     */
    validateWebhookSignature(payload, signature, secret) {
        try {
            const webhookSecret = secret || this.kushkiWebhookSecret;
            if (!webhookSecret) {
                console.warn('Webhook secret not configured');
                return false;
            }
            // Remove 'sha256=' prefix if present
            const cleanSignature = signature.replace('sha256=', '');
            // Calculate expected signature
            const expectedSignature = crypto_1.default
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');
            // Use timing-safe comparison
            return crypto_1.default.timingSafeEqual(Buffer.from(cleanSignature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        }
        catch (error) {
            console.error('Webhook signature validation failed:', error);
            return false;
        }
    }
    /**
     * Process webhook event
     */
    processWebhookEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Processing webhook event:', {
                    event: event.event,
                    paymentId: event.data.id,
                    subscriptionId: event.data.subscription_id
                });
                switch (event.event) {
                    case 'payment.success':
                        return yield this.handlePaymentSuccess(event);
                    case 'payment.failed':
                        return yield this.handlePaymentFailed(event);
                    case 'subscription.cancelled':
                        return yield this.handleSubscriptionCancelled(event);
                    case 'payment.refunded':
                        return yield this.handlePaymentRefunded(event);
                    default:
                        console.log(`Unhandled webhook event: ${event.event}`);
                        return { processed: false };
                }
            }
            catch (error) {
                console.error('Webhook processing failed:', error);
                return { processed: false, error: error.message };
            }
        });
    }
    /**
     * Retry failed payment
     */
    retryFailedPayment(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield Subscription_1.Subscription.findByPk(subscriptionId);
                if (!subscription) {
                    throw new Error('Subscription not found');
                }
                if (!subscription.canRetry()) {
                    return {
                        willRetry: false,
                        error: 'Maximum retry attempts reached'
                    };
                }
                // Schedule retry (in production, this would use a job queue)
                const retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later
                yield subscription.incrementRetryCount();
                console.log(`Payment retry scheduled for subscription ${subscriptionId} at ${retryAt}`);
                return { willRetry: true, retryAt };
            }
            catch (error) {
                console.error('Failed payment retry failed:', error);
                return { willRetry: false, error: error.message };
            }
        });
    }
    /**
     * Get subscription plans configuration
     */
    getSubscriptionPlans() {
        return [
            {
                id: 'daily',
                name: 'Daily Access',
                price: 2.50,
                currency: 'USD',
                interval: 'day',
                features: ['Live streaming', 'HD quality', 'Chat access']
            },
            {
                id: 'monthly',
                name: 'Monthly Premium',
                price: 10.00,
                currency: 'USD',
                interval: 'month',
                features: ['Live streaming', '720p quality', 'Chat access', 'Ad-free', 'Exclusive content'],
                popular: true
            }
        ];
    }
    // Private methods
    getPlanConfig(planType) {
        const configs = {
            daily: {
                planId: 'daily_2_50',
                name: 'Daily Access',
                amount: 250, // $2.50 in cents
                currency: 'USD'
            },
            monthly: {
                planId: 'monthly_10_00',
                name: 'Monthly Premium',
                amount: 1000, // $10.00 in cents
                currency: 'USD'
            }
        };
        return configs[planType];
    }
    makeKushkiRequest(endpoint, method, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.kushkiApiUrl}/v1${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                'Private-Merchant-Id': this.kushkiPrivateKey
            };
            try {
                const response = yield (0, axios_1.default)({
                    method,
                    url,
                    headers,
                    data,
                    timeout: 30000 // 30 second timeout
                });
                return response.data;
            }
            catch (error) {
                if (error.response) {
                    // Kushki API error
                    throw new Error(error.response.data.message || 'Payment gateway error');
                }
                else if (error.request) {
                    // Network error
                    throw new Error('Payment gateway unavailable');
                }
                else {
                    throw new Error('Payment processing failed');
                }
            }
        });
    }
    handleKushkiError(error) {
        var _a, _b;
        // Log specific Kushki error codes for monitoring
        if ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.code) {
            console.error(`Kushki Error ${error.response.data.code}: ${error.response.data.message}`);
        }
    }
    // Webhook handlers
    handlePaymentSuccess(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check for duplicate processing
                const existingTransaction = yield PaymentTransaction_1.PaymentTransaction.findByKushkiPaymentId(event.data.id);
                if (existingTransaction) {
                    return { processed: true }; // Already processed
                }
                // Find subscription
                const subscription = yield Subscription_1.Subscription.findOne({
                    where: { kushkiSubscriptionId: event.data.subscription_id }
                });
                if (!subscription) {
                    return { processed: false, error: 'Subscription not found' };
                }
                // Create transaction record
                yield PaymentTransaction_1.PaymentTransaction.create({
                    subscriptionId: subscription.id,
                    kushkiPaymentId: event.data.id,
                    type: 'subscription_payment',
                    status: 'completed',
                    amount: event.data.amount,
                    currency: event.data.currency,
                    paymentMethod: 'card',
                    processedAt: new Date(),
                    kushkiResponse: event.data,
                    metadata: event.data.metadata
                });
                // Extend subscription if payment was successful
                const now = new Date();
                const newExpiryDate = subscription.type === 'daily'
                    ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
                    : new Date(now.setMonth(now.getMonth() + 1));
                yield subscription.update({
                    expiresAt: newExpiryDate,
                    status: 'active'
                });
                yield subscription.resetRetryCount();
                return { processed: true };
            }
            catch (error) {
                return { processed: false, error: error.message };
            }
        });
    }
    handlePaymentFailed(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find subscription
                const subscription = yield Subscription_1.Subscription.findOne({
                    where: { kushkiSubscriptionId: event.data.subscription_id }
                });
                if (!subscription) {
                    return { processed: false, error: 'Subscription not found' };
                }
                // Create failed transaction record
                yield PaymentTransaction_1.PaymentTransaction.create({
                    subscriptionId: subscription.id,
                    kushkiPaymentId: event.data.id,
                    type: 'subscription_payment',
                    status: 'failed',
                    amount: event.data.amount,
                    currency: event.data.currency,
                    paymentMethod: 'card',
                    errorCode: event.data.error_code,
                    errorMessage: event.data.error_message,
                    failedAt: new Date(),
                    kushkiResponse: event.data
                });
                // Schedule retry if possible
                if (subscription.canRetry()) {
                    yield this.retryFailedPayment(subscription.id);
                }
                else {
                    // Mark subscription as expired after max retries
                    yield subscription.update({ status: 'expired' });
                }
                return { processed: true };
            }
            catch (error) {
                return { processed: false, error: error.message };
            }
        });
    }
    handleSubscriptionCancelled(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield Subscription_1.Subscription.findOne({
                    where: { kushkiSubscriptionId: event.data.id }
                });
                if (!subscription) {
                    return { processed: false, error: 'Subscription not found' };
                }
                yield subscription.update({
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelReason: 'kushki_cancellation'
                });
                return { processed: true };
            }
            catch (error) {
                return { processed: false, error: error.message };
            }
        });
    }
    handlePaymentRefunded(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find original transaction
                const originalTransaction = yield PaymentTransaction_1.PaymentTransaction.findByKushkiPaymentId(event.data.id // This would be the original payment ID in the refund event
                );
                if (!originalTransaction) {
                    return { processed: false, error: 'Original transaction not found' };
                }
                // Create refund transaction
                yield PaymentTransaction_1.PaymentTransaction.create({
                    subscriptionId: originalTransaction.subscriptionId,
                    kushkiPaymentId: `refund_${event.data.id}`,
                    type: 'refund',
                    status: 'completed',
                    amount: -event.data.amount, // Negative amount for refund
                    currency: event.data.currency,
                    paymentMethod: originalTransaction.paymentMethod,
                    processedAt: new Date(),
                    kushkiResponse: event.data
                });
                return { processed: true };
            }
            catch (error) {
                return { processed: false, error: error.message };
            }
        });
    }
}
exports.PaymentService = PaymentService;
// Create singleton instance
exports.paymentService = new PaymentService();
exports.default = exports.paymentService;
