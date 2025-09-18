import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { asyncHandler, errors } from "../middleware/errorHandler";
import { User, Wallet, Event, Venue, Fight } from "../models";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import multer from "multer";
import path from "path";
import fs from "fs";
import { retryOperation, sequelize } from "../config/database";

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
    // Obtener suscripción actual normalizada (free si no hay activa)
    const subscription = await (user as any).getCurrentSubscription?.();

    res.json({
      success: true,
      data: {
        user: user.toPublicJSON(),
        wallet: userData.wallet?.toPublicJSON?.() || userData.wallet,
        subscription: subscription || {
          type: 'free',
          status: 'active',
          expiresAt: null,
          features: [],
          remainingDays: 0,
        },
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

    console.log('Received profileInfo:', profileInfo);
    console.log('Current user profileInfo:', user.profileInfo);

    if (profileInfo) {
      // Actualizar información del perfil manteniendo datos existentes
      user.profileInfo = {
        ...user.profileInfo,
        ...profileInfo,
      };
      console.log('Updated user profileInfo:', user.profileInfo);
    }

    await user.save();
    console.log('User saved successfully');

    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      data: user.toPublicJSON(),
    });
  })
);

// GET /api/users - Listar usuarios (admin/operator for management, all users for social browsing)
router.get(
  "/",
  authenticate, // Not optional anymore, operators need to be authenticated
  asyncHandler(async (req, res, next) => {
    const { role } = req.query;
    const userRole = req.user!.role;
    
    // Allow social browsing of galleras and venues by any authenticated user
    if (role === "gallera" || role === "venue") {
      // Social browsing allowed for everyone
      next();
    } else if (userRole === "admin" || userRole === "operator") {
      // Admin/operator can access all users
      next();
    } else {
      // Regular users can only browse galleras and venues
      return res.status(403).json({
        error: true,
        message: "Insufficient permissions. Use /api/galleras or /api/venues for social browsing.",
        statusCode: 403
      });
    }
  }),
  asyncHandler(async (req, res) => {
    const { role, isActive, limit = 50, offset = 0 } = req.query;
    const where: any = {};

    const userRole = req.user!.role;
    
    if (userRole === "operator") {
      const operatorId = req.user!.id;

      const events = await Event.findAll({
        where: { operatorId },
        attributes: ["id", "venueId"],
        raw: true,
      });

      if (events.length === 0) {
        return res.json({
          success: true,
          data: { users: [], total: 0, limit: Number(limit), offset: Number(offset) },
        });
      }

      const eventIds = events.map(e => e.id);
      const venueIds = [...new Set(events.map(e => e.venueId).filter(Boolean))];

      const venues = await Venue.findAll({
        where: { id: { [Op.in]: venueIds } },
        attributes: ["ownerId"],
        raw: true,
      });
      const venueOwnerIds = venues.map(v => v.ownerId);

      const fights = await Fight.findAll({
        where: { eventId: { [Op.in]: eventIds } },
        attributes: ["redCorner", "blueCorner"],
        raw: true,
      });
      const galleraUsernames = [...new Set(fights.flatMap(f => [f.redCorner, f.blueCorner]))];

      const galleras = await User.findAll({
        where: { username: { [Op.in]: galleraUsernames }, role: "gallera" },
        attributes: ["id"],
        raw: true,
      });
      const galleraUserIds = galleras.map(g => g.id);

      const userIds = [...new Set([...venueOwnerIds, ...galleraUserIds])];

      where.id = { [Op.in]: userIds };
      if (role) {
        where.role = role;
      } else {
        where.role = { [Op.in]: ["venue", "gallera"] };
      }
    } else if (userRole === "admin") {
      // Admin can access all users
      if (role) where.role = role;
    } else {
      // Regular users: social browsing - only galleras and venues, limited data
      if (role === "gallera" || role === "venue") {
        where.role = role;
        where.isActive = true; // Only show active users for social browsing
      } else {
        return res.status(403).json({
          error: true,
          message: "Social browsing only available for galleras and venues",
          statusCode: 403
        });
      }
    }

    if (isActive !== undefined) where.isActive = isActive === "true";

    // Configure attributes and includes based on user role
    const isSocialBrowsing = userRole !== "admin" && userRole !== "operator";
    
    const attributes = isSocialBrowsing 
      ? ["id", "username", "role", "profileInfo", "createdAt"] // Limited public info
      : [
          "id", "username", "email", "role", "isActive", 
          "profileInfo", "lastLogin", "createdAt", "updatedAt"
        ];
        
    const include = isSocialBrowsing 
      ? [] // No wallet info for social browsing
      : [
          {
            model: Wallet,
            as: "wallet",
            attributes: ["balance", "frozenAmount"],
          },
        ];

    // Optimized query with caching for user listings
    const cacheKey = `users_list_${role || 'all'}_${isActive || 'all'}_${limit}_${offset}`;
    const users = await retryOperation(async () => {
      return await (sequelize as any).cache.getOrSet(cacheKey, async () => {
        return await User.findAndCountAll({
          where,
          attributes,
          include,
          order: [["createdAt", "DESC"]],
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        });
      }, 60); // Cache for 1 minute
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
  optionalAuth,
  asyncHandler(async (req, res, next) => {
    // Fetch minimal user first to determine role/public access
    const target = await User.findByPk(req.params.id);

    if (!target) {
      throw errors.notFound("User not found");
    }

    const isPublicProfile = target.role === "gallera" || target.role === "venue";
    const isSelf = req.user && req.user.id === target.id;
    const isAdmin = req.user && req.user.role === "admin";

    // If not a public profile, only admin or the user themself can view
    if (!isPublicProfile && !isAdmin && !isSelf) {
      return next(errors.forbidden("Insufficient permissions"));
    }

    const attributes = isPublicProfile
      ? ["id", "username", "role", "profileInfo", "createdAt"]
      : { exclude: ["passwordHash"] };

    const include = isPublicProfile
      ? []
      : [
          {
            model: Wallet,
            as: "wallet",
            attributes: ["balance", "frozenAmount"],
          },
        ];

    const user = await User.findByPk(req.params.id, {
      attributes,
      include,
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    // Build sanitized response according to include
    const userJson: any = (user as any).toPublicJSON ? (user as any).toPublicJSON() : user;
    let responseData: any = userJson;
    if (!isPublicProfile) {
      const userRaw = user.toJSON() as any;
      const wallet = userRaw.wallet?.toPublicJSON?.() || userRaw.wallet;
      responseData = { user: userJson, wallet };
    }

    res.json({
      success: true,
      data: responseData,
    });
  })
);

// PUT /api/users/:id/activation - Activar/desactivar usuario (solo admin)
router.put(
  "/:id/activation",
  authenticate,
  authorize("admin"),
  [
    body("isActive").isBoolean().withMessage("isActive must be a boolean value"),
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

    const { isActive, reason } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw errors.notFound("User not found");
    }

    user.isActive = isActive;
    await user.save();

    // Log de auditoría
    require("../config/logger").logger.info(
      `User ${user.username} (${user.id}) active status changed to ${isActive} by admin ${
        req.user!.username
      }. Reason: ${reason || "Not specified"}`
    );

    res.json({
      success: true,
      message: `User active status updated to ${isActive} successfully`,
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

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters")
      .isAlphanumeric()
      .withMessage("Username must contain only letters and numbers"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("role")
      .optional()
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

    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw errors.notFound("User not found");
    }

    console.log('Updating user with data:', req.body);

    // Update allowed fields
    const allowedFields = ["username", "email", "role", "profileInfo"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (user as any)[field] = req.body[field];
        console.log(`Updated field ${field}:`, (user as any)[field]);
      }
    });

    await user.save();
    console.log('User saved successfully');

    res.json({
      success: true,
      message: "User updated successfully",
      data: user.toPublicJSON(),
    });
  })
);

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw errors.notFound("User not found");
    }

    // No permitir eliminar admin users
    if (user.role === "admin") {
      throw errors.forbidden("Cannot delete admin users");
    }

    // Soft delete - desactivar en lugar de eliminar completamente
    user.isActive = false;
    await user.save();

    // Log de auditoría
    require("../config/logger").logger.info(
      `User ${user.username} (${user.id}) deactivated by admin ${
        req.user!.username
      }`
    );

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  })
);

// Configure multer for payment proof uploads
const paymentProofStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/payment_proofs');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `payment_proof_${timestamp}_${originalName}`);
  }
});

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/users/upload-payment-proof
router.post('/upload-payment-proof', authenticate, uploadPaymentProof.single('payment_proof'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw errors.badRequest('Payment proof image is required');
  }
  
  const { assigned_username, payment_description, payment_method } = req.body;
  
  if (!assigned_username || assigned_username.trim().length === 0) {
    throw errors.badRequest('Username assignment is required');
  }
  
  const proofUrl = `/uploads/payment_proofs/${req.file.filename}`;
  
  // Create notification for admin (could be email/system notification)
  console.log(`New payment proof uploaded by user ${req.user!.id} for username: ${assigned_username}`);
  
  res.json({
    success: true,
    message: 'Payment proof uploaded successfully',
    proof_url: proofUrl,
    assigned_username: assigned_username.trim(),
    payment_method: payment_method || 'bank_transfer'
  });
}));

export default router;