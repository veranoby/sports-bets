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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// GET /api/users/profile - Obtener perfil del usuario autenticado
router.get("/profile", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield models_1.User.findByPk(req.user.id, {
        include: [
            {
                model: models_1.Wallet,
                as: "wallet",
                attributes: ["balance", "frozenAmount"],
            },
        ],
    });
    if (!user) {
        throw errorHandler_1.errors.notFound("User not found");
    }
    const userData = user.toJSON();
    res.json({
        success: true,
        data: {
            user: user.toPublicJSON(),
            wallet: ((_b = (_a = userData.wallet) === null || _a === void 0 ? void 0 : _a.toPublicJSON) === null || _b === void 0 ? void 0 : _b.call(_a)) || userData.wallet,
        },
    });
})));
// PUT /api/users/profile - Actualizar perfil del usuario
router.put("/profile", auth_1.authenticate, [
    (0, express_validator_1.body)("profileInfo.fullName")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters"),
    (0, express_validator_1.body)("profileInfo.phoneNumber")
        .optional()
        .isMobilePhone("any")
        .withMessage("Please provide a valid mobile phone number"),
    (0, express_validator_1.body)("profileInfo.address")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Address must not exceed 500 characters"),
    (0, express_validator_1.body)("profileInfo.identificationNumber")
        .optional()
        .isLength({ min: 5, max: 20 })
        .withMessage("Identification number must be between 5 and 20 characters"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const user = req.user;
    const { profileInfo } = req.body;
    if (profileInfo) {
        // Actualizar información del perfil manteniendo datos existentes
        user.profileInfo = Object.assign(Object.assign({}, user.profileInfo), profileInfo);
    }
    yield user.save();
    res.json({
        success: true,
        message: "Profile updated successfully",
        data: user.toPublicJSON(),
    });
})));
// GET /api/users - Listar usuarios (solo admin)
router.get("/", auth_1.optionalAuth, (req, res, next) => {
    const requestedRole = req.query.role;
    const isPublicQuery = requestedRole === "gallera" || requestedRole === "venue";
    if (isPublicQuery) {
        return next();
    }
    // For all other user list requests, require admin privileges
    return (0, auth_1.authorize)("admin")(req, res, next);
}, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { role, isActive, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (role)
        where.role = role;
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    // For public queries, only return public profile information
    const isPublicQuery = role === "gallera" || role === "venue";
    const attributes = isPublicQuery
        ? ["id", "username", "role", "profileInfo", "createdAt"]
        : [
            "id",
            "username",
            "email",
            "role",
            "isActive",
            "profileInfo",
            "lastLogin",
            "createdAt",
            "updatedAt",
        ];
    const users = yield models_1.User.findAndCountAll({
        where,
        attributes,
        include: isPublicQuery
            ? []
            : [
                {
                    model: models_1.Wallet,
                    as: "wallet",
                    attributes: ["balance", "frozenAmount"],
                },
            ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });
    res.json({
        success: true,
        data: {
            users: users.rows,
            total: users.count,
            limit: parseInt(limit),
            offset: parseInt(offset),
        },
    });
})));
// POST /api/users - Create new user (admin only)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin"), [
    (0, express_validator_1.body)("username")
        .isLength({ min: 3, max: 50 })
        .withMessage("Username must be between 3 and 50 characters")
        .isAlphanumeric()
        .withMessage("Username must contain only letters and numbers"),
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Please provide a valid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    (0, express_validator_1.body)("role")
        .isIn(["admin", "operator", "venue", "user", "gallera"])
        .withMessage("Invalid role"),
    (0, express_validator_1.body)("profileInfo")
        .optional()
        .isObject()
        .withMessage("Profile info must be an object"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { username, email, password, role, profileInfo } = req.body;
    // Check if username or email already exists
    const { Op } = require("sequelize");
    const existingUser = yield models_1.User.findOne({
        where: {
            [Op.or]: [{ username }, { email }]
        }
    });
    if (existingUser) {
        throw errorHandler_1.errors.badRequest(existingUser.username === username
            ? "Username already exists"
            : "Email already exists");
    }
    const user = yield models_1.User.create({
        username,
        email,
        passwordHash: password, // Will be hashed automatically by the model hook
        role,
        profileInfo: profileInfo || { verificationLevel: "none" },
        isActive: true
    });
    // Create wallet for user
    yield models_1.Wallet.create({
        userId: user.id,
        balance: 0,
        frozenAmount: 0
    });
    res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user.toPublicJSON()
    });
})));
// GET /api/users/:id - Obtener usuario específico (solo admin)
router.get("/:id", auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Fetch minimal user first to determine role/public access
    const target = yield models_1.User.findByPk(req.params.id);
    if (!target) {
        throw errorHandler_1.errors.notFound("User not found");
    }
    const isPublicProfile = target.role === "gallera" || target.role === "venue";
    const isSelf = req.user && req.user.id === target.id;
    const isAdmin = req.user && req.user.role === "admin";
    // If not a public profile, only admin or the user themself can view
    if (!isPublicProfile && !isAdmin && !isSelf) {
        return next(errorHandler_1.errors.forbidden("Insufficient permissions"));
    }
    const attributes = isPublicProfile
        ? ["id", "username", "role", "profileInfo", "createdAt"]
        : { exclude: ["passwordHash"] };
    const include = isPublicProfile
        ? []
        : [
            {
                model: models_1.Wallet,
                as: "wallet",
                attributes: ["balance", "frozenAmount"],
            },
        ];
    const user = yield models_1.User.findByPk(req.params.id, {
        attributes,
        include,
    });
    if (!user) {
        throw errorHandler_1.errors.notFound("User not found");
    }
    // Build sanitized response according to include
    const userJson = user.toPublicJSON ? user.toPublicJSON() : user;
    let responseData = userJson;
    if (!isPublicProfile) {
        const userRaw = user.toJSON();
        const wallet = ((_b = (_a = userRaw.wallet) === null || _a === void 0 ? void 0 : _a.toPublicJSON) === null || _b === void 0 ? void 0 : _b.call(_a)) || userRaw.wallet;
        responseData = { user: userJson, wallet };
    }
    res.json({
        success: true,
        data: responseData,
    });
})));
// PUT /api/users/:id/activation - Activar/desactivar usuario (solo admin)
router.put("/:id/activation", auth_1.authenticate, (0, auth_1.authorize)("admin"), [
    (0, express_validator_1.body)("isActive").isBoolean().withMessage("isActive must be a boolean value"),
    (0, express_validator_1.body)("reason")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Reason must not exceed 500 characters"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { isActive, reason } = req.body;
    const user = yield models_1.User.findByPk(req.params.id);
    if (!user) {
        throw errorHandler_1.errors.notFound("User not found");
    }
    user.isActive = isActive;
    yield user.save();
    // Log de auditoría
    require("../config/logger").logger.info(`User ${user.username} (${user.id}) active status changed to ${isActive} by admin ${req.user.username}. Reason: ${reason || "Not specified"}`);
    res.json({
        success: true,
        message: `User active status updated to ${isActive} successfully`,
        data: user.toPublicJSON(),
    });
})));
// PUT /api/users/:id/role - Cambiar rol de usuario (solo admin)
router.put("/:id/role", auth_1.authenticate, (0, auth_1.authorize)("admin"), [
    (0, express_validator_1.body)("role")
        .isIn(["admin", "operator", "venue", "user", "gallera"])
        .withMessage("Invalid role"),
    (0, express_validator_1.body)("reason")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Reason must not exceed 500 characters"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { role, reason } = req.body;
    const user = yield models_1.User.findByPk(req.params.id);
    if (!user) {
        throw errorHandler_1.errors.notFound("User not found");
    }
    const oldRole = user.role;
    user.role = role;
    yield user.save();
    // Log de auditoría
    require("../config/logger").logger.info(`User ${user.username} (${user.id}) role changed from ${oldRole} to ${role} by admin ${req.user.username}. Reason: ${reason || "Not specified"}`);
    res.json({
        success: true,
        message: "User role updated successfully",
        data: user.toPublicJSON(),
    });
})));
// GET /api/users/operators/available - Obtener operadores disponibles (solo admin)
router.get("/operators/available", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const operators = yield models_1.User.findAll({
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
})));
exports.default = router;
