"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var models_1 = require("../models");
var Subscription_1 = require("../models/Subscription");
var errorHandler_1 = require("../middleware/errorHandler");
var auth_1 = require("../middleware/auth");
var logger_1 = require("../config/logger");
var database_1 = require("../config/database");
var sequelize_1 = require("sequelize");
var crypto_1 = __importDefault(require("crypto"));
var emailService = __importStar(require("../services/emailService"));
var sessionService_1 = require("../services/sessionService");
var router = (0, express_1.Router)();
// Rate limiting for authentication endpoints (prevents brute-force attacks)
var authRateLimit = (0, express_rate_limit_1.default)({
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
var registerValidation = [
    (0, express_validator_1.body)("username")
        .isLength({ min: 3, max: 50 })
        .withMessage("Username must be between 3 and 50 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username must contain only letters, numbers, and underscores"),
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
        .isIn(["user", "venue", "gallera"])
        .withMessage("Invalid role specified"),
];
// Validaciones para login
var loginValidation = [
    (0, express_validator_1.body)("login").notEmpty().withMessage("Username or email is required"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
];
// Función para generar JWT - SOLUCIONADO
var generateToken = function (userId) {
    return jsonwebtoken_1.default.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: '24h' } // CHANGED: 7d -> 24h for better security
    );
};
// POST /api/auth/register - Registro de usuario
router.post("/register", authRateLimit, registerValidation, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, username, email, password, _b, role, existingUser;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, username = _a.username, email = _a.email, password = _a.password, _b = _a.role, role = _b === void 0 ? "user" : _b;
                return [4 /*yield*/, models_1.User.findOne({
                        where: (_c = {},
                            _c[sequelize_1.Op.or] = [{ email: email }, { username: username }],
                            _c),
                    })];
            case 1:
                existingUser = _d.sent();
                if (existingUser) {
                    throw errorHandler_1.errors.conflict("User with this email or username already exists");
                }
                // Crear usuario y wallet en una transacción
                return [4 /*yield*/, (0, database_1.transaction)(function (t) { return __awaiter(void 0, void 0, void 0, function () {
                        var verificationToken, user;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    verificationToken = crypto_1.default.randomBytes(32).toString('hex');
                                    return [4 /*yield*/, models_1.User.create({
                                            username: username,
                                            email: email,
                                            passwordHash: password, // Se hashea automáticamente en el hook
                                            role: role,
                                            approved: false, // ✅ Usuarios de registro público requieren aprobación
                                            emailVerified: false,
                                            verificationToken: verificationToken,
                                            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                                            profileInfo: {
                                                verificationLevel: "pending",
                                            },
                                        }, { transaction: t })];
                                case 1:
                                    user = _a.sent();
                                    // Crear wallet para el usuario
                                    return [4 /*yield*/, models_1.Wallet.create({
                                            userId: user.id,
                                            balance: 0,
                                            frozenAmount: 0,
                                        }, { transaction: t })];
                                case 2:
                                    // Crear wallet para el usuario
                                    _a.sent();
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
                                    return [4 /*yield*/, emailService.sendVerificationEmail(email, verificationToken)];
                                case 3:
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
                                    _a.sent();
                                    logger_1.logger.info("New user registered: ".concat(user.username, " (").concat(user.email, ")"));
                                    // Respuesta
                                    res.status(201).json({
                                        success: true,
                                        message: "User registered successfully. Please check your email to verify your account.",
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 2:
                // Crear usuario y wallet en una transacción
                _d.sent();
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/auth/login - Login de usuario
router.post("/login", authRateLimit, loginValidation, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, login, password, user, isPasswordValid, token, sessionError_1, _b, _c;
    var _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, login = _a.login, password = _a.password;
                console.log('🔍 Login attempt for:', login);
                return [4 /*yield*/, models_1.User.findOne({
                        where: (_d = {},
                            _d[sequelize_1.Op.or] = [{ email: login }, { username: login }],
                            _d),
                    })];
            case 1:
                user = _g.sent();
                console.log('🔍 User found:', user ? 'YES' : 'NO', user === null || user === void 0 ? void 0 : user.toJSON());
                if (!user) {
                    console.log('❌ Login failed: User not found for:', login);
                    throw errorHandler_1.errors.unauthorized("Invalid credentials");
                }
                // Verificar si el usuario está activo
                if (!user.isActive) {
                    console.log('❌ Login failed: User inactive:', login);
                    throw errorHandler_1.errors.forbidden("Account is disabled");
                }
                // Verificar contraseña
                console.log('🔍 Checking password...');
                return [4 /*yield*/, user.comparePassword(password)];
            case 2:
                isPasswordValid = _g.sent();
                console.log('🔍 Password valid:', isPasswordValid);
                if (!isPasswordValid) {
                    console.log('❌ Login failed: Invalid password for:', login);
                    throw errorHandler_1.errors.unauthorized("Invalid credentials");
                }
                // Actualizar último login
                user.lastLogin = new Date();
                return [4 /*yield*/, user.save()];
            case 3:
                _g.sent();
                token = generateToken(user.id);
                _g.label = 4;
            case 4:
                _g.trys.push([4, 6, , 7]);
                return [4 /*yield*/, sessionService_1.SessionService.createSession(user.id, token, req)];
            case 5:
                _g.sent();
                return [3 /*break*/, 7];
            case 6:
                sessionError_1 = _g.sent();
                // Handle session conflict (concurrent login detected)
                if (sessionError_1.code === 'SESSION_CONFLICT') {
                    console.log('❌ Login rejected: Active session exists for:', login);
                    return [2 /*return*/, res.status(409).json({
                            success: false,
                            error: sessionError_1.message,
                            code: 'SESSION_CONFLICT',
                            existingSession: sessionError_1.existingSession
                        })];
                }
                // Re-throw other errors
                throw sessionError_1;
            case 7:
                console.log('✅ Login successful for:', user.username, '(', user.email, ')');
                logger_1.logger.info("User logged in: ".concat(user.username, " (").concat(user.email, ")"));
                // Respuesta
                _c = (_b = res).json;
                _e = {
                    success: true,
                    message: "Login successful"
                };
                _f = {};
                return [4 /*yield*/, user.toPublicJSON()];
            case 8:
                // Respuesta
                _c.apply(_b, [(_e.data = (_f.user = _g.sent(),
                        _f.token = token,
                        _f),
                        _e)]);
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/auth/me - Obtener información del usuario autenticado
router.get("/me", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, _b;
    var _c, _d;
    var _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0: return [4 /*yield*/, models_1.User.findByPk(req.user.id, {
                    include: [
                        {
                            model: models_1.Wallet,
                            as: "wallet",
                            separate: false,
                        },
                    ],
                })];
            case 1:
                user = _f.sent();
                if (!user) {
                    throw errorHandler_1.errors.notFound("User not found");
                }
                _b = (_a = res).json;
                _c = {
                    success: true
                };
                _d = {};
                return [4 /*yield*/, user.toPublicJSON()];
            case 2:
                _b.apply(_a, [(_c.data = (_d.user = _f.sent(),
                        _d.wallet = (_e = user.wallet) === null || _e === void 0 ? void 0 : _e.toPublicJSON(),
                        _d),
                        _c)]);
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/auth/refresh - Renovar token
router.post("/refresh", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token;
    return __generator(this, function (_a) {
        token = generateToken(req.user.id);
        res.json({
            success: true,
            message: "Token refreshed successfully",
            data: { token: token },
        });
        return [2 /*return*/];
    });
}); }));
// POST /api/auth/logout - Logout with session invalidation
router.post("/logout", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
                if (!token) return [3 /*break*/, 2];
                // Invalidate the session to prevent token reuse
                return [4 /*yield*/, sessionService_1.SessionService.invalidateSession(token)];
            case 1:
                // Invalidate the session to prevent token reuse
                _b.sent();
                _b.label = 2;
            case 2:
                logger_1.logger.info("User logged out: ".concat(req.user.username));
                res.json({
                    success: true,
                    message: "Logout successful",
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/auth/change-password - Cambiar contraseña
router.post("/change-password", authRateLimit, auth_1.authenticate, [
    (0, express_validator_1.body)("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),
    (0, express_validator_1.body)("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, currentPassword, newPassword, user, isCurrentPasswordValid;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                user = req.user;
                return [4 /*yield*/, user.comparePassword(currentPassword)];
            case 1:
                isCurrentPasswordValid = _b.sent();
                if (!isCurrentPasswordValid) {
                    throw errorHandler_1.errors.unauthorized("Current password is incorrect");
                }
                // Actualizar contraseña
                user.passwordHash = newPassword; // Se hashea automáticamente en el hook
                return [4 /*yield*/, user.save()];
            case 2:
                _b.sent();
                logger_1.logger.info("Password changed for user: ".concat(user.username));
                res.json({
                    success: true,
                    message: "Password changed successfully",
                });
                return [2 /*return*/];
        }
    });
}); }));
router.get('/verify/:token', (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                token = req.params.token;
                return [4 /*yield*/, models_1.User.findOne({
                        where: {
                            verificationToken: token,
                            verificationExpires: (_a = {}, _a[sequelize_1.Op.gt] = new Date(), _a)
                        }
                    })];
            case 1:
                user = _b.sent();
                if (!user) {
                    throw errorHandler_1.errors.badRequest('Token de verificación inválido o expirado');
                }
                user.emailVerified = true;
                user.verificationToken = null;
                user.verificationExpires = null;
                return [4 /*yield*/, user.save()];
            case 2:
                _b.sent();
                res.json({
                    success: true,
                    message: 'Email verificado exitosamente'
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/auth/check-membership-status - Check user membership status
router.post("/check-membership-status", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, subscription, membershipStatus;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.user.id;
                return [4 /*yield*/, Subscription_1.Subscription.findOne({
                        where: {
                            userId: userId,
                            status: 'active',
                            expiresAt: (_a = {}, _a[sequelize_1.Op.gt] = new Date(), _a)
                        },
                        order: [['expiresAt', 'DESC']]
                    })];
            case 1:
                subscription = _b.sent();
                if (subscription) {
                    membershipStatus = {
                        current_status: 'active',
                        membership_type: subscription.type,
                        expires_at: subscription.expiresAt,
                        features: subscription.features || [],
                        subscription_id: subscription.id
                    };
                }
                else {
                    membershipStatus = {
                        current_status: 'inactive',
                        membership_type: 'free',
                        expires_at: null,
                        features: [],
                        subscription_id: null
                    };
                }
                logger_1.logger.info("Membership status checked for user: ".concat(req.user.username));
                res.json({
                    success: true,
                    data: membershipStatus
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
