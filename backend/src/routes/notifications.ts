import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import Notification from "../models/Notification"; // ✅ Debe ser exactamente así

import { Op } from "sequelize"; // Importación necesaria para operadores

const router = Router();

// GET /api/notifications - Obtener notificaciones del usuario
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.findAll({
      where: {
        userId: req.user.id,
        status: { [Op.ne]: "archived" },
      },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    res.json({
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        status: n.status,
        type: n.type,
      })),
    });
  })
);

// PUT /api/notifications/:id/read - Marcar como leído
router.put(
  "/:id/read",
  authenticate,
  asyncHandler(async (req, res) => {
    await Notification.update(
      { status: "read" },
      {
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
      }
    );
    res.json({ success: true });
  })
);

// PUT /api/notifications/:id/archive - Archivar notificación
router.put(
  "/:id/archive",
  authenticate,
  asyncHandler(async (req, res) => {
    await Notification.update(
      { status: "archived" },
      {
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
      }
    );
    res.json({ success: true });
  })
);

export default router;
