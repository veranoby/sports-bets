import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Wallet, Transaction, User } from "../models";
import { body, validationResult } from "express-validator";
import { transaction, retryOperation, sequelize, cache } from "../config/database";
import { Op, fn, col } from "sequelize";
import { requireWallets, injectCommissionSettings } from "../middleware/settingsMiddleware";

const router = Router();

// Apply wallet feature gate to all routes
router.use(requireWallets);

// ⚡ ULTRA OPTIMIZED: Wallet GET with aggressive caching and error recovery
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    // ⚡ CRITICAL OPTIMIZATION: Cache user wallet data
    const cacheKey = `wallet_main_${req.user!.id}`;

    const walletData = await retryOperation(async () => {
      return await cache.getOrSet(cacheKey, async () => {
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
          // ⚡ CRITICAL FIX: Auto-create wallet if missing (prevents 503 errors)
          console.log(`Auto-creating wallet for user ${req.user!.id}`);
          try {
            const newWallet = await Wallet.create({
              userId: req.user!.id,
              balance: 0,
              frozenAmount: 0,
            });

            console.log(`Wallet created successfully: ${newWallet.id}`);
            return {
              wallet: newWallet.toPublicJSON(),
              recentTransactions: []
            };
          } catch (error) {
            console.error(`Failed to create wallet for user ${req.user!.id}:`, error);
            throw new Error(`Wallet service unavailable: ${error.message}`);
          }
        }

        const walletJson = wallet.toJSON() as any;

        return {
          wallet: wallet.toPublicJSON(),
          recentTransactions:
            walletJson.transactions?.map((t: any) => t.toPublicJSON?.() || t) || [],
        };
      }, 60); // ⚡ 1 minute cache for wallet data (frequently accessed)
    }, 2, 500); // ⚡ Retry with shorter delays for wallet endpoints

    res.json({
      success: true,
      data: walletData,
    });
  })
);

// ⚡ OPTIMIZED: Wallet transactions with enhanced caching
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

    // ⚡ PERFORMANCE: Get or create wallet with better error handling
    let wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      // ⚡ AUTO-CREATE: Create wallet if missing to prevent 503s
      wallet = await Wallet.create({
        userId: req.user!.id,
        balance: 0,
        frozenAmount: 0,
      });
    }

    // ⚡ OPTIMIZATION: Cache transactions query
    const cacheKey = `wallet_transactions_${wallet.id}_${limit}_${offset}_${JSON.stringify(where)}`;

    const transactions = await retryOperation(async () => {
      return await cache.getOrSet(cacheKey, async () => {
        return await Transaction.findAndCountAll({
          where: {
            walletId: wallet.id,
            ...where,
          },
          order: [["createdAt", "DESC"]],
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        });
      }, 30); // ⚡ 30 second cache for transaction queries
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

// ⚡ OPTIMIZED: Deposit with cache invalidation
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

    // ⚡ PERFORMANCE: Get or create wallet
    let wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user!.id,
        balance: 0,
        frozenAmount: 0,
      });
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

        // ⚡ OPTIMIZATION: Invalidate wallet cache after deposit
        await cache.invalidatePattern(`wallet_*_${req.user!.id}`);

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

