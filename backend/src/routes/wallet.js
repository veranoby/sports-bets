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
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var auth_2 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var models_1 = require("../models");
var express_validator_1 = require("express-validator");
var database_1 = require("../config/database");
var sequelize_1 = require("sequelize");
var settingsMiddleware_1 = require("../middleware/settingsMiddleware");
var router = (0, express_1.Router)();
// Apply wallet feature gate to all routes
router.use(settingsMiddleware_1.requireWallets);
// 🔒 ROLE RESTRICTION: Only 'user' and 'gallera' roles can access wallet
router.use(function (req, res, next) {
    var _a;
    if (!['user', 'gallera'].includes(((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || '')) {
        return res.status(403).json({
            success: false,
            error: 'Wallet access denied',
            message: 'Your role does not have wallet privileges'
        });
    }
    next();
});
// ⚡ ULTRA OPTIMIZED: Wallet GET with aggressive caching and error recovery
router.get("/", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cacheKey, walletData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cacheKey = "wallet_main_".concat(req.user.id);
                return [4 /*yield*/, (0, database_1.retryOperation)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                                        var wallet, newWallet, error_1, walletJson;
                                        var _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0: return [4 /*yield*/, models_1.Wallet.findOne({
                                                        where: { userId: req.user.id },
                                                        include: [
                                                            {
                                                                model: models_1.Transaction,
                                                                as: "transactions",
                                                                limit: 10,
                                                                order: [["createdAt", "DESC"]],
                                                                separate: false,
                                                            },
                                                        ],
                                                    })];
                                                case 1:
                                                    wallet = _b.sent();
                                                    if (!!wallet) return [3 /*break*/, 5];
                                                    // ⚡ CRITICAL FIX: Auto-create wallet if missing (prevents 503 errors)
                                                    console.log("Auto-creating wallet for user ".concat(req.user.id));
                                                    _b.label = 2;
                                                case 2:
                                                    _b.trys.push([2, 4, , 5]);
                                                    return [4 /*yield*/, models_1.Wallet.create({
                                                            userId: req.user.id,
                                                            balance: 0,
                                                            frozenAmount: 0,
                                                        })];
                                                case 3:
                                                    newWallet = _b.sent();
                                                    console.log("Wallet created successfully: ".concat(newWallet.id));
                                                    return [2 /*return*/, {
                                                            wallet: newWallet.toPublicJSON(),
                                                            recentTransactions: []
                                                        }];
                                                case 4:
                                                    error_1 = _b.sent();
                                                    console.error("Failed to create wallet for user ".concat(req.user.id, ":"), error_1);
                                                    throw new Error("Wallet service unavailable: ".concat(error_1.message));
                                                case 5:
                                                    walletJson = wallet.toJSON();
                                                    return [2 /*return*/, {
                                                            wallet: wallet.toPublicJSON(),
                                                            recentTransactions: ((_a = walletJson.transactions) === null || _a === void 0 ? void 0 : _a.map(function (t) { var _a; return ((_a = t.toPublicJSON) === null || _a === void 0 ? void 0 : _a.call(t)) || t; })) || [],
                                                        }];
                                            }
                                        });
                                    }); }, 60)];
                                case 1: return [2 /*return*/, _a.sent()]; // ⚡ 1 minute cache for wallet data (frequently accessed)
                            }
                        });
                    }); }, 2, 500)];
            case 1:
                walletData = _a.sent();
                res.json({
                    success: true,
                    data: walletData,
                });
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ OPTIMIZED: Wallet transactions with enhanced caching
router.get("/transactions", auth_1.authenticate, [
// Validaciones opcionales para filtros
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, type, status, _b, limit, _c, offset, dateFrom, dateTo, where, wallet, cacheKey, transactions;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = req.query, type = _a.type, status = _a.status, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c, dateFrom = _a.dateFrom, dateTo = _a.dateTo;
                where = {};
                if (type)
                    where.type = type;
                if (status)
                    where.status = status;
                // Filtros de fecha
                if (dateFrom || dateTo) {
                    where.createdAt = {};
                    if (dateFrom)
                        where.createdAt[sequelize_1.Op.gte] = new Date(dateFrom);
                    if (dateTo)
                        where.createdAt[sequelize_1.Op.lte] = new Date(dateTo);
                }
                return [4 /*yield*/, models_1.Wallet.findOne({
                        where: { userId: req.user.id },
                    })];
            case 1:
                wallet = _d.sent();
                if (!!wallet) return [3 /*break*/, 3];
                return [4 /*yield*/, models_1.Wallet.create({
                        userId: req.user.id,
                        balance: 0,
                        frozenAmount: 0,
                    })];
            case 2:
                // ⚡ AUTO-CREATE: Create wallet if missing to prevent 503s
                wallet = _d.sent();
                _d.label = 3;
            case 3:
                cacheKey = "wallet_transactions_".concat(wallet.id, "_").concat(limit, "_").concat(offset, "_").concat(JSON.stringify(where));
                return [4 /*yield*/, (0, database_1.retryOperation)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, models_1.Transaction.findAndCountAll({
                                                        where: __assign({ walletId: wallet.id }, where),
                                                        order: [["createdAt", "DESC"]],
                                                        limit: parseInt(limit),
                                                        offset: parseInt(offset),
                                                    })];
                                                case 1: return [2 /*return*/, _a.sent()];
                                            }
                                        });
                                    }); }, 30)];
                                case 1: return [2 /*return*/, _a.sent()]; // ⚡ 30 second cache for transaction queries
                            }
                        });
                    }); })];
            case 4:
                transactions = _d.sent();
                res.json({
                    success: true,
                    data: {
                        transactions: transactions.rows.map(function (t) { return t.toPublicJSON(); }),
                        total: transactions.count,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ OPTIMIZED: Deposit with cache invalidation
router.post("/deposit", auth_1.authenticate, [
    (0, express_validator_1.body)("amount")
        .isFloat({ min: 10, max: 10000 })
        .withMessage("Amount must be between 10 and 10000"),
    (0, express_validator_1.body)("paymentMethod")
        .isIn(["card", "transfer"])
        .withMessage("Payment method must be card or transfer"),
    (0, express_validator_1.body)("paymentData")
        .optional()
        .isObject()
        .withMessage("Payment data must be an object"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, amount, paymentMethod, paymentData, wallet;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, amount = _a.amount, paymentMethod = _a.paymentMethod, paymentData = _a.paymentData;
                return [4 /*yield*/, models_1.Wallet.findOne({
                        where: { userId: req.user.id },
                    })];
            case 1:
                wallet = _b.sent();
                if (!!wallet) return [3 /*break*/, 3];
                return [4 /*yield*/, models_1.Wallet.create({
                        userId: req.user.id,
                        balance: 0,
                        frozenAmount: 0,
                    })];
            case 2:
                wallet = _b.sent();
                _b.label = 3;
            case 3: return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                    var depositTransaction;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, models_1.Transaction.create({
                                    walletId: wallet.id,
                                    type: "deposit",
                                    amount: amount,
                                    status: "pending",
                                    description: "Deposit via ".concat(paymentMethod),
                                    metadata: {
                                        paymentMethod: paymentMethod,
                                        paymentData: paymentData,
                                        requestedAt: new Date(),
                                    },
                                }, { transaction: t })];
                            case 1:
                                depositTransaction = _a.sent();
                                if (!(process.env.NODE_ENV === "development")) return [3 /*break*/, 5];
                                // Completar transacción inmediatamente en desarrollo
                                depositTransaction.status = "completed";
                                depositTransaction.reference = "DEV_".concat(Date.now());
                                return [4 /*yield*/, depositTransaction.save({ transaction: t })];
                            case 2:
                                _a.sent();
                                // Agregar fondos al wallet
                                return [4 /*yield*/, wallet.addBalance(amount)];
                            case 3:
                                // Agregar fondos al wallet
                                _a.sent();
                                // ⚡ OPTIMIZATION: Invalidate wallet cache after deposit
                                return [4 /*yield*/, database_1.cache.invalidatePattern("wallet_*_".concat(req.user.id))];
                            case 4:
                                // ⚡ OPTIMIZATION: Invalidate wallet cache after deposit
                                _a.sent();
                                res.status(201).json({
                                    success: true,
                                    message: "Deposit completed successfully (development mode)",
                                    data: {
                                        transaction: depositTransaction.toPublicJSON(),
                                        wallet: wallet.toPublicJSON(),
                                    },
                                });
                                return [3 /*break*/, 6];
                            case 5:
                                // En producción, la transacción quedaría pendiente hasta confirmación del webhook
                                res.status(201).json({
                                    success: true,
                                    message: "Deposit request created successfully",
                                    data: {
                                        transaction: depositTransaction.toPublicJSON(),
                                        paymentUrl: "".concat(process.env.FRONTEND_URL, "/payment/").concat(depositTransaction.id), // URL de pago
                                    },
                                });
                                _a.label = 6;
                            case 6: return [2 /*return*/];
                        }
                    });
                }); })];
            case 4:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ OPTIMIZED: Withdrawal with cache invalidation
