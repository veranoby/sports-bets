import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../app';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { PaymentTransaction } from '../models/PaymentTransaction';
import jwt from 'jsonwebtoken';
import * as kushkiService from '../services/paymentService';

// Mock the Kushki service
vi.mock('../services/paymentService', () => ({
  createSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  validateWebhookSignature: vi.fn(),
  processPaymentEvent: vi.fn(),
  retryFailedPayment: vi.fn()
}));

// Mock database models
vi.mock('../models/User');
vi.mock('../models/Subscription');
vi.mock('../models/PaymentTransaction');

describe('Subscription Flow Integration', () => {
  let authToken: string;
  let testUser: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create test user
    testUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      save: vi.fn().mockResolvedValue(true)
    };

    // Mock User.findByPk
    (User.findByPk as any).mockResolvedValue(testUser);

    // Generate test JWT token
    authToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/subscriptions/create', () => {
    it('creates subscription with valid payment token', async () => {
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
      (Subscription.create as any).mockResolvedValue(mockSubscription);

      // Mock Kushki service
      (kushkiService.createSubscription as any).mockResolvedValue({
        subscriptionId: 'kushki_sub_123',
        status: 'active',
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('monthly');
      expect(response.body.data.status).toBe('active');
      expect(kushkiService.createSubscription).toHaveBeenCalledWith({
        token: subscriptionData.paymentToken,
        planType: subscriptionData.planType,
        userId: testUser.id,
        userEmail: testUser.email
      });
    });

    it('rejects invalid payment token', async () => {
      (kushkiService.createSubscription as any).mockRejectedValue(
        new Error('Invalid payment token')
      );

      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'monthly',
          paymentToken: 'invalid_token'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid payment token');
    });

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('prevents creating duplicate active subscriptions', async () => {
      // Mock existing active subscription
      (Subscription.findOne as any).mockResolvedValue({
        id: 'existing_sub',
        status: 'active',
        userId: testUser.id
      });

      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'monthly',
          paymentToken: 'tok_test_123'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('active subscription');
    });

    it('handles Kushki API errors', async () => {
      (kushkiService.createSubscription as any).mockRejectedValue(
        new Error('Payment gateway error')
      );

      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'monthly',
          paymentToken: 'tok_test_123'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Payment gateway error');
    });
  });

  describe('POST /api/subscriptions/cancel', () => {
    it('cancels active subscription', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        userId: testUser.id,
        status: 'active',
        kushkiSubscriptionId: 'kushki_sub_123',
        update: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true)
      };

      (Subscription.findOne as any).mockResolvedValue(mockSubscription);
      (kushkiService.cancelSubscription as any).mockResolvedValue({
        cancelled: true,
        refundAmount: 0
      });

      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'User requested' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockSubscription.update).toHaveBeenCalledWith({
        status: 'cancelled',
        cancelledAt: expect.any(Date),
        cancelReason: 'User requested'
      });
    });

    it('fails when no active subscription exists', async () => {
      (Subscription.findOne as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'User requested' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No active subscription');
    });
  });

  describe('GET /api/subscriptions/current', () => {
    it('returns current active subscription', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        userId: testUser.id,
        type: 'monthly',
        status: 'active',
        expiresAt: new Date(),
        createdAt: new Date(),
        features: ['streaming', 'hd_quality']
      };

      (Subscription.findOne as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('monthly');
      expect(response.body.data.status).toBe('active');
    });

    it('returns null when no active subscription', async () => {
      (Subscription.findOne as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe(null);
    });
  });

  describe('GET /api/subscriptions/history', () => {
    it('returns user payment history', async () => {
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

      (PaymentTransaction.findAll as any).mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/subscriptions/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].amount).toBe(1000);
    });

    it('supports pagination', async () => {
      const mockTransactions = Array.from({ length: 5 }, (_, i) => ({
        id: `txn_${i}`,
        amount: 1000,
        status: 'completed',
        createdAt: new Date()
      }));

      (PaymentTransaction.findAll as any).mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/subscriptions/history?limit=2&offset=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(PaymentTransaction.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 2,
          offset: 2
        })
      );
    });
  });

  describe('POST /api/subscriptions/check-access', () => {
    it('returns true for active subscription', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        features: ['streaming', 'hd_quality']
      };

      (Subscription.findOne as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/subscriptions/check-access')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ feature: 'streaming' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasAccess).toBe(true);
    });

    it('returns false for expired subscription', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        status: 'active',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        features: ['streaming']
      };

      (Subscription.findOne as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/subscriptions/check-access')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ feature: 'streaming' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasAccess).toBe(false);
    });

    it('returns false when no subscription exists', async () => {
      (Subscription.findOne as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/subscriptions/check-access')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ feature: 'streaming' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasAccess).toBe(false);
    });
  });

  describe('Authentication Requirements', () => {
    it('requires authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/subscriptions/create' },
        { method: 'post', path: '/api/subscriptions/cancel' },
        { method: 'get', path: '/api/subscriptions/current' },
        { method: 'get', path: '/api/subscriptions/history' },
        { method: 'post', path: '/api/subscriptions/check-access' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
      }
    });

    it('rejects invalid tokens', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('enforces rate limits on subscription creation', async () => {
      // Mock multiple rapid requests
      const requests = Array.from({ length: 6 }, () =>
        request(app)
          .post('/api/subscriptions/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            planType: 'monthly',
            paymentToken: 'tok_test_123'
          })
      );

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      (Subscription.findOne as any).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('validates request body schema', async () => {
      const response = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'invalid_plan',
          paymentToken: '' // Empty token
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});