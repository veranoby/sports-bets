"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../config/logger");
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// Validaciones para registro
const registerValidation = [
    (0, express_validator_1.body)("username")
        .isLength({ min: 3, max: 50 })
        .withMessage("Username must be between 3 and 50 characters")
        .isAlphanumeric()
        .withMessage("Username must contain only letters and numbers"),
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    (0, express_validator_1.body)("role")
        .optional()
        .isIn(["user", "operator", "venue"])
        .withMessage("Invalid role specified"),
];
// Validaciones para login
const loginValidation = [
    (0, express_validator_1.body)("login").notEmpty().withMessage("Username or email is required"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
];
// Función para generar JWT - SOLUCIONADO
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
// POST /api/auth/register - Registro de usuario
router.post("/register", registerValidation, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar errores de validación
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { username, email, password, role = "user" } = req.body;
    // Verificar si el usuario ya existe
    const existingUser = yield models_1.User.findOne({
        where: {
            [sequelize_1.Op.or]: [{ email }, { username }],
        },
    });
    if (existingUser) {
        throw errorHandler_1.errors.conflict("User with this email or username already exists");
    }
    // Crear usuario y wallet en una transacción
    yield (0, database_1.transaction)((t) => __awaiter(void 0, void 0, void 0, function* () {
        // Crear usuario
        const user = yield models_1.User.create({
            username,
            email,
            passwordHash: password, // Se hashea automáticamente en el hook
            role,
            profileInfo: {
                verificationLevel: "none",
            },
        }, { transaction: t });
        // Crear wallet para el usuario
        yield models_1.Wallet.create({
            userId: user.id,
            balance: 0,
            frozenAmount: 0,
        }, { transaction: t });
        // Generar token
        const token = generateToken(user.id);
        logger_1.logger.info(`New user registered: ${user.username} (${user.email})`);
        // Respuesta
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: user.toPublicJSON(),
                token,
            },
        });
    }));
})));
// POST /api/auth/login - Login de usuario
router.post("/login", loginValidation, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar errores de validación
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { login, password } = req.body;
    // Buscar usuario por email o username
    const user = yield models_1.User.findOne({
        where: {
            [sequelize_1.Op.or]: [{ email: login }, { username: login }],
        },
    });
    if (!user) {
        throw errorHandler_1.errors.unauthorized("Invalid credentials");
    }
    // Verificar si el usuario está activo
    if (!user.isActive) {
        throw errorHandler_1.errors.forbidden("Account is disabled");
    }
    // Verificar contraseña
    const isPasswordValid = yield user.comparePassword(password);
    if (!isPasswordValid) {
        throw errorHandler_1.errors.unauthorized("Invalid credentials");
    }
    // Actualizar último login
    user.lastLogin = new Date();
    yield user.save();
    // Generar token
    const token = generateToken(user.id);
    logger_1.logger.info(`User logged in: ${user.username} (${user.email})`);
    // Respuesta
    res.json({
        success: true,
        message: "Login successful",
        data: {
            user: user.toPublicJSON(),
            token,
        },
    });
})));
// GET /api/auth/me - Obtener información del usuario autenticado
router.get("/me", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Obtener usuario con información adicional
    const user = yield models_1.User.findByPk(req.user.id, {
        include: [
            {
                model: models_1.Wallet,
                as: "wallet",
            },
        ],
    });
    if (!user) {
        throw errorHandler_1.errors.notFound("User not found");
    }
    res.json({
        success: true,
        data: {
            user: user.toPublicJSON(),
            wallet: (_a = user.wallet) === null || _a === void 0 ? void 0 : _a.toPublicJSON(),
        },
    });
})));
// POST /api/auth/refresh - Renovar token
router.post("/refresh", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = generateToken(req.user.id);
    res.json({
        success: true,
        message: "Token refreshed successfully",
        data: { token },
    });
})));
// POST /api/auth/logout - Logout (principalmente para limpiar token del cliente)
router.post("/logout", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info(`User logged out: ${req.user.username}`);
    res.json({
        success: true,
        message: "Logout successful",
    });
})));
// POST /api/auth/change-password - Cambiar contraseña
router.post("/change-password", auth_1.authenticate, [
    (0, express_validator_1.body)("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),
    (0, express_validator_1.body)("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    // Verificar contraseña actual
    const isCurrentPasswordValid = yield user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw errorHandler_1.errors.unauthorized("Current password is incorrect");
    }
    // Actualizar contraseña
    user.passwordHash = newPassword; // Se hashea automáticamente en el hook
    yield user.save();
    logger_1.logger.info(`Password changed for user: ${user.username}`);
    res.json({
        success: true,
        message: "Password changed successfully",
    });
})));
exports.default = router;
