// backend/src/routes/galleras.ts
// API para la nueva entidad Gallera

import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { Gallera, User } from "../models";

const router = Router();

// GET /api/galleras - Listar todas las galleras
router.get(
  "/",
  optionalAuth, // O `authenticate` si solo usuarios logueados pueden verlas
  asyncHandler(async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query as any;

    const where: any = {};
    if (status) where.status = status;

    const { count, rows } = await Gallera.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: {
        galleras: rows,
        total: count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

// GET /api/galleras/:id - Obtener gallera específica
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const gallera = await Gallera.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    if (!gallera) {
      throw errors.notFound("Gallera not found");
    }

    res.json({
      success: true,
      data: gallera,
    });
  })
);

// POST /api/galleras - Crear nueva gallera (admin/owner)
router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { name, location, description, specialties, activeRoosters, fightRecord, ownerId } = req.body;
    
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
      status: req.user!.role === 'admin' ? 'active' : 'pending'
    });

    res.status(201).json({
      success: true,
      data: gallera,
    });
  })
);

// PUT /api/galleras/:id - Actualizar gallera
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
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

    const allowedFields = ["name", "location", "description", "specialties", "activeRoosters", "fightRecord", "images"];
    if (isAdmin) {
      allowedFields.push("status", "isVerified");
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (gallera as any)[field] = req.body[field];
      }
    });

    await gallera.save();

    res.json({
      success: true,
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

    res.json({
      success: true,
      message: "Gallera deleted successfully",
    });
  })
);

export default router;
