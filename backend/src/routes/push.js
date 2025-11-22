"use strict";
// backend/src/routes/push.ts
// 📱 PUSH NOTIFICATION ENDPOINTS - PWA Integration
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
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var express_validator_1 = require("express-validator");
var web_push_1 = __importDefault(require("web-push"));
// Configure web-push (in production, use environment variables)
// Only configure VAPID if environment variables are provided
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    web_push_1.default.setVapidDetails('mailto:admin@gallobets.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    console.log('📱 VAPID configured for push notifications');
}
else {
    console.warn('📱 VAPID keys not configured - push notifications will not work');
}
var router = (0, express_1.Router)();
// Temporary in-memory storage for subscriptions (use database in production)
var subscriptions = new Map();
// Subscribe to push notifications
router.post('/subscribe', auth_1.authenticate, [
    (0, express_validator_1.body)('subscription').isObject(),
    (0, express_validator_1.body)('userId').isString().notEmpty()
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, _a, subscription, userId;
    return __generator(this, function (_b) {
        errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return [2 /*return*/, res.status(400).json({ errors: errors.array() })];
        }
        _a = req.body, subscription = _a.subscription, userId = _a.userId;
        // Store subscription (in production, save to database)
        subscriptions.set(userId, subscription);
        console.log("\uD83D\uDCF1 Push subscription registered for user ".concat(userId));
        res.status(200).json({
            success: true,
            message: 'Subscription registered successfully'
        });
        return [2 /*return*/];
    });
}); }));
// Unsubscribe from push notifications
router.post('/unsubscribe', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    return __generator(this, function (_a) {
        userId = req.body.userId;
        subscriptions.delete(userId);
        res.status(200).json({
            success: true,
            message: 'Unsubscribed successfully'
        });
        return [2 /*return*/];
    });
}); }));
// Send push notification to specific user
router.post('/send', auth_1.authenticate, (0, auth_1.authorize)('admin', 'operator'), [
    (0, express_validator_1.body)('userId').isString().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('body').isString().notEmpty(),
    (0, express_validator_1.body)('type').isIn(['betting_window_open', 'betting_window_close', 'fight_result', 'pago_proposal']),
    (0, express_validator_1.body)('data').optional().isObject()
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, _a, userId, title, body, type, data, subscription, payload, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({ errors: errors.array() })];
                }
                _a = req.body, userId = _a.userId, title = _a.title, body = _a.body, type = _a.type, data = _a.data;
                subscription = subscriptions.get(userId);
                if (!subscription) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'User subscription not found'
                        })];
                }
                payload = JSON.stringify({
                    title: title,
                    body: body,
                    data: __assign({ type: type }, data)
                });
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, web_push_1.default.sendNotification(subscription, payload)];
            case 2:
                _b.sent();
                console.log("\uD83D\uDCF1 Push notification sent to user ".concat(userId, ": ").concat(type));
                res.status(200).json({
                    success: true,
                    message: 'Notification sent successfully'
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error('Push notification failed:', error_1);
                // Remove invalid subscription
                if (error_1.statusCode === 410) {
                    subscriptions.delete(userId);
                }
                res.status(500).json({
                    success: false,
                    message: 'Failed to send notification',
                    error: error_1.message
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); }));
// Send notification to multiple users (broadcast)
router.post('/broadcast', auth_1.authenticate, (0, auth_1.authorize)('admin'), [
    (0, express_validator_1.body)('userIds').isArray().notEmpty(),
    (0, express_validator_1.body)('title').isString().notEmpty(),
    (0, express_validator_1.body)('body').isString().notEmpty(),
    (0, express_validator_1.body)('type').isIn(['betting_window_open', 'betting_window_close', 'fight_result', 'system_maintenance']),
    (0, express_validator_1.body)('data').optional().isObject()
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, _a, userIds, title, body, type, data, payload, results, promises;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    return [2 /*return*/, res.status(400).json({ errors: errors.array() })];
                }
                _a = req.body, userIds = _a.userIds, title = _a.title, body = _a.body, type = _a.type, data = _a.data;
                payload = JSON.stringify({
                    title: title,
                    body: body,
                    data: __assign({ type: type }, data)
                });
                results = {
                    sent: 0,
                    failed: 0,
                    invalidSubscriptions: []
                };
                promises = userIds.map(function (userId) { return __awaiter(void 0, void 0, void 0, function () {
                    var subscription, error_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                subscription = subscriptions.get(userId);
                                if (!subscription) {
                                    results.failed++;
                                    return [2 /*return*/];
                                }
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, web_push_1.default.sendNotification(subscription, payload)];
                            case 2:
                                _a.sent();
                                results.sent++;
                                return [3 /*break*/, 4];
                            case 3:
                                error_2 = _a.sent();
                                results.failed++;
                                if (error_2.statusCode === 410) {
                                    subscriptions.delete(userId);
                                    results.invalidSubscriptions.push(userId);
                                }
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                return [4 /*yield*/, Promise.all(promises)];
            case 1:
                _b.sent();
                console.log("\uD83D\uDCF1 Broadcast notification sent: ".concat(results.sent, " success, ").concat(results.failed, " failed"));
                res.status(200).json({
                    success: true,
                    message: 'Broadcast completed',
                    results: results
                });
                return [2 /*return*/];
        }
    });
}); }));
// Get subscription status
router.get('/subscription/:userId', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, hasSubscription;
    return __generator(this, function (_a) {
        userId = req.params.userId;
        hasSubscription = subscriptions.has(userId);
        res.status(200).json({
            success: true,
            userId: userId,
            hasSubscription: hasSubscription,
            subscriptionCount: subscriptions.size
        });
        return [2 /*return*/];
    });
}); }));
// List all subscriptions (admin only)
router.get('/subscriptions', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var subscriptionList;
    return __generator(this, function (_a) {
        subscriptionList = Array.from(subscriptions.keys()).map(function (userId) { return ({
            userId: userId,
            subscribed: true
        }); });
        res.status(200).json({
            success: true,
            totalSubscriptions: subscriptions.size,
            subscriptions: subscriptionList
        });
        return [2 /*return*/];
    });
}); }));
exports.default = router;
