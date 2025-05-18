import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { Wallet, Transaction, User } from '../models';
import { body, validationResult } from 'express-validator';
import { transaction } from '../config/database';

const router = Router();

// GET /api/wallet - Obtener información del wallet del usuario
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({
    where: { userId: req.user!.id },
    include: [
      {
        model: Transaction,
        as: 'transactions',
        limit: 10,
        order: [['createdAt', 'DESC']]
      }
    ]
  });

  if (!wallet) {
    throw errors.notFound('Wallet not found');
  }

  res.json({
    success: true,
    data: {
      wallet: wallet.toPublicJSON(),
      recentTransactions: wallet.transactions?.map(t => t.toPublicJSON()) || []
    }
  });
}));

// GET /api/wallet/transactions - Obtener historial de transacciones
router.get('/transactions', authenticate, [
  // Validaciones opcionales para filtros
], asyncHandler(async (req, res) => {
  const { type, status, limit = 20, offset = 0, dateFrom, dateTo } = req.query;

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  
  // Filtros de fecha
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[require('sequelize').Op.gte] = new Date(dateFrom as string);
    if (dateTo) where.createdAt[require('sequelize').Op.lte] = new Date(dateTo as string);
  }

  const wallet = await Wallet.findOne({
    where: { userId: req.user!.id }
  });

  if (!wallet) {
    throw errors.notFound('Wallet not found');
  }

  const transactions = await Transaction.findAndCountAll({
    where: {
      walletId: wallet.userId,
      ...where
    },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
    offset: parseInt(offset as string)
  });

  res.json({
    success: true,
    data: {
      transactions: transactions.rows.map(t => t.toPublicJSON()),
      total: transactions.count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    }
  });
}));

// POST /api/wallet/deposit - Solicitar depósito
router.post('/deposit',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 10, max: 10000 })
      .withMessage('Amount must be between 10 and 10000'),
    body('paymentMethod')
      .isIn(['card', 'transfer'])
      .withMessage('Payment method must be card or transfer'),
    body('paymentData')
      .optional()
      .isObject()
      .withMessage('Payment data must be an object')
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest('Validation failed: ' + validationErrors.array().map(err => err.msg).join(', '));
    }

    const { amount, paymentMethod, paymentData } = req.body;

    const wallet = await Wallet.findOne({
      where: { userId: req.user!.id }
    });

    if (!wallet) {
      throw errors.notFound('Wallet not found');
    }

    await transaction(async (t) => {
      // Crear transacción de depósito pendiente
      const depositTransaction = await Transaction.create({
        walletId: wallet.userId,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        description: `Deposit via ${paymentMethod}`,
        metadata: {
          paymentMethod,
          paymentData,
          requestedAt: new Date()
        }
      }, { transaction: t });

      // En un caso real, aquí integraríamos con Kushki u otro proveedor de pagos
      // Por ahora, simularemos el procesamiento

      // Simular procesamiento exitoso (en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        // Completar transacción inmediatamente en desarrollo
        depositTransaction.status = 'completed';
        depositTransaction.reference = `DEV_${Date.now()}`;
        await depositTransaction.save({ transaction: t });

        // Agregar fondos al wallet
        await wallet.addBalance(amount);

        res.status(201).json({
          success: true,
          message: 'Deposit completed successfully (development mode)',
          data: {
            transaction: depositTransaction.toPublicJSON(),
            wallet: wallet.toPublicJSON()
          }
        });
      } else {
        // En producción, la transacción quedaría pendiente hasta confirmación del webhook
        res.status(201).json({
          success: true,
          message: 'Deposit request created successfully',
          data: {
            transaction: depositTransaction.toPublicJSON(),
            paymentUrl: `${process.env.FRONTEND_URL}/payment/${depositTransaction.id}` // URL de pago
          }
        });
      }
    });
  })
);

// POST /api/wallet/withdraw - Solicitar retiro
router.post('/withdraw',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 10, max: 50000 })
      .withMessage('Amount must be between 10 and 50000'),
    body('accountNumber')
      .isLength({ min: 10, max: 50 })
      .withMessage('Account number must be between 10 and 50 characters'),
    body('accountType')
      .optional()
      .isIn(['checking', 'savings'])
      .withMessage('Account type must be checking or savings'),
    body('bankName')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Bank name must be between 3 and 100 characters')
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest('Validation failed: ' + validationErrors.array().map(err => err.msg).join(', '));
    }

    const { amount, accountNumber, accountType, bankName } = req.body;

    const wallet = await Wallet.findOne({
      where: { userId: req.user!.id }
    });

    if (!wallet) {
      throw errors.notFound('Wallet not found');
    }

    // Verificar que tiene suficiente balance disponible
    if (!wallet.canWithdraw(amount)) {
      throw errors.badRequest('Insufficient available balance');
    }

    // Verificar límites diarios (opcional - implementar según requerimientos)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWithdrawals = await Transaction.sum('amount', {
      where: {
        walletId: wallet.userId,
        type: 'withdrawal',
        status: ['pending', 'completed'],
        createdAt: {
          [require('sequelize').Op.gte]: today
        }
      }
    });

    const dailyLimit = parseFloat(process.env.MAX_WITHDRAWAL_DAILY || '5000');
    if ((todayWithdrawals || 0) + amount > dailyLimit) {
      throw errors.badRequest(`Daily withdrawal limit exceeded. Remaining: $${dailyLimit - (todayWithdrawals || 0)}`);
    }

    await transaction(async (t) => {
      // Crear transacción de retiro pendiente
      const withdrawalTransaction = await Transaction.create({
        walletId: wallet.userId,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        description: `Withdrawal to ${accountNumber}`,
        metadata: {
          accountNumber: accountNumber.slice(-4), // Solo almacenar últimos 4 dígitos por seguridad
          accountType,
          bankName,
          requestedAt: new Date(),
          fullAccountNumber: accountNumber // En un caso real, esto debería estar encriptado
        }
      }, { transaction: t });

      // Congelar fondos inmediatamente
      await wallet.freezeAmount(amount);

      res.status(201).json({
        success: true,
        message: 'Withdrawal request created successfully. Processing within 24-48 hours.',
        data: {
          transaction: withdrawalTransaction.toPublicJSON(),
          wallet: wallet.toPublicJSON()
        }
      });
    });
  })
);

// GET /api/wallet/balance - Obtener solo el balance actual
router.get('/balance', authenticate, asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({
    where: { userId: req.user!.id }
  });

  if (!wallet) {
    throw errors.notFound('Wallet not found');
  }

  res.json({
    success: true,
    data: wallet.toPublicJSON()
  });
}));

// GET /api/wallet/stats - Obtener estadísticas del wallet
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({
    where: { userId: req.user!.id }
  });

  if (!wallet) {
    throw errors.notFound('Wallet not found');
  }

  // Obtener estadísticas de transacciones del último mes
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const monthlyStats = await Transaction.findAll({
    where: {
      walletId: wallet.userId,
      createdAt: {
        [require('sequelize').Op.gte]: lastMonth
      }
    },
    attributes: [
      'type',
      'status',
      'amount'
    ],
    raw: true
  });

  const stats = {
    totalDeposits: monthlyStats
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalWithdrawals: monthlyStats
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalBetWins: monthlyStats
      .filter(t => t.type === 'bet-win')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalBetLosses: monthlyStats
      .filter(t => t.type === 'bet-loss')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    pendingTransactions: monthlyStats.filter(t => t.status === 'pending').length,
    currentBalance: wallet.toPublicJSON()
  };

  res.json({
    success: true,
    data: stats
  });
}));

export default router;