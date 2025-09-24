import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { User } from "../models";
import { body, param, validationResult } from "express-validator";
import { Op } from "sequelize";

const router = Router();

// GET /api/users - Listar usuarios (admin/operator)
router.get(
  "/",
  authenticate,
  authorize("admin", "operator"),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, role, isActive, search } = req.query;

    // Construir filtros
    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // ⚡ PERFORMANCE OPTIMIZATION: Only operators can see non-admin/operator users
    if (req.user!.role === "operator") {
      where.role = { [Op.in]: ["venue", "user", "gallera"] };
    }

    const users = await User.findAndCountAll({
      where,
      limit: Math.min(parseInt(limit as string), 100),
      offset: parseInt(offset as string),
      attributes: {
        exclude: ["passwordHash", "verificationToken"],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        users: users.rows.map((u) => u.toPublicJSON()),
        pagination: {
          total: users.count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  })
);

// GET /api/users/:id - Obtener usuario específico (admin/operator/self)
router.get(
  "/:id",
  authenticate,
  param("id").isUUID().withMessage("Valid user ID required"),
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

    const userId = req.params.id;

    // Check permissions
    if (
      req.user!.role !== "admin" &&
      req.user!.role !== "operator" &&
      req.user!.id !== userId
    ) {
      throw errors.forbidden("Insufficient permissions");
    }

    // ⚡ PERFORMANCE OPTIMIZATION: Prevent operators from viewing admin/operator users
    const targetUser = await User.findByPk(userId, {
      attributes: {
        exclude: ["passwordHash", "verificationToken"],
      },
    });

    if (!targetUser) {
      throw errors.notFound("User not found");
    }

    if (
      req.user!.role === "operator" &&
      ["admin", "operator"].includes(targetUser.role)
    ) {
      throw errors.forbidden(
        "Operators cannot view admin or operator accounts"
      );
    }

    res.json({
      success: true,
      data: targetUser.toPublicJSON(),
    });
  })
);

// PUT /api/users/profile - Actualizar perfil propio
router.put(
  "/profile",
  authenticate,
  [
    body("profileInfo")
      .optional()
      .isObject()
      .withMessage("Profile info must be an object"),
    body("profileInfo.fullName")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters")
      .trim()
      .escape(),
    body("profileInfo.phoneNumber")
      .optional()
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage("Invalid phone number format")
      .isLength({ min: 10, max: 20 })
      .withMessage("Phone number must be between 10 and 20 characters"),
    body("profileInfo.address")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Address must be less than 500 characters")
      .trim(),
    body("profileInfo.businessName")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Business name must be between 2 and 100 characters")
      .trim()
      .escape(),
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

    const { profileInfo } = req.body;
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      throw errors.notFound("User not found");
    }

    // Validate business-specific fields for venue/gallera accounts
    if (profileInfo && ['venue', 'gallera'].includes(user.role)) {
      // Ensure venue/gallera have required business information
      const requiredFields = ['businessName'];
      for (const field of requiredFields) {
        if (profileInfo[field] && profileInfo[field].trim().length < 2) {
          throw errors.badRequest(`${field} is required for ${user.role} accounts`);
        }
      }
    }

    if (profileInfo) {
      // Initialize profileInfo if it doesn't exist
      if (!user.profileInfo) {
        user.profileInfo = { verificationLevel: "none" };
      }

      // Merge profile information, ensuring proper data types
      user.profileInfo = {
        ...user.profileInfo,
        ...profileInfo,
        // Ensure certain fields are properly sanitized
        verificationLevel: user.profileInfo?.verificationLevel || "none"
      };

      console.log('Updated user profileInfo:', JSON.stringify(user.profileInfo, null, 2));
    }

    try {
      await user.save();
      console.log('User saved successfully');

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user.toPublicJSON(),
      });
    } catch (error) {
      console.error('Error saving user:', error);
      throw errors.internal("Failed to save user profile");
    }
  })
);

// POST /api/users - Crear usuario (admin/operator)
router.post(
  "/",
  authenticate,
  authorize("admin", "operator"),
  [
    body("username")
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      .isAlphanumeric()
      .withMessage("Username must be alphanumeric")
      .trim()
      .toLowerCase(),
    body("email")
      .isEmail()
      .withMessage("Valid email required")
      .normalizeEmail()
      .trim()
      .toLowerCase(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .isIn(["venue", "user", "gallera"])
      .withMessage("Invalid role"),
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

    const { username, email, password, role } = req.body;

    // ⚡ SECURITY: Operators can only create venue/user/gallera accounts
    if (req.user!.role === "operator" && !["venue", "user", "gallera"].includes(role)) {
      throw errors.forbidden("Operators can only create venue, user, or gallera accounts");
    }

    // Check for existing user
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw errors.conflict("User with this email or username already exists");
    }

    const user = await User.create({
      username,
      email,
      passwordHash: password,
      role,
      isActive: true,
      profileInfo: {
        verificationLevel: "none",
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user.toPublicJSON(),
    });
  })
);

// PUT /api/users/:id - Actualizar usuario (admin/operator)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "operator"),
  [
    param("id").isUUID().withMessage("Valid user ID required"),
    body("role")
      .optional()
      .isIn(["admin", "operator", "venue", "user", "gallera"])
      .withMessage("Invalid role"),
    body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
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

    const userId = req.params.id;
    const { role, isActive } = req.body;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      throw errors.notFound("User not found");
    }

    // ⚡ SECURITY: Operators cannot modify admin/operator accounts
    if (req.user!.role === "operator") {
      if (["admin", "operator"].includes(targetUser.role)) {
        throw errors.forbidden("Operators cannot modify admin or operator accounts");
      }
      if (role && ["admin", "operator"].includes(role)) {
        throw errors.forbidden("Operators cannot assign admin or operator roles");
      }
    }

    // Update allowed fields
    if (role !== undefined) targetUser.role = role;
    if (isActive !== undefined) targetUser.isActive = isActive;

    await targetUser.save();

    res.json({
      success: true,
      message: "User updated successfully",
      data: targetUser.toPublicJSON(),
    });
  })
);

// DELETE /api/users/:id - Desactivar usuario (solo admin)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  param("id").isUUID().withMessage("Valid user ID required"),
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

    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw errors.notFound("User not found");
    }

    // Don't allow deleting other admins
    if (user.role === "admin" && user.id !== req.user!.id) {
      throw errors.forbidden("Cannot delete other admin accounts");
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "User deactivated successfully",
      data: user.toPublicJSON(),
    });
  })
);

export default router;