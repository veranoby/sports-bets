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
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var helmet_1 = __importDefault(require("helmet"));
var http_1 = require("http");
var dotenv_1 = require("dotenv");
var envValidator_1 = require("./config/envValidator");
var database_1 = require("./config/database");
var logger_1 = require("./config/logger");
var errorHandler_1 = require("./middleware/errorHandler");
var requestLogger_1 = require("./middleware/requestLogger");
var performanceMonitoring_1 = require("./middleware/performanceMonitoring");
// Import SSE and WebSocket services
var websocketService_1 = require("./services/websocketService");
var databaseHooks_1 = __importDefault(require("./services/databaseHooks"));
var sessionService_1 = __importDefault(require("./services/sessionService"));
// Importar rutas
var auth_1 = __importDefault(require("./routes/auth"));
var users_1 = __importDefault(require("./routes/users"));
var events_1 = __importDefault(require("./routes/events"));
var fights_1 = __importDefault(require("./routes/fights"));
var bets_1 = __importDefault(require("./routes/bets"));
var wallet_1 = __importDefault(require("./routes/wallet"));
var venues_1 = __importDefault(require("./routes/venues"));
var galleras_1 = __importDefault(require("./routes/galleras"));
var subscriptions_1 = __importDefault(require("./routes/subscriptions"));
var webhooks_1 = __importDefault(require("./routes/webhooks"));
var notifications_1 = __importDefault(require("./routes/notifications"));
var articles_1 = __importDefault(require("./routes/articles"));
var sse_1 = __importDefault(require("./routes/sse"));
var push_1 = __importDefault(require("./routes/push"));
var settings_1 = __importDefault(require("./routes/settings"));
var monitoring_1 = __importDefault(require("./routes/monitoring"));
var uploads_1 = __importDefault(require("./routes/uploads"));
var membership_requests_1 = __importDefault(require("./routes/membership-requests"));
var streaming_1 = __importDefault(require("./routes/streaming"));
var streaming_monitoring_1 = __importDefault(require("./routes/streaming-monitoring"));
var admin_sessions_1 = __importDefault(require("./routes/admin-sessions"));
// Cargar variables de entorno
(0, dotenv_1.config)();
// Validate environment variables before starting server
(0, envValidator_1.validateEnvironment)();
(0, envValidator_1.logEnvironmentStatus)();
// Importar Redis
var redis_1 = require("./config/redis");
// Importar middleware de configuración global
var settingsMiddleware_1 = require("./middleware/settingsMiddleware");
var Server = /** @class */ (function () {
    function Server() {
        this.app = (0, express_1.default)();
        this.httpServer = (0, http_1.createServer)(this.app);
        this.port = process.env.PORT || 3001;
        // Inicializar Redis (no bloqueante)
        (0, redis_1.initRedis)().catch(function (err) {
            logger_1.logger.error("Redis initialization error:", err);
        });
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    Server.prototype.initializeMiddlewares = function () {
        // Middleware de seguridad
        this.app.use((0, helmet_1.default)({
            crossOriginEmbedderPolicy: false, // Para permitir streaming
            crossOriginOpenerPolicy: false, // Permitir cross-origin para imágenes
            crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos cross-origin
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:", "http:", "http://localhost:3001"],
                    mediaSrc: ["'self'", "https:"],
                },
            },
        }));
        // CORS
        this.app.use((0, cors_1.default)({
            origin: function (origin, callback) {
                var allowedOrigins = [
                    process.env.FRONTEND_URL || "http://localhost:5173",
                    "http://localhost:3000",
                    "http://localhost:5174",
                    "http://127.0.0.1:5174",
                    "http://[::1]:5174"
                ];
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    logger_1.logger.warn("CORS blocked origin: ".concat(origin));
                    callback(null, true); // Allow all in dev
                }
            },
            credentials: true,
        }));
        // Parsing del body
        this.app.use(express_1.default.json({ limit: "10mb" }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
        // Logger de requests
        this.app.use(requestLogger_1.requestLogger);
        // Performance monitoring middleware
        this.app.use(performanceMonitoring_1.performanceMonitoring);
        // Global settings middleware
        this.app.use(settingsMiddleware_1.checkMaintenanceMode);
        this.app.use(settingsMiddleware_1.injectPublicSettings);
        // Health check endpoint
        this.app.get("/health", function (req, res) {
            res.status(200).json({
                status: "OK",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || "development",
            });
        });
    };
    Server.prototype.initializeRoutes = function () {
        // Rutas API
        this.app.use("/api/auth", auth_1.default);
        this.app.use("/api/users", users_1.default);
        this.app.use("/api/events", events_1.default);
        this.app.use("/api/fights", fights_1.default);
        this.app.use("/api/bets", bets_1.default);
        this.app.use("/api/wallet", wallet_1.default);
        this.app.use("/api/venues", venues_1.default);
        this.app.use("/api/subscriptions", subscriptions_1.default);
        this.app.use("/api/webhooks", webhooks_1.default);
        this.app.use("/api/notifications", notifications_1.default);
        this.app.use("/api/articles", articles_1.default);
        this.app.use("/api/sse", sse_1.default);
        this.app.use("/api/push", push_1.default);
        this.app.use("/api/settings", settings_1.default);
        this.app.use("/api/galleras", galleras_1.default);
        this.app.use("/api/monitoring", monitoring_1.default);
        this.app.use("/api/uploads", uploads_1.default);
        this.app.use("/api/membership-requests", membership_requests_1.default);
        this.app.use("/api/streaming", streaming_1.default);
        this.app.use("/api/sse", streaming_monitoring_1.default);
        this.app.use("/api/admin", admin_sessions_1.default);
        // Ruta para servir archivos estáticos con CORS headers
        this.app.use("/uploads", function (req, res, next) {
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
            res.setHeader("Access-Control-Allow-Origin", "*");
            next();
        }, express_1.default.static("uploads"));
        // Ruta 404
        this.app.use(function (req, res) {
            res.status(404).json({
                error: "Route not found",
                path: req.originalUrl,
            });
        });
    };
    Server.prototype.initializeErrorHandling = function () {
        this.app.use(errorHandler_1.errorHandler);
        // Manejo de promesas no capturadas
        process.on("unhandledRejection", function (reason, promise) {
            logger_1.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
        });
        process.on("uncaughtException", function (error) {
            logger_1.logger.error("Uncaught Exception:", error);
            process.exit(1);
        });
    };
    Server.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Conectar a la base de datos
                        return [4 /*yield*/, (0, database_1.connectDatabase)()];
                    case 1:
                        // Conectar a la base de datos
                        _a.sent();
                        // Initialize database hooks for SSE integration
                        databaseHooks_1.default.setupDatabaseHooks();
                        databaseHooks_1.default.setupPerformanceHooks();
                        // Initialize WebSocket service for PAGO/DOY proposals
                        websocketService_1.websocketService.initialize(this.httpServer);
                        // Initialize session cleanup cron job (runs every 6 hours)
                        this.sessionCleanupInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                            var deleted, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, sessionService_1.default.cleanupExpiredSessions()];
                                    case 1:
                                        deleted = _a.sent();
                                        if (deleted > 0) {
                                            logger_1.logger.info("\uD83E\uDDF9 Session cleanup: deleted ".concat(deleted, " expired/old sessions"));
                                        }
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_2 = _a.sent();
                                        logger_1.logger.error('❌ Session cleanup error:', error_2);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }, 6 * 60 * 60 * 1000); // Every 6 hours
                        // Run cleanup immediately on startup
                        sessionService_1.default.cleanupExpiredSessions()
                            .then(function (deleted) {
                            if (deleted > 0) {
                                logger_1.logger.info("\uD83E\uDDF9 Initial cleanup: deleted ".concat(deleted, " expired/old sessions"));
                            }
                        })
                            .catch(function (err) { return logger_1.logger.error('❌ Initial cleanup error:', err); });
                        // Iniciar el servidor HTTP
                        this.httpServer.listen(this.port, function () {
                            logger_1.logger.info("\uD83D\uDE80 Server running on port ".concat(_this.port));
                            logger_1.logger.info("\uD83C\uDF10 Environment: ".concat(process.env.NODE_ENV || "development"));
                            logger_1.logger.info("\uD83D\uDCCA Health check: http://localhost:".concat(_this.port, "/health"));
                            logger_1.logger.info("\uD83D\uDCE1 SSE endpoints: http://localhost:".concat(_this.port, "/api/sse/admin/*"));
                            logger_1.logger.info("\uD83D\uDD0C WebSocket endpoint: ws://localhost:".concat(_this.port, "/socket.io (PAGO/DOY only)"));
                        });
                        // Graceful shutdown handling
                        this.setupGracefulShutdown();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.error("Failed to start server:", error_1);
                        process.exit(1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Server.prototype.setupGracefulShutdown = function () {
        var _this = this;
        var gracefulShutdown = function (signal) {
            logger_1.logger.info("\uD83D\uDD04 Received ".concat(signal, ". Starting graceful shutdown..."));
            // Clear session cleanup interval
            if (_this.sessionCleanupInterval) {
                clearInterval(_this.sessionCleanupInterval);
                logger_1.logger.info('✅ Session cleanup interval cleared');
            }
            // Close HTTP server
            _this.httpServer.close(function () {
                logger_1.logger.info('✅ HTTP server closed');
                // Shutdown WebSocket service
                websocketService_1.websocketService.shutdown();
                // Remove database hooks
                databaseHooks_1.default.removeAllHooks();
                logger_1.logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            });
            // Force close after 10 seconds
            setTimeout(function () {
                logger_1.logger.error('❌ Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', function () { return gracefulShutdown('SIGTERM'); });
        process.on('SIGINT', function () { return gracefulShutdown('SIGINT'); });
    };
    Server.prototype.getApp = function () {
        return this.app;
    };
    return Server;
}());
// Inicializar y arrancar el servidor
var server = new Server();
server.start();
exports.default = server;
