import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// GET /api/venues - Listar galleras
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: "Venues endpoint - To be implemented",
      data: [],
    });
  })
);

export default router;
