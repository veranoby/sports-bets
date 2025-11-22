"use strict";
// frontend/src/services/pushNotificationService.ts
// 📱 PUSH NOTIFICATIONS PARA BETTING EVENTS - PWA Enhancement
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
exports.pushNotificationService = void 0;
var PushNotificationService = /** @class */ (function () {
    function PushNotificationService() {
        this.registration = null;
        this.subscription = null;
    }
    PushNotificationService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                            console.warn("Push notifications not supported");
                            return [2 /*return*/, false];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        // Get service worker registration
                        _a = this;
                        return [4 /*yield*/, navigator.serviceWorker.ready];
                    case 2:
                        // Get service worker registration
                        _a.registration = _c.sent();
                        // Check if already subscribed
                        _b = this;
                        return [4 /*yield*/, this.registration.pushManager.getSubscription()];
                    case 3:
                        // Check if already subscribed
                        _b.subscription = _c.sent();
                        return [2 /*return*/, true];
                    case 4:
                        error_1 = _c.sent();
                        console.error("Push notification initialization failed:", error_1);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PushNotificationService.prototype.requestPermission = function () {
        return __awaiter(this, void 0, void 0, function () {
            var permission;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!("Notification" in window)) {
                            console.warn("Notifications not supported");
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, Notification.requestPermission()];
                    case 1:
                        permission = _a.sent();
                        return [2 /*return*/, permission === "granted"];
                }
            });
        });
    };
    PushNotificationService.prototype.subscribe = function () {
        return __awaiter(this, void 0, void 0, function () {
            var vapidPublicKey, _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.registration) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        if (!this.registration) {
                            return [2 /*return*/, null];
                        }
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 6, , 7]);
                        vapidPublicKey = "BMxJpN8V-XR4M8cCh7pW4_6H9V3z9q8n4L7N2kP1V8L5K2wJ9S3Y4T";
                        _a = this;
                        return [4 /*yield*/, this.registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
                            })];
                    case 4:
                        _a.subscription = _b.sent();
                        // Send subscription to backend
                        return [4 /*yield*/, this.sendSubscriptionToBackend(this.subscription)];
                    case 5:
                        // Send subscription to backend
                        _b.sent();
                        return [2 /*return*/, this.subscription];
                    case 6:
                        error_2 = _b.sent();
                        console.error("Push subscription failed:", error_2);
                        return [2 /*return*/, null];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    PushNotificationService.prototype.sendSubscriptionToBackend = function (subscription) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("/api/push/subscribe", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: "Bearer ".concat(localStorage.getItem("token")),
                                },
                                body: JSON.stringify({
                                    subscription: subscription,
                                    userId: JSON.parse(localStorage.getItem("user") || "{}").id,
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to send subscription to backend");
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error("Error sending subscription to backend:", error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Show local notification (fallback)
    PushNotificationService.prototype.showLocalNotification = function (payload) {
        if (!("Notification" in window) || Notification.permission !== "granted") {
            return;
        }
        new Notification(payload.title, {
            body: payload.body,
            icon: "/icon-192x192.png",
            badge: "/icon-96x96.png",
            data: payload.data,
            requireInteraction: payload.type === "pago_proposal", // Keep PAGO proposals visible
        });
    };
    // Integration with betting events
    PushNotificationService.prototype.notifyBettingWindowOpen = function (eventId, fightId) {
        return __awaiter(this, void 0, void 0, function () {
            var payload;
            return __generator(this, function (_a) {
                payload = {
                    type: "betting_window_open",
                    title: "🟢 Ventana de Apuestas Abierta",
                    body: "Nueva pelea disponible para apostar",
                    data: { eventId: eventId, fightId: fightId, url: "/events/".concat(eventId) },
                };
                this.showLocalNotification(payload);
                return [2 /*return*/];
            });
        });
    };
    PushNotificationService.prototype.notifyPagoProposal = function (betId, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var payload;
            return __generator(this, function (_a) {
                payload = {
                    type: "pago_proposal",
                    title: "💰 Propuesta de PAGO",
                    body: "Propuesta de $".concat(amount.toLocaleString(), " recibida"),
                    data: { betId: betId, url: "/profile/bets" },
                };
                this.showLocalNotification(payload);
                return [2 /*return*/];
            });
        });
    };
    PushNotificationService.prototype.urlBase64ToUint8Array = function (base64String) {
        var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        var base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        var rawData = window.atob(base64);
        var outputArray = new Uint8Array(rawData.length);
        for (var i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };
    // Unsubscribe from notifications
    PushNotificationService.prototype.unsubscribe = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.subscription) {
                            return [2 /*return*/, true];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.subscription.unsubscribe()];
                    case 2:
                        result = _a.sent();
                        this.subscription = null;
                        return [2 /*return*/, result];
                    case 3:
                        error_4 = _a.sent();
                        console.error("Push unsubscription failed:", error_4);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return PushNotificationService;
}());
exports.pushNotificationService = new PushNotificationService();
exports.default = exports.pushNotificationService;
