"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../config/logger");
// Middleware para logging de requests
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Logging del request entrante
    logger_1.logger.http(`→ ${req.method} ${req.originalUrl} from ${req.ip}`);
    // Logging de headers importantes en desarrollo
    if (process.env.NODE_ENV === 'development') {
        if (req.headers.authorization) {
            logger_1.logger.debug(`Authorization header present`);
        }
        if (req.headers['content-type']) {
            logger_1.logger.debug(`Content-Type: ${req.headers['content-type']}`);
        }
    }
    // Capturar cuando se termine la respuesta
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Rojo para errores, verde para éxito
        const resetColor = '\x1b[0m';
        logger_1.logger.http(`← ${req.method} ${req.originalUrl} ${statusColor}${res.statusCode}${resetColor} ${duration}ms`);
        // Log adicional para errores 4xx y 5xx
        if (res.statusCode >= 400) {
            logger_1.logger.warn(`Error response: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
