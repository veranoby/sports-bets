import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import webhookRoutes from '../webhooks';
import { paymentService } from '../../services/paymentService';
import { PaymentTransaction } from '../../models/PaymentTransaction';

// Mock dependencies
jest.mock('../../services/paymentService');
jest.mock('../../models/PaymentTransaction');

const mockedPaymentService = paymentService as jest.Mocked<typeof paymentService>;
const mockedPaymentTransaction = PaymentTransaction as jest.MockedClass<typeof PaymentTransaction>;

describe('Webhook Routes', () => {
  let app: express.Application;
  const webhookSecret = 'test_webhook_secret';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/webhooks', webhookRoutes);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Set environment variable
    process.env.KUSHKI_WEBHOOK_SECRET = webhookSecret;
  });

  afterEach(() => {
    delete process.env.KUSHKI_WEBHOOK_SECRET;
  });

  const createValidSignature = (payload: string): string => {
    return 'sha256=' + crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
  };

  const createValidWebhookPayload = (overrides = {}) => {
    return {
      event: 'payment.success',
      data: {
        id: 'payment_123',
        subscription_id: 'sub_456',
        amount: 1000,
        currency: 'USD',
        status: 'approved',
        created_at: new Date().toISOString()
      },
      timestamp: Math.floor(Date.now() / 1000),
      ...overrides
    };
  };

  describe('POST /api/webhooks/kushki', () => {
    describe('Signature validation', () => {
      it('should reject webhook without signature', async () => {
        const payload = createValidWebhookPayload();

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .send(payload);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Missing webhook signature'
        });
      });

      it('should reject webhook with invalid signature', async () => {
        const payload = createValidWebhookPayload();
        const invalidSignature = 'sha256=invalid_signature';

        mockedPaymentService.validateWebhookSignature.mockReturnValue(false);

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', invalidSignature)
          .send(payload);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid webhook signature'
        });
      });

      it('should accept webhook with valid signature', async () => {
        const payload = createValidWebhookPayload();
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
        mockedPaymentService.processWebhookEvent.mockResolvedValue({ processed: true });

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(200);
        expect(mockedPaymentService.validateWebhookSignature).toHaveBeenCalled();
      });
    });

    describe('Timestamp validation', () => {
      it('should reject webhook with old timestamp', async () => {
        const oldTimestamp = Math.floor((Date.now() - 10 * 60 * 1000) / 1000); // 10 minutes ago
        const payload = createValidWebhookPayload({ timestamp: oldTimestamp });
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);

        const response = await request(app)
          .post('/api/webhooks/kushvi')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Webhook timestamp too old'
        });
      });

      it('should accept webhook with recent timestamp', async () => {
        const recentTimestamp = Math.floor(Date.now() / 1000); // Now
        const payload = createValidWebhookPayload({ timestamp: recentTimestamp });
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
        mockedPaymentService.processWebhookEvent.mockResolvedValue({ processed: true });

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(200);
      });
    });

    describe('Event validation', () => {
      it('should reject webhook with invalid event type', async () => {
        const payload = createValidWebhookPayload({ event: 'invalid.event' });
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid webhook payload'
        });
      });

      it('should accept valid event types', async () => {
        const validEvents = [
          'payment.success',
          'payment.failed',
          'payment.pending',
          'subscription.cancelled',
          'payment.refunded',
          'payment.chargeback'
        ];

        for (const event of validEvents) {
          const payload = createValidWebhookPayload({ event });
          const payloadString = JSON.stringify(payload);
          const validSignature = createValidSignature(payloadString);

          mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
          mockedPaymentService.processWebhookEvent.mockResolvedValue({ processed: true });

          const response = await request(app)
            .post('/api/webhooks/kushki')
            .set('X-Kushki-Signature', validSignature)
            .send(payload);

          expect(response.status).toBe(200);
        }
      });
    });

    describe('Idempotency', () => {
      it('should prevent duplicate webhook processing', async () => {
        const payload = createValidWebhookPayload();
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
        mockedPaymentService.processWebhookEvent.mockResolvedValue({ processed: true });

        // First request
        const response1 = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response1.status).toBe(200);

        // Second request with same payload
        const response2 = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response2.status).toBe(200);
        expect(response2.body).toMatchObject({
          success: true,
          message: 'Webhook already processed'
        });

        // Verify processWebhookEvent was only called once
        expect(mockedPaymentService.processWebhookEvent).toHaveBeenCalledTimes(1);
      });

      it('should check database for existing payment transactions', async () => {
        const payload = createValidWebhookPayload({ event: 'payment.success' });
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        const existingTransaction = {
          id: 'transaction_123',
          status: 'completed',
          kushkiPaymentId: 'payment_123'
        };

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
        mockedPaymentTransaction.findByKushkiPaymentId.mockResolvedValue(existingTransaction as any);

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          message: 'Payment already processed'
        });

        expect(mockedPaymentTransaction.findByKushkiPaymentId).toHaveBeenCalledWith('payment_123');
        expect(mockedPaymentService.processWebhookEvent).not.toHaveBeenCalled();
      });
    });

    describe('Event processing', () => {
      it('should process successful webhook event', async () => {
        const payload = createValidWebhookPayload();
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
        mockedPaymentTransaction.findByKushkiPaymentId.mockResolvedValue(null);
        mockedPaymentService.processWebhookEvent.mockResolvedValue({ processed: true });

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          message: 'Webhook processed successfully',
          eventType: 'payment.success',
          paymentId: 'payment_123'
        });

        expect(mockedPaymentService.processWebhookEvent).toHaveBeenCalledWith(payload);
      });

      it('should handle webhook processing failure', async () => {
        const payload = createValidWebhookPayload();
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
        mockedPaymentTransaction.findByKushkiPaymentId.mockResolvedValue(null);
        mockedPaymentService.processWebhookEvent.mockResolvedValue({ 
          processed: false, 
          error: 'Subscription not found' 
        });

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(422);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Webhook processing failed',
          error: 'Subscription not found',
          eventType: 'payment.success',
          paymentId: 'payment_123'
        });
      });

      it('should handle internal processing errors', async () => {
        const payload = createValidWebhookPayload();
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
        mockedPaymentTransaction.findByKushkiPaymentId.mockResolvedValue(null);
        mockedPaymentService.processWebhookEvent.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Internal webhook processing error',
          eventType: 'payment.success'
        });
      });
    });

    describe('Payload validation', () => {
      it('should reject malformed JSON', async () => {
        const invalidSignature = 'sha256=invalid';
        
        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', invalidSignature)
          .set('Content-Type', 'application/json')
          .send('{ invalid json');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid JSON payload'
        });
      });

      it('should require data object', async () => {
        const payload = { event: 'payment.success', timestamp: Date.now() };
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid webhook payload'
        });
      });

      it('should require payment ID in data', async () => {
        const payload = createValidWebhookPayload();
        delete payload.data.id;
        const payloadString = JSON.stringify(payload);
        const validSignature = createValidSignature(payloadString);

        mockedPaymentService.validateWebhookSignature.mockReturnValue(true);

        const response = await request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: 'Invalid webhook payload'
        });
      });
    });
  });

  describe('GET /api/webhooks/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/webhooks/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          environment: expect.any(String),
          processedWebhooks: expect.any(Number),
          memoryUsage: expect.any(Object)
        })
      });
    });
  });

  describe('POST /api/webhooks/kushki/test (development only)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should generate test webhook event', async () => {
      const testData = {
        event: 'payment.success',
        data: {
          id: 'test_payment',
          amount: 2500,
          currency: 'USD'
        },
        generateSignature: true
      };

      const response = await request(app)
        .post('/api/webhooks/kushki/test')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Test webhook event generated',
        data: expect.objectContaining({
          event: expect.objectContaining({
            event: 'payment.success',
            data: expect.objectContaining({
              id: 'test_payment',
              amount: 2500,
              currency: 'USD'
            }),
            timestamp: expect.any(Number)
          }),
          signature: expect.stringContaining('sha256='),
          usage: expect.any(String)
        })
      });
    });

    it('should generate test event without signature', async () => {
      const testData = {
        event: 'payment.failed',
        data: { id: 'test_failed' }
      };

      const response = await request(app)
        .post('/api/webhooks/kushki/test')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.data.signature).toBe('');
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to webhook endpoint', async () => {
      const payload = createValidWebhookPayload();
      const payloadString = JSON.stringify(payload);
      const validSignature = createValidSignature(payloadString);

      mockedPaymentService.validateWebhookSignature.mockReturnValue(true);
      mockedPaymentService.processWebhookEvent.mockResolvedValue({ processed: true });

      // Make multiple requests quickly
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/webhooks/kushki')
          .set('X-Kushki-Signature', validSignature)
          .send(payload)
      );

      const responses = await Promise.all(requests);
      
      // All should succeed as rate limit is 100 per 5 minutes
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});