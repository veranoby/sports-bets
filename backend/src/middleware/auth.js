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
exports.filterByOperatorAssignment = exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var User_1 = require("../models/User");
var Subscription_1 = require("../models/Subscription");
var errorHandler_1 = require("./errorHandler");
var sessionService_1 = require("../services/sessionService");
var userCache = new Map();
var BASE_CACHE_DURATION = 1 * 60 * 1000; // 1 minute base TTL
var MIN_CACHE_DURATION = 30 * 1000; // 30 seconds minimum TTL
var MAX_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes maximum TTL
// ⚡ OPTIMIZATION: Periodic cache cleanup to prevent memory leaks
setInterval(function () {
    var now = Date.now();
    for (var _i = 0, _a = userCache.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], userId = _b[0], cached = _b[1];
        if (now >= cached.expires) {
            userCache.delete(userId);
        }
    }
}, 5 * 60 * 1000); // Clean up every 5 minutes
/**
 * ⚡ CRITICAL: Subscription expiration check (PRD:149-153)
 *
 * Automatically expires subscriptions on each authenticated request if:
 * - subscription.expiresAt < current_time
 * - subscription.status === 'active'
 *
 * Changes subscription to 'expired' and invalidates user cache.
 * This ensures immediate access control update.
 */
function checkAndExpireSubscription(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var subscription, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, Subscription_1.Subscription.findOne({
                            where: { userId: userId, status: 'active' },
                            order: [['createdAt', 'DESC']]
                        })];
                case 1:
                    subscription = _a.sent();
                    if (!(subscription && subscription.isExpired())) return [3 /*break*/, 3];
                    console.log("\u23F0 Deleting expired subscription for user ".concat(userId));
                    // Delete expired subscription instead of marking as expired
                    return [4 /*yield*/, subscription.destroy()];
                case 2:
                    // Delete expired subscription instead of marking as expired
                    _a.sent();
                    // Invalidate user cache to force re-fetch on next request
                    userCache.delete(userId);
                    console.log("\u2705 Expired subscription deleted for user ".concat(userId));
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error checking subscription expiration:', error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Middleware de autenticación
var authenticate = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, decoded, activeSession, now, user, cached, newTtl, fetchedUser, ttl, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                token = extractToken(req);
                if (!token) {
                    throw errorHandler_1.errors.unauthorized('No token provided');
                }
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                return [4 /*yield*/, sessionService_1.SessionService.validateSession(token)];
            case 1:
                activeSession = _a.sent();
                if (!activeSession) {
                    throw errorHandler_1.errors.unauthorized('Session expired or invalidated. Please login again.');
                }
                now = Date.now();
                user = void 0;
                cached = userCache.get(decoded.userId);
                if (!(cached && now < cached.expires)) return [3 /*break*/, 2];
                user = cached.user;
                // Update access frequency and time for adaptive TTL
                cached.lastAccessTime = now;
                cached.accessFrequency = (cached.accessFrequency || 0) + 1;
                newTtl = calculateAdaptiveTtl(cached);
                cached.expires = now + newTtl;
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, User_1.User.findByPk(decoded.userId)];
            case 3:
                fetchedUser = _a.sent();
                if (!fetchedUser || !fetchedUser.isActive) {
                    throw errorHandler_1.errors.unauthorized('Invalid token or user inactive');
                }
                ttl = calculateInitialTtl(fetchedUser);
                userCache.set(decoded.userId, {
                    user: fetchedUser,
                    expires: now + ttl,
                    lastAccessTime: now,
                    accessFrequency: 1
                });
                user = fetchedUser;
                _a.label = 4;
            case 4:
                if (!user || !user.isActive) {
                    throw errorHandler_1.errors.unauthorized('Invalid token or user inactive');
                }
                // ⚡ CRITICAL: Check subscription expiration (PRD:149-153)
                // Auto-expire subscriptions on each authenticated request
                return [4 /*yield*/, checkAndExpireSubscription(user.id)];
            case 5:
                // ⚡ CRITICAL: Check subscription expiration (PRD:149-153)
                // Auto-expire subscriptions on each authenticated request
                _a.sent();
                // ⚠️ Check if user account is approved (except for admins/operators who are auto-approved)
                if (["venue", "gallera"].includes(user.role) && !user.approved) {
                    throw errorHandler_1.errors.forbidden("Your ".concat(user.role, " account is pending admin approval. Please check your email for status updates."));
                }
                // lastLogin is only updated during actual login in auth.ts
                // Removed excessive database updates per request
                req.user = user;
                next();
                return [3 /*break*/, 7];
            case 6:
                error_2 = _a.sent();
                console.log('Authentication error:', error_2.name, error_2.message);
                if (error_2.name === 'JsonWebTokenError' || error_2.name === 'TokenExpiredError') {
                    next(errorHandler_1.errors.unauthorized('Invalid or expired token'));
                }
                else {
                    next(error_2);
                }
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.authenticate = authenticate;
// Middleware de autorización por rol
var authorize = function () {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return function (req, res, next) {
        if (!req.user) {
            return next(errorHandler_1.errors.unauthorized('User not authenticated'));
        }
        if (!roles.includes(req.user.role)) {
            return next(errorHandler_1.errors.forbidden('Insufficient permissions'));
        }
        next();
    };
};
exports.authorize = authorize;
// Función para extraer token del header
var extractToken = function (req) {
    // Check for authorization header in multiple possible formats
    var authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Check for token in query parameters (for SSE connections)
    // SSE cannot send custom headers, so token is passed as ?token=...
    if (req.query && req.query.token && typeof req.query.token === 'string') {
        return req.query.token;
    }
    // También buscar en cookies si es necesario
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    return null;
};
// Middleware para rutas opcionales de autenticación
var optionalAuth = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, decoded, now, user, cached, newTtl, fetchedUser, ttl, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                token = extractToken(req);
                if (!token) return [3 /*break*/, 4];
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                now = Date.now();
                user = null;
                cached = userCache.get(decoded.userId);
                if (!(cached && now < cached.expires)) return [3 /*break*/, 1];
                user = cached.user;
                // Update access frequency and time for adaptive TTL
                cached.lastAccessTime = now;
                cached.accessFrequency = (cached.accessFrequency || 0) + 1;
                newTtl = calculateAdaptiveTtl(cached);
                cached.expires = now + newTtl;
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, User_1.User.findByPk(decoded.userId)];
            case 2:
                fetchedUser = _a.sent();
                if (fetchedUser && fetchedUser.isActive) {
                    ttl = calculateInitialTtl(fetchedUser);
                    userCache.set(decoded.userId, {
                        user: fetchedUser,
                        expires: now + ttl,
                        lastAccessTime: now,
                        accessFrequency: 1
                    });
                    user = fetchedUser;
                }
                _a.label = 3;
            case 3:
                if (user && user.isActive) {
                    req.user = user;
                }
                _a.label = 4;
            case 4:
                next();
                return [3 /*break*/, 6];
            case 5:
                error_3 = _a.sent();
                // En autenticación opcional, continuamos sin usuario si hay error
                next();
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.optionalAuth = optionalAuth;
// Middleware para filtrar datos para operadores
var filterByOperatorAssignment = function (req, res, next) {
    var _a;
    // Si el usuario es un operador, añadimos un filtro para sus consultas.
    // Este filtro será usado en los controladores para limitar los resultados
    // a los eventos/datos que le han sido asignados.
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'operator') {
        // Se adjunta el filtro al objeto de la petición.
        // Los controladores deben estar preparados para usar este filtro.
        req.queryFilter = { operatorId: req.user.id };
    }
    // Si el rol es 'admin' o cualquier otro, no se aplica ningún filtro,
    // permitiendo acceso completo (según lo definido en 'authorize').
    next();
};
exports.filterByOperatorAssignment = filterByOperatorAssignment;
// Helper function to calculate initial TTL based on user role
// Role-based caching: admin/operator get longer TTL (more frequent access),
// regular users get shorter TTL (less frequent access)
function calculateInitialTtl(user) {
    // Roles that typically access system more frequently get longer cache time
    if (['admin', 'operator'].includes(user.role)) {
        return MAX_CACHE_DURATION; // 5 minutes for admin/operator
    }
    // Regular users get base time
    return BASE_CACHE_DURATION; // 1 minute for regular users
}
// Helper function to calculate adaptive TTL based on access patterns
function calculateAdaptiveTtl(cached) {
    var accessFrequency = cached.accessFrequency || 1;
    // If accessed many times recently, extend cache time
    if (accessFrequency > 5) {
        return MAX_CACHE_DURATION; // 5 minutes for frequently accessed users
    }
    // If accessed moderately recently, use base time
    if (accessFrequency > 2) {
        return BASE_CACHE_DURATION; // 1 minute for moderately accessed users
    }
    // If not accessed recently, use shorter cache time
    return MIN_CACHE_DURATION; // 30 seconds for infrequently accessed users
}
