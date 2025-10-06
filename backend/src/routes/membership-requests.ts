
import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';
import { MembershipChangeRequest, User, Subscription } from '../models';

const router = Router();

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
          include: [
            {
              model: Subscription,
              as: 'subscriptions',
              attributes: ['id', 'status', 'type', 'manual_expires_at'],
              limit: 1,
              order: [['created_at', 'DESC']],
            },
          ],
        },
      ],
      order: [['requestedAt', 'ASC']],
      limit: limitNum,
    });

    res.json({
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
     });
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

    request.status = 'completed';
    request.processedAt = new Date();
    request.processedBy = req.user!.id;
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }

    await request.save();

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

    res.json({ success: true, message: 'Solicitud eliminada correctamente' });
  })
);

export default router;
