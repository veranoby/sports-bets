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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// GET /api/wallet - Obtener información del wallet del usuario
router.get("/", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const wallet = yield models_1.Wallet.findOne({
        where: { userId: req.user.id },
        include: [
            {
                model: models_1.Transaction,
                as: "transactions",
                limit: 10,
                order: [["createdAt", "DESC"]],
            },
        ],
    });
    if (!wallet) {
        throw errorHandler_1.errors.notFound("Wallet not found");
    }
    const walletData = wallet.toJSON();
    res.json({
        success: true,
        data: {
            wallet: wallet.toPublicJSON(),
            recentTransactions: ((_a = walletData.transactions) === null || _a === void 0 ? void 0 : _a.map((t) => { var _a; return ((_a = t.toPublicJSON) === null || _a === void 0 ? void 0 : _a.call(t)) || t; })) ||
                [],
        },
    });
})));
// GET /api/wallet/transactions - Obtener historial de transacciones
router.get("/transactions", auth_1.authenticate, [
// Validaciones opcionales para filtros
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, status, limit = 20, offset = 0, dateFrom, dateTo, } = req.query;
    const where = {};
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
    const wallet = yield models_1.Wallet.findOne({
        where: { userId: req.user.id },
    });
    if (!wallet) {
        throw errorHandler_1.errors.notFound("Wallet not found");
    }
    const transactions = yield models_1.Transaction.findAndCountAll({
        where: Object.assign({ walletId: wallet.id }, where),
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });
    res.json({
        success: true,
        data: {
            transactions: transactions.rows.map((t) => t.toPublicJSON()),
            total: transactions.count,
            limit: parseInt(limit),
            offset: parseInt(offset),
        },
    });
})));
// POST /api/wallet/deposit - Solicitar depósito
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
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { amount, paymentMethod, paymentData } = req.body;
    const wallet = yield models_1.Wallet.findOne({
        where: { userId: req.user.id },
    });
    if (!wallet) {
        throw errorHandler_1.errors.notFound("Wallet not found");
    }
    yield (0, database_1.transaction)((t) => __awaiter(void 0, void 0, void 0, function* () {
        // Crear transacción de depósito pendiente
        const depositTransaction = yield models_1.Transaction.create({
            walletId: wallet.id,
            type: "deposit",
            amount: amount,
            status: "pending",
            description: `Deposit via ${paymentMethod}`,
            metadata: {
                paymentMethod,
                paymentData,
                requestedAt: new Date(),
            },
        }, { transaction: t });
        // En un caso real, aquí integraríamos con Kushki u otro proveedor de pagos
        // Por ahora, simularemos el procesamiento
        // Simular procesamiento exitoso (en desarrollo)
        if (process.env.NODE_ENV === "development") {
            // Completar transacción inmediatamente en desarrollo
            depositTransaction.status = "completed";
            depositTransaction.reference = `DEV_${Date.now()}`;
            yield depositTransaction.save({ transaction: t });
            // Agregar fondos al wallet
            yield wallet.addBalance(amount);
            res.status(201).json({
                success: true,
                message: "Deposit completed successfully (development mode)",
                data: {
                    transaction: depositTransaction.toPublicJSON(),
                    wallet: wallet.toPublicJSON(),
                },
            });
        }
        else {
            // En producción, la transacción quedaría pendiente hasta confirmación del webhook
            res.status(201).json({
                success: true,
                message: "Deposit request created successfully",
                data: {
                    transaction: depositTransaction.toPublicJSON(),
                    paymentUrl: `${process.env.FRONTEND_URL}/payment/${depositTransaction.id}`, // URL de pago
                },
            });
        }
    }));
})));
// POST /api/wallet/withdraw - Solicitar retiro
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
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { amount, accountNumber, accountType, bankName } = req.body;
    const wallet = yield models_1.Wallet.findOne({
        where: { userId: req.user.id },
    });
    if (!wallet) {
        throw errorHandler_1.errors.notFound("Wallet not found");
    }
    // Verificar que tiene suficiente balance disponible
    if (!wallet.canWithdraw(amount)) {
        throw errorHandler_1.errors.badRequest("Insufficient available balance");
    }
    // Verificar límites diarios (opcional - implementar según requerimientos)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWithdrawals = yield models_1.Transaction.sum("amount", {
        where: {
            walletId: wallet.id,
            type: "withdrawal",
            status: ["pending", "completed"],
            createdAt: {
                [sequelize_1.Op.gte]: today,
            },
        },
    });
    const dailyLimit = parseFloat(process.env.MAX_WITHDRAWAL_DAILY || "5000");
    if ((todayWithdrawals || 0) + amount > dailyLimit) {
        throw errorHandler_1.errors.badRequest(`Daily withdrawal limit exceeded. Remaining: $${dailyLimit - (todayWithdrawals || 0)}`);
    }
    yield (0, database_1.transaction)((t) => __awaiter(void 0, void 0, void 0, function* () {
        // Crear transacción de retiro pendiente
        const withdrawalTransaction = yield models_1.Transaction.create({
            walletId: wallet.id,
            type: "withdrawal",
            amount: amount,
            status: "pending",
            description: `Withdrawal to ${accountNumber}`,
            metadata: {
                accountNumber: accountNumber.slice(-4), // Solo almacenar últimos 4 dígitos por seguridad
                accountType,
                bankName,
                requestedAt: new Date(),
                fullAccountNumber: accountNumber, // En un caso real, esto debería estar encriptado
            },
        }, { transaction: t });
        // Congelar fondos inmediatamente
        yield wallet.freezeAmount(amount);
        res.status(201).json({
            success: true,
            message: "Withdrawal request created successfully. Processing within 24-48 hours.",
            data: {
                transaction: withdrawalTransaction.toPublicJSON(),
                wallet: wallet.toPublicJSON(),
            },
        });
    }));
})));
// GET /api/wallet/balance - Obtener solo el balance actual
router.get("/balance", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield models_1.Wallet.findOne({
        where: { userId: req.user.id },
    });
    if (!wallet) {
        throw errorHandler_1.errors.notFound("Wallet not found");
    }
    res.json({
        success: true,
        data: wallet.toPublicJSON(),
    });
})));
// GET /api/wallet/stats - Obtener estadísticas del wallet
router.get("/stats", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield models_1.Wallet.findOne({
        where: { userId: req.user.id },
    });
    if (!wallet) {
        throw errorHandler_1.errors.notFound("Wallet not found");
    }
    // Obtener estadísticas de transacciones del último mes
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthlyStats = yield models_1.Transaction.findAll({
        where: {
            walletId: wallet.id,
            createdAt: {
                [sequelize_1.Op.gte]: lastMonth,
            },
        },
        attributes: ["type", "status", "amount"],
        raw: true,
    });
    const stats = {
        totalDeposits: monthlyStats
            .filter((t) => t.type === "deposit" && t.status === "completed")
            .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0),
        totalWithdrawals: monthlyStats
            .filter((t) => t.type === "withdrawal" && t.status === "completed")
            .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0),
        totalBetWins: monthlyStats
            .filter((t) => t.type === "bet-win")
            .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0),
        totalBetLosses: monthlyStats
            .filter((t) => t.type === "bet-loss")
            .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0),
        pendingTransactions: monthlyStats.filter((t) => t.status === "pending").length,
        currentBalance: wallet.toPublicJSON(),
    };
    res.json({
        success: true,
        data: stats,
    });
})));
// POST /api/wallet/process-payment - Webhook para procesar pagos (solo sistema)
router.post("/process-payment", 
// En producción, aquí iría validación de webhook de Kushki
[
    (0, express_validator_1.body)("transactionId").isString(),
    (0, express_validator_1.body)("status").isIn(["approved", "rejected"]),
    (0, express_validator_1.body)("reference").isString(),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { transactionId, status, reference } = req.body;
    yield (0, database_1.transaction)((t) => __awaiter(void 0, void 0, void 0, function* () {
        // Buscar transacción por referencia
        const depositTransaction = yield models_1.Transaction.findOne({
            where: {
                id: transactionId,
                status: "pending",
            },
            transaction: t,
        });
        if (!depositTransaction) {
            throw errorHandler_1.errors.notFound("Transaction not found");
        }
        // Actualizar estado de transacción
        if (status === "approved") {
            depositTransaction.status = "completed";
            depositTransaction.reference = reference;
            yield depositTransaction.save({ transaction: t });
            // Actualizar balance del wallet
            const wallet = yield models_1.Wallet.findByPk(depositTransaction.walletId, {
                transaction: t,
            });
            if (wallet) {
                yield wallet.addBalance(depositTransaction.amount);
            }
        }
        else {
            depositTransaction.status = "failed";
            yield depositTransaction.save({ transaction: t });
        }
        res.json({
            success: true,
            message: "Payment processed successfully",
        });
    }));
})));
// GET /api/wallet/withdrawal-requests
router.get("/withdrawal-requests", auth_1.authenticate, (0, auth_2.authorize)("admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const transactions = yield models_1.Transaction.findAll({
        where: { type: "withdrawal" },
        include: [{ model: models_1.User, as: "user" }],
        order: [["createdAt", "DESC"]],
    });
    res.json({
        success: true,
        data: { requests: transactions },
    });
})));
// GET /api/wallet/financial-metrics
router.get("/financial-metrics", auth_1.authenticate, (0, auth_2.authorize)("admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Calcular métricas reales desde el modelo Transaction
    const metrics = {
        totalDeposits: yield models_1.Transaction.sum("amount", {
            where: { type: "deposit" },
        }),
        totalWithdrawals: yield models_1.Transaction.sum("amount", {
            where: { type: "withdrawal" },
        }),
        // Agregar más métricas según sea necesario
    };
    res.json({ success: true, data: metrics });
})));
exports.default = router;
