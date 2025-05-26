"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = exports.createError = exports.asyncHandler = exports.errorHandler = void 0;
const logger_1 = require("../config/logger");
// Middleware de manejo de errores
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    // Log del error
    logger_1.logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
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
    const response = {
        error: true,
        message,
        statusCode
    };
    // En desarrollo, incluir stack trace
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
// Middleware para capturar errores async
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Función para crear errores personalizados
const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
exports.createError = createError;
// Errores comunes predefinidos
exports.errors = {
    badRequest: (message = 'Bad Request') => (0, exports.createError)(message, 400),
    unauthorized: (message = 'Unauthorized') => (0, exports.createError)(message, 401),
    forbidden: (message = 'Forbidden') => (0, exports.createError)(message, 403),
    notFound: (message = 'Not Found') => (0, exports.createError)(message, 404),
    conflict: (message = 'Conflict') => (0, exports.createError)(message, 409),
    internal: (message = 'Internal Server Error') => (0, exports.createError)(message, 500)
};
