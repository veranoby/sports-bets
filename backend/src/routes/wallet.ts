import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Wallet, Transaction, User } from "../models";
import { body, validationResult } from "express-validator";
import { transaction } from "../config/database";
import { Op, fn, col } from "sequelize";

const router = Router();

// GET /api/wallet - Obtener información del wallet del usuario
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
      include: [
        {
          model: Transaction,
          as: "transactions",
          limit: 10,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!wallet) {
      throw errors.notFound("Wallet not found");
    }

    const walletData = wallet.toJSON() as any;

    res.json({
      success: true,
      data: {
        wallet: wallet.toPublicJSON(),
        recentTransactions:
          walletData.transactions?.map((t: any) => t.toPublicJSON?.() || t) ||
          [],
      },
    });
  })
);

// GET /api/wallet/transactions - Obtener historial de transacciones
router.get(
  "/transactions",
  authenticate,
  [
    // Validaciones opcionales para filtros
  ],
  asyncHandler(async (req, res) => {
    const {
      type,
      status,
      limit = 20,
      offset = 0,
      dateFrom,
      dateTo,
    } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    // Filtros de fecha
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom as string);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo as string);
    }

    const wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      throw errors.notFound("Wallet not found");
    }

    const transactions = await Transaction.findAndCountAll({
      where: {
        walletId: wallet.id,
        ...where,
      },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows.map((t) => t.toPublicJSON()),
        total: transactions.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

// POST /api/wallet/deposit - Solicitar depósito
router.post(
  "/deposit",
  authenticate,
  [
    body("amount")
      .isFloat({ min: 10, max: 10000 })
      .withMessage("Amount must be between 10 and 10000"),
    body("paymentMethod")
      .isIn(["card", "transfer"])
      .withMessage("Payment method must be card or transfer"),
    body("paymentData")
      .optional()
      .isObject()
      .withMessage("Payment data must be an object"),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const { amount, paymentMethod, paymentData } = req.body;

    const wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      throw errors.notFound("Wallet not found");
    }

    await transaction(async (t) => {
      // Crear transacción de depósito pendiente
      const depositTransaction = await Transaction.create(
        {
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
        },
        { transaction: t }
      );

      // En un caso real, aquí integraríamos con Kushki u otro proveedor de pagos
      // Por ahora, simularemos el procesamiento

      // Simular procesamiento exitoso (en desarrollo)
      if (process.env.NODE_ENV === "development") {
        // Completar transacción inmediatamente en desarrollo
        depositTransaction.status = "completed";
        depositTransaction.reference = `DEV_${Date.now()}`;
        await depositTransaction.save({ transaction: t });

        // Agregar fondos al wallet
        await wallet.addBalance(amount);

        res.status(201).json({
          success: true,
          message: "Deposit completed successfully (development mode)",
          data: {
            transaction: depositTransaction.toPublicJSON(),
            wallet: wallet.toPublicJSON(),
          },
        });
      } else {
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
    });
  })
);

// POST /api/wallet/withdraw - Solicitar retiro
router.post(
  "/withdraw",
  authenticate,
  [
    body("amount")
      .isFloat({ min: 10, max: 50000 })
      .withMessage("Amount must be between 10 and 50000"),
    body("accountNumber")
      .isLength({ min: 10, max: 50 })
      .withMessage("Account number must be between 10 and 50 characters"),
    body("accountType")
      .optional()
      .isIn(["checking", "savings"])
      .withMessage("Account type must be checking or savings"),
    body("bankName")
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage("Bank name must be between 3 and 100 characters"),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(
        "Validation failed: " +
          validationErrors
            .array()
            .map((err) => err.msg)
            .join(", ")
      );
    }

    const { amount, accountNumber, accountType, bankName } = req.body;

    const wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      throw errors.notFound("Wallet not found");
    }

    // Verificar que tiene suficiente balance disponible
    if (!wallet.canWithdraw(amount)) {
      throw errors.badRequest("Insufficient available balance");
    }

    // Verificar límites diarios (opcional - implementar según requerimientos)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayWithdrawals = await Transaction.sum("amount", {
      where: {
        walletId: wallet.id,
        type: "withdrawal",
        status: ["pending", "completed"],
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    const dailyLimit = parseFloat(process.env.MAX_WITHDRAWAL_DAILY || "5000");
    if ((todayWithdrawals || 0) + amount > dailyLimit) {
      throw errors.badRequest(
        `Daily withdrawal limit exceeded. Remaining: $${
          dailyLimit - (todayWithdrawals || 0)
        }`
      );
    }

    await transaction(async (t) => {
      // Crear transacción de retiro pendiente
      const withdrawalTransaction = await Transaction.create(
        {
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
        },
        { transaction: t }
      );

      // Congelar fondos inmediatamente
      await wallet.freezeAmount(amount);

      res.status(201).json({
        success: true,
        message:
          "Withdrawal request created successfully. Processing within 24-48 hours.",
        data: {
          transaction: withdrawalTransaction.toPublicJSON(),
          wallet: wallet.toPublicJSON(),
        },
      });
    });
  })
);

// GET /api/wallet/balance - Obtener solo el balance actual
router.get(
  "/balance",
  authenticate,
  asyncHandler(async (req, res) => {
    const wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      throw errors.notFound("Wallet not found");
    }

    res.json({
      success: true,
      data: wallet.toPublicJSON(),
    });
  })
);

