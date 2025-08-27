import express, { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { paymentService } from '../services/paymentService';
import { PaymentTransaction } from '../models/PaymentTransaction';

const router = Router();

// Rate limiting for webhook endpoints
const webhookRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Allow higher rate for webhooks
  message: {
    success: false,
    message: 'Too many webhook requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP and webhook signature for rate limiting with IPv6 support
    const signature = req.headers['x-kushki-signature'] as string;
    const ipKey = ipKeyGenerator(req.ip);
    return signature ? `webhook_sig_${signature.substring(0, 10)}` : `webhook_ip_${ipKey}`;
  }
});

// Store processed webhook IDs to prevent duplicate processing
const processedWebhooks = new Set<string>();

// Clean up old processed webhook IDs every hour
setInterval(() => {
  processedWebhooks.clear();
}, 60 * 60 * 1000);

/**
 * POST /api/webhooks/kushki
 * Handle Kushki payment webhook events
 */
router.post(
  '/kushki',
  webhookRateLimit,
  // Skip Express JSON parsing for webhooks to preserve raw body
  express.raw({ type: 'application/json' }),
  // Custom middleware to parse JSON and preserve raw body
  (req: Request, res: Response, next: Function) => {
    try {
      (req as any).rawBody = req.body.toString();
      req.body = JSON.parse(req.body.toString());
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON payload'
      });
    }
  },
  [
    body('event')
      .isString()
      .isIn([
        'payment.success',
        'payment.failed', 
        'payment.pending',
        'subscription.cancelled',
        'payment.refunded',
        'payment.chargeback'
      ])
      .withMessage('Invalid webhook event type'),
    body('data')
      .isObject()
      .withMessage('Data object is required'),
    body('data.id')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Payment ID is required'),
    body('timestamp')
      .isNumeric()
      .withMessage('Timestamp is required')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload',
        errors: validationErrors.array()
      });
    }

    const signature = req.headers['x-kushki-signature'] as string;
    const rawBody = (req as any).rawBody;
    const webhookEvent = req.body;

    try {
      // 1. Validate webhook signature
      if (!signature) {
        console.warn('Webhook received without signature');
        return res.status(401).json({
          success: false,
          message: 'Missing webhook signature'
        });
      }

      const isValidSignature = paymentService.validateWebhookSignature(
        rawBody,
        signature
      );

      if (!isValidSignature) {
        console.error('Invalid webhook signature:', {
          event: webhookEvent.event,
          paymentId: webhookEvent.data.id,
          receivedSignature: signature.substring(0, 10) + '...'
        });
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // 2. Check timestamp to prevent replay attacks (5 minute window)
      const webhookTimestamp = webhookEvent.timestamp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeDiff = Math.abs(now - webhookTimestamp);
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (timeDiff > maxAge) {
        console.warn('Webhook timestamp too old:', {
          event: webhookEvent.event,
          paymentId: webhookEvent.data.id,
          timestamp: webhookTimestamp,
          age: timeDiff
        });
        return res.status(400).json({
          success: false,
          message: 'Webhook timestamp too old'
        });
      }

      // 3. Idempotency check using event ID + payment ID
      const idempotencyKey = `${webhookEvent.event}_${webhookEvent.data.id}_${webhookEvent.timestamp}`;
      
      if (processedWebhooks.has(idempotencyKey)) {
        console.log('Duplicate webhook ignored:', {
          event: webhookEvent.event,
          paymentId: webhookEvent.data.id,
          idempotencyKey
        });
        return res.status(200).json({
          success: true,
          message: 'Webhook already processed'
        });
      }

      // 4. Additional duplicate check in database for payment events
      if (webhookEvent.event.startsWith('payment.') && webhookEvent.data.id) {
        const existingTransaction = await PaymentTransaction.findByKushkiPaymentId(
          webhookEvent.data.id
        );
        
        if (existingTransaction && 
            (webhookEvent.event === 'payment.success' && existingTransaction.status === 'completed') ||
            (webhookEvent.event === 'payment.failed' && existingTransaction.status === 'failed')) {
          console.log('Payment already processed in database:', {
            event: webhookEvent.event,
            paymentId: webhookEvent.data.id,
            existingStatus: existingTransaction.status
          });
          return res.status(200).json({
            success: true,
            message: 'Payment already processed'
          });
        }
      }

      // 5. Process the webhook event
      console.log('Processing webhook event:', {
        event: webhookEvent.event,
        paymentId: webhookEvent.data.id,
        subscriptionId: webhookEvent.data.subscription_id,
        amount: webhookEvent.data.amount,
        currency: webhookEvent.data.currency
      });

      const result = await paymentService.processWebhookEvent(webhookEvent);

      if (result.processed) {
        // Mark as processed to prevent duplicates
        processedWebhooks.add(idempotencyKey);
        
        console.log('Webhook processed successfully:', {
          event: webhookEvent.event,
          paymentId: webhookEvent.data.id,
          result
        });

        return res.status(200).json({
          success: true,
          message: 'Webhook processed successfully',
          eventType: webhookEvent.event,
          paymentId: webhookEvent.data.id
        });
      } else {
        console.error('Webhook processing failed:', {
          event: webhookEvent.event,
          paymentId: webhookEvent.data.id,
          error: result.error
        });

        return res.status(422).json({
          success: false,
          message: 'Webhook processing failed',
          error: result.error,
          eventType: webhookEvent.event,
          paymentId: webhookEvent.data.id
        });
      }

    } catch (error: any) {
      console.error('Webhook handler error:', {
        event: webhookEvent.event,
        paymentId: webhookEvent.data?.id,
        error: error.message,
        stack: error.stack
      });

      // For critical errors, still return 200 to prevent Kushki retries
      // but log the error for investigation
      return res.status(500).json({
        success: false,
        message: 'Internal webhook processing error',
        eventType: webhookEvent.event
      });
    }
  })
);

/**
 * GET /api/webhooks/health
 * Health check endpoint for webhook service
 */
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      processedWebhooks: processedWebhooks.size,
      memoryUsage: process.memoryUsage()
    };

    res.status(200).json({
      success: true,
      data: healthCheck
    });
  })
);

/**
 * POST /api/webhooks/kushki/test
 * Test endpoint for webhook validation (development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.post(
    '/kushki/test',
    [
      body('event').isString().withMessage('Event type is required'),
      body('data').isObject().withMessage('Data object is required'),
      body('generateSignature').optional().isBoolean()
    ],
    asyncHandler(async (req: Request, res: Response) => {
      const { event, data, generateSignature = false } = req.body;
      
      const testEvent = {
        event,
        data: {
          id: data.id || `test_${Date.now()}`,
          subscription_id: data.subscription_id,
          amount: data.amount || 1000,
          currency: data.currency || 'USD',
          status: data.status || 'approved',
          created_at: new Date().toISOString(),
          ...data
        },
        timestamp: Math.floor(Date.now() / 1000)
      };

      let testSignature = '';
      if (generateSignature) {
        const crypto = require('crypto');
        const secret = process.env.KUSHKI_WEBHOOK_SECRET || 'test_secret';
        testSignature = 'sha256=' + crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(testEvent))
          .digest('hex');
      }

      res.status(200).json({
        success: true,
        message: 'Test webhook event generated',
        data: {
          event: testEvent,
          signature: testSignature,
          usage: 'Send POST request to /api/webhooks/kushki with this event and X-Kushki-Signature header'
        }
      });
    })
  );
}

export default router;