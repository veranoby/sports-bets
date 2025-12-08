import { Router } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { User, Wallet } from "../models";
import { Subscription } from "../models/Subscription";
import { errors, asyncHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import { logger } from "../config/logger";
import { transaction } from "../config/database";
import { Op } from "sequelize";
import crypto from "crypto";
import * as emailService from "../services/emailService";
import { SessionService } from "../services/sessionService";

const router = Router();

// Rate limiting for authentication endpoints (prevents brute-force attacks)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validaciones para registro
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username must contain only letters, numbers, and underscores"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("role")
    .optional()
    .isIn(["user", "venue", "gallera"])
    .withMessage("Invalid role specified"),
];

// Validaciones para login
const loginValidation = [
  body("login").notEmpty().withMessage("Username or email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Función para generar JWT - SOLUCIONADO
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' } as any // CHANGED: 7d -> 24h for better security
  );
};

// POST /api/auth/register - Registro de usuario
router.post(
  "/register",
  authRateLimit,
  registerValidation,
  asyncHandler(async (req, res) => {
    // Verificar errores de validación
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

    const { username, email, password, role = "user" } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw errors.conflict("User with this email already exists");
      } else {
        throw errors.conflict("User with this username already exists");
      }
    }

    // Crear usuario y wallet en una transacción
    await transaction(async (t) => {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      // Crear usuario
      const user = await User.create(
        {
          username,
          email,
          passwordHash: password, // Se hashea automáticamente en el hook
          role,
          approved: false, // ✅ Usuarios de registro público requieren aprobación
          emailVerified: false,
          verificationToken: verificationToken,
          verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          profileInfo: {
            verificationLevel: "pending",
          },
        },
        { transaction: t }
      );

      // Crear wallet para el usuario
      await Wallet.create(
        {
          userId: user.id,
          balance: 0,
          frozenAmount: 0,
        },
        { transaction: t }
      );

      // DEPRECATED: Venue/Gallera models consolidated into User.profileInfo
      // Venue/gallera data now stored in user.profileInfo field
      /*
      if (role === "venue") {
        await Venue.create(
          {
            ownerId: user.id,
            name: null,
            location: null,
            description: null,
            status: "pending",
            contactInfo: {},
            images: [],
          },
          { transaction: t }
        );
      } else if (role === "gallera") {
        await Gallera.create(
          {
            ownerId: user.id,
            name: null,
            location: null,
            description: null,
            specialties: [],
            status: "pending",
            contactInfo: {},
            images: [],
          },
          { transaction: t }
        );
      }
      */

      // Enviar email de verificación
      await emailService.sendVerificationEmail(email, verificationToken);


      logger.info(`New user registered: ${user.username} (${user.email})`);

      // Respuesta
      res.status(201).json({
        success: true,
        message: "User registered successfully. Please check your email to verify your account.",
      });
    });
  })
);

// POST /api/auth/login - Login de usuario
router.post(
  "/login",
  authRateLimit,
  loginValidation,
  asyncHandler(async (req, res) => {
    // Verificar errores de validación
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

    const { login, password } = req.body;

    console.log('🔍 Login attempt for:', login);
    
    // Buscar usuario por email o username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: login }, { username: login }],
      },
    });

    console.log('🔍 User found:', user ? 'YES' : 'NO', user?.toJSON());

    if (!user) {
      console.log('❌ Login failed: User not found for:', login);
      throw errors.unauthorized("Invalid credentials");
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      console.log('❌ Login failed: User inactive:', login);
      throw errors.forbidden("Account is disabled");
    }

    // Verificar contraseña
    console.log('🔍 Checking password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔍 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password for:', login);
      throw errors.unauthorized("Invalid credentials");
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token
    const token = generateToken(user.id);

    // ⚡ SECURITY: Create session with concurrent login prevention
    try {
      await SessionService.createSession(user.id, token, req);
    } catch (sessionError: any) {
      // Handle session conflict (concurrent login detected)
      if (sessionError.code === 'SESSION_CONFLICT') {
        console.log('❌ Login rejected: Active session exists for:', login);
        return res.status(409).json({
          success: false,
          error: sessionError.message,
          code: 'SESSION_CONFLICT',
          existingSession: sessionError.existingSession
        });
      }
      // Re-throw other errors
      throw sessionError;
    }

    console.log('✅ Login successful for:', user.username, '(', user.email, ')');
    logger.info(`User logged in: ${user.username} (${user.email})`);

    // Respuesta
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: await user.toPublicJSON(),
        token,
      },
    });
  })
);

// GET /api/auth/me - Obtener información del usuario autenticado
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    // Obtener usuario con información adicional
    const user = await User.findByPk(req.user!.id, {
      include: [
        {
          model: Wallet,
          as: "wallet",
          separate: false,
        },
      ],
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    res.json({
      success: true,
      data: {
        user: await user.toPublicJSON(),
        wallet: (user as any).wallet?.toPublicJSON(),
      },
    });
  })
);

// POST /api/auth/refresh - Renovar token
router.post(
  "/refresh",
  authenticate,
  asyncHandler(async (req, res) => {
    const token = generateToken(req.user!.id);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: { token },
    });
  })
);

// POST /api/auth/logout - Logout with session invalidation
router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    // Extract token from Authorization header
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      // Invalidate the session to prevent token reuse
      await SessionService.invalidateSession(token);
    }

    logger.info(`User logged out: ${req.user!.username}`);

    res.json({
      success: true,
      message: "Logout successful",
    });
  })
);

// POST /api/auth/change-password - Cambiar contraseña
router.post(
  "/change-password",
  authRateLimit,
  authenticate,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "New password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
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

    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw errors.unauthorized("Current password is incorrect");
    }

    // Actualizar contraseña
    user.passwordHash = newPassword; // Se hashea automáticamente en el hook
    await user.save();

    logger.info(`Password changed for user: ${user.username}`);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  })
);

router.get('/verify/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    where: {
      verificationToken: token,
      verificationExpires: { [Op.gt]: new Date() }
    }
  });

  if (!user) {
    throw errors.badRequest('Token de verificación inválido o expirado');
  }

  user.emailVerified = true;
  user.verificationToken = null;
  user.verificationExpires = null;
  await user.save();

  res.json({
    success: true,
    message: 'Email verificado exitosamente'
  });
}));

// POST /api/auth/check-membership-status - Check user membership status
router.post(
  "/check-membership-status",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Find active subscription for user
    const subscription = await Subscription.findOne({
      where: {
        userId: userId,
        status: 'active',
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['expiresAt', 'DESC']]
    });

    let membershipStatus;

    if (subscription) {
      membershipStatus = {
        current_status: 'active',
        membership_type: subscription.type,
        expires_at: subscription.expiresAt,
        features: subscription.features || [],
        subscription_id: subscription.id
      };
    } else {
      membershipStatus = {
        current_status: 'inactive',
        membership_type: 'free',
        expires_at: null,
        features: [],
        subscription_id: null
      };
    }

    logger.info(`Membership status checked for user: ${req.user!.username}`);

    res.json({
      success: true,
      data: membershipStatus
    });
  })
);

export default router;