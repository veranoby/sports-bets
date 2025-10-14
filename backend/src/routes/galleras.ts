// backend/src/routes/galleras.ts
// API para la nueva entidad Gallera

import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Gallera, User } from "../models";
import { body, validationResult } from "express-validator";
import { getOrSet, invalidatePattern } from "../config/redis";

const router = Router();

// GET /api/galleras - Listar todas las galleras
router.get(
  "/",
  optionalAuth, // O `authenticate` si solo usuarios logueados pueden verlas
  asyncHandler(async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query as any;
    const userRole = req.user?.role || 'public';

    // ⚡ Redis cache key
    const cacheKey = `galleras:list:${userRole}:${status || ''}:${limit}:${offset}`;

    const data = await getOrSet(cacheKey, async () => {
      const where: any = {};
      if (status) where.status = status;

      const { count, rows } = await Gallera.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "username", "email", "profileInfo"],
            separate: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      return {
        success: true,
        data: {
          galleras: rows,
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
