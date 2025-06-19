import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import Notification from "../models/Notification"; // Asumiendo modelo existente

const router = Router();

// GET /api/notifications - Obtener notificaciones del usuario
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
      userId: req.user.id,
      status: { $ne: "archived" },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: notifications.map((n) => ({
        id: n._id,
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
    await Notification.updateOne(
      { _id: req.params.id, userId: req.user.id },
      { status: "read" }
    );
    res.json({ success: true });
  })
);

// PUT /api/notifications/:id/archive - Archivar notificación
router.put(
  "/:id/archive",
  authenticate,
  asyncHandler(async (req, res) => {
    await Notification.updateOne(
      { _id: req.params.id, userId: req.user.id },
      { status: "archived" }
    );
    res.json({ success: true });
  })
);

export default router;
