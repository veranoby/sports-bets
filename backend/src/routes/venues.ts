import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Venue, User, Subscription } from "../models";
import { body, validationResult } from "express-validator";
import { getOrSet, invalidatePattern } from "../config/redis";
import { Op } from "sequelize";
import Sequelize from "sequelize";

import { UserRole } from "../../../shared/types";

function getVenueAttributes(role: UserRole | undefined) {
  const publicAttributes = [
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

  switch (role) {
    case "admin":
      return undefined; // Return all attributes
    default:
      return publicAttributes;
  }
}

const router = Router();

// GET /api/venues - Listar galleras
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { status, limit = 20, offset = 0, ownerApproved, ownerSubscription, search } = req.query as any;
    const userRole = req.user?.role || 'public';

    // ⚡ Redis cache key
    const cacheKey = `venues:list:${userRole}:${status || 'all'}:${ownerApproved || 'all'}:${ownerSubscription || 'all'}:${search || 'all'}:${limit}:${offset}`;

    const data = await getOrSet(cacheKey, async () => {
      const attributes = getVenueAttributes(req.user?.role);

      // ✅ CORRECTED: Query from users table (source of truth) → LEFT JOIN venues
      const userWhere: any = {
        role: 'venue',
        isActive: true
      };

      // Add owner approval filter
      if (ownerApproved !== undefined) {
        userWhere.approved = ownerApproved === "true";
      }

      // Add search filter
      if (search) {
        userWhere[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const venueAttributes = [
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
        userWhere[Op.or] = [
          { '$subscriptions.id$': null }, // Users with no subscription (free by default)
          { '$subscriptions.status$': 'free' },
          {
            [Op.and]: [
              { '$subscriptions.expiresAt$': { [Op.lte]: new Date() } },
              { '$subscriptions.status$': 'active' }
            ]
          }
        ];
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

      const { count, rows } = await User.findAndCountAll({
        where: userWhere,
        attributes: ["id", "username", "email", "profileInfo", "approved", "createdAt", "updatedAt"],
        include: [
          {
            model: Venue,
            as: "venues",
            attributes: venueAttributes,
            required: false, // LEFT JOIN - keeps users without venues
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
        // If user has venues, return first venue with user info
        const venue = user.venues?.[0];
        if (venue) {
          return {
            ...venue.toJSON(),
            owner: {
              id: user.id,
              username: user.username,
              email: user.email,
              profileInfo: user.profileInfo,
            },
          };
        }
        // If no venue record, create synthetic venue entry from user
        const profile = user.profileInfo || {};
        return {
          id: user.id,
          name: (profile as any).venueName || user.username,
          location: (profile as any).venueLocation || '',
          description: (profile as any).venueDescription || '',
          status: 'pending',
          isVerified: false,
          images: (profile as any).venueImages || [],
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
          venues: transformedRows,
          total: count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      };
    }, 300); // 5 min TTL (venues change rarely)

    res.json(data);
  })
);

// GET /api/venues/:id - Obtener gallera específica
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const userRole = req.user?.role || 'public';
    const cacheKey = `venue:${req.params.id}:${userRole}`;

    const data = await getOrSet(cacheKey, async () => {
      const attributes = getVenueAttributes(req.user?.role);

      const venue = await Venue.findByPk(req.params.id, {
        attributes,
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "username", "email", "profileInfo"],
            separate: false,
          },
        ],
      });

      if (!venue) {
        throw errors.notFound("Venue not found");
      }

      return {
        success: true,
        data: venue.toJSON({ attributes }),
      };
    }, 300); // 5 min TTL

    res.json(data);
  })
);

