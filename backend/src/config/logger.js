"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.httpLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// Definir niveles de logging personalizados
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
// Colores para los niveles
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
};
winston_1.default.addColors(logColors);
// Formato personalizado para logs
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Formato para archivos (sin colores)
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Configuración de transports
const transports = [
    // Console transport
    new winston_1.default.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        format: logFormat
    })
];
// En producción, agregar transports de archivo
if (process.env.NODE_ENV === 'production') {
    // Crear directorio de logs si no existe
    const fs = require('fs');
    const logDir = path_1.default.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    transports.push(
    // Log de errores
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
    }), 
    // Log combinado
    new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'combined.log'),
        format: fileFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5
    }));
}
// Crear el logger
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels: logLevels,
    format: winston_1.default.format.errors({ stack: true }),
    transports,
    exitOnError: false
});
// Función para logging de requests HTTP
const httpLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
        if (res.statusCode >= 400) {
            exports.logger.warn(message);
        }
        else {
            exports.logger.http(message);
        }
    });
    next();
};
exports.httpLogger = httpLogger;
// Stream para Morgan (si se usa)
exports.stream = {
    write: (message) => {
        exports.logger.http(message.substring(0, message.lastIndexOf('\n')));
    }
};
exports.default = exports.logger;
