import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { Subscription } from '../models/Subscription';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { User } from '../models/User';
import { paymentService } from '../services/paymentService';
import { Op } from 'sequelize';

const router = Router();

// Rate limiting for subscription operations
const subscriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 subscription operations per window
  message: {
    success: false,
    message: 'Too many subscription requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for subscription creation (more restrictive)
const createSubscriptionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 subscription creations per hour
  message: {
    success: false,
    message: 'Too many subscription creation attempts, please try again in an hour'
  }
});

/**
 * POST /api/subscriptions/create
 * Create new subscription with payment
 */
router.post(
  '/create',
  createSubscriptionRateLimit,
  authenticate,
  [
    body('planType')
      .isIn(['daily', 'monthly'])
      .withMessage('Plan type must be daily or monthly'),
    body('paymentToken')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Valid payment token is required'),
    body('autoRenew')
      .optional()
      .isBoolean()
      .withMessage('Auto renew must be boolean')
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.array()
      });
    }

    const { planType, paymentToken, autoRenew = true } = req.body;
    const userId = req.user!.id;

    try {
      // Check for existing active subscription
      const existingSubscription = await Subscription.findOne({
        where: {
          userId,
          status: 'active',
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      });

      if (existingSubscription) {
        return res.status(409).json({
          success: false,
          message: 'You already have an active subscription. Cancel it first to create a new one.',
          code: 'SUBSCRIPTION_EXISTS'
        });
      }

      // Get user details
      const user = await User.findByPk(userId);
      if (!user) {
        throw errors.notFound('User not found');
      }

      // Get plan configuration
      const planConfig = paymentService.getSubscriptionPlans()
        .find(plan => plan.id === planType);
      
      if (!planConfig) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subscription plan'
        });
      }

      // Create subscription with Kushki
      const kushkiResponse = await paymentService.createSubscription({
        token: paymentToken,
        planType,
        userId,
        userEmail: user.email
      });

      // Calculate expiry date
      const now = new Date();
      const expiresAt = planType === 'daily'
        ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
        : new Date(now.setMonth(now.getMonth() + 1));

      // Create subscription record
      const subscription = await Subscription.create({
        userId,
        type: planType,
        status: 'active',
        kushkiSubscriptionId: kushkiResponse.subscriptionId,
        paymentMethod: 'card',
        autoRenew,
        amount: planConfig.price * 100, // Convert to cents
        currency: planConfig.currency,
        expiresAt,
        nextBillingDate: autoRenew ? kushkiResponse.nextPaymentDate : null,
        metadata: {
          planName: planConfig.name,
          createdVia: 'web'
        }
      });

      // Create initial payment transaction
      await PaymentTransaction.create({
        subscriptionId: subscription.id,
        type: 'subscription_payment',
        status: 'completed',
        amount: planConfig.price * 100,
        currency: planConfig.currency,
        paymentMethod: 'card',
        processedAt: new Date(),
        metadata: {
          planType,
          initialPayment: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: {
          id: subscription.id,
          type: subscription.type,
          status: subscription.status,
          expiresAt: subscription.expiresAt,
          autoRenew: subscription.autoRenew,
          features: subscription.features,
          amount: subscription.amount,
          currency: subscription.currency,
          nextBillingDate: subscription.nextBillingDate,
          createdAt: subscription.createdAt
        }
      });

    } catch (error: any) {
      console.error('Subscription creation failed:', error);
      
      // Handle specific payment errors
      if (error.message.includes('declined') || error.message.includes('insufficient')) {
        return res.status(400).json({
          success: false,
          message: 'Your payment was declined. Please check your card details and try again.',
          code: 'PAYMENT_DECLINED'
        });
      }
      
      if (error.message.includes('token')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment token. Please try again.',
          code: 'INVALID_TOKEN'
        });
      }

      throw errors.internal(`Failed to create subscription: ${error.message}`);
    }
  })
);

/**
 * POST /api/subscriptions/cancel
 * Cancel active subscription
 */
router.post(
  '/cancel',
  subscriptionRateLimit,
  authenticate,
  [
    body('reason')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Cancel reason must be a string under 500 characters')
  ],
  asyncHandler(async (req, res) => {
    const { reason = 'User requested cancellation' } = req.body;
    const userId = req.user!.id;

    try {
      // Find active subscription
      const subscription = await Subscription.findOne({
        where: {
          userId,
          status: 'active',
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found',
          code: 'NO_ACTIVE_SUBSCRIPTION'
        });
      }

      // Cancel with Kushki if it has a Kushki subscription ID
      if (subscription.kushkiSubscriptionId) {
        try {
          await paymentService.cancelSubscription(subscription.kushkiSubscriptionId);
        } catch (kushkiError) {
          console.warn('Kushki cancellation failed:', kushkiError);
          // Continue with local cancellation even if Kushki fails
        }
      }

      // Update subscription status
      await subscription.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason,
        autoRenew: false,
        nextBillingDate: null
      });

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          id: subscription.id,
          status: subscription.status,
          cancelledAt: subscription.cancelledAt,
          expiresAt: subscription.expiresAt, // Subscription remains active until expiry
          refund: null // No immediate refund, service continues until expiry
        }
      });

    } catch (error: any) {
      console.error('Subscription cancellation failed:', error);
      throw errors.internal(`Failed to cancel subscription: ${error.message}`);
    }
  })
);

