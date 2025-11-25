// backend/src/routes/walletOperations.ts
// API routes for wallet operations (deposits and withdrawals)

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { body, validationResult, query } from 'express-validator';
import { WalletOperation, Wallet, User, Transaction } from '../models';
import { transaction, sequelize } from '../config/database';
import SystemSettingsService from '../services/systemSettingsService';
import { Op } from 'sequelize';
import { logger } from '../config/logger';

const router = Router();

// POST /api/wallet-operations/deposit - Create deposit request
router.post('/deposit',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 1, max: 10000 })
      .withMessage('Amount must be a number between 1 and 10000'),
    body('paymentProofUrl')
      .optional()
      .isURL()
      .withMessage('Payment proof URL must be a valid URL'),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    const { amount, paymentProofUrl } = req.body;
    const userId = req.user!.id;

    // Get deposit limits from system settings
    const [depositMin, depositMax, depositMaxDaily, requireProofOver] = await Promise.all([
      SystemSettingsService.getSettingValue('limits.deposit_min'),
      SystemSettingsService.getSettingValue('limits.deposit_max'),
      SystemSettingsService.getSettingValue('limits.deposit_max_daily'),
      SystemSettingsService.getSettingValue('limits.require_proof_over')
    ]);

    // Validate limits
    if (amount < (depositMin || 5) || amount > (depositMax || 1000)) {
      throw errors.badRequest(`Deposit amount must be between $${depositMin || 5} and $${depositMax || 1000}`);
    }

    if (requireProofOver && amount > requireProofOver && !paymentProofUrl) {
      throw errors.badRequest(`Payment proof is required for deposits over $${requireProofOver}`);
    }

    // Validate daily limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyTotal = await WalletOperation.sum('amount', {
      where: {
        userId,
        type: 'deposit',
        status: ['pending', 'approved', 'completed'],
        createdAt: {
          [Op.gte]: startOfDay
        }
      }
    });

    if ((dailyTotal || 0) + amount > (depositMaxDaily || 5000)) {
      throw errors.badRequest(`Daily deposit limit exceeded. $${dailyTotal || 0} + $${amount} > $${depositMaxDaily || 5000}`);
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({
      where: { userId }
    });

    if (!wallet) {
      throw errors.notFound('User wallet not found');
    }

    // Create wallet operation record
    const walletOperation = await WalletOperation.create({
      userId,
      walletId: wallet.id,
      type: 'deposit',
      amount,
      paymentProofUrl,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Deposit request created successfully',
      data: walletOperation.toPublicJSON()
    });
  })
);

// POST /api/wallet-operations/withdrawal - Create withdrawal request
router.post('/withdrawal',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 1, max: 10000 })
      .withMessage('Amount must be a number between 1 and 10000'),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    const { amount } = req.body;
    const userId = req.user!.id;

    // Get withdrawal limits from system settings
    const [withdrawalMin, withdrawalMax, withdrawalMaxDaily] = await Promise.all([
      SystemSettingsService.getSettingValue('limits.withdrawal_min'),
      SystemSettingsService.getSettingValue('limits.withdrawal_max'),
      SystemSettingsService.getSettingValue('limits.withdrawal_max_daily')
    ]);

    // Validate limits
    if (amount < (withdrawalMin || 10) || amount > (withdrawalMax || 500)) {
      throw errors.badRequest(`Withdrawal amount must be between $${withdrawalMin || 10} and $${withdrawalMax || 500}`);
    }

    // Get user's wallet and check balance
    const wallet = await Wallet.findOne({
      where: { userId }
    });

    if (!wallet) {
      throw errors.notFound('User wallet not found');
    }

    if (wallet.balance < amount) {
      throw errors.badRequest(`Insufficient balance. Current balance: $${wallet.balance}, requested: $${amount}`);
    }

    // Validate daily limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyTotal = await WalletOperation.sum('amount', {
      where: {
        userId,
        type: 'withdrawal',
        status: ['pending', 'approved', 'completed'],
        createdAt: {
          [Op.gte]: startOfDay
        }
      }
    });

    if ((dailyTotal || 0) + amount > (withdrawalMaxDaily || 2000)) {
      throw errors.badRequest(`Daily withdrawal limit exceeded. $${dailyTotal || 0} + $${amount} > $${withdrawalMaxDaily || 2000}`);
    }

    // Create wallet operation record
    const walletOperation = await WalletOperation.create({
      userId,
      walletId: wallet.id,
      type: 'withdrawal',
      amount,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: walletOperation.toPublicJSON()
    });
  })
);

