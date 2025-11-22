"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
var sequelize_1 = require("sequelize");
var database_1 = require("../config/database");
// Subscription model class with proper camelCase → snake_case mapping
var Subscription = /** @class */ (function (_super) {
    __extends(Subscription, _super);
    function Subscription() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Instance methods
    Subscription.prototype.isActive = function () {
        return this.status === 'active' && new Date(this.expiresAt) > new Date();
    };
    Subscription.prototype.isExpired = function () {
        return this.status === 'expired' || new Date(this.expiresAt) <= new Date();
    };
    Subscription.prototype.isCancelled = function () {
        return this.status === 'cancelled';
    };
    Subscription.prototype.getRemainingDays = function () {
        if (this.isExpired())
            return 0;
        var now = new Date();
        var diffTime = this.expiresAt.getTime() - now.getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };
    Subscription.prototype.canRetry = function () {
        return this.getRetryCount() < this.getMaxRetries();
    };
    Subscription.prototype.hasFeature = function (feature) {
        return this.features.includes(feature);
    };
    Subscription.prototype.markAsExpired = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.setNextBillingDate(null);
                        return [4 /*yield*/, this.update({
                                status: 'expired',
                                autoRenew: false,
                                metadata: this.metadata
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Subscription.prototype.incrementRetryCount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        currentCount = this.getRetryCount();
                        this.setRetryCount(currentCount + 1);
                        return [4 /*yield*/, this.update({
                                metadata: this.metadata
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Subscription.prototype.resetRetryCount = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.setRetryCount(0);
                        return [4 /*yield*/, this.update({
                                metadata: this.metadata
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Subscription.prototype.getFormattedAmount = function () {
        var amount = this.amount / 100; // Convert cents to dollars
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency
        }).format(amount);
    };
    // ============================================================
    // METADATA ACCESSORS - Transparent access to metadata.payment
    // These getters/setters provide backward compatibility
    // Original columns are preserved in DB, but data lives in metadata
    // ============================================================
    /**
     * Get next billing date from metadata.payment or fallback to column
     */
    Subscription.prototype.getNextBillingDate = function () {
        // Try metadata.payment first (migrated data)
        if (this.metadata && typeof this.metadata === 'object') {
            var payment = this.metadata.payment;
            if (payment === null || payment === void 0 ? void 0 : payment.nextBillingDate) {
                return new Date(payment.nextBillingDate);
            }
        }
        // Fallback to direct column (pre-migration)
        return this.nextBillingDate ? new Date(this.nextBillingDate) : null;
    };
    /**
     * Set next billing date in metadata.payment
     */
    Subscription.prototype.setNextBillingDate = function (date) {
        if (!this.metadata)
            this.metadata = {};
        if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
            if (!(this.metadata.payment)) {
                this.metadata.payment = {};
            }
            this.metadata.payment.nextBillingDate = date ? date.toISOString() : null;
        }
    };
    /**
     * Get cancelled date from metadata.payment or fallback to column
     */
    Subscription.prototype.getCancelledAt = function () {
        // Try metadata.payment first
        if (this.metadata && typeof this.metadata === 'object') {
            var payment = this.metadata.payment;
            if (payment === null || payment === void 0 ? void 0 : payment.cancelledAt) {
                return new Date(payment.cancelledAt);
            }
        }
        // Fallback to direct column
        return this.cancelledAt ? new Date(this.cancelledAt) : null;
    };
    /**
     * Set cancelled date in metadata.payment
     */
    Subscription.prototype.setCancelledAt = function (date) {
        if (!this.metadata)
            this.metadata = {};
        if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
            if (!(this.metadata.payment)) {
                this.metadata.payment = {};
            }
            this.metadata.payment.cancelledAt = date ? date.toISOString() : null;
        }
    };
    /**
     * Get cancel reason from metadata.payment or fallback to column
     */
    Subscription.prototype.getCancelReason = function () {
        // Try metadata.payment first
        if (this.metadata && typeof this.metadata === 'object') {
            var payment = this.metadata.payment;
            if (payment === null || payment === void 0 ? void 0 : payment.cancelReason) {
                return payment.cancelReason;
            }
        }
        // Fallback to direct column
        return this.cancelReason || null;
    };
    /**
     * Set cancel reason in metadata.payment
     */
    Subscription.prototype.setCancelReason = function (reason) {
        if (!this.metadata)
            this.metadata = {};
        if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
            if (!(this.metadata.payment)) {
                this.metadata.payment = {};
            }
            this.metadata.payment.cancelReason = reason;
        }
    };
    /**
     * Get retry count from metadata.payment or fallback to column
     */
    Subscription.prototype.getRetryCount = function () {
        // Try metadata.payment first
        if (this.metadata && typeof this.metadata === 'object') {
            var payment = this.metadata.payment;
            if (typeof (payment === null || payment === void 0 ? void 0 : payment.retryCount) === 'number') {
                return payment.retryCount;
            }
        }
        // Fallback to direct column
        return this.retryCount || 0;
    };
    /**
     * Set retry count in metadata.payment
     */
    Subscription.prototype.setRetryCount = function (count) {
        if (!this.metadata)
            this.metadata = {};
        if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
            if (!(this.metadata.payment)) {
                this.metadata.payment = {};
            }
            this.metadata.payment.retryCount = count;
        }
    };
    /**
     * Get max retries from metadata.payment or fallback to column
     */
    Subscription.prototype.getMaxRetries = function () {
        // Try metadata.payment first
        if (this.metadata && typeof this.metadata === 'object') {
            var payment = this.metadata.payment;
            if (typeof (payment === null || payment === void 0 ? void 0 : payment.maxRetries) === 'number') {
                return payment.maxRetries;
            }
        }
        // Fallback to direct column
        return this.maxRetries || 3;
    };
    /**
     * Set max retries in metadata.payment
     */
    Subscription.prototype.setMaxRetries = function (count) {
        if (!this.metadata)
            this.metadata = {};
        if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
            if (!(this.metadata.payment)) {
                this.metadata.payment = {};
            }
            this.metadata.payment.maxRetries = count;
        }
    };
    /**
     * Get Kushki subscription ID from metadata.payment or fallback to column
     */
    Subscription.prototype.getKushkiSubscriptionId = function () {
        // Try metadata.payment first
        if (this.metadata && typeof this.metadata === 'object') {
            var payment = this.metadata.payment;
            if (payment === null || payment === void 0 ? void 0 : payment.kushkiSubscriptionId) {
                return payment.kushkiSubscriptionId;
            }
        }
        // Fallback to direct column
        return this.kushkiSubscriptionId || null;
    };
    /**
     * Set Kushki subscription ID in metadata.payment
     */
    Subscription.prototype.setKushkiSubscriptionId = function (id) {
        if (!this.metadata)
            this.metadata = {};
        if (typeof this.metadata === 'object' && !Array.isArray(this.metadata)) {
            if (!(this.metadata.payment)) {
                this.metadata.payment = {};
            }
            this.metadata.payment.kushkiSubscriptionId = id;
        }
    };
    /**
     * Get admin data from metadata.admin
     */
    Subscription.prototype.getAdminMetadata = function () {
        if (this.metadata && typeof this.metadata === 'object') {
            var admin = this.metadata.admin;
            if (admin) {
                return {
                    assignedByAdminId: admin.assignedByAdminId,
                    assignedUsername: admin.assignedUsername
                };
            }
        }
        // Fallback to direct columns
        if (this.assigned_by_admin_id || this.assigned_username) {
            return {
                assignedByAdminId: this.assigned_by_admin_id,
                assignedUsername: this.assigned_username
            };
        }
        return null;
    };
    /**
     * Get payment metadata
     */
    Subscription.prototype.getPaymentMetadata = function () {
        if (this.metadata && typeof this.metadata === 'object') {
            var payment = this.metadata.payment;
            if (payment) {
                return payment;
            }
        }
        return null;
    };
    // Static methods
    Subscription.findActiveByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Subscription.findOne({
                            where: {
                                userId: userId,
                                status: 'active',
                                expiresAt: (_a = {},
                                    _a[require('sequelize').Op.gt] = new Date(),
                                    _a)
                            },
                            order: [['createdAt', 'DESC']]
                        })];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    Subscription.findByKushkiSubscriptionId = function (kushkiSubscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Subscription.findOne({
                            where: { kushkiSubscriptionId: kushkiSubscriptionId }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Subscription.findExpiredSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Subscription.findAll({
                            where: {
                                status: 'active',
                                expiresAt: (_a = {},
                                    _a[require('sequelize').Op.lte] = new Date(),
                                    _a)
                            }
                        })];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    Subscription.findRetryableSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, Subscription.findAll({
                            where: {
                                status: 'active',
                                retryCount: (_a = {},
                                    _a[require('sequelize').Op.lt] = require('sequelize').col('maxRetries'),
                                    _a),
                                expiresAt: (_b = {},
                                    _b[require('sequelize').Op.lte] = new Date(),
                                    _b)
                            }
                        })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    Subscription.getSubscriptionStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, _a, total, active, cancelled, expired;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        whereClause = userId ? { userId: userId } : {};
                        return [4 /*yield*/, Promise.all([
                                Subscription.count({ where: whereClause }),
                                Subscription.count({ where: __assign(__assign({}, whereClause), { status: 'active' }) }),
                                Subscription.count({ where: __assign(__assign({}, whereClause), { status: 'cancelled' }) }),
                                Subscription.count({ where: __assign(__assign({}, whereClause), { status: 'expired' }) })
                            ])];
                    case 1:
                        _a = _b.sent(), total = _a[0], active = _a[1], cancelled = _a[2], expired = _a[3];
                        return [2 /*return*/, { total: total, active: active, cancelled: cancelled, expired: expired }];
                }
            });
        });
    };
    // Legacy methods for compatibility with old code
    Subscription.prototype.getPlanPrice = function () {
        return this.amount / 100; // Convert cents to dollars
    };
    Subscription.prototype.daysRemaining = function () {
        return this.getRemainingDays();
    };
    Subscription.prototype.extend = function () {
        return __awaiter(this, void 0, void 0, function () {
            var extensionTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        extensionTime = (this.type === 'daily' || this.type === null)
                            ? 24 * 60 * 60 * 1000 // 24 hours
                            : 30 * 24 * 60 * 60 * 1000;
                        return [4 /*yield*/, this.update({
                                expiresAt: new Date(this.expiresAt.getTime() + extensionTime)
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Subscription.prototype.cancel = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.update({
                            status: 'cancelled',
                            cancelledAt: new Date(),
                            autoRenew: false,
                            nextBillingDate: null
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Subscription.prototype.toPublicJSON = function () {
        return {
            id: this.id,
            type: this.type,
            plan: this.type, // Legacy compatibility
            status: this.status,
            expiresAt: this.expiresAt,
            endDate: this.expiresAt, // Legacy compatibility
            autoRenew: this.autoRenew,
            amount: this.amount,
            formattedAmount: this.getFormattedAmount(),
            currency: this.currency,
            features: this.features,
            remainingDays: this.getRemainingDays(),
            daysRemaining: this.getRemainingDays(), // Legacy compatibility
            isActive: this.isActive(),
            nextBillingDate: this.nextBillingDate,
            createdAt: this.createdAt
        };
    };
    // Manual membership management methods
    Subscription.prototype.assignManualMembership = function (membershipType, adminId, assignedUsername) {
        return __awaiter(this, void 0, void 0, function () {
            var now, expiresAt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        expiresAt = null;
                        if (membershipType === '24h') {
                            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                        }
                        else if (membershipType === 'monthly') {
                            expiresAt = new Date(now);
                            expiresAt.setMonth(expiresAt.getMonth() + 1);
                        }
                        return [4 /*yield*/, this.update({
                                status: membershipType === 'free' ? 'free' : 'active',
                                manual_expires_at: expiresAt,
                                assigned_by_admin_id: adminId,
                                assigned_username: assignedUsername,
                                expiresAt: expiresAt
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this];
                }
            });
        });
    };
    return Subscription;
}(sequelize_1.Model));
exports.Subscription = Subscription;
// Define the model
Subscription.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('daily', 'monthly'),
        allowNull: true, // Temporarily allow null for migration
        defaultValue: 'daily'
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'cancelled', 'expired', 'pending', 'free'),
        allowNull: false,
        defaultValue: 'pending'
    },
    kushkiSubscriptionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: "kushki_subscription_id",
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('card', 'cash', 'transfer'),
        allowNull: false,
        defaultValue: 'card',
        field: "payment_method",
    },
    autoRenew: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "auto_renew",
    },
    amount: {
        type: sequelize_1.DataTypes.INTEGER, // Amount in cents
        allowNull: false,
        validate: {
            min: 0
        }
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
    },
    nextBillingDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "next_billing_date",
    },
    cancelledAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "cancelled_at",
    },
    cancelReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: "cancel_reason",
    },
    retryCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "retry_count",
        validate: {
            min: 0
        }
    },
    maxRetries: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        field: "max_retries",
        validate: {
            min: 0
        }
    },
    features: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: function () {
            // Default features based on subscription type
            return ['Live streaming', 'HD quality', 'Chat access'];
        }
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
        field: "created_at",
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
        field: "updated_at",
    },
    manual_expires_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: 'Manual expiration for admin-assigned memberships'
    },
    payment_proof_url: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL to uploaded payment proof image'
    },
    assigned_by_admin_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        comment: 'Admin who assigned this membership'
    },
    assigned_username: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        comment: 'Username specified in payment proof'
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'subscriptions',
    modelName: 'Subscription',
    timestamps: true,
    underscored: true, // Enable snake_case mapping
    indexes: [
        {
            name: 'idx_subscriptions_user_id',
            fields: ['user_id']
        },
        {
            name: 'idx_subscriptions_status',
            fields: ['status']
        },
        {
            name: 'idx_subscriptions_type',
            fields: ['type']
        },
        {
            name: 'idx_subscriptions_expires_at',
            fields: ['expires_at']
        },
        {
            name: 'subscriptions_kushki_subscription_id_unique',
            fields: ['kushki_subscription_id'],
            unique: true,
            where: {
                kushki_subscription_id: (_a = {},
                    _a[require('sequelize').Op.ne] = null,
                    _a)
            }
        },
        {
            name: 'idx_subscriptions_status_expires',
            fields: ['status', 'expires_at']
        },
        {
            name: 'idx_subscriptions_retry',
            fields: ['retry_count', 'max_retries']
        }
    ],
    hooks: {
        beforeCreate: function (subscription) {
            // Set default features based on subscription type
            if (!subscription.features || subscription.features.length === 0) {
                subscription.features = (subscription.type === 'daily' || subscription.type === null)
                    ? ['Live streaming', 'HD quality', 'Chat access']
                    : ['Live streaming', '720p quality', 'Chat access', 'Ad-free', 'Exclusive content'];
            }
            // Set default type if null
            if (!subscription.type) {
                subscription.type = 'daily';
            }
        },
        beforeUpdate: function (subscription) {
            // Auto-expire subscriptions that have passed their expiry date
            if (subscription.changed('expiresAt') || subscription.changed('status')) {
                if (subscription.status === 'active' && subscription.isExpired()) {
                    subscription.status = 'expired';
                    subscription.autoRenew = false;
                    subscription.nextBillingDate = null;
                }
            }
        }
    }
});
exports.default = Subscription;
