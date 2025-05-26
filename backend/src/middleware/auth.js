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
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const errorHandler_1 = require("./errorHandler");
// Middleware de autenticación
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = extractToken(req);
        if (!token) {
            throw errorHandler_1.errors.unauthorized('No token provided');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.User.findByPk(decoded.userId);
        if (!user || !user.isActive) {
            throw errorHandler_1.errors.unauthorized('Invalid token or user inactive');
        }
        // Actualizar último acceso
        user.lastLogin = new Date();
        yield user.save();
        req.user = user;
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            next(errorHandler_1.errors.unauthorized('Invalid or expired token'));
        }
        else {
            next(error);
        }
    }
});
exports.authenticate = authenticate;
// Middleware de autorización por rol
const authorize = (...roles) => {
    return (req, res, next) => {
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
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // También buscar en cookies si es necesario
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    return null;
};
// Middleware para rutas opcionales de autenticación
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = extractToken(req);
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = yield User_1.User.findByPk(decoded.userId);
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        // En autenticación opcional, continuamos sin usuario si hay error
        next();
    }
});
exports.optionalAuth = optionalAuth;