// GET /api/wallet-operations - Get wallet operations
router.get('/',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled', 'completed']).withMessage('Invalid status'),
    query('type').optional().isIn(['deposit', 'withdrawal']).withMessage('Invalid type'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where: any = { userId: req.user!.id };

    if (status) where.status = status;
    if (type) where.type = type;

    // Check user role - admin can see all operations, others see only their own
    let operations, count;
    if (req.user?.role === 'admin') {
      // Admin can see all operations
      delete where.userId; // Remove user filter
      if (req.query.userId) where.userId = req.query.userId; // Allow filtering by specific user

      ({ rows: operations, count } = await WalletOperation.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email'],
          },
        ],
        limit: Number(limit),
        offset: Number(offset),
        order: [['createdAt', 'DESC']],
      }));
    } else {
      // Regular users see only their own operations
      ({ rows: operations, count } = await WalletOperation.findAndCountAll({
        where,
        limit: Number(limit),
        offset: Number(offset),
        order: [['createdAt', 'DESC']],
      }));
    }

    res.json({
      success: true,
      data: {
        operations: operations.map(op => op.toPublicJSON()),
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  })
);

// PUT /api/wallet-operations/:id/approve - Approve wallet operation (admin only)
router.put('/:id/approve',
  authenticate,
  authorize('admin'),
  [
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string'),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    const { id } = req.params;
    const { adminNotes } = req.body;
    const processedBy = req.user!.id;

    await transaction(async (t) => {
      // Get the wallet operation
      const operation = await WalletOperation.findByPk(id, { transaction: t });
      if (!operation) {
        throw errors.notFound('Wallet operation not found');
      }

      if (operation.status !== 'pending') {
        throw errors.badRequest('Only pending operations can be approved');
      }

      // Get the user's wallet
      const wallet = await Wallet.findByPk(operation.walletId, { transaction: t });
      if (!wallet) {
        throw errors.notFound('Wallet not found');
      }

      // Update the operation
      operation.status = 'approved';
      operation.processedBy = processedBy;
      operation.processedAt = new Date();
      operation.adminNotes = adminNotes || null;
      await operation.save({ transaction: t });

      // If it's a deposit, update the wallet balance
      if (operation.type === 'deposit') {
        wallet.balance = Number(wallet.balance) + Number(operation.amount);
        await wallet.save({ transaction: t });

        // Create transaction record
        await Transaction.create({
          walletId: wallet.id,
          type: 'deposit',
          amount: operation.amount,
          status: 'completed',
          description: `Deposit approved: ${operation.id}`,
          metadata: {
            walletOperationId: operation.id,
            processedBy: processedBy,
          },
        }, { transaction: t });
      }

      // If it's a withdrawal, we only update when completed (not just approved)
      if (operation.type === 'withdrawal') {
        // For withdrawals, we keep them as approved until completion
        // The actual withdrawal happens when admin completes the operation
      }

      res.json({
        success: true,
        message: 'Wallet operation approved successfully',
        data: operation.toPublicJSON(),
      });
    });
  })
);