/**
 * GET /api/subscriptions/current
 * Get current active subscription
 */
router.get(
  '/current',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    try {
      const subscription = await Subscription.findOne({
        where: {
          userId,
          status: 'active',
          expiresAt: {
            [Op.gt]: new Date()
          }
        },
        order: [['createdAt', 'DESC']]
      });

      if (!subscription) {
        return res.json({
          success: true,
          data: { type: 'free', status: 'active', features: [], plan: 'free', isActive: true, id: 'free-plan' }
        });
      }

      // Check if subscription is actually expired
      if (subscription.isExpired()) {
        await subscription.markAsExpired();
        return res.json({
          success: true,
          data: { type: 'free', status: 'active', features: [], plan: 'free', isActive: true, id: 'free-plan' }
        });
      }

      res.json({
        success: true,
        data: {
          id: subscription.id,
          type: subscription.type,
          status: subscription.status,
          expiresAt: subscription.expiresAt,
          remainingDays: subscription.getRemainingDays(),
          autoRenew: subscription.autoRenew,
          features: subscription.features,
          amount: subscription.amount,
          currency: subscription.currency,
          nextBillingDate: subscription.nextBillingDate,
          createdAt: subscription.createdAt
        }
      });

    } catch (error: any) {
      console.error('Failed to get current subscription:', error);
      throw errors.internal('Failed to retrieve subscription information');
    }
  })
);

/**
 * GET /api/subscriptions/history
 * Get payment history
 */
router.get(
  '/history',
  authenticate,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be non-negative'),
    query('status')
      .optional()
      .isIn(['completed', 'failed', 'refunded'])
      .withMessage('Invalid status filter')
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { limit = 20, offset = 0, status } = req.query;

    try {
      // Get user's subscriptions
      const userSubscriptions = await Subscription.findAll({
        where: { userId },
        attributes: ['id']
      });

      const subscriptionIds = userSubscriptions.map(sub => sub.id);

      if (subscriptionIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit: Number(limit),
            offset: Number(offset)
          }
        });
      }

      // Build where clause
      const whereClause: any = {
        subscriptionId: subscriptionIds
      };

      if (status) {
        whereClause.status = status;
      }

      // Get transactions with pagination
      const { rows: transactions, count: total } = await PaymentTransaction.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset: Number(offset)
      });

      const formattedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount,
        formattedAmount: transaction.getFormattedAmount(),
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        cardLast4: transaction.cardLast4,
        cardBrand: transaction.cardBrand,
        processedAt: transaction.processedAt,
        failedAt: transaction.failedAt,
        errorMessage: transaction.errorMessage,
        createdAt: transaction.createdAt
      }));

      res.json({
        success: true,
        data: formattedTransactions,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      });

    } catch (error: any) {
      console.error('Failed to get payment history:', error);
      throw errors.internal('Failed to retrieve payment history');
    }
  })
);

/**
 * POST /api/subscriptions/check-access
 * Check if user has access to specific features
 */
router.post(
  '/check-access',
  authenticate,
  [
    body('feature')
      .optional()
      .isString()
      .withMessage('Feature must be a string')
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { feature } = req.body;

    try {
      const subscription = await Subscription.findOne({
        where: {
          userId,
          status: 'active',
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      });

      let hasAccess = false;
      let accessDetails: any = {
        hasSubscription: false,
        isActive: false,
        isExpired: false,
        features: []
      };

      if (subscription) {
        accessDetails.hasSubscription = true;
        accessDetails.isActive = subscription.status === 'active';
        accessDetails.isExpired = subscription.isExpired();
        accessDetails.features = subscription.features;
        accessDetails.expiresAt = subscription.expiresAt;
        accessDetails.remainingDays = subscription.getRemainingDays();

        // Check specific feature access
        if (feature) {
          hasAccess = subscription.isActive() && subscription.hasFeature(feature);
        } else {
          // General access check
          hasAccess = subscription.isActive();
        }

        // Mark as expired if needed
        if (subscription.isExpired() && subscription.status === 'active') {
          await subscription.markAsExpired();
          accessDetails.isActive = false;
          hasAccess = false;
        }
      }

      res.json({
        success: true,
        data: {
          hasAccess,
          ...accessDetails
        }
      });

    } catch (error: any) {
      console.error('Access check failed:', error);
      throw errors.internal('Failed to check subscription access');
    }
  })
);

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans (kept for compatibility)
 */
