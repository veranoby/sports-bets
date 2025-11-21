
import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { MembershipChangeRequest, User, Subscription } from '../models';
import { getOrSet, invalidatePattern } from '../config/redis';

const router = Router();

/**
 * ⚡ Helper: Create or update user subscription
 * Consolidates subscription creation/update logic used by multiple endpoints
 * @param userId - User ID
 * @param type - Subscription type ('daily' | 'monthly')
 * @param expiresAt - Expiration date
 * @param metadata - Additional metadata to store
 * @returns Created or updated subscription
 */
async function createOrUpdateUserSubscription(
  userId: string,
  type: 'daily' | 'monthly',
  expiresAt: Date,
  metadata: any = {}
) {
  let subscription = await Subscription.findOne({
    where: { userId },
    order: [['created_at', 'DESC']]
  });

  const subscriptionData = {
    type,
    status: 'active' as const,
    manual_expires_at: expiresAt,
    expiresAt,
    paymentMethod: 'cash' as const,
    autoRenew: false,
    amount: 0,
    currency: 'USD',
    metadata
  };

  if (subscription) {
    await subscription.update(subscriptionData);
    console.log(`✅ Updated existing subscription for user ${userId} to ${type}`);
  } else {
    subscription = await Subscription.create({
      userId,
      ...subscriptionData
    });
    console.log(`✅ Created new subscription for user ${userId} with type ${type}`);
  }

  return subscription;
}

/**
 * @route   POST /api/membership-requests
 * @desc    Create a new membership change request
 * @access  Private (any authenticated user)
 */
router.post(
  '/',
  authenticate,
  [
    body('requestedMembershipType')
      .isString()
      .withMessage('El tipo de membresía es requerido')
      .isLength({ min: 1, max: 50 })
      .withMessage('El tipo de membresía no puede exceder los 50 caracteres'),
    body('requestNotes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Las notas no pueden exceder los 1000 caracteres'),
    body('paymentProofUrl')
      .optional()
      .isURL()
      .withMessage('La URL del comprobante de pago no es válida')
      .isLength({ max: 500 })
      .withMessage('La URL no puede exceder los 500 caracteres'),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest('Error de validación');
    }

    const user = req.user as User;
    const { requestedMembershipType, requestNotes, paymentProofUrl } = req.body;

    // Requirement 1: Only users with registered phone numbers can request changes
    if (!user.profileInfo?.phoneNumber) {
      throw errors.badRequest('Debes tener un número de teléfono registrado para solicitar cambios de membresía');
    }

    // Check for existing pending request for this user
    const existingPendingRequest = await MembershipChangeRequest.findOne({
      where: {
        userId: user.id,
        status: 'pending',
      },
    });

    if (existingPendingRequest) {
      throw errors.conflict('Ya tienes una solicitud pendiente');
    }

    const currentMembershipType = (user as any).subscription?.type || null;

    const newRequest = await MembershipChangeRequest.create({
      userId: user.id,
      currentMembershipType,
      requestedMembershipType,
      requestNotes,
      paymentProofUrl,
      status: 'pending',
      requestedAt: new Date(),
    });

    // ⚡ Invalidate admin dashboard cache
    await invalidatePattern('membership:requests:admin:*');

    res.status(201).json({ success: true, data: newRequest.toPublicJSON() });
  })
);

/**
 * @route   GET /api/membership-requests/my-requests
 * @desc    Get current user's membership change requests
 * @access  Private (any authenticated user)
 */
router.get(
  '/my-requests',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'completed', 'rejected']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest('Error de validación');
    }

    const { status, limit = 20, offset = 0 } = req.query;
    const where: any = { userId: req.user!.id };

    if (status) {
      where.status = status;
    }

    const limitNum = parseInt(limit as string, 10) || 20;
    const offsetNum = parseInt(offset as string, 10) || 0;

    const { rows, count } = await MembershipChangeRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'username'],
          separate: false,
        },
      ],
      order: [['requestedAt', 'DESC']],
      limit: limitNum,
      offset: offsetNum,
    });

    res.json({
        success: true,
        data: {
            requests: rows.map((r: any) => r.toPublicJSON()),
            total: count,
            limit: limitNum,
            offset: offsetNum
        }
    });
  })
);

/**
 * @route   GET /api/membership-requests/pending
 * @desc    Admin: Get all membership requests (supports status filter)
 * @access  Private (admin, operator)
 */