router.post("/withdraw", auth_1.authenticate, [
    (0, express_validator_1.body)("amount")
        .isFloat({ min: 10, max: 50000 })
        .withMessage("Amount must be between 10 and 50000"),
    (0, express_validator_1.body)("accountNumber")
        .isLength({ min: 10, max: 50 })
        .withMessage("Account number must be between 10 and 50 characters"),
    (0, express_validator_1.body)("accountType")
        .optional()
        .isIn(["checking", "savings"])
        .withMessage("Account type must be checking or savings"),
    (0, express_validator_1.body)("bankName")
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage("Bank name must be between 3 and 100 characters"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, amount, accountNumber, accountType, bankName, wallet, today, cacheKey, todayWithdrawals, dailyLimit;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, amount = _a.amount, accountNumber = _a.accountNumber, accountType = _a.accountType, bankName = _a.bankName;
                return [4 /*yield*/, models_1.Wallet.findOne({
                        where: { userId: req.user.id },
                    })];
            case 1:
                wallet = _b.sent();
                if (!!wallet) return [3 /*break*/, 3];
                return [4 /*yield*/, models_1.Wallet.create({
                        userId: req.user.id,
                        balance: 0,
                        frozenAmount: 0,
                    })];
            case 2:
                wallet = _b.sent();
                _b.label = 3;
            case 3:
                // Verificar que tiene suficiente balance disponible
                if (!wallet.canWithdraw(amount)) {
                    throw errorHandler_1.errors.badRequest("Insufficient available balance");
                }
                today = new Date();
                today.setHours(0, 0, 0, 0);
                cacheKey = "daily_withdrawals_".concat(wallet.id, "_").concat(today.toISOString().split('T')[0]);
                return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, models_1.Transaction.sum("amount", {
                                        where: {
                                            walletId: wallet.id,
                                            type: "withdrawal",
                                            status: ["pending", "completed"],
                                            createdAt: (_a = {},
                                                _a[sequelize_1.Op.gte] = today,
                                                _a),
                                        },
                                    })];
                                case 1: return [2 /*return*/, (_b.sent()) || 0];
                            }
                        });
                    }); }, 300)];
            case 4:
                todayWithdrawals = _b.sent();
                dailyLimit = parseFloat(process.env.MAX_WITHDRAWAL_DAILY || "5000");
                if (todayWithdrawals + amount > dailyLimit) {
                    throw errorHandler_1.errors.badRequest("Daily withdrawal limit exceeded. Remaining: $".concat(dailyLimit - todayWithdrawals));
                }
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var withdrawalTransaction;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Transaction.create({
                                        walletId: wallet.id,
                                        type: "withdrawal",
                                        amount: amount,
                                        status: "pending",
                                        description: "Withdrawal to ".concat(accountNumber),
                                        metadata: {
                                            accountNumber: accountNumber.slice(-4), // Solo almacenar últimos 4 dígitos por seguridad
                                            accountType: accountType,
                                            bankName: bankName,
                                            requestedAt: new Date(),
                                            fullAccountNumber: accountNumber, // En un caso real, esto debería estar encriptado
                                        },
                                    }, { transaction: t })];
                                case 1:
                                    withdrawalTransaction = _a.sent();
                                    // Congelar fondos inmediatamente
                                    return [4 /*yield*/, wallet.freezeAmount(amount)];
                                case 2:
                                    // Congelar fondos inmediatamente
                                    _a.sent();
                                    // ⚡ OPTIMIZATION: Invalidate wallet and daily limit caches
                                    return [4 /*yield*/, Promise.all([
                                            database_1.cache.invalidatePattern("wallet_*_".concat(req.user.id)),
                                            database_1.cache.invalidate(cacheKey)
                                        ])];
                                case 3:
                                    // ⚡ OPTIMIZATION: Invalidate wallet and daily limit caches
                                    _a.sent();
                                    res.status(201).json({
                                        success: true,
                                        message: "Withdrawal request created successfully. Processing within 24-48 hours.",
                                        data: {
                                            transaction: withdrawalTransaction.toPublicJSON(),
                                            wallet: wallet.toPublicJSON(),
                                        },
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 5:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ ULTRA OPTIMIZED: Balance endpoint with micro-caching
router.get("/balance", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cacheKey, walletBalance;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cacheKey = "wallet_balance_".concat(req.user.id);
                return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var wallet;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Wallet.findOne({
                                        where: { userId: req.user.id },
                                    })];
                                case 1:
                                    wallet = _a.sent();
                                    if (!!wallet) return [3 /*break*/, 3];
                                    return [4 /*yield*/, models_1.Wallet.create({
                                            userId: req.user.id,
                                            balance: 0,
                                            frozenAmount: 0,
                                        })];
                                case 2:
                                    wallet = _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/, wallet.toPublicJSON()];
                            }
                        });
                    }); }, 30)];
            case 1:
                walletBalance = _a.sent();
                res.json({
                    success: true,
                    data: walletBalance,
                });
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ OPTIMIZED: Stats with caching
router.get("/stats", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var wallet, cacheKey, stats;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Wallet.findOne({
                    where: { userId: req.user.id },
                })];
            case 1:
                wallet = _a.sent();
                if (!!wallet) return [3 /*break*/, 3];
                return [4 /*yield*/, models_1.Wallet.create({
                        userId: req.user.id,
                        balance: 0,
                        frozenAmount: 0,
                    })];
            case 2:
                wallet = _a.sent();
                _a.label = 3;
            case 3:
                cacheKey = "wallet_stats_".concat(wallet.id, "_monthly");
                return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var lastMonth, monthlyStats;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    lastMonth = new Date();
                                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                                    return [4 /*yield*/, models_1.Transaction.findAll({
                                            where: {
                                                walletId: wallet.id,
                                                createdAt: (_a = {},
                                                    _a[sequelize_1.Op.gte] = lastMonth,
                                                    _a),
                                            },
                                            attributes: ["type", "status", "amount"],
                                            raw: true,
                                        })];
                                case 1:
                                    monthlyStats = _b.sent();
                                    return [2 /*return*/, {
                                            totalDeposits: monthlyStats
                                                .filter(function (t) { return t.type === "deposit" && t.status === "completed"; })
                                                .reduce(function (sum, t) { return sum + parseFloat(String(t.amount)); }, 0),
                                            totalWithdrawals: monthlyStats
                                                .filter(function (t) { return t.type === "withdrawal" && t.status === "completed"; })
                                                .reduce(function (sum, t) { return sum + parseFloat(String(t.amount)); }, 0),
                                            totalBetWins: monthlyStats
                                                .filter(function (t) { return t.type === "bet-win"; })
                                                .reduce(function (sum, t) { return sum + parseFloat(String(t.amount)); }, 0),
                                            totalBetLosses: monthlyStats
                                                .filter(function (t) { return t.type === "bet-loss"; })
                                                .reduce(function (sum, t) { return sum + parseFloat(String(t.amount)); }, 0),
                                            pendingTransactions: monthlyStats.filter(function (t) { return t.status === "pending"; }).length,
                                            currentBalance: wallet.toPublicJSON(),
                                        }];
                            }
                        });
                    }); }, 300)];
            case 4:
                stats = _a.sent();
                res.json({
                    success: true,
                    data: stats,
                });
                return [2 /*return*/];
        }
    });
}); }));
// ⚡ OPTIMIZATION: Process payment with cache invalidation
router.post("/process-payment", 
// En producción, aquí iría validación de webhook de Kushki
[
    (0, express_validator_1.body)("transactionId").isString(),
    (0, express_validator_1.body)("status").isIn(["approved", "rejected"]),
    (0, express_validator_1.body)("reference").isString(),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, transactionId, status, reference;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, transactionId = _a.transactionId, status = _a.status, reference = _a.reference;
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var depositTransaction, wallet, user;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Transaction.findOne({
                                        where: {
                                            id: transactionId,
                                            status: "pending",
                                        },
                                        transaction: t,
                                    })];
                                case 1:
                                    depositTransaction = _a.sent();
                                    if (!depositTransaction) {
                                        throw errorHandler_1.errors.notFound("Transaction not found");
                                    }
                                    if (!(status === "approved")) return [3 /*break*/, 8];
                                    depositTransaction.status = "completed";
                                    depositTransaction.reference = reference;
                                    return [4 /*yield*/, depositTransaction.save({ transaction: t })];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, models_1.Wallet.findByPk(depositTransaction.walletId, {
                                            transaction: t,
                                        })];
                                case 3:
                                    wallet = _a.sent();
                                    if (!wallet) return [3 /*break*/, 7];
                                    return [4 /*yield*/, wallet.addBalance(depositTransaction.amount)];
                                case 4:
                                    _a.sent();
                                    return [4 /*yield*/, models_1.User.findByPk(wallet.userId)];
                                case 5:
                                    user = _a.sent();
                                    if (!user) return [3 /*break*/, 7];
                                    return [4 /*yield*/, database_1.cache.invalidatePattern("wallet_*_".concat(user.id))];
                                case 6:
                                    _a.sent();
                                    _a.label = 7;
                                case 7: return [3 /*break*/, 10];
                                case 8:
                                    depositTransaction.status = "failed";
                                    return [4 /*yield*/, depositTransaction.save({ transaction: t })];
                                case 9:
                                    _a.sent();
                                    _a.label = 10;
                                case 10:
                                    res.json({
                                        success: true,
                                        message: "Payment processed successfully",
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 1:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); }));
// Admin routes - no changes needed for core functionality
router.get("/withdrawal-requests", auth_1.authenticate, (0, auth_2.authorize)("admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var transactions;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Transaction.findAll({
                    where: { type: "withdrawal" },
                    include: [{ model: models_1.User, as: "user", separate: false }],
                    order: [["createdAt", "DESC"]],
                })];
            case 1:
                transactions = _a.sent();
                res.json({
                    success: true,
                    data: { requests: transactions },
                });
                return [2 /*return*/];
        }
    });
}); }));
router.get("/financial-metrics", auth_1.authenticate, (0, auth_2.authorize)("admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cacheKey, metrics;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cacheKey = 'admin_financial_metrics';
                return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = {};
                                    return [4 /*yield*/, models_1.Transaction.sum("amount", {
                                            where: { type: "deposit", status: "completed" },
                                        })];
                                case 1:
                                    _a.totalDeposits = (_b.sent()) || 0;
                                    return [4 /*yield*/, models_1.Transaction.sum("amount", {
                                            where: { type: "withdrawal", status: "completed" },
                                        })];
                                case 2: return [2 /*return*/, (_a.totalWithdrawals = (_b.sent()) || 0,
                                        _a)];
                            }
                        });
                    }); }, 300)];
            case 1:
                metrics = _a.sent();
                res.json({ success: true, data: metrics });
                return [2 /*return*/];
        }
    });
}); }));
router.get("/revenue-by-source", auth_1.authenticate, (0, auth_2.authorize)("admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var cacheKey, revenueBySource;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cacheKey = 'admin_revenue_by_source';
                return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.Transaction.findAll({
                                        attributes: [
                                            "type",
                                            [(0, sequelize_1.fn)("SUM", (0, sequelize_1.col)("amount")), "total"],
                                            [(0, sequelize_1.fn)("COUNT", "*"), "count"],
                                        ],
                                        where: {
                                            status: "completed",
                                        },
                                        group: ["type"],
                                        raw: true,
                                    })];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); }, 600)];
            case 1:
                revenueBySource = _a.sent();
                res.json({
                    success: true,
                    data: { revenueBySource: revenueBySource },
                });
                return [2 /*return*/];
        }
    });
}); }));
router.get("/revenue-trends", auth_1.authenticate, (0, auth_2.authorize)("admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, period, _c, days, dateFormat, startDate, cacheKey, trends;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = req.query, _b = _a.period, period = _b === void 0 ? "daily" : _b, _c = _a.days, days = _c === void 0 ? 30 : _c;
                dateFormat = "%Y-%m-%d";
                if (period === "monthly") {
                    dateFormat = "%Y-%m";
                }
                startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(days));
                cacheKey = "admin_revenue_trends_".concat(period, "_").concat(days);
                return [4 /*yield*/, database_1.cache.getOrSet(cacheKey, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, models_1.Transaction.findAll({
                                        attributes: [
                                            [(0, sequelize_1.fn)("DATE_FORMAT", (0, sequelize_1.col)("created_at"), dateFormat), "date"],
                                            "type",
                                            [(0, sequelize_1.fn)("SUM", (0, sequelize_1.col)("amount")), "amount"],
                                            [(0, sequelize_1.fn)("COUNT", "*"), "count"],
                                        ],
                                        where: {
                                            status: "completed",
                                            createdAt: (_a = {},
                                                _a[sequelize_1.Op.gte] = startDate,
                                                _a),
                                        },
                                        group: [(0, sequelize_1.fn)("DATE_FORMAT", (0, sequelize_1.col)("created_at"), dateFormat), "type"],
                                        order: [[(0, sequelize_1.fn)("DATE_FORMAT", (0, sequelize_1.col)("created_at"), dateFormat), "DESC"]],
                                        raw: true,
                                    })];
                                case 1: return [2 /*return*/, _b.sent()];
                            }
                        });
                    }); }, 300)];
            case 1:
                trends = _d.sent();
                res.json({
                    success: true,
                    data: { trends: trends, period: period, days: days },
                });
                return [2 /*return*/];
        }
    });
}); }));
router.get("/user/:userId", auth_1.authenticate, (0, auth_2.authorize)("admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var wallet;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, models_1.Wallet.findOne({
                    where: { userId: req.params.userId },
                    include: [
                        {
                            model: models_1.User,
                            as: "user",
                            separate: false,
                        },
                        {
                            model: models_1.Transaction,
                            as: "transactions",
                            limit: 10,
                            order: [["createdAt", "DESC"]],
                            separate: false,
                        },
                    ],
                })];
            case 1:
                wallet = _b.sent();
                if (!wallet) {
                    throw errorHandler_1.errors.notFound("Wallet not found for this user");
                }
                res.json({
                    success: true,
                    data: {
                        wallet: wallet.toPublicJSON(),
                        user: wallet.user,
                        recentTransactions: ((_a = wallet.transactions) === null || _a === void 0 ? void 0 : _a.map(function (t) { var _a; return ((_a = t.toPublicJSON) === null || _a === void 0 ? void 0 : _a.call(t)) || t; })) || [],
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