// ⚡ OPTIMIZED: Withdrawal with cache invalidation
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

    // ⚡ PERFORMANCE: Get or create wallet
    let wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user!.id,
        balance: 0,
        frozenAmount: 0,
      });
    }

    // Verificar que tiene suficiente balance disponible
    if (!wallet.canWithdraw(amount)) {
      throw errors.badRequest("Insufficient available balance");
    }

    // ⚡ OPTIMIZATION: Cache daily withdrawals query
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cacheKey = `daily_withdrawals_${wallet.id}_${today.toISOString().split('T')[0]}`;

    const todayWithdrawals = await cache.getOrSet(cacheKey, async () => {
      return await Transaction.sum("amount", {
        where: {
          walletId: wallet.id,
          type: "withdrawal",
          status: ["pending", "completed"],
          createdAt: {
            [Op.gte]: today,
          },
        },
      }) || 0;
    }, 300); // ⚡ 5 minute cache for daily limits

    const dailyLimit = parseFloat(process.env.MAX_WITHDRAWAL_DAILY || "5000");
    if (todayWithdrawals + amount > dailyLimit) {
      throw errors.badRequest(
        `Daily withdrawal limit exceeded. Remaining: $${
          dailyLimit - todayWithdrawals
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

      // ⚡ OPTIMIZATION: Invalidate wallet and daily limit caches
      await Promise.all([
        cache.invalidatePattern(`wallet_*_${req.user!.id}`),
        cache.invalidate(cacheKey)
      ]);

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

// ⚡ ULTRA OPTIMIZED: Balance endpoint with micro-caching
router.get(
  "/balance",
  authenticate,
  asyncHandler(async (req, res) => {
    // ⚡ MICRO-CACHE: Very short cache for balance queries (30 seconds)
    const cacheKey = `wallet_balance_${req.user!.id}`;

    const walletBalance = await cache.getOrSet(cacheKey, async () => {
      let wallet = await Wallet.findOne({
        where: { userId: req.user!.id },
      });

      if (!wallet) {
        wallet = await Wallet.create({
          userId: req.user!.id,
          balance: 0,
          frozenAmount: 0,
        });
      }

      return wallet.toPublicJSON();
    }, 30); // ⚡ 30 second micro-cache for balance

    res.json({
      success: true,
      data: walletBalance,
    });
  })
);

// ⚡ OPTIMIZED: Stats with caching
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (req, res) => {
    // ⚡ PERFORMANCE: Get or create wallet
    let wallet = await Wallet.findOne({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user!.id,
        balance: 0,
        frozenAmount: 0,
      });
    }

    // ⚡ OPTIMIZATION: Cache monthly stats
    const cacheKey = `wallet_stats_${wallet.id}_monthly`;

    const stats = await cache.getOrSet(cacheKey, async () => {
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

      return {
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
    }, 300); // ⚡ 5 minute cache for stats

    res.json({
      success: true,
      data: stats,
    });
  })
);

// ⚡ OPTIMIZATION: Process payment with cache invalidation
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

          // ⚡ OPTIMIZATION: Invalidate user's wallet cache
          const user = await User.findByPk(wallet.userId);
          if (user) {
            await cache.invalidatePattern(`wallet_*_${user.id}`);
          }
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

// Admin routes - no changes needed for core functionality
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

router.get(
  "/financial-metrics",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    // ⚡ OPTIMIZATION: Cache admin financial metrics
    const cacheKey = 'admin_financial_metrics';

    const metrics = await cache.getOrSet(cacheKey, async () => {
      return {
        totalDeposits: await Transaction.sum("amount", {
          where: { type: "deposit", status: "completed" },
        }) || 0,
        totalWithdrawals: await Transaction.sum("amount", {
          where: { type: "withdrawal", status: "completed" },
        }) || 0,
      };
    }, 300); // ⚡ 5 minute cache for admin metrics

    res.json({ success: true, data: metrics });
  })
);

router.get(
  "/revenue-by-source",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    // ⚡ OPTIMIZATION: Cache revenue source data
    const cacheKey = 'admin_revenue_by_source';

    const revenueBySource = await cache.getOrSet(cacheKey, async () => {
      return await Transaction.findAll({
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
    }, 600); // ⚡ 10 minute cache for revenue data

    res.json({
      success: true,
      data: { revenueBySource },
    });
  })
);

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

    // ⚡ OPTIMIZATION: Cache revenue trends
    const cacheKey = `admin_revenue_trends_${period}_${days}`;

    const trends = await cache.getOrSet(cacheKey, async () => {
      return await Transaction.findAll({
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
    }, 300); // ⚡ 5 minute cache for trends

    res.json({
      success: true,
      data: { trends, period, days },
    });
  })
);

router.get(
  "/user/:userId",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const wallet = await Wallet.findOne({
      where: { userId: req.params.userId },
      include: [
        {
          model: User,
          as: "user",
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