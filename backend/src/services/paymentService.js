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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = exports.paymentService = void 0;
var axios_1 = __importDefault(require("axios"));
var crypto_1 = __importDefault(require("crypto"));
var Subscription_1 = require("../models/Subscription");
var PaymentTransaction_1 = require("../models/PaymentTransaction");
var PaymentService = /** @class */ (function () {
    function PaymentService() {
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
    PaymentService.prototype.createSubscription = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var planConfig, requestData, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        planConfig = this.getPlanConfig(params.planType);
                        requestData = {
                            token: params.token,
                            amount: planConfig.amount,
                            currency: planConfig.currency,
                            planId: planConfig.planId,
                            email: params.userEmail,
                            description: "".concat(planConfig.name, " subscription for user ").concat(params.userId),
                            metadata: {
                                userId: params.userId,
                                planType: params.planType
                            }
                        };
                        return [4 /*yield*/, this.makeKushkiRequest('/subscriptions', 'POST', requestData)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                subscriptionId: response.data.subscription_id,
                                status: response.data.status,
                                nextPaymentDate: new Date(response.data.next_payment_date),
                                customerId: response.data.customer_id
                            }];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Kushki subscription creation failed:', error_1);
                        this.handleKushkiError(error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cancel subscription with Kushki
     */
    PaymentService.prototype.cancelSubscription = function (kushkiSubscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeKushkiRequest("/subscriptions/".concat(kushkiSubscriptionId), 'DELETE')];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                cancelled: response.data.cancelled,
                                refundAmount: response.data.refund_amount || 0
                            }];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Kushki subscription cancellation failed:', error_2);
                        this.handleKushkiError(error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process one-time payment
     */
    PaymentService.prototype.processPayment = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var requestData, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        requestData = {
                            token: params.token,
                            amount: params.amount,
                            currency: params.currency,
                            description: params.description,
                            metadata: params.metadata
                        };
                        return [4 /*yield*/, this.makeKushkiRequest('/charges', 'POST', requestData)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                transactionId: response.data.transaction_id,
                                status: response.data.status,
                                authCode: response.data.auth_code,
                                responseText: response.data.response_text,
                                responseCode: response.data.response_code
                            }];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Kushki payment processing failed:', error_3);
                        this.handleKushkiError(error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate webhook signature
     */
    PaymentService.prototype.validateWebhookSignature = function (payload, signature, secret) {
        try {
            var webhookSecret = secret || this.kushkiWebhookSecret;
            if (!webhookSecret) {
                console.warn('Webhook secret not configured');
                return false;
            }
            // Remove 'sha256=' prefix if present
            var cleanSignature = signature.replace('sha256=', '');
            // Calculate expected signature
            var expectedSignature = crypto_1.default
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
    };
    /**
     * Process webhook event
     */
    PaymentService.prototype.processWebhookEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 11, , 12]);
                        console.log('Processing webhook event:', {
                            event: event.event,
                            paymentId: event.data.id,
                            subscriptionId: event.data.subscription_id
                        });
                        _a = event.event;
                        switch (_a) {
                            case 'payment.success': return [3 /*break*/, 1];
                            case 'payment.failed': return [3 /*break*/, 3];
                            case 'subscription.cancelled': return [3 /*break*/, 5];
                            case 'payment.refunded': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.handlePaymentSuccess(event)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.handlePaymentFailed(event)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.handleSubscriptionCancelled(event)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.handlePaymentRefunded(event)];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9:
                        console.log("Unhandled webhook event: ".concat(event.event));
                        return [2 /*return*/, { processed: false }];
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        error_4 = _b.sent();
                        console.error('Webhook processing failed:', error_4);
                        return [2 /*return*/, { processed: false, error: error_4.message }];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retry failed payment
     */
    PaymentService.prototype.retryFailedPayment = function (subscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription, retryAt, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Subscription_1.Subscription.findByPk(subscriptionId)];
                    case 1:
                        subscription = _a.sent();
                        if (!subscription) {
                            throw new Error('Subscription not found');
                        }
                        if (!subscription.canRetry()) {
                            return [2 /*return*/, {
                                    willRetry: false,
                                    error: 'Maximum retry attempts reached'
                                }];
                        }
                        retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                        return [4 /*yield*/, subscription.incrementRetryCount()];
                    case 2:
                        _a.sent();
                        console.log("Payment retry scheduled for subscription ".concat(subscriptionId, " at ").concat(retryAt));
                        return [2 /*return*/, { willRetry: true, retryAt: retryAt }];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Failed payment retry failed:', error_5);
                        return [2 /*return*/, { willRetry: false, error: error_5.message }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get subscription plans configuration
     */
    PaymentService.prototype.getSubscriptionPlans = function () {
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
    };
    // Private methods
    PaymentService.prototype.getPlanConfig = function (planType) {
        var configs = {
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
    };
    PaymentService.prototype.makeKushkiRequest = function (endpoint, method, data) {
        return __awaiter(this, void 0, void 0, function () {
            var url, headers, response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.kushkiApiUrl, "/v1").concat(endpoint);
                        headers = {
                            'Content-Type': 'application/json',
                            'Private-Merchant-Id': this.kushkiPrivateKey
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, axios_1.default)({
                                method: method,
                                url: url,
                                headers: headers,
                                data: data,
                                timeout: 30000 // 30 second timeout
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 3:
                        error_6 = _a.sent();
                        if (error_6.response) {
                            // Kushki API error
                            throw new Error(error_6.response.data.message || 'Payment gateway error');
                        }
                        else if (error_6.request) {
                            // Network error
                            throw new Error('Payment gateway unavailable');
                        }
                        else {
                            throw new Error('Payment processing failed');
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.handleKushkiError = function (error) {
        var _a, _b;
        // Log specific Kushki error codes for monitoring
        if ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.code) {
            console.error("Kushki Error ".concat(error.response.data.code, ": ").concat(error.response.data.message));
        }
    };
    // Webhook handlers
    PaymentService.prototype.handlePaymentSuccess = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var existingTransaction, subscription, now, newExpiryDate, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, PaymentTransaction_1.PaymentTransaction.findByKushkiPaymentId(event.data.id)];
                    case 1:
                        existingTransaction = _a.sent();
                        if (existingTransaction) {
                            return [2 /*return*/, { processed: true }]; // Already processed
                        }
                        return [4 /*yield*/, Subscription_1.Subscription.findOne({
                                where: { kushkiSubscriptionId: event.data.subscription_id }
                            })];
                    case 2:
                        subscription = _a.sent();
                        if (!subscription) {
                            return [2 /*return*/, { processed: false, error: 'Subscription not found' }];
                        }
                        // Create transaction record
                        return [4 /*yield*/, PaymentTransaction_1.PaymentTransaction.create({
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
                            })];
                    case 3:
                        // Create transaction record
                        _a.sent();
                        now = new Date();
                        newExpiryDate = subscription.type === 'daily'
                            ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
                            : new Date(now.setMonth(now.getMonth() + 1));
                        return [4 /*yield*/, subscription.update({
                                expiresAt: newExpiryDate,
                                status: 'active'
                            })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, subscription.resetRetryCount()];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, { processed: true }];
                    case 6:
                        error_7 = _a.sent();
                        return [2 /*return*/, { processed: false, error: error_7.message }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.handlePaymentFailed = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, Subscription_1.Subscription.findOne({
                                where: { kushkiSubscriptionId: event.data.subscription_id }
                            })];
                    case 1:
                        subscription = _a.sent();
                        if (!subscription) {
                            return [2 /*return*/, { processed: false, error: 'Subscription not found' }];
                        }
                        // Create failed transaction record
                        return [4 /*yield*/, PaymentTransaction_1.PaymentTransaction.create({
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
                            })];
                    case 2:
                        // Create failed transaction record
                        _a.sent();
                        if (!subscription.canRetry()) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.retryFailedPayment(subscription.id)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4: 
                    // Mark subscription as expired after max retries
                    return [4 /*yield*/, subscription.update({ status: 'expired' })];
                    case 5:
                        // Mark subscription as expired after max retries
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, { processed: true }];
                    case 7:
                        error_8 = _a.sent();
                        return [2 /*return*/, { processed: false, error: error_8.message }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.handleSubscriptionCancelled = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Subscription_1.Subscription.findOne({
                                where: { kushkiSubscriptionId: event.data.id }
                            })];
                    case 1:
                        subscription = _a.sent();
                        if (!subscription) {
                            return [2 /*return*/, { processed: false, error: 'Subscription not found' }];
                        }
                        return [4 /*yield*/, subscription.update({
                                status: 'cancelled',
                                cancelledAt: new Date(),
                                cancelReason: 'kushki_cancellation'
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { processed: true }];
                    case 3:
                        error_9 = _a.sent();
                        return [2 /*return*/, { processed: false, error: error_9.message }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.handlePaymentRefunded = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var originalTransaction, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, PaymentTransaction_1.PaymentTransaction.findByKushkiPaymentId(event.data.id // This would be the original payment ID in the refund event
                            )];
                    case 1:
                        originalTransaction = _a.sent();
                        if (!originalTransaction) {
                            return [2 /*return*/, { processed: false, error: 'Original transaction not found' }];
                        }
                        // Create refund transaction
                        return [4 /*yield*/, PaymentTransaction_1.PaymentTransaction.create({
                                subscriptionId: originalTransaction.subscriptionId,
                                kushkiPaymentId: "refund_".concat(event.data.id),
                                type: 'refund',
                                status: 'completed',
                                amount: -event.data.amount, // Negative amount for refund
                                currency: event.data.currency,
                                paymentMethod: originalTransaction.paymentMethod,
                                processedAt: new Date(),
                                kushkiResponse: event.data
                            })];
                    case 2:
                        // Create refund transaction
                        _a.sent();
                        return [2 /*return*/, { processed: true }];
                    case 3:
                        error_10 = _a.sent();
                        return [2 /*return*/, { processed: false, error: error_10.message }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return PaymentService;
}());
exports.PaymentService = PaymentService;
// Create singleton instance
exports.paymentService = new PaymentService();
exports.default = exports.paymentService;
