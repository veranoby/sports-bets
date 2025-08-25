import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import Notification from "../models/Notification"; // ✅ Debe ser exactamente así

const router = Router();

// GET /api/notifications - Obtener notificaciones del usuario
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.findAll({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    res.json({
      success: true,
      data: notifications.map((n) => n.toPublicJSON()),
    });
  })
);

// PUT /api/notifications/read-all - Marcar todas como leídas
router.put(
    "/read-all",
    authenticate,
    asyncHandler(async (req, res) => {
        await Notification.update(
            { isRead: true },
            {
                where: {
                    userId: req.user!.id,
                    isRead: false,
                },
            }
        );
        res.json({ success: true, message: "All notifications marked as read." });
    })
);

// PUT /api/notifications/:id/read - Marcar como leído
router.put(
  "/:id/read",
  authenticate,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        where: {
            id: req.params.id,
            userId: req.user!.id,
        },
    });

    if (notification) {
        notification.isRead = true;
        await notification.save();
        res.json({ success: true, data: notification.toPublicJSON() });
    } else {
        res.status(404).json({ success: false, message: "Notification not found" });
    }
  })
);

export default router;
