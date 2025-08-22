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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
const errorHandler_1 = require("../middleware/errorHandler");
const paymentService_1 = require("../services/paymentService");
const PaymentTransaction_1 = require("../models/PaymentTransaction");
const router = (0, express_1.Router)();
// Rate limiting for webhook endpoints
const webhookRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Allow higher rate for webhooks
    message: {
        success: false,
        message: 'Too many webhook requests'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use IP and webhook signature for rate limiting with IPv6 support
        const signature = req.headers['x-kushki-signature'];
        const ipKey = (0, express_rate_limit_1.ipKeyGenerator)(req.ip);
        return signature ? `webhook_sig_${signature.substring(0, 10)}` : `webhook_ip_${ipKey}`;
    }
});
// Store processed webhook IDs to prevent duplicate processing
const processedWebhooks = new Set();
// Clean up old processed webhook IDs every hour
setInterval(() => {
    processedWebhooks.clear();
}, 60 * 60 * 1000);
/**
 * POST /api/webhooks/kushki
 * Handle Kushki payment webhook events
 */
router.post('/kushki', webhookRateLimit, 
// Skip Express JSON parsing for webhooks to preserve raw body
express_1.default.raw({ type: 'application/json' }), 
// Custom middleware to parse JSON and preserve raw body
(req, res, next) => {
    try {
        req.rawBody = req.body.toString();
        req.body = JSON.parse(req.body.toString());
        next();
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload'
        });
    }
}, [
    (0, express_validator_1.body)('event')
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
    (0, express_validator_1.body)('data')
        .isObject()
        .withMessage('Data object is required'),
    (0, express_validator_1.body)('data.id')
        .isString()
        .isLength({ min: 1 })
        .withMessage('Payment ID is required'),
    (0, express_validator_1.body)('timestamp')
        .isNumeric()
        .withMessage('Timestamp is required')
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid webhook payload',
            errors: validationErrors.array()
        });
    }
    const signature = req.headers['x-kushki-signature'];
    const rawBody = req.rawBody;
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
        const isValidSignature = paymentService_1.paymentService.validateWebhookSignature(rawBody, signature);
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
            const existingTransaction = yield PaymentTransaction_1.PaymentTransaction.findByKushkiPaymentId(webhookEvent.data.id);
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
        const result = yield paymentService_1.paymentService.processWebhookEvent(webhookEvent);
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
        }
        else {
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
    }
    catch (error) {
        console.error('Webhook handler error:', {
            event: webhookEvent.event,
            paymentId: (_a = webhookEvent.data) === null || _a === void 0 ? void 0 : _a.id,
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
})));
/**
 * GET /api/webhooks/health
 * Health check endpoint for webhook service
 */
router.get('/health', (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
})));
/**
 * POST /api/webhooks/kushki/test
 * Test endpoint for webhook validation (development only)
 */
if (process.env.NODE_ENV === 'development') {
    router.post('/kushki/test', [
        (0, express_validator_1.body)('event').isString().withMessage('Event type is required'),
        (0, express_validator_1.body)('data').isObject().withMessage('Data object is required'),
        (0, express_validator_1.body)('generateSignature').optional().isBoolean()
    ], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { event, data, generateSignature = false } = req.body;
        const testEvent = {
            event,
            data: Object.assign({ id: data.id || `test_${Date.now()}`, subscription_id: data.subscription_id, amount: data.amount || 1000, currency: data.currency || 'USD', status: data.status || 'approved', created_at: new Date().toISOString() }, data),
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
    })));
}
exports.default = router;
