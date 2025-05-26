import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// GET /api/bets - Listar apuestas del usuario
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: "Bets endpoint - To be implemented",
      data: [],
    });
  })
);

export default router;
