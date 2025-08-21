"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const app_1 = require("../app");
const Subscription_1 = require("../models/Subscription");
const PaymentTransaction_1 = require("../models/PaymentTransaction");
const crypto_1 = __importDefault(require("crypto"));
const paymentService = __importStar(require("../services/paymentService"));
// Mock the payment service
vitest_1.vi.mock('../services/paymentService', () => ({
    validateWebhookSignature: vitest_1.vi.fn(),
    processPaymentEvent: vitest_1.vi.fn(),
    retryFailedPayment: vitest_1.vi.fn(),
    handleSubscriptionEvent: vitest_1.vi.fn()
}));
// Mock database models
vitest_1.vi.mock('../models/Subscription');
vitest_1.vi.mock('../models/PaymentTransaction');
(0, vitest_1.describe)('Kushki Webhook Handler', () => {
    const webhookSecret = 'test_webhook_secret';
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        process.env.KUSHKI_WEBHOOK_SECRET = webhookSecret;
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    const createWebhookPayload = (eventData) => {
        const payload = JSON.stringify(eventData);
        const signature = crypto_1.default
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');
        return { payload, signature: `sha256=${signature}` };
    };
    (0, vitest_1.describe)('POST /api/webhooks/kushki', () => {
        (0, vitest_1.it)('processes successful payment webhook', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.success',
                data: {
                    id: 'payment_123',
                    subscription_id: 'sub_kushki_123',
                    amount: 1000, // $10.00 in cents
                    currency: 'USD',
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    metadata: {
                        user_id: '1',
                        plan_type: 'monthly'
                    }
                }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            // Mock signature validation
            paymentService.validateWebhookSignature.mockReturnValue(true);
            // Mock subscription lookup
            const mockSubscription = {
                id: 'sub_local_123',
                userId: '1',
                kushkiSubscriptionId: 'sub_kushki_123',
                status: 'active',
                update: vitest_1.vi.fn().mockResolvedValue(true)
            };
            Subscription_1.Subscription.findOne.mockResolvedValue(mockSubscription);
            // Mock transaction creation
            PaymentTransaction_1.PaymentTransaction.create.mockResolvedValue({
                id: 'txn_123',
                subscriptionId: mockSubscription.id,
                kushkiPaymentId: eventData.data.id,
                amount: eventData.data.amount,
                status: 'completed'
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(200);
            (0, vitest_1.expect)(response.body.received).toBe(true);
            (0, vitest_1.expect)(paymentService.validateWebhookSignature).toHaveBeenCalledWith(payload, signature, webhookSecret);
            (0, vitest_1.expect)(PaymentTransaction_1.PaymentTransaction.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                kushkiPaymentId: eventData.data.id,
                amount: eventData.data.amount,
                status: 'completed'
            }));
        }));
        (0, vitest_1.it)('processes failed payment webhook', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.failed',
                data: {
                    id: 'payment_456',
                    subscription_id: 'sub_kushki_123',
                    amount: 1000,
                    currency: 'USD',
                    status: 'failed',
                    error_code: 'insufficient_funds',
                    error_message: 'Insufficient funds',
                    created_at: new Date().toISOString(),
                    metadata: {
                        user_id: '1',
                        plan_type: 'monthly'
                    }
                }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            const mockSubscription = {
                id: 'sub_local_123',
                userId: '1',
                kushkiSubscriptionId: 'sub_kushki_123',
                status: 'active',
                retryCount: 0,
                update: vitest_1.vi.fn().mockResolvedValue(true)
            };
            Subscription_1.Subscription.findOne.mockResolvedValue(mockSubscription);
            PaymentTransaction_1.PaymentTransaction.create.mockResolvedValue({
                id: 'txn_456',
                status: 'failed',
                errorCode: 'insufficient_funds'
            });
            paymentService.retryFailedPayment.mockResolvedValue({
                willRetry: true,
                retryAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(200);
            (0, vitest_1.expect)(response.body.received).toBe(true);
            (0, vitest_1.expect)(PaymentTransaction_1.PaymentTransaction.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                status: 'failed',
                errorCode: 'insufficient_funds',
                errorMessage: 'Insufficient funds'
            }));
            (0, vitest_1.expect)(paymentService.retryFailedPayment).toHaveBeenCalled();
        }));
        (0, vitest_1.it)('processes subscription cancelled webhook', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'subscription.cancelled',
                data: {
                    id: 'sub_kushki_123',
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    cancellation_reason: 'customer_request',
                    metadata: {
                        user_id: '1'
                    }
                }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            const mockSubscription = {
                id: 'sub_local_123',
                userId: '1',
                kushkiSubscriptionId: 'sub_kushki_123',
                status: 'active',
                update: vitest_1.vi.fn().mockResolvedValue(true)
            };
            Subscription_1.Subscription.findOne.mockResolvedValue(mockSubscription);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(200);
            (0, vitest_1.expect)(response.body.received).toBe(true);
            (0, vitest_1.expect)(mockSubscription.update).toHaveBeenCalledWith({
                status: 'cancelled',
                cancelledAt: vitest_1.expect.any(Date),
                cancelReason: 'customer_request'
            });
        }));
        (0, vitest_1.it)('rejects webhook with invalid signature', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.success',
                data: { id: 'payment_123' }
            };
            paymentService.validateWebhookSignature.mockReturnValue(false);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', 'invalid_signature')
                .send(eventData)
                .expect(401);
            (0, vitest_1.expect)(response.body.error).toBe('Invalid webhook signature');
        }));
        (0, vitest_1.it)('rejects webhook without signature header', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.success',
                data: { id: 'payment_123' }
            };
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .send(eventData)
                .expect(401);
            (0, vitest_1.expect)(response.body.error).toBe('Missing webhook signature');
        }));
        (0, vitest_1.it)('handles unknown event types gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'unknown.event',
                data: { id: 'unknown_123' }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(200);
            (0, vitest_1.expect)(response.body.received).toBe(true);
            (0, vitest_1.expect)(response.body.processed).toBe(false);
        }));
        (0, vitest_1.it)('implements idempotency for duplicate webhooks', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.success',
                data: {
                    id: 'payment_duplicate',
                    subscription_id: 'sub_kushki_123',
                    amount: 1000,
                    status: 'completed',
                    created_at: new Date().toISOString()
                }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            // Mock existing transaction (duplicate)
            PaymentTransaction_1.PaymentTransaction.findOne.mockResolvedValue({
                id: 'existing_txn',
                kushkiPaymentId: 'payment_duplicate',
                status: 'completed'
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(200);
            (0, vitest_1.expect)(response.body.received).toBe(true);
            (0, vitest_1.expect)(response.body.duplicate).toBe(true);
            // Should not create duplicate transaction
            (0, vitest_1.expect)(PaymentTransaction_1.PaymentTransaction.create).not.toHaveBeenCalled();
        }));
        (0, vitest_1.it)('handles subscription not found gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.success',
                data: {
                    id: 'payment_orphaned',
                    subscription_id: 'sub_nonexistent',
                    amount: 1000,
                    status: 'completed',
                    created_at: new Date().toISOString()
                }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            Subscription_1.Subscription.findOne.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(200);
            (0, vitest_1.expect)(response.body.received).toBe(true);
            (0, vitest_1.expect)(response.body.error).toContain('Subscription not found');
        }));
        (0, vitest_1.it)('processes refund webhook', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.refunded',
                data: {
                    id: 'refund_123',
                    original_payment_id: 'payment_123',
                    amount: 1000,
                    currency: 'USD',
                    status: 'completed',
                    reason: 'customer_request',
                    created_at: new Date().toISOString()
                }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            // Mock original transaction
            const mockTransaction = {
                id: 'txn_123',
                kushkiPaymentId: 'payment_123',
                subscriptionId: 'sub_local_123',
                amount: 1000,
                status: 'completed',
                update: vitest_1.vi.fn().mockResolvedValue(true)
            };
            PaymentTransaction_1.PaymentTransaction.findOne.mockResolvedValue(mockTransaction);
            PaymentTransaction_1.PaymentTransaction.create.mockResolvedValue({
                id: 'refund_txn_123',
                type: 'refund',
                amount: -1000,
                status: 'completed'
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(200);
            (0, vitest_1.expect)(response.body.received).toBe(true);
            (0, vitest_1.expect)(PaymentTransaction_1.PaymentTransaction.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'refund',
                amount: -1000,
                status: 'completed'
            }));
        }));
        (0, vitest_1.it)('handles malformed webhook data', () => __awaiter(void 0, void 0, void 0, function* () {
            const malformedData = {
                event: 'payment.success',
                // Missing required data fields
            };
            const { payload, signature } = createWebhookPayload(malformedData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(malformedData)
                .expect(400);
            (0, vitest_1.expect)(response.body.error).toContain('Invalid webhook data');
        }));
        (0, vitest_1.it)('logs webhook events for audit trail', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.success',
                data: {
                    id: 'payment_audit',
                    subscription_id: 'sub_kushki_123',
                    amount: 1000,
                    status: 'completed',
                    created_at: new Date().toISOString()
                }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            const consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
            yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(200);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Webhook received'), vitest_1.expect.objectContaining({
                event: 'payment.success',
                paymentId: 'payment_audit'
            }));
            consoleSpy.mockRestore();
        }));
        (0, vitest_1.it)('handles database errors during webhook processing', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.success',
                data: {
                    id: 'payment_db_error',
                    subscription_id: 'sub_kushki_123',
                    amount: 1000,
                    status: 'completed',
                    created_at: new Date().toISOString()
                }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            Subscription_1.Subscription.findOne.mockRejectedValue(new Error('Database connection failed'));
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(500);
            (0, vitest_1.expect)(response.body.error).toContain('Internal server error');
        }));
        (0, vitest_1.it)('validates webhook timestamp to prevent replay attacks', () => __awaiter(void 0, void 0, void 0, function* () {
            const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
            const eventData = {
                event: 'payment.success',
                data: {
                    id: 'payment_old',
                    created_at: oldTimestamp
                },
                timestamp: Math.floor(Date.now() / 1000) - 600 // 10 minutes ago
            };
            const { payload, signature } = createWebhookPayload(eventData);
            paymentService.validateWebhookSignature.mockReturnValue(true);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData)
                .expect(400);
            (0, vitest_1.expect)(response.body.error).toContain('Webhook timestamp too old');
        }));
    });
    (0, vitest_1.describe)('Webhook Security', () => {
        (0, vitest_1.it)('rate limits webhook endpoints', () => __awaiter(void 0, void 0, void 0, function* () {
            const eventData = {
                event: 'payment.success',
                data: { id: 'rate_limit_test' }
            };
            const { payload, signature } = createWebhookPayload(eventData);
            // Send multiple rapid requests
            const requests = Array.from({ length: 20 }, () => (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('X-Kushki-Signature', signature)
                .send(eventData));
            const responses = yield Promise.all(requests);
            // Should have some rate limited responses
            const rateLimited = responses.filter(r => r.status === 429);
            (0, vitest_1.expect)(rateLimited.length).toBeGreaterThan(0);
        }));
        (0, vitest_1.it)('validates content type', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/webhooks/kushki')
                .set('Content-Type', 'text/plain')
                .set('X-Kushki-Signature', 'sig')
                .send('invalid data')
                .expect(415);
            (0, vitest_1.expect)(response.body.error).toContain('Content-Type must be application/json');
        }));
    });
});
