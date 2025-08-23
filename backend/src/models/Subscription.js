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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
// Subscription model class with proper camelCase → snake_case mapping
class Subscription extends sequelize_1.Model {
    // Instance methods
    isActive() {
        return this.status === 'active' && new Date(this.expiresAt) > new Date();
    }
    isExpired() {
        return this.status === 'expired' || new Date(this.expiresAt) <= new Date();
    }
    isCancelled() {
        return this.status === 'cancelled';
    }
    getRemainingDays() {
        if (this.isExpired())
            return 0;
        const now = new Date();
        const diffTime = this.expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }
    canRetry() {
        return this.retryCount < this.maxRetries;
    }
    hasFeature(feature) {
        return this.features.includes(feature);
    }
    markAsExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update({
                status: 'expired',
                autoRenew: false,
                nextBillingDate: null
            });
        });
    }
    incrementRetryCount() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update({
                retryCount: this.retryCount + 1
            });
        });
    }
    resetRetryCount() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update({
                retryCount: 0
            });
        });
    }
    getFormattedAmount() {
        const amount = this.amount / 100; // Convert cents to dollars
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency
        }).format(amount);
    }
    // Static methods
    static findActiveByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Subscription.findOne({
                where: {
                    userId,
                    status: 'active',
                    expiresAt: {
                        [require('sequelize').Op.gt]: new Date()
                    }
                },
                order: [['createdAt', 'DESC']]
            });
        });
    }
    static findByKushkiSubscriptionId(kushkiSubscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Subscription.findOne({
                where: { kushkiSubscriptionId }
            });
        });
    }
    static findExpiredSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Subscription.findAll({
                where: {
                    status: 'active',
                    expiresAt: {
                        [require('sequelize').Op.lte]: new Date()
                    }
                }
            });
        });
    }
    static findRetryableSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Subscription.findAll({
                where: {
                    status: 'active',
                    retryCount: {
                        [require('sequelize').Op.lt]: require('sequelize').col('maxRetries')
                    },
                    expiresAt: {
                        [require('sequelize').Op.lte]: new Date()
                    }
                }
            });
        });
    }
    static getSubscriptionStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const whereClause = userId ? { userId } : {};
            const [total, active, cancelled, expired] = yield Promise.all([
                Subscription.count({ where: whereClause }),
                Subscription.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'active' }) }),
                Subscription.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'cancelled' }) }),
                Subscription.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'expired' }) })
            ]);
            return { total, active, cancelled, expired };
        });
    }
    // Legacy methods for compatibility with old code
    getPlanPrice() {
        return this.amount / 100; // Convert cents to dollars
    }
    daysRemaining() {
        return this.getRemainingDays();
    }
    extend() {
        return __awaiter(this, void 0, void 0, function* () {
            const extensionTime = (this.type === 'daily' || this.type === null)
                ? 24 * 60 * 60 * 1000 // 24 hours
                : 30 * 24 * 60 * 60 * 1000; // 30 days
            yield this.update({
                expiresAt: new Date(this.expiresAt.getTime() + extensionTime)
            });
        });
    }
    cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update({
                status: 'cancelled',
                cancelledAt: new Date(),
                autoRenew: false,
                nextBillingDate: null
            });
        });
    }
    toPublicJSON() {
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
    }
}
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
        type: sequelize_1.DataTypes.ENUM('active', 'cancelled', 'expired', 'pending'),
        allowNull: false,
        defaultValue: 'pending'
    },
    kushkiSubscriptionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('card', 'cash', 'transfer'),
        allowNull: false,
        defaultValue: 'card'
    },
    autoRenew: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    },
    nextBillingDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    cancelledAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    cancelReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    retryCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    maxRetries: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        validate: {
            min: 0
        }
    },
    features: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: () => {
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
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
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
                kushki_subscription_id: {
                    [require('sequelize').Op.ne]: null
                }
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
        beforeCreate: (subscription) => {
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
        beforeUpdate: (subscription) => {
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