router.get(
  '/plans/info',
  asyncHandler(async (req, res) => {
    try {
      const plans = paymentService.getSubscriptionPlans();
      
      res.json({
        success: true,
        data: Array.isArray(plans) ? plans : [plans]
      });
    } catch (error: any) {
      console.error('Failed to get subscription plans:', error);
      throw errors.internal('Failed to retrieve subscription plans');
    }
  })
);

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans (new endpoint)
 */
router.get(
  '/plans',
  asyncHandler(async (req, res) => {
    try {
      const plans = paymentService.getSubscriptionPlans();
      
      res.json({
        success: true,
        data: Array.isArray(plans) ? plans : [plans]
      });
    } catch (error: any) {
      console.error('Failed to get subscription plans:', error);
      throw errors.internal('Failed to retrieve subscription plans');
    }
  })
);

/**
 * PUT /api/subscriptions/:id/auto-renew
 * Toggle auto-renew setting
 */
router.put(
  '/:id/auto-renew',
  subscriptionRateLimit,
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid subscription ID'),
    body('autoRenew').isBoolean().withMessage('Auto renew must be boolean')
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.array()
      });
    }

    const { id: subscriptionId } = req.params;
    const { autoRenew } = req.body;
    const userId = req.user!.id;

    try {
      const subscription = await Subscription.findOne({
        where: {
          id: subscriptionId,
          userId
        }
      });

      if (!subscription) {
        throw errors.notFound('Subscription not found');
      }

      if (subscription.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Can only modify active subscriptions'
        });
      }

      await subscription.update({
        autoRenew,
        nextBillingDate: autoRenew ? subscription.expiresAt : null
      });

      res.json({
        success: true,
        message: `Auto-renew ${autoRenew ? 'enabled' : 'disabled'} successfully`,
        data: {
          id: subscription.id,
          autoRenew: subscription.autoRenew,
          nextBillingDate: subscription.nextBillingDate
        }
      });

    } catch (error: any) {
      console.error('Auto-renew toggle failed:', error);
      throw errors.internal('Failed to update auto-renew setting');
    }
  })
);

/**
 * PUT /api/subscriptions/admin/:userId/membership
 * Admin: Update user membership manually
 */
router.put(
  '/admin/:userId/membership',
  authenticate,
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    body('membership_type')
      .isIn(['free', '24-hour', 'monthly'])
      .withMessage('Invalid membership type'),
    body('assigned_username')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Assigned username is required')
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.array()
      });
    }

    // Check admin permission
    if (req.user!.role !== 'admin') {
      throw errors.forbidden('Only admins can update user memberships');
    }

    const { userId } = req.params;
    const { membership_type, assigned_username } = req.body;

    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw errors.notFound('User not found');
      }

      // Calculate expiry date based on membership type
      const now = new Date();
      let expiresAt: Date | null = null;

      if (membership_type === '24-hour') {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (membership_type === 'monthly') {
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // If free, cancel any active subscriptions
      if (membership_type === 'free') {
        await Subscription.update(
          { status: 'cancelled', cancelledAt: new Date(), cancelReason: `Admin cancelled - ${assigned_username}` },
          { where: { userId, status: 'active' } }
        );

        return res.json({
          success: true,
          message: 'Membership updated to free',
          data: { membership_type: 'free', status: 'active' }
        });
      }

      // Create or update subscription
      const [subscription, created] = await Subscription.findOrCreate({
        where: { userId, status: 'active' },
        defaults: {
          userId,
          type: membership_type === '24-hour' ? 'daily' : 'monthly',
          status: 'active',
          manual_expires_at: expiresAt,
          expiresAt: expiresAt!,
          paymentMethod: 'cash', // Admin manual assignment
          autoRenew: false,
          amount: 0,
          currency: 'USD',
          metadata: {
            assignedBy: assigned_username,
            assignedAt: new Date().toISOString(),
            manualAssignment: true
          }
        }
      });

      if (!created) {
        await subscription.update({
          type: membership_type === '24-hour' ? 'daily' : 'monthly',
          status: 'active',
          manual_expires_at: expiresAt,
          expiresAt: expiresAt!,
          metadata: {
            ...subscription.metadata,
            lastAssignedBy: assigned_username,
            lastAssignedAt: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        message: 'Membership updated successfully',
        data: {
          id: subscription.id,
          type: subscription.type,
          status: subscription.status,
          expiresAt: subscription.expiresAt,
          manual_expires_at: subscription.manual_expires_at
        }
      });

    } catch (error: any) {
      console.error('Admin membership update failed:', error);
      throw errors.internal(`Failed to update membership: ${error.message}`);
    }
  })
);

export default router;