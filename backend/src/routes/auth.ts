import { Router } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { User, Wallet } from "../models";
import { errors, asyncHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import { logger } from "../config/logger";
import { transaction } from "../config/database";
import { Op } from "sequelize";

const router = Router();

// Validaciones para registro
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .isAlphanumeric()
    .withMessage("Username must contain only letters and numbers"),
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
    .isIn(["user", "operator", "venue"])
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
    { expiresIn: '7d' } as any
  );
};

// POST /api/auth/register - Registro de usuario
router.post(
  "/register",
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
      throw errors.conflict("User with this email or username already exists");
    }

    // Crear usuario y wallet en una transacción
    await transaction(async (t) => {
      // Crear usuario
      const user = await User.create(
        {
          username,
          email,
          passwordHash: password, // Se hashea automáticamente en el hook
          role,
          profileInfo: {
            verificationLevel: "none",
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

      // Generar token
      const token = generateToken(user.id);

      logger.info(`New user registered: ${user.username} (${user.email})`);

      // Respuesta
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: user.toPublicJSON(),
          token,
        },
      });
    });
  })
);

// POST /api/auth/login - Login de usuario
router.post(
  "/login",
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

    // Buscar usuario por email o username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: login }, { username: login }],
      },
    });

    if (!user) {
      throw errors.unauthorized("Invalid credentials");
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      throw errors.forbidden("Account is disabled");
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw errors.unauthorized("Invalid credentials");
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token
    const token = generateToken(user.id);

    logger.info(`User logged in: ${user.username} (${user.email})`);

    // Respuesta
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toPublicJSON(),
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
        },
      ],
    });

    if (!user) {
      throw errors.notFound("User not found");
    }

    res.json({
      success: true,
      data: {
        user: user.toPublicJSON(),
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

// POST /api/auth/logout - Logout (principalmente para limpiar token del cliente)
router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
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

export default router;