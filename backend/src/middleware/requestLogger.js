"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
var logger_1 = require("../config/logger");
// Middleware para logging de requests
var requestLogger = function (req, res, next) {
    var start = Date.now();
    // Logging del request entrante
    logger_1.logger.http("\u2192 ".concat(req.method, " ").concat(req.originalUrl, " from ").concat(req.ip));
    // Logging de headers importantes en desarrollo
    if (process.env.NODE_ENV === 'development') {
        if (req.headers.authorization) {
            logger_1.logger.debug("Authorization header present");
        }
        if (req.headers['content-type']) {
            logger_1.logger.debug("Content-Type: ".concat(req.headers['content-type']));
        }
    }
    // Capturar cuando se termine la respuesta
    res.on('finish', function () {
        var duration = Date.now() - start;
        var statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Rojo para errores, verde para éxito
        var resetColor = '\x1b[0m';
        logger_1.logger.http("\u2190 ".concat(req.method, " ").concat(req.originalUrl, " ").concat(statusColor).concat(res.statusCode).concat(resetColor, " ").concat(duration, "ms"));
        // Log adicional para errores 4xx y 5xx
        if (res.statusCode >= 400) {
            logger_1.logger.warn("Error response: ".concat(req.method, " ").concat(req.originalUrl, " - ").concat(res.statusCode, " - ").concat(duration, "ms"));
        }
    });
    next();
};
exports.requestLogger = requestLogger;
