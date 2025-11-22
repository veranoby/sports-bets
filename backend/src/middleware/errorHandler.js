"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = exports.createError = exports.asyncHandler = exports.errorHandler = void 0;
var logger_1 = require("../config/logger");
// Middleware de manejo de errores
var errorHandler = function (error, req, res, next) {
    var statusCode = error.statusCode || 500;
    var message = error.message || 'Internal Server Error';
    // Log del error
    logger_1.logger.error("".concat(statusCode, " - ").concat(message, " - ").concat(req.originalUrl, " - ").concat(req.method, " - ").concat(req.ip));
    logger_1.logger.error(error.stack);
    // Errores específicos de Sequelize
    if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Validation error';
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'Resource already exists';
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        statusCode = 400;
        message = 'Invalid reference';
    }
    // Errores de JWT
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Error de validación de Joi
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = error.message;
    }
    // Respuesta del error
    var response = {
        error: true,
        message: message,
        statusCode: statusCode
    };
    // En desarrollo, incluir stack trace
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
// Middleware para capturar errores async
var asyncHandler = function (fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Función para crear errores personalizados
var createError = function (message, statusCode) {
    var error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
exports.createError = createError;
// Errores comunes predefinidos
exports.errors = {
    badRequest: function (message) {
        if (message === void 0) { message = 'Bad Request'; }
        return (0, exports.createError)(message, 400);
    },
    unauthorized: function (message) {
        if (message === void 0) { message = 'Unauthorized'; }
        return (0, exports.createError)(message, 401);
    },
    forbidden: function (message) {
        if (message === void 0) { message = 'Forbidden'; }
        return (0, exports.createError)(message, 403);
    },
    notFound: function (message) {
        if (message === void 0) { message = 'Not Found'; }
        return (0, exports.createError)(message, 404);
    },
    conflict: function (message) {
        if (message === void 0) { message = 'Conflict'; }
        return (0, exports.createError)(message, 409);
    },
    internal: function (message) {
        if (message === void 0) { message = 'Internal Server Error'; }
        return (0, exports.createError)(message, 500);
    }
};
