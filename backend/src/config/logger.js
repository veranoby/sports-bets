"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.httpLogger = exports.logger = void 0;
var winston_1 = __importDefault(require("winston"));
var path_1 = __importDefault(require("path"));
// Definir niveles de logging personalizados
var logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
// Colores para los niveles
var logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
};
winston_1.default.addColors(logColors);
// Formato personalizado para logs
var logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(function (info) { return "".concat(info.timestamp, " ").concat(info.level, ": ").concat(info.message); }));
// Formato para archivos (sin colores)
var fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.printf(function (info) { return "".concat(info.timestamp, " ").concat(info.level, ": ").concat(info.message); }));
// Configuración de transports
var transports = [
    // Console transport
    new winston_1.default.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        format: logFormat
    })
];
// En producción, agregar transports de archivo
if (process.env.NODE_ENV === 'production') {
    // Crear directorio de logs si no existe
    var fs = require('fs');
    var logDir = path_1.default.join(__dirname, '../../logs');
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
    transports: transports,
    exitOnError: false
});
// Función para logging de requests HTTP
var httpLogger = function (req, res, next) {
    var start = Date.now();
    res.on('finish', function () {
        var duration = Date.now() - start;
        var message = "".concat(req.method, " ").concat(req.originalUrl, " ").concat(res.statusCode, " ").concat(duration, "ms");
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
    write: function (message) {
        exports.logger.http(message.substring(0, message.lastIndexOf('\n')));
    }
};
exports.default = exports.logger;
