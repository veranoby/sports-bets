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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importStar(require("express"));
var express_validator_1 = require("express-validator");
var express_rate_limit_1 = __importStar(require("express-rate-limit"));
var errorHandler_1 = require("../middleware/errorHandler");
var paymentService_1 = require("../services/paymentService");
var PaymentTransaction_1 = require("../models/PaymentTransaction");
var router = (0, express_1.Router)();
// Rate limiting for webhook endpoints
var webhookRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Allow higher rate for webhooks
    message: {
        success: false,
        message: 'Too many webhook requests'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: function (req) {
        // Use IP and webhook signature for rate limiting with IPv6 support
        var signature = req.headers['x-kushki-signature'];
        var ipKey = (0, express_rate_limit_1.ipKeyGenerator)(req.ip);
        return signature ? "webhook_sig_".concat(signature.substring(0, 10)) : "webhook_ip_".concat(ipKey);
    }
});
// Store processed webhook IDs to prevent duplicate processing
var processedWebhooks = new Set();
// Clean up old processed webhook IDs every hour
setInterval(function () {
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
function (req, res, next) {
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
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, signature, rawBody, webhookEvent, isValidSignature, webhookTimestamp, now, timeDiff, maxAge, idempotencyKey, existingTransaction, result, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Invalid webhook payload',
                            errors: validationErrors.array()
                        })];
                }
                signature = req.headers['x-kushki-signature'];
                rawBody = req.rawBody;
                webhookEvent = req.body;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                // 1. Validate webhook signature
                if (!signature) {
                    console.warn('Webhook received without signature');
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Missing webhook signature'
                        })];
                }
                isValidSignature = paymentService_1.paymentService.validateWebhookSignature(rawBody, signature);
                if (!isValidSignature) {
                    console.error('Invalid webhook signature:', {
                        event: webhookEvent.event,
                        paymentId: webhookEvent.data.id,
                        receivedSignature: signature.substring(0, 10) + '...'
                    });
                    return [2 /*return*/, res.status(401).json({
                            success: false,
                            message: 'Invalid webhook signature'
                        })];
                }
                webhookTimestamp = webhookEvent.timestamp * 1000;
                now = Date.now();
                timeDiff = Math.abs(now - webhookTimestamp);
                maxAge = 5 * 60 * 1000;
                if (timeDiff > maxAge) {
                    console.warn('Webhook timestamp too old:', {
                        event: webhookEvent.event,
                        paymentId: webhookEvent.data.id,
                        timestamp: webhookTimestamp,
                        age: timeDiff
                    });
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Webhook timestamp too old'
                        })];
                }
                idempotencyKey = "".concat(webhookEvent.event, "_").concat(webhookEvent.data.id, "_").concat(webhookEvent.timestamp);
                if (processedWebhooks.has(idempotencyKey)) {
                    console.log('Duplicate webhook ignored:', {
                        event: webhookEvent.event,
                        paymentId: webhookEvent.data.id,
                        idempotencyKey: idempotencyKey
                    });
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            message: 'Webhook already processed'
                        })];
                }
                if (!(webhookEvent.event.startsWith('payment.') && webhookEvent.data.id)) return [3 /*break*/, 3];
                return [4 /*yield*/, PaymentTransaction_1.PaymentTransaction.findByKushkiPaymentId(webhookEvent.data.id)];
            case 2:
                existingTransaction = _b.sent();
                if (existingTransaction &&
                    (webhookEvent.event === 'payment.success' && existingTransaction.status === 'completed') ||
                    (webhookEvent.event === 'payment.failed' && existingTransaction.status === 'failed')) {
                    console.log('Payment already processed in database:', {
                        event: webhookEvent.event,
                        paymentId: webhookEvent.data.id,
                        existingStatus: existingTransaction.status
                    });
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            message: 'Payment already processed'
                        })];
                }
                _b.label = 3;
            case 3:
                // 5. Process the webhook event
                console.log('Processing webhook event:', {
                    event: webhookEvent.event,
                    paymentId: webhookEvent.data.id,
                    subscriptionId: webhookEvent.data.subscription_id,
                    amount: webhookEvent.data.amount,
                    currency: webhookEvent.data.currency
                });
                return [4 /*yield*/, paymentService_1.paymentService.processWebhookEvent(webhookEvent)];
            case 4:
                result = _b.sent();
                if (result.processed) {
                    // Mark as processed to prevent duplicates
                    processedWebhooks.add(idempotencyKey);
                    console.log('Webhook processed successfully:', {
                        event: webhookEvent.event,
                        paymentId: webhookEvent.data.id,
                        result: result
                    });
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            message: 'Webhook processed successfully',
                            eventType: webhookEvent.event,
                            paymentId: webhookEvent.data.id
                        })];
                }
                else {
                    console.error('Webhook processing failed:', {
                        event: webhookEvent.event,
                        paymentId: webhookEvent.data.id,
                        error: result.error
                    });
                    return [2 /*return*/, res.status(422).json({
                            success: false,
                            message: 'Webhook processing failed',
                            error: result.error,
                            eventType: webhookEvent.event,
                            paymentId: webhookEvent.data.id
                        })];
                }
                return [3 /*break*/, 6];
            case 5:
                error_1 = _b.sent();
                console.error('Webhook handler error:', {
                    event: webhookEvent.event,
                    paymentId: (_a = webhookEvent.data) === null || _a === void 0 ? void 0 : _a.id,
                    error: error_1.message,
                    stack: error_1.stack
                });
                // For critical errors, still return 200 to prevent Kushki retries
                // but log the error for investigation
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Internal webhook processing error',
                        eventType: webhookEvent.event
                    })];
            case 6: return [2 /*return*/];
        }
    });
}); }));
/**
 * GET /api/webhooks/health
 * Health check endpoint for webhook service
 */
router.get('/health', (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var healthCheck;
    return __generator(this, function (_a) {
        healthCheck = {
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
        return [2 /*return*/];
    });
}); }));
/**
 * POST /api/webhooks/kushki/test
 * Test endpoint for webhook validation (development only)
 */
if (process.env.NODE_ENV === 'development') {
    router.post('/kushki/test', [
        (0, express_validator_1.body)('event').isString().withMessage('Event type is required'),
        (0, express_validator_1.body)('data').isObject().withMessage('Data object is required'),
        (0, express_validator_1.body)('generateSignature').optional().isBoolean()
    ], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, event, data, _b, generateSignature, testEvent, testSignature, crypto_1, secret;
        return __generator(this, function (_c) {
            _a = req.body, event = _a.event, data = _a.data, _b = _a.generateSignature, generateSignature = _b === void 0 ? false : _b;
            testEvent = {
                event: event,
                data: __assign({ id: data.id || "test_".concat(Date.now()), subscription_id: data.subscription_id, amount: data.amount || 1000, currency: data.currency || 'USD', status: data.status || 'approved', created_at: new Date().toISOString() }, data),
                timestamp: Math.floor(Date.now() / 1000)
            };
            testSignature = '';
            if (generateSignature) {
                crypto_1 = require('crypto');
                secret = process.env.KUSHKI_WEBHOOK_SECRET || 'test_secret';
                testSignature = 'sha256=' + crypto_1
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
            return [2 /*return*/];
        });
    }); }));
}
exports.default = router;
