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
exports.PaymentTransaction = void 0;
var sequelize_1 = require("sequelize");
var database_1 = require("../config/database");
// Payment transaction model class
var PaymentTransaction = /** @class */ (function (_super) {
    __extends(PaymentTransaction, _super);
    function PaymentTransaction() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // Instance methods
    PaymentTransaction.prototype.isCompleted = function () {
        return this.status === "completed";
    };
    PaymentTransaction.prototype.isFailed = function () {
        return this.status === "failed";
    };
    PaymentTransaction.prototype.canRetry = function () {
        return this.isFailed() && this.retryAttempt < 3;
    };
    PaymentTransaction.prototype.getFormattedAmount = function () {
        var amount = this.amount / 100; // Convert cents to dollars
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: this.currency,
        }).format(amount);
    };
    PaymentTransaction.prototype.markAsCompleted = function (kushkiData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.update({
                            status: "completed",
                            processedAt: new Date(),
                            kushkiResponse: kushkiData,
                            errorCode: null,
                            errorMessage: null,
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PaymentTransaction.prototype.markAsFailed = function (errorCode, errorMessage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.update({
                            status: "failed",
                            failedAt: new Date(),
                            errorCode: errorCode,
                            errorMessage: errorMessage,
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PaymentTransaction.prototype.incrementRetryAttempt = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.update({
                            retryAttempt: this.retryAttempt + 1,
                            status: "pending",
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Static methods
    PaymentTransaction.findByKushkiPaymentId = function (kushkiPaymentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PaymentTransaction.findOne({
                            where: { kushkiPaymentId: kushkiPaymentId },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PaymentTransaction.findBySubscriptionId = function (subscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PaymentTransaction.findAll({
                            where: { subscriptionId: subscriptionId },
                            order: [["createdAt", "DESC"]],
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PaymentTransaction.findFailedTransactions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, PaymentTransaction.findAll({
                            where: {
                                status: "failed",
                                retryAttempt: (_a = {},
                                    _a[require("sequelize").Op.lt] = 3,
                                    _a),
                            },
                            order: [["failedAt", "ASC"]],
                        })];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    PaymentTransaction.getTransactionStats = function (subscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var transactions, completed, failed, totalAmount, lastPayment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PaymentTransaction.findAll({
                            where: { subscriptionId: subscriptionId },
                        })];
                    case 1:
                        transactions = _a.sent();
                        completed = transactions.filter(function (t) { return t.status === "completed"; });
                        failed = transactions.filter(function (t) { return t.status === "failed"; });
                        totalAmount = completed.reduce(function (sum, t) { return sum + t.amount; }, 0);
                        lastPayment = completed.length > 0
                            ? new Date(Math.max.apply(Math, completed.map(function (t) { var _a; return ((_a = t.processedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0; })))
                            : undefined;
                        return [2 /*return*/, {
                                totalAmount: totalAmount,
                                successfulPayments: completed.length,
                                failedPayments: failed.length,
                                lastPayment: lastPayment,
                            }];
                }
            });
        });
    };
    return PaymentTransaction;
}(sequelize_1.Model));
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
                kushkiPaymentId: (_a = {},
                    _a[require("sequelize").Op.ne] = null,
                    _a),
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
        beforeCreate: function (transaction) {
            // Set processing timestamp for non-pending transactions
            if (transaction.status === "processing") {
                transaction.processedAt = new Date();
            }
        },
        beforeUpdate: function (transaction) {
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