// POST /api/venues - Crear nueva gallera (admin/venue)
router.post(
  "/",
  authenticate,
  authorize("admin", "venue"),
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

    const { name, location, description, contactInfo, ownerId } = req.body;

    console.log('Creating venue with data:', req.body);

    // Determinar el propietario
    let finalOwnerId = ownerId;
    if (req.user!.role === "venue") {
      // Si es un usuario venue, se asigna a sí mismo
      finalOwnerId = req.user!.id;
    } else if (req.user!.role === "admin" && !ownerId) {
      // Si es admin pero no especifica owner, se asigna a sí mismo
      finalOwnerId = req.user!.id;
    }

    // Verificar que el owner existe
    if (finalOwnerId) {
      const owner = await User.findByPk(finalOwnerId);
      if (!owner) {
        throw errors.badRequest("Specified owner does not exist");
      }
    }

    // Crear venue
    const venue = await Venue.create({
      name,
      location,
      description,
      contactInfo: contactInfo || {},
      ownerId: finalOwnerId,
      status: req.user!.role === "admin" ? "active" : "pending", // Admin aprueba automáticamente
    });

    console.log('Venue created successfully:', venue.toJSON());

    // Recargar con asociaciones
    await venue.reload({
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
          separate: false,
        },
      ],
    });

    // ⚡ Invalidate cache
    await invalidatePattern('venues:list:*');

    res.status(201).json({
      success: true,
      message: "Local creado exitosamente",
      data: venue.toJSON(),
    });
  })
);

// PUT /api/venues/:id - Actualizar gallera
router.put(
  "/:id",
  authenticate,
  authorize("admin", "venue"),
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
      .isIn(["pending", "active", "suspended"])
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

    const venue = await Venue.findByPk(req.params.id);
    if (!venue) {
      throw errors.notFound("Venue not found");
    }

    // Verificar permisos
    if (req.user!.role === "venue" && venue.ownerId !== req.user!.id) {
      throw errors.forbidden("You can only edit your own venues");
    }

    console.log('Updating venue with data:', req.body);

    // Actualizar campos permitidos
    const allowedFields = ["name", "location", "description", "contactInfo", "images"];
    if (req.user!.role === "admin") {
      allowedFields.push("status"); // Solo admin puede cambiar status
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (venue as any)[field] = req.body[field];
        console.log(`Updated field ${field}:`, (venue as any)[field]);
      }
    });

    await venue.save();
    console.log('Venue saved successfully');

    // Recargar con asociaciones
    await venue.reload({
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
          separate: false,
        },
      ],
    });

    // ⚡ Invalidate cache
    await Promise.all([
      invalidatePattern('venues:list:*'),
      invalidatePattern(`venue:${req.params.id}:*`)
    ]);

    res.json({
      success: true,
      message: "Información del local actualizada exitosamente",
      data: venue.toJSON(),
    });
  })
);

// PUT /api/venues/:id/status - Cambiar estado de gallera (solo admin)
router.put(
  "/:id/status",
  authenticate,
  authorize("admin"),
  [
    body("status")
      .isIn(["pending", "active", "suspended"])
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

    const venue = await Venue.findByPk(req.params.id);
    if (!venue) {
      throw errors.notFound("Venue not found");
    }

    const oldStatus = venue.status;
    venue.status = status;
    await venue.save();

    // Log de auditoría
    require("../config/logger").logger.info(
      `Venue ${venue.name} (${venue.id}) status changed from ${oldStatus} to ${status} by admin ${req.user!.username}. Reason: ${reason || "Not specified"}`
    );

    // ⚡ Invalidate cache
    await Promise.all([
      invalidatePattern('venues:list:*'),
      invalidatePattern(`venue:${req.params.id}:*`)
    ]);

    res.json({
      success: true,
      message: `Venue status updated to ${status}`,
      data: venue.toJSON(),
    });
  })
);

// DELETE /api/venues/:id - Eliminar gallera (solo admin)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const venue = await Venue.findByPk(req.params.id);
    if (!venue) {
      throw errors.notFound("Venue not found");
    }

    // En lugar de eliminar, suspender
    venue.status = "suspended";
    await venue.save();

    // Log de auditoría
    require("../config/logger").logger.info(
      `Venue ${venue.name} (${venue.id}) suspended by admin ${req.user!.username}`
    );

    // ⚡ Invalidate cache
    await Promise.all([
      invalidatePattern('venues:list:*'),
      invalidatePattern(`venue:${req.params.id}:*`)
    ]);

    res.json({
      success: true,
      message: "Venue suspended successfully",
    });
  })
);

// GET /api/venues/my/venues - Obtener galleras del usuario actual (venue)
router.get(
  "/my/venues",
  authenticate,
  authorize("venue", "admin"),
  asyncHandler(async (req, res) => {
    const venues = await Venue.findAll({
      where: { ownerId: req.user!.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: venues.map((venue) => venue.toJSON()),
    });
  })
);

export default router;