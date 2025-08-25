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
exports.PaymentTransaction = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
// Payment transaction model class
class PaymentTransaction extends sequelize_1.Model {
    // Instance methods
    isCompleted() {
        return this.status === "completed";
    }
    isFailed() {
        return this.status === "failed";
    }
    canRetry() {
        return this.isFailed() && this.retryAttempt < 3;
    }
    getFormattedAmount() {
        const amount = this.amount / 100; // Convert cents to dollars
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: this.currency,
        }).format(amount);
    }
    markAsCompleted(kushkiData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update({
                status: "completed",
                processedAt: new Date(),
                kushkiResponse: kushkiData,
                errorCode: null,
                errorMessage: null,
            });
        });
    }
    markAsFailed(errorCode, errorMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update({
                status: "failed",
                failedAt: new Date(),
                errorCode,
                errorMessage,
            });
        });
    }
    incrementRetryAttempt() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update({
                retryAttempt: this.retryAttempt + 1,
                status: "pending",
            });
        });
    }
    // Static methods
    static findByKushkiPaymentId(kushkiPaymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PaymentTransaction.findOne({
                where: { kushkiPaymentId },
            });
        });
    }
    static findBySubscriptionId(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PaymentTransaction.findAll({
                where: { subscriptionId },
                order: [["createdAt", "DESC"]],
            });
        });
    }
    static findFailedTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PaymentTransaction.findAll({
                where: {
                    status: "failed",
                    retryAttempt: {
                        [require("sequelize").Op.lt]: 3,
                    },
                },
                order: [["failedAt", "ASC"]],
            });
        });
    }
    static getTransactionStats(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield PaymentTransaction.findAll({
                where: { subscriptionId },
            });
            const completed = transactions.filter((t) => t.status === "completed");
            const failed = transactions.filter((t) => t.status === "failed");
            const totalAmount = completed.reduce((sum, t) => sum + t.amount, 0);
            const lastPayment = completed.length > 0
                ? new Date(Math.max(...completed.map((t) => { var _a; return ((_a = t.processedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0; })))
                : undefined;
            return {
                totalAmount,
                successfulPayments: completed.length,
                failedPayments: failed.length,
                lastPayment,
            };
        });
    }
}
exports.PaymentTransaction = PaymentTransaction;
// Define the model
PaymentTransaction.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    subscriptionId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: "subscription_id",
        references: {
            model: "subscriptions",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    kushkiPaymentId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: "kushki_payment_id",
    },
    kushkiTransactionId: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        field: "kushki_transaction_id",
    },
    kushkiTicketNumber: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        field: "kushki_ticket_number",
    },
    type: {
        type: sequelize_1.DataTypes.ENUM("subscription_payment", "one_time_payment", "refund", "chargeback"),
        allowNull: false,
    },
    transactionType: {
        type: sequelize_1.DataTypes.ENUM("subscription_payment", "subscription_refund", "bet_deposit", "bet_withdrawal"),
        allowNull: false,
        field: "transaction_type",
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM("card", "cash", "transfer", "wallet"),
        allowNull: false,
        field: "payment_method",
    },
    idempotencyKey: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        field: "idempotency_key",
    },
    processedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "processed_at",
    },
    retryCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        field: "retry_count",
        defaultValue: 0,
    },
    maxRetries: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        field: "max_retries",
        defaultValue: 3,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("pending", "processing", "completed", "failed", "cancelled", "refunded"),
        allowNull: false,
        defaultValue: "pending",
    },
    amount: {
        type: sequelize_1.DataTypes.INTEGER, // Amount in cents
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "USD",
    },
    cardLast4: {
        type: sequelize_1.DataTypes.STRING(4),
        allowNull: true,
        field: "card_last_4",
    },
    cardBrand: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: "card_brand",
    },
    errorCode: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        field: "error_code",
    },
    errorMessage: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: "error_message",
    },
    kushkiResponse: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    retryAttempt: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 3,
        },
    },
    failedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "failed_at",
    },
    refundedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "refunded_at",
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: "payment_transactions",
    modelName: "PaymentTransaction",
    timestamps: true,
    indexes: [
        {
            fields: ["subscriptionId"],
        },
        {
            fields: ["status"],
        },
        {
            fields: ["type"],
        },
        {
            fields: ["kushkiPaymentId"],
            unique: true,
            where: {
                kushkiPaymentId: {
                    [require("sequelize").Op.ne]: null,
                },
            },
        },
        {
            fields: ["createdAt"],
        },
        {
            fields: ["processedAt"],
        },
        {
            fields: ["failedAt"],
        },
        {
            fields: ["status", "retryAttempt"],
        },
    ],
    hooks: {
        beforeCreate: (transaction) => {
            // Set processing timestamp for non-pending transactions
            if (transaction.status === "processing") {
                transaction.processedAt = new Date();
            }
        },
        beforeUpdate: (transaction) => {
            // Set timestamps based on status changes
            if (transaction.changed("status")) {
                switch (transaction.status) {
                    case "completed":
                        if (!transaction.processedAt) {
                            transaction.processedAt = new Date();
                        }
                        break;
                    case "failed":
                        if (!transaction.failedAt) {
                            transaction.failedAt = new Date();
                        }
                        break;
                    case "refunded":
                        if (!transaction.refundedAt) {
                            transaction.refundedAt = new Date();
                        }
                        break;
                }
            }
        },
    },
});
exports.default = PaymentTransaction;