// PUT /api/wallet-operations/:id/complete - Complete wallet operation (admin only)
router.put('/:id/complete',
  authenticate,
  authorize('admin'),
  [
    body('adminProofUrl').isURL().withMessage('Admin proof URL must be a valid URL'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string'),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    const { id } = req.params;
    const { adminProofUrl, adminNotes } = req.body;
    const processedBy = req.user!.id;

    await transaction(async (t) => {
      // Get the wallet operation
      const operation = await WalletOperation.findByPk(id, { transaction: t });
      if (!operation) {
        throw errors.notFound('Wallet operation not found');
      }

      if (operation.status !== 'approved') {
        throw errors.badRequest('Only approved operations can be completed');
      }

      // Get the user's wallet
      const wallet = await Wallet.findByPk(operation.walletId, { transaction: t });
      if (!wallet) {
        throw errors.notFound('Wallet not found');
      }

      // For deposits, this just marks as completed (balance already updated on approval)
      if (operation.type === 'deposit') {
        operation.status = 'completed';
        operation.adminProofUrl = adminProofUrl;
        operation.adminNotes = adminNotes || null;
        operation.completedAt = new Date();
        await operation.save({ transaction: t });
      } 
      // For withdrawals, this is where we update the balance
      else if (operation.type === 'withdrawal') {
        // Verify the user still has sufficient balance
        if (Number(wallet.balance) < Number(operation.amount)) {
          throw errors.badRequest('Insufficient balance for withdrawal completion');
        }

        // Update wallet balance
        wallet.balance = Number(wallet.balance) - Number(operation.amount);
        await wallet.save({ transaction: t });

        // Update the operation
        operation.status = 'completed';
        operation.adminProofUrl = adminProofUrl;
        operation.adminNotes = adminNotes || null;
        operation.completedAt = new Date();
        operation.processedBy = processedBy;
        await operation.save({ transaction: t });

        // Create transaction record
        await Transaction.create({
          walletId: wallet.id,
          type: 'withdrawal',
          amount: operation.amount,
          status: 'completed',
          description: `Withdrawal completed: ${operation.id}`,
          metadata: {
            walletOperationId: operation.id,
            processedBy: processedBy,
          },
        }, { transaction: t });
      }

      res.json({
        success: true,
        message: 'Wallet operation completed successfully',
        data: operation.toPublicJSON(),
      });
    });
  })
);

// PUT /api/wallet-operations/:id/reject - Reject wallet operation (admin only)
router.put('/:id/reject',
  authenticate,
  authorize('admin'),
  [
    body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string'),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;
    const processedBy = req.user!.id;

    // Get the wallet operation
    const operation = await WalletOperation.findByPk(id);
    if (!operation) {
      throw errors.notFound('Wallet operation not found');
    }

    if (operation.status !== 'pending') {
      throw errors.badRequest('Only pending operations can be rejected');
    }

    // Update the operation
    operation.status = 'rejected';
    operation.rejectionReason = rejectionReason;
    operation.adminNotes = adminNotes || null;
    operation.processedBy = processedBy;
    operation.processedAt = new Date();
    await operation.save();

    res.json({
      success: true,
      message: 'Wallet operation rejected successfully',
      data: operation.toPublicJSON(),
    });
  })
);

// PUT /api/wallet-operations/:id/upload-proof - Upload admin proof for withdrawal (admin only)
router.put('/:id/upload-proof',
  authenticate,
  authorize('admin'),
  [
    body('adminProofUrl').isURL().withMessage('Admin proof URL must be a valid URL'),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest(`Validation failed: ${validationErrors.array().map(err => err.msg).join(', ')}`);
    }

    const { id } = req.params;
    const { adminProofUrl } = req.body;
    const processedBy = req.user!.id;

    // Get the wallet operation
    const operation = await WalletOperation.findByPk(id);
    if (!operation) {
      throw errors.notFound('Wallet operation not found');
    }

    if (operation.type !== 'withdrawal') {
      throw errors.badRequest('Proof upload only available for withdrawal operations');
    }

    if (operation.status !== 'approved') {
      throw errors.badRequest('Can only upload proof for approved withdrawal operations');
    }

    // Update the operation
    operation.adminProofUrl = adminProofUrl;
    operation.processedBy = processedBy;
    await operation.save();

    res.json({
      success: true,
      message: 'Admin proof uploaded successfully',
      data: operation.toPublicJSON(),
    });
  })
);

// GET /api/wallet-operations/stats - Get wallet operations statistics (admin only)
router.get('/stats',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    // Get statistics for all operations
    const stats = await WalletOperation.findAll({
      attributes: [
        'type',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      group: ['type', 'status'],
      raw: true,
    });

    // Organize stats by type and status
    const organizedStats: any = {};
    stats.forEach((stat: any) => {
      if (!organizedStats[stat.type]) {
        organizedStats[stat.type] = {};
      }
      organizedStats[stat.type][stat.status] = {
        count: parseInt(stat.count),
        totalAmount: parseFloat(stat.totalAmount),
      };
    });

    res.json({
      success: true,
      data: organizedStats,
    });
  })
);

export default router;