import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { app } from '../app';
import { Subscription } from '../models/Subscription';
import { PaymentTransaction } from '../models/PaymentTransaction';
import crypto from 'crypto';
import * as paymentService from '../services/paymentService';

// Mock the payment service
vi.mock('../services/paymentService', () => ({
  validateWebhookSignature: vi.fn(),
  processPaymentEvent: vi.fn(),
  retryFailedPayment: vi.fn(),
  handleSubscriptionEvent: vi.fn()
}));

// Mock database models
vi.mock('../models/Subscription');
vi.mock('../models/PaymentTransaction');

describe('Kushki Webhook Handler', () => {
  const webhookSecret = 'test_webhook_secret';
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.KUSHKI_WEBHOOK_SECRET = webhookSecret;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createWebhookPayload = (eventData: any) => {
    const payload = JSON.stringify(eventData);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    return { payload, signature: `sha256=${signature}` };
  };

  describe('POST /api/webhooks/kushki', () => {
    it('processes successful payment webhook', async () => {
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
      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      // Mock subscription lookup
      const mockSubscription = {
        id: 'sub_local_123',
        userId: '1',
        kushkiSubscriptionId: 'sub_kushki_123',
        status: 'active',
        update: vi.fn().mockResolvedValue(true)
      };
      (Subscription.findOne as any).mockResolvedValue(mockSubscription);

      // Mock transaction creation
      (PaymentTransaction.create as any).mockResolvedValue({
        id: 'txn_123',
        subscriptionId: mockSubscription.id,
        kushkiPaymentId: eventData.data.id,
        amount: eventData.data.amount,
        status: 'completed'
      });

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(paymentService.validateWebhookSignature).toHaveBeenCalledWith(
        payload,
        signature,
        webhookSecret
      );
      expect(PaymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kushkiPaymentId: eventData.data.id,
          amount: eventData.data.amount,
          status: 'completed'
        })
      );
    });

    it('processes failed payment webhook', async () => {
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

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      const mockSubscription = {
        id: 'sub_local_123',
        userId: '1',
        kushkiSubscriptionId: 'sub_kushki_123',
        status: 'active',
        retryCount: 0,
        update: vi.fn().mockResolvedValue(true)
      };
      (Subscription.findOne as any).mockResolvedValue(mockSubscription);

      (PaymentTransaction.create as any).mockResolvedValue({
        id: 'txn_456',
        status: 'failed',
        errorCode: 'insufficient_funds'
      });

      (paymentService.retryFailedPayment as any).mockResolvedValue({
        willRetry: true,
        retryAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(PaymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          errorCode: 'insufficient_funds',
          errorMessage: 'Insufficient funds'
        })
      );
      expect(paymentService.retryFailedPayment).toHaveBeenCalled();
    });

    it('processes subscription cancelled webhook', async () => {
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

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      const mockSubscription = {
        id: 'sub_local_123',
        userId: '1',
        kushkiSubscriptionId: 'sub_kushki_123',
        status: 'active',
        update: vi.fn().mockResolvedValue(true)
      };
      (Subscription.findOne as any).mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(mockSubscription.update).toHaveBeenCalledWith({
        status: 'cancelled',
        cancelledAt: expect.any(Date),
        cancelReason: 'customer_request'
      });
    });

    it('rejects webhook with invalid signature', async () => {
      const eventData = {
        event: 'payment.success',
        data: { id: 'payment_123' }
      };

      (paymentService.validateWebhookSignature as any).mockReturnValue(false);

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', 'invalid_signature')
        .send(eventData)
        .expect(401);

      expect(response.body.error).toBe('Invalid webhook signature');
    });

    it('rejects webhook without signature header', async () => {
      const eventData = {
        event: 'payment.success',
        data: { id: 'payment_123' }
      };

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .send(eventData)
        .expect(401);

      expect(response.body.error).toBe('Missing webhook signature');
    });

    it('handles unknown event types gracefully', async () => {
      const eventData = {
        event: 'unknown.event',
        data: { id: 'unknown_123' }
      };

      const { payload, signature } = createWebhookPayload(eventData);

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(response.body.processed).toBe(false);
    });

    it('implements idempotency for duplicate webhooks', async () => {
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

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      // Mock existing transaction (duplicate)
      (PaymentTransaction.findOne as any).mockResolvedValue({
        id: 'existing_txn',
        kushkiPaymentId: 'payment_duplicate',
        status: 'completed'
      });

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(response.body.duplicate).toBe(true);

      // Should not create duplicate transaction
      expect(PaymentTransaction.create).not.toHaveBeenCalled();
    });

    it('handles subscription not found gracefully', async () => {
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

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);
      (Subscription.findOne as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(response.body.error).toContain('Subscription not found');
    });

    it('processes refund webhook', async () => {
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

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      // Mock original transaction
      const mockTransaction = {
        id: 'txn_123',
        kushkiPaymentId: 'payment_123',
        subscriptionId: 'sub_local_123',
        amount: 1000,
        status: 'completed',
        update: vi.fn().mockResolvedValue(true)
      };
      (PaymentTransaction.findOne as any).mockResolvedValue(mockTransaction);

      (PaymentTransaction.create as any).mockResolvedValue({
        id: 'refund_txn_123',
        type: 'refund',
        amount: -1000,
        status: 'completed'
      });

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(200);

      expect(response.body.received).toBe(true);
      expect(PaymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'refund',
          amount: -1000,
          status: 'completed'
        })
      );
    });

    it('handles malformed webhook data', async () => {
      const malformedData = {
        event: 'payment.success',
        // Missing required data fields
      };

      const { payload, signature } = createWebhookPayload(malformedData);

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(malformedData)
        .expect(400);

      expect(response.body.error).toContain('Invalid webhook data');
    });

    it('logs webhook events for audit trail', async () => {
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

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Webhook received'),
        expect.objectContaining({
          event: 'payment.success',
          paymentId: 'payment_audit'
        })
      );

      consoleSpy.mockRestore();
    });

    it('handles database errors during webhook processing', async () => {
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

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);
      (Subscription.findOne as any).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(500);

      expect(response.body.error).toContain('Internal server error');
    });

    it('validates webhook timestamp to prevent replay attacks', async () => {
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

      (paymentService.validateWebhookSignature as any).mockReturnValue(true);

      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('X-Kushki-Signature', signature)
        .send(eventData)
        .expect(400);

      expect(response.body.error).toContain('Webhook timestamp too old');
    });
  });

  describe('Webhook Security', () => {
    it('rate limits webhook endpoints', async () => {
      const eventData = {
        event: 'payment.success',
        data: { id: 'rate_limit_test' }
      };

      const { payload, signature } = createWebhookPayload(eventData);

      // Send multiple rapid requests
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', signature)
          .send(eventData)
      );

      const responses = await Promise.all(requests);
      
      // Should have some rate limited responses
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('validates content type', async () => {
      const response = await request(app)
        .post('/api/webhooks/kushki')
        .set('Content-Type', 'text/plain')
        .set('X-Kushki-Signature', 'sig')
        .send('invalid data')
        .expect(415);

      expect(response.body.error).toContain('Content-Type must be application/json');
    });
  });
});