router.get(
  '/pending',
  authenticate,
  authorize('admin', 'operator'),
  [
    query('search').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('status').optional().isIn(['pending', 'completed', 'rejected', 'all']),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest('Error de validación');
    }

    const { search, limit = 100, status = 'pending' } = req.query;

    // ⚡ Redis cache key (admin dashboard - critical performance)
    const cacheKey = `membership:requests:admin:${status}:${search || 'all'}:${limit}`;

    const data = await getOrSet(cacheKey, async () => {
      const where: any = {};

      // Apply status filter
      if (status && status !== 'all') {
        where.status = status;
      }

      let userWhere: any = {};
      if (search) {
          const searchTerm = `%${search}%`;
          userWhere = {
              [Op.or]: [
                  { username: { [Op.iLike]: searchTerm } },
                  { email: { [Op.iLike]: searchTerm } },
              ],
          };
      }

      const limitNum = parseInt(limit as string, 10) || 100;

      const { rows, count } = await MembershipChangeRequest.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'profileInfo'],
            where: userWhere,
            separate: false,
            include: [
              {
                model: Subscription,
                as: 'subscriptions',
                attributes: ['id', 'status', 'type', 'manual_expires_at'],
                limit: 1,
                order: [['created_at', 'DESC']],
                separate: true,
              },
            ],
          },
        ],
        order: [['requestedAt', 'ASC']],
        limit: limitNum,
      });

      return {
          success: true,
          data: {
              requests: rows.map((r: any) => ({
                ...r.toPublicJSON(),
                user: r.user ? {
                  id: r.user.id,
                  username: r.user.username,
                  email: r.user.email,
                  profileInfo: r.user.profileInfo,
                  subscription: r.user.subscriptions && r.user.subscriptions.length > 0 ? {
                    status: r.user.subscriptions[0].status,
                    type: r.user.subscriptions[0].type,
                    manual_expires_at: r.user.subscriptions[0].manual_expires_at,
                  } : null,
                } : null,
              })),
              total: count
          }
       };
    }, 60); // 1 min TTL (admin dashboard needs fresh data, but not real-time)

    res.json(data);
  })
);

/**
 * @route   PATCH /api/membership-requests/:id/complete
 * @desc    Mark request as completed
 * @access  Private (admin)
 */
router.patch(
  '/:id/complete',
  authenticate,
  authorize('admin'),
  [body('adminNotes').optional().isString().isLength({ max: 500 })],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest('Error de validación');
    }

    const { id } = req.params;
    const { adminNotes } = req.body;

    const request = await MembershipChangeRequest.findByPk(id);

    if (!request) {
      throw errors.notFound('Solicitud no encontrada');
    }

    if (request.status !== 'pending') {
      throw errors.conflict(`La solicitud ya ha sido procesada (estado: ${request.status})`);
    }

    // Get the user who made the request
    const user = await User.findByPk(request.userId);
    if (!user) {
      throw errors.notFound('Usuario no encontrado');
    }

    // Calculate expiry date based on requested membership type
    const now = new Date();
    let expiresAt: Date | null = null;

    if (request.requestedMembershipType === '24-hour') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (request.requestedMembershipType === 'monthly') {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      // If requested type is not recognized, default to free
      throw errors.badRequest('Tipo de membresía solicitado no válido');
    }

    // ⚡ Create or update subscription using shared helper function
    const subscriptionType = (request.requestedMembershipType === '24-hour' ? 'daily' : 'monthly') as 'daily' | 'monthly';
    const metadata = {
      assignedBy: req.user!.username,
      assignedAt: new Date().toISOString(),
      manualAssignment: true,
      fromRequest: request.id
    };

    const subscription = await createOrUpdateUserSubscription(
      user.id,
      subscriptionType,
      expiresAt!,
      metadata
    );

    // Update the request status to completed
    request.status = 'completed';
    request.processedAt = new Date();
    request.processedBy = req.user!.id;
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }

    await request.save();

    // ⚡ Invalidate admin dashboard cache
    await invalidatePattern('membership:requests:admin:*');
    // ⚡ Invalidate user profile cache to reflect new subscription
    await invalidatePattern(`user:profile:${user.id}`);

    res.json({ success: true, data: request.toPublicJSON() });
  })
);

/**
 * @route   PATCH /api/membership-requests/:id/reject
 * @desc    Admin: Reject a membership change request
 * @access  Private (admin)
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize('admin'),
  [
    body('rejectionReason')
      .isString()
      .withMessage('Se requiere un motivo de rechazo')
      .isLength({ min: 10, max: 1000 })
      .withMessage('El motivo de rechazo debe tener entre 10 y 1000 caracteres'),
    body('adminNotes').optional().isString().isLength({ max: 500 }),
  ],
  asyncHandler(async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest('Error de validación');
    }

    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    const request = await MembershipChangeRequest.findByPk(id);

    if (!request) {
      throw errors.notFound('Solicitud no encontrada');
    }

    if (request.status !== 'pending') {
      throw errors.conflict(`La solicitud ya ha sido procesada (estado: ${request.status})`);
    }

    request.status = 'rejected';
    request.processedAt = new Date();
    request.processedBy = req.user!.id;
    request.rejectionReason = rejectionReason;
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }

    await request.save();

    // ⚡ Invalidate admin dashboard cache
    await invalidatePattern('membership:requests:admin:*');

    res.json({ success: true, data: request.toPublicJSON() });
  })
);

/**
 * @route   DELETE /api/membership-requests/:id
 * @desc    Admin: Delete a membership change request (only completed/rejected)
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const request = await MembershipChangeRequest.findByPk(id);

    if (!request) {
      throw errors.notFound('Solicitud no encontrada');
    }

    // Only allow deletion of completed or rejected requests
    if (request.status === 'pending') {
      throw errors.conflict('No se puede eliminar una solicitud pendiente. Rechazala primero.');
    }

    await request.destroy();

    // ⚡ Invalidate admin dashboard cache
    await invalidatePattern('membership:requests:admin:*');

    res.json({ success: true, message: 'Solicitud eliminada correctamente' });
  })
);

export default router;
