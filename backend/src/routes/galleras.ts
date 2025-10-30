// backend/src/routes/galleras.ts
// API para la nueva entidad Gallera

import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Gallera, User, Subscription } from "../models";
import { body, validationResult } from "express-validator";
import { getOrSet, invalidatePattern } from "../config/redis";
import { Op } from "sequelize";

const router = Router();

// GET /api/galleras - Listar todas las galleras
router.get(
  "/",
  optionalAuth, // O `authenticate` si solo usuarios logueados pueden verlas
  asyncHandler(async (req, res) => {
    const { status, limit = 50, offset = 0, ownerApproved, ownerSubscription, search } = req.query as any;
    const userRole = req.user?.role || 'public';

    // ⚡ Redis cache key
    const cacheKey = `galleras:list:${userRole}:${status || 'all'}:${ownerApproved || 'all'}:${ownerSubscription || 'all'}:${search || 'all'}:${limit}:${offset}`;

    const data = await getOrSet(cacheKey, async () => {
      // ✅ CORRECTED: Query from users table (source of truth) → LEFT JOIN galleras
      const userWhere: any = {
        role: 'gallera',
        isActive: true
      };

      // Add owner approval filter
      if (ownerApproved !== undefined) {
        userWhere.approved = ownerApproved === "true";
      }

      const galleraAttributes = [
        "id",
        "name",
        "location",
        "description",
        "status",
        "isVerified",
        "images",
        "createdAt",
        "updatedAt",
      ];

      // 🔧 FIX: Use conditions array to combine search and subscription filters WITHOUT overwriting
      const conditions: any[] = [];

      // Add search filter
      if (search) {
        conditions.push({
          [Op.or]: [
            { username: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
          ]
        });
      }

      // SUBSCRIPTION FILTERING LOGIC:
      let subscriptionInclude = [];
      if (ownerSubscription === 'free') {
        // Find users WITH NO active subscription OR with status='free'
        subscriptionInclude = [{
          model: Subscription,
          attributes: ['type', 'status', 'expiresAt'],
          required: false, // LEFT JOIN to include users without subscriptions
          where: {
            [Op.or]: [
              { status: 'free' },
              {
                [Op.and]: [
                  { expiresAt: { [Op.lte]: new Date() } },
                  { status: 'active' }
                ]
              }
            ]
          }
        }];
        // Then filter to only include users where the subscription is NULL (no subscription) OR matches the free criteria
        conditions.push({
          [Op.or]: [
            { '$subscriptions.id$': null }, // Users with no subscription (free by default)
            { '$subscriptions.status$': 'free' },
            {
              [Op.and]: [
                { '$subscriptions.expiresAt$': { [Op.lte]: new Date() } },
                { '$subscriptions.status$': 'active' }
              ]
            }
          ]
        });
      } else if (ownerSubscription === 'monthly') {
        subscriptionInclude = [{
          model: Subscription,
          attributes: ['type', 'status', 'expiresAt'],
          required: true, // INNER JOIN - only users WITH matching subscription
          where: {
            type: 'monthly',
            status: 'active',
            expiresAt: { [Op.gt]: new Date() }
          }
        }];
      } else if (ownerSubscription === 'daily') {
        subscriptionInclude = [{
          model: Subscription,
          attributes: ['type', 'status', 'expiresAt'],
          required: true, // INNER JOIN - only users WITH matching subscription
          where: {
            type: 'daily',
            status: 'active',
            expiresAt: { [Op.gt]: new Date() }
          }
        }];
      }

      // Combine all conditions if any exist
      if (conditions.length > 0) {
        userWhere[Op.and] = conditions;
      }

      const { count, rows } = await User.findAndCountAll({
        where: userWhere,
        attributes: ["id", "username", "email", "profileInfo", "approved", "createdAt", "updatedAt"],
        include: [
          {
            model: Gallera,
            as: "galleras",
            attributes: galleraAttributes,
            required: false, // LEFT JOIN - keeps users without galleras
            separate: true, // Prevents LIMIT issues with associations
            where: status ? { status } : {},
          },
          // NEW: Include Subscription for filtering
          ...subscriptionInclude,
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        subQuery: false,
      });

      // ✅ Transform response to match expected format
      const transformedRows = rows.map((user: any) => {
        // If user has galleras, return first gallera with user info
        const gallera = user.galleras?.[0];
        if (gallera) {
          return {
            ...gallera.toJSON(),
            owner: {
              id: user.id,
              username: user.username,
              email: user.email,
              profileInfo: user.profileInfo,
            },
          };
        }
        // If no gallera record, create synthetic gallera entry from user
        const profile = user.profileInfo || {};
        return {
          id: user.id,
          name: (profile as any).galleraName || user.username,
          location: (profile as any).galleraLocation || '',
          description: (profile as any).galleraDescription || '',
          status: 'pending',
          isVerified: false,
          images: (profile as any).galleraImages || [],
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          owner: {
            id: user.id,
            username: user.username,
            email: user.email,
            profileInfo: user.profileInfo,
          },
        };
      });

      return {
        success: true,
        data: {
          galleras: transformedRows,
          total: count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      };
    }, 300); // 5 min TTL (galleras change rarely)

    res.json(data);
  })
);

// GET /api/galleras/:id - Obtener gallera específica
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const userRole = req.user?.role || 'public';
    const cacheKey = `gallera:${req.params.id}:${userRole}`;

    const data = await getOrSet(cacheKey, async () => {
      const gallera = await Gallera.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "username", "email", "profileInfo"],
            separate: false,
          },
        ],
      });

      if (!gallera) {
        throw errors.notFound("Gallera not found");
      }

      return {
        success: true,
        data: gallera,
      };
    }, 300); // 5 min TTL

    res.json(data);
  })
);

