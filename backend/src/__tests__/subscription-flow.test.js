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
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const PaymentTransaction_1 = require("../models/PaymentTransaction");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const kushkiService = __importStar(require("../services/paymentService"));
// Mock the Kushki service
vitest_1.vi.mock('../services/paymentService', () => ({
    createSubscription: vitest_1.vi.fn(),
    cancelSubscription: vitest_1.vi.fn(),
    validateWebhookSignature: vitest_1.vi.fn(),
    processPaymentEvent: vitest_1.vi.fn(),
    retryFailedPayment: vitest_1.vi.fn()
}));
// Mock database models
vitest_1.vi.mock('../models/User');
vitest_1.vi.mock('../models/Subscription');
vitest_1.vi.mock('../models/PaymentTransaction');
(0, vitest_1.describe)('Subscription Flow Integration', () => {
    let authToken;
    let testUser;
    (0, vitest_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        vitest_1.vi.clearAllMocks();
        // Create test user
        testUser = {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            role: 'user',
            save: vitest_1.vi.fn().mockResolvedValue(true)
        };
        // Mock User.findByPk
        User_1.User.findByPk.mockResolvedValue(testUser);
        // Generate test JWT token
        authToken = jsonwebtoken_1.default.sign({ userId: testUser.id, role: testUser.role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    }));
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('POST /api/subscriptions/create', () => {
        (0, vitest_1.it)('creates subscription with valid payment token', () => __awaiter(void 0, void 0, void 0, function* () {
            const subscriptionData = {
                planType: 'monthly',
                paymentToken: 'tok_test_123456',
                autoRenew: true
            };
            const mockSubscription = {
                id: 'sub_test_123',
                userId: testUser.id,
                type: 'monthly',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                paymentMethod: 'card',
                autoRenew: true,
                kushkiSubscriptionId: 'kushki_sub_123'
            };
            // Mock Subscription.create
            Subscription_1.Subscription.create.mockResolvedValue(mockSubscription);
            // Mock Kushki service
            kushkiService.createSubscription.mockResolvedValue({
                subscriptionId: 'kushki_sub_123',
                status: 'active',
                nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(subscriptionData)
                .expect(201);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.type).toBe('monthly');
            (0, vitest_1.expect)(response.body.data.status).toBe('active');
            (0, vitest_1.expect)(kushkiService.createSubscription).toHaveBeenCalledWith({
                token: subscriptionData.paymentToken,
                planType: subscriptionData.planType,
                userId: testUser.id,
                userEmail: testUser.email
            });
        }));
        (0, vitest_1.it)('rejects invalid payment token', () => __awaiter(void 0, void 0, void 0, function* () {
            kushkiService.createSubscription.mockRejectedValue(new Error('Invalid payment token'));
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                planType: 'monthly',
                paymentToken: 'invalid_token'
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toContain('Invalid payment token');
        }));
        (0, vitest_1.it)('validates required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.errors).toBeDefined();
        }));
        (0, vitest_1.it)('prevents creating duplicate active subscriptions', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock existing active subscription
            Subscription_1.Subscription.findOne.mockResolvedValue({
                id: 'existing_sub',
                status: 'active',
                userId: testUser.id
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                planType: 'monthly',
                paymentToken: 'tok_test_123'
            })
                .expect(409);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toContain('active subscription');
        }));
        (0, vitest_1.it)('handles Kushki API errors', () => __awaiter(void 0, void 0, void 0, function* () {
            kushkiService.createSubscription.mockRejectedValue(new Error('Payment gateway error'));
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                planType: 'monthly',
                paymentToken: 'tok_test_123'
            })
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toContain('Payment gateway error');
        }));
    });
    (0, vitest_1.describe)('POST /api/subscriptions/cancel', () => {
        (0, vitest_1.it)('cancels active subscription', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSubscription = {
                id: 'sub_test_123',
                userId: testUser.id,
                status: 'active',
                kushkiSubscriptionId: 'kushki_sub_123',
                update: vitest_1.vi.fn().mockResolvedValue(true),
                save: vitest_1.vi.fn().mockResolvedValue(true)
            };
            Subscription_1.Subscription.findOne.mockResolvedValue(mockSubscription);
            kushkiService.cancelSubscription.mockResolvedValue({
                cancelled: true,
                refundAmount: 0
            });
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/cancel')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ reason: 'User requested' })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(mockSubscription.update).toHaveBeenCalledWith({
                status: 'cancelled',
                cancelledAt: vitest_1.expect.any(Date),
                cancelReason: 'User requested'
            });
        }));
        (0, vitest_1.it)('fails when no active subscription exists', () => __awaiter(void 0, void 0, void 0, function* () {
            Subscription_1.Subscription.findOne.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/cancel')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ reason: 'User requested' })
                .expect(404);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toContain('No active subscription');
        }));
    });
    (0, vitest_1.describe)('GET /api/subscriptions/current', () => {
        (0, vitest_1.it)('returns current active subscription', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSubscription = {
                id: 'sub_test_123',
                userId: testUser.id,
                type: 'monthly',
                status: 'active',
                expiresAt: new Date(),
                createdAt: new Date(),
                features: ['streaming', 'hd_quality']
            };
            Subscription_1.Subscription.findOne.mockResolvedValue(mockSubscription);
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/api/subscriptions/current')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.type).toBe('monthly');
            (0, vitest_1.expect)(response.body.data.status).toBe('active');
        }));
        (0, vitest_1.it)('returns null when no active subscription', () => __awaiter(void 0, void 0, void 0, function* () {
            Subscription_1.Subscription.findOne.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/api/subscriptions/current')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toBe(null);
        }));
    });
    (0, vitest_1.describe)('GET /api/subscriptions/history', () => {
        (0, vitest_1.it)('returns user payment history', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransactions = [
                {
                    id: 'txn_1',
                    subscriptionId: 'sub_1',
                    amount: 1000, // $10.00 in cents
                    currency: 'USD',
                    status: 'completed',
                    createdAt: new Date(),
                    type: 'subscription_payment'
                },
                {
                    id: 'txn_2',
                    subscriptionId: 'sub_1',
                    amount: 1000,
                    currency: 'USD',
                    status: 'completed',
                    createdAt: new Date(),
                    type: 'subscription_payment'
                }
            ];
            PaymentTransaction_1.PaymentTransaction.findAll.mockResolvedValue(mockTransactions);
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/api/subscriptions/history')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toHaveLength(2);
            (0, vitest_1.expect)(response.body.data[0].amount).toBe(1000);
        }));
        (0, vitest_1.it)('supports pagination', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockTransactions = Array.from({ length: 5 }, (_, i) => ({
                id: `txn_${i}`,
                amount: 1000,
                status: 'completed',
                createdAt: new Date()
            }));
            PaymentTransaction_1.PaymentTransaction.findAll.mockResolvedValue(mockTransactions);
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/api/subscriptions/history?limit=2&offset=2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(PaymentTransaction_1.PaymentTransaction.findAll).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                limit: 2,
                offset: 2
            }));
        }));
    });
    (0, vitest_1.describe)('POST /api/subscriptions/check-access', () => {
        (0, vitest_1.it)('returns true for active subscription', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSubscription = {
                id: 'sub_test_123',
                status: 'active',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                features: ['streaming', 'hd_quality']
            };
            Subscription_1.Subscription.findOne.mockResolvedValue(mockSubscription);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/check-access')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ feature: 'streaming' })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.hasAccess).toBe(true);
        }));
        (0, vitest_1.it)('returns false for expired subscription', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockSubscription = {
                id: 'sub_test_123',
                status: 'active',
                expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                features: ['streaming']
            };
            Subscription_1.Subscription.findOne.mockResolvedValue(mockSubscription);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/check-access')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ feature: 'streaming' })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.hasAccess).toBe(false);
        }));
        (0, vitest_1.it)('returns false when no subscription exists', () => __awaiter(void 0, void 0, void 0, function* () {
            Subscription_1.Subscription.findOne.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/check-access')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ feature: 'streaming' })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.hasAccess).toBe(false);
        }));
    });
    (0, vitest_1.describe)('Authentication Requirements', () => {
        (0, vitest_1.it)('requires authentication for all endpoints', () => __awaiter(void 0, void 0, void 0, function* () {
            const endpoints = [
                { method: 'post', path: '/api/subscriptions/create' },
                { method: 'post', path: '/api/subscriptions/cancel' },
                { method: 'get', path: '/api/subscriptions/current' },
                { method: 'get', path: '/api/subscriptions/history' },
                { method: 'post', path: '/api/subscriptions/check-access' }
            ];
            for (const endpoint of endpoints) {
                const response = yield (0, supertest_1.default)(app_1.app)[endpoint.method](endpoint.path);
                (0, vitest_1.expect)(response.status).toBe(401);
            }
        }));
        (0, vitest_1.it)('rejects invalid tokens', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/api/subscriptions/current')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
    });
    (0, vitest_1.describe)('Rate Limiting', () => {
        (0, vitest_1.it)('enforces rate limits on subscription creation', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock multiple rapid requests
            const requests = Array.from({ length: 6 }, () => (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                planType: 'monthly',
                paymentToken: 'tok_test_123'
            }));
            const responses = yield Promise.all(requests);
            // At least one should be rate limited (429)
            const rateLimited = responses.filter(r => r.status === 429);
            (0, vitest_1.expect)(rateLimited.length).toBeGreaterThan(0);
        }));
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('handles database errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            Subscription_1.Subscription.findOne.mockRejectedValue(new Error('Database connection failed'));
            const response = yield (0, supertest_1.default)(app_1.app)
                .get('/api/subscriptions/current')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(500);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.message).toBeDefined();
        }));
        (0, vitest_1.it)('validates request body schema', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.app)
                .post('/api/subscriptions/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                planType: 'invalid_plan',
                paymentToken: '' // Empty token
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.errors).toBeDefined();
        }));
    });
});
