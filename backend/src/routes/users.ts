import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { User, Wallet } from "../models";
import { body, validationResult } from "express-validator";

const router = Router();

// GET /api/users/profile - Obtener perfil del usuario autenticado
router.get(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user!.id, {
      include: [
        {
          model: Wallet,
          as: "wallet",
          attributes: ["balance", "frozenAmount"],
        },
      ],
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    const userData = user.toJSON() as any;

    res.json({
      success: true,
      data: {
        user: user.toPublicJSON(),
        wallet: userData.wallet?.toPublicJSON?.() || userData.wallet,
      },
    });
  })
);

// PUT /api/users/profile - Actualizar perfil del usuario
router.put(
  "/profile",
  authenticate,
  [
    body("profileInfo.fullName")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters"),
    body("profileInfo.phoneNumber")
      .optional()
      .isMobilePhone("any")
      .withMessage("Please provide a valid mobile phone number"),
    body("profileInfo.address")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Address must not exceed 500 characters"),
    body("profileInfo.identificationNumber")
      .optional()
      .isLength({ min: 5, max: 20 })
      .withMessage("Identification number must be between 5 and 20 characters"),
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

    const user = req.user!;
    const { profileInfo } = req.body;

    if (profileInfo) {
      // Actualizar información del perfil manteniendo datos existentes
      user.profileInfo = {
        ...user.profileInfo,
        ...profileInfo,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user.toPublicJSON(),
    });
  })
);

// GET /api/users - Listar usuarios (solo admin)
router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { role, isActive, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ["passwordHash"] },
      include: [
        {
          model: Wallet,
          as: "wallet",
          attributes: ["balance", "frozenAmount"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        total: users.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

// POST /api/users - Create new user (admin only)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      .isAlphanumeric()
      .withMessage("Username must contain only letters and numbers"),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role")
      .isIn(["admin", "operator", "venue", "user", "gallera"])
      .withMessage("Invalid role"),
    body("profileInfo")
      .optional()
      .isObject()
      .withMessage("Profile info must be an object"),
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

    const { username, email, password, role, profileInfo } = req.body;

    // Check if username or email already exists
    const { Op } = require("sequelize");
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      throw errors.badRequest(
        existingUser.username === username
          ? "Username already exists"
          : "Email already exists"
      );
    }

    const user = await User.create({
      username,
      email,
      passwordHash: password, // Will be hashed automatically by the model hook
      role,
      profileInfo: profileInfo || { verificationLevel: "none" },
      isActive: true
    });

    // Create wallet for user
    await Wallet.create({
      userId: user.id,
      balance: 0,
      frozenAmount: 0
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user.toPublicJSON()
    });
  })
);

// GET /api/users/:id - Obtener usuario específico (solo admin)
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["passwordHash"] },
      include: [
        {
          model: Wallet,
          as: "wallet",
        },
      ],
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

// PUT /api/users/:id/status - Cambiar estado de usuario (solo admin)
router.put(
  "/:id/status",
  authenticate,
  authorize("admin"),
  [
    body("status").isBoolean().withMessage("status must be a boolean"),
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

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw errors.notFound("User not found");
    }

    user.isActive = status;
    await user.save();

    // Log de auditoría
    require("../config/logger").logger.info(
      `User ${user.username} (${user.id}) ${
        status ? "activated" : "deactivated"
      } by admin ${req.user!.username}. Reason: ${reason || "Not specified"}`
    );

    res.json({
      success: true,
      message: `User ${status ? "activated" : "deactivated"} successfully`,
      data: user.toPublicJSON(),
    });
  })
);

// PUT /api/users/:id/role - Cambiar rol de usuario (solo admin)
router.put(
  "/:id/role",
  authenticate,
  authorize("admin"),
  [
    body("role")
      .isIn(["admin", "operator", "venue", "user", "gallera"])
      .withMessage("Invalid role"),
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

    const { role, reason } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw errors.notFound("User not found");
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log de auditoría
    require("../config/logger").logger.info(
      `User ${user.username} (${
        user.id
      }) role changed from ${oldRole} to ${role} by admin ${
        req.user!.username
      }. Reason: ${reason || "Not specified"}`
    );

    res.json({
      success: true,
      message: "User role updated successfully",
      data: user.toPublicJSON(),
    });
  })
);

// GET /api/users/operators/available - Obtener operadores disponibles (solo admin)
router.get(
  "/operators/available",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const operators = await User.findAll({
      where: {
        role: "operator",
        isActive: true,
      },
      attributes: ["id", "username", "email", "profileInfo", "lastLogin"],
    });

    res.json({
      success: true,
      data: operators,
    });
  })
);

export default router;