// POST /api/galleras - Crear nueva gallera (admin/owner)
router.post(
  "/",
  authenticate,
  authorize("admin", "gallera"),
  [
    body("name")
      .isLength({ min: 3, max: 255 })
      .withMessage("Name must be between 3 and 255 characters"),
    body("location")
      .isLength({ min: 5, max: 500 })
      .withMessage("Location must be between 5 and 500 characters"),
    body("description")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Description must not exceed 2000 characters"),
    body("contactInfo")
      .optional()
      .isObject()
      .withMessage("Contact info must be an object"),
    body("ownerId")
      .optional()
      .isUUID()
      .withMessage("Owner ID must be a valid UUID"),
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

    const { name, location, description, specialties, activeRoosters, fightRecord, ownerId, contactInfo } = req.body;
    
    console.log('Creating gallera with data:', req.body);
    
    // Admin can create for any user, others only for themselves
    const finalOwnerId = req.user!.role === 'admin' ? (ownerId || req.user!.id) : req.user!.id;

    const gallera = await Gallera.create({
      name,
      location,
      description,
      ownerId: finalOwnerId,
      specialties,
      activeRoosters: activeRoosters || 0,
      fightRecord,
      contactInfo: contactInfo || {},
      status: req.user!.role === 'admin' ? 'active' : 'pending'
    });

    console.log('Gallera created successfully:', gallera.toJSON());

    // ⚡ Invalidate cache
    await invalidatePattern('galleras:list:*');

    res.status(201).json({
      success: true,
      message: "Gallera creada exitosamente",
      data: gallera,
    });
  })
);

// PUT /api/galleras/:id - Actualizar gallera
router.put(
  "/:id",
  authenticate,
  authorize("admin", "gallera"),
  [
    body("name")
      .optional()
      .isLength({ min: 3, max: 255 })
      .withMessage("Name must be between 3 and 255 characters"),
    body("location")
      .optional()
      .isLength({ min: 5, max: 500 })
      .withMessage("Location must be between 5 and 500 characters"),
    body("description")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Description must not exceed 2000 characters"),
    body("contactInfo")
      .optional()
      .isObject()
      .withMessage("Contact info must be an object"),
    body("images")
      .optional()
      .isArray()
      .withMessage("Images must be an array of URLs"),
    body("status")
      .optional()
      .isIn(["pending", "active", "suspended", "rejected"])
      .withMessage("Invalid status"),
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

    const gallera = await Gallera.findByPk(req.params.id);
    
    if (!gallera) {
      throw errors.notFound("Gallera not found");
    }

    // Check permissions
    const isOwner = gallera.ownerId === req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw errors.forbidden("You can only edit your own gallera");
    }

    console.log('Updating gallera with data:', req.body);

    const allowedFields = ["name", "location", "description", "specialties", "activeRoosters", "fightRecord", "images", "contactInfo"];
    if (isAdmin) {
      allowedFields.push("status", "isVerified");
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (gallera as any)[field] = req.body[field];
        console.log(`Updated field ${field}:`, (gallera as any)[field]);
      }
    });

    await gallera.save();
    console.log('Gallera saved successfully');

    // ⚡ Invalidate cache
    await Promise.all([
      invalidatePattern('galleras:list:*'),
      invalidatePattern(`gallera:${req.params.id}:*`)
    ]);

    res.json({
      success: true,
      message: "Información de la gallera actualizada exitosamente",
      data: gallera,
    });
  })
);

// DELETE /api/galleras/:id - Eliminar gallera (admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const gallera = await Gallera.findByPk(req.params.id);
    
    if (!gallera) {
      throw errors.notFound("Gallera not found");
    }

    await gallera.destroy();

    // ⚡ Invalidate cache
    await Promise.all([
      invalidatePattern('galleras:list:*'),
      invalidatePattern(`gallera:${req.params.id}:*`)
    ]);

    res.json({
      success: true,
      message: "Gallera deleted successfully",
    });
  })
);

// PUT /api/galleras/:id/status - Cambiar estado de gallera (solo admin)
router.put(
  "/:id/status",
  authenticate,
  authorize("admin"),
  [
    body("status")
      .isIn(["pending", "active", "suspended", "rejected"])
      .withMessage("Invalid status"),
    body("reason")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Reason must not exceed 500 characters"),
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

    const { status, reason } = req.body;

    const gallera = await Gallera.findByPk(req.params.id);
    if (!gallera) {
      throw errors.notFound("Gallera not found");
    }

    const oldStatus = gallera.status;
    gallera.status = status;
    await gallera.save();

    // Log de auditoría
    require("../config/logger").logger.info(
      `Gallera ${gallera.name} (${gallera.id}) status changed from ${oldStatus} to ${status} by admin ${req.user!.username}. Reason: ${reason || "Not specified"}`
    );

    // ⚡ Invalidate cache
    await Promise.all([
      invalidatePattern('galleras:list:*'),
      invalidatePattern(`gallera:${req.params.id}:*`)
    ]);

    res.json({
      success: true,
      message: `Gallera status updated to ${status}`,
      data: gallera,
    });
  })
);

export default router;
