import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Venue, User } from "../models";
import { body, validationResult } from "express-validator";

const router = Router();

// GET /api/venues - Listar galleras
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { status, limit = 20, offset = 0 } = req.query as any;

    const isAdmin = !!req.user && req.user.role === "admin";

    const where: any = {};
    if (status) where.status = status;

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

    const { count, rows } = await Venue.findAndCountAll({
      where,
      attributes: isAdmin ? undefined : publicAttributes,
      include: [
        {
          model: User,
          as: "owner",
          attributes: isAdmin ? ["id", "username", "email"] : ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: {
        venues: rows.map((v) => {
          const data = v.get({ plain: true }) as any;
          if (!isAdmin) {
            // Asegurar que contactInfo no se exponga a público
            delete data.contactInfo;
            delete data.ownerId;
          }
          return data;
        }),
        total: count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

// GET /api/venues/:id - Obtener gallera específica
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const isAdmin = !!req.user && req.user.role === "admin";

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

    const venue = await Venue.findByPk(req.params.id, {
      attributes: isAdmin ? undefined : publicAttributes,
      include: [
        {
          model: User,
          as: "owner",
          attributes: isAdmin ? ["id", "username", "email"] : ["id", "username"],
        },
      ],
    });

    if (!venue) {
      throw errors.notFound("Venue not found");
    }

    const data = venue.get({ plain: true }) as any;
    if (!isAdmin) {
      delete data.contactInfo;
      delete data.ownerId;
    }

    res.json({
      success: true,
      data,
    });
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

    // Recargar con asociaciones
    await venue.reload({
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Venue created successfully",
      data: venue.toPublicJSON(),
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

    // Actualizar campos permitidos
    const allowedFields = ["name", "location", "description", "contactInfo"];
    if (req.user!.role === "admin") {
      allowedFields.push("status"); // Solo admin puede cambiar status
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (venue as any)[field] = req.body[field];
      }
    });

    await venue.save();

    // Recargar con asociaciones
    await venue.reload({
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Venue updated successfully",
      data: venue.toPublicJSON(),
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

    res.json({
      success: true,
      message: `Venue status updated to ${status}`,
      data: venue.toPublicJSON(),
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
      data: venues.map((venue) => venue.toPublicJSON()),
    });
  })
);

export default router;