// GET /api/wallet/stats - Obtener estadísticas del wallet
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (req, res) => {
    const wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      throw errors.notFound("Wallet not found");
    }

    // Obtener estadísticas de transacciones del último mes
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const monthlyStats = await Transaction.findAll({
      where: {
        walletId: wallet.id,
        createdAt: {
          [Op.gte]: lastMonth,
        },
      },
      attributes: ["type", "status", "amount"],
      raw: true,
    });

    const stats = {
      totalDeposits: monthlyStats
        .filter((t: any) => t.type === "deposit" && t.status === "completed")
        .reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0),
      totalWithdrawals: monthlyStats
        .filter((t: any) => t.type === "withdrawal" && t.status === "completed")
        .reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0),
      totalBetWins: monthlyStats
        .filter((t: any) => t.type === "bet-win")
        .reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0),
      totalBetLosses: monthlyStats
        .filter((t: any) => t.type === "bet-loss")
        .reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0),
      pendingTransactions: monthlyStats.filter(
        (t: any) => t.status === "pending"
      ).length,
      currentBalance: wallet.toPublicJSON(),
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

// POST /api/wallet/process-payment - Webhook para procesar pagos (solo sistema)
router.post(
  "/process-payment",
  // En producción, aquí iría validación de webhook de Kushki
  [
    body("transactionId").isString(),
    body("status").isIn(["approved", "rejected"]),
    body("reference").isString(),
  ],
  asyncHandler(async (req, res) => {
    const { transactionId, status, reference } = req.body;

    await transaction(async (t) => {
      // Buscar transacción por referencia
      const depositTransaction = await Transaction.findOne({
        where: {
          id: transactionId,
          status: "pending",
        },
        transaction: t,
      });

      if (!depositTransaction) {
        throw errors.notFound("Transaction not found");
      }

      // Actualizar estado de transacción
      if (status === "approved") {
        depositTransaction.status = "completed";
        depositTransaction.reference = reference;
        await depositTransaction.save({ transaction: t });

        // Actualizar balance del wallet
        const wallet = await Wallet.findByPk(depositTransaction.walletId, {
          transaction: t,
        });

        if (wallet) {
          await wallet.addBalance(depositTransaction.amount);
        }
      } else {
        depositTransaction.status = "failed";
        await depositTransaction.save({ transaction: t });
      }

      res.json({
        success: true,
        message: "Payment processed successfully",
      });
    });
  })
);

// GET /api/wallet/withdrawal-requests
router.get(
  "/withdrawal-requests",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const transactions = await Transaction.findAll({
      where: { type: "withdrawal" },
      include: [{ model: User, as: "user" }],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: { requests: transactions },
    });
  })
);

// GET /api/wallet/financial-metrics
router.get(
  "/financial-metrics",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    // Calcular métricas reales desde el modelo Transaction
    const metrics = {
      totalDeposits: await Transaction.sum("amount", {
        where: { type: "deposit" },
      }),
      totalWithdrawals: await Transaction.sum("amount", {
        where: { type: "withdrawal" },
      }),
      // Agregar más métricas según sea necesario
    };

    res.json({ success: true, data: metrics });
  })
);

// GET /api/wallet/revenue-by-source - Revenue aggregated by transaction type
router.get(
  "/revenue-by-source",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    // Aggregate transactions by type, return totals
    const revenueBySource = await Transaction.findAll({
      attributes: [
        "type",
        [fn("SUM", col("amount")), "total"],
        [fn("COUNT", "*"), "count"],
      ],
      where: {
        status: "completed",
      },
      group: ["type"],
      raw: true,
    });

    res.json({
      success: true,
      data: { revenueBySource },
    });
  })
);

// GET /api/wallet/revenue-trends - Daily/monthly revenue trends
router.get(
  "/revenue-trends",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { period = "daily", days = 30 } = req.query;

    let dateFormat = "%Y-%m-%d"; // daily format
    if (period === "monthly") {
      dateFormat = "%Y-%m";
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const trends = await Transaction.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("created_at"), dateFormat), "date"],
        "type",
        [fn("SUM", col("amount")), "amount"],
        [fn("COUNT", "*"), "count"],
      ],
      where: {
        status: "completed",
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      group: [fn("DATE_FORMAT", col("created_at"), dateFormat), "type"],
      order: [[fn("DATE_FORMAT", col("created_at"), dateFormat), "DESC"]],
      raw: true,
    });

    res.json({
      success: true,
      data: { trends, period, days },
    });
  })
);

// GET /api/wallet/user/:userId - Get specific user's wallet (admin only)
router.get(
  "/user/:userId",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const wallet = await Wallet.findOne({
      where: { userId: req.params.userId },
      include: [
        {
          model: Wallet,
          as: "wallet",
          include: [{ model: User, as: "user" }],
        },
        {
          model: Transaction,
          as: "transactions",
          limit: 10,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!wallet) {
      throw errors.notFound("Wallet not found for this user");
    }

    res.json({
      success: true,
      data: {
        wallet: wallet.toPublicJSON(),
        user: wallet.user,
        recentTransactions:
          wallet.transactions?.map((t: any) => t.toPublicJSON?.() || t) || [],
      },
    });
  })
);

export default router;
