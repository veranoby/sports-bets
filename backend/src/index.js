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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = require("dotenv");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("./config/database");
const logger_1 = require("./config/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
// Importar rutas
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const events_1 = __importDefault(require("./routes/events"));
const fights_1 = __importDefault(require("./routes/fights"));
const bets_1 = __importDefault(require("./routes/bets"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const venues_1 = __importDefault(require("./routes/venues"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const articles_1 = __importDefault(require("./routes/articles"));
// Cargar variables de entorno
(0, dotenv_1.config)();
// Importar Redis
const redis_1 = require("./config/redis");
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = process.env.PORT || 3001;
        this.httpServer = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
            },
        });
        // Inicializar Redis (no bloqueante)
        (0, redis_1.initRedis)().catch((err) => {
            logger_1.logger.error("Redis initialization error:", err);
        });
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeWebSocket();
        this.initializeErrorHandling();
    }
    initializeMiddlewares() {
        // Middleware de seguridad
        this.app.use((0, helmet_1.default)({
            crossOriginEmbedderPolicy: false, // Para permitir streaming
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    mediaSrc: ["'self'", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:"],
                },
            },
        }));
        // CORS
        this.app.use((0, cors_1.default)({
            origin: function (origin, callback) {
                const allowedOrigins = [
                    process.env.FRONTEND_URL || "http://localhost:5173",
                    "http://localhost:3000",
                    "http://localhost:5174",
                ];
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true,
        }));
        // Parsing del body
        this.app.use(express_1.default.json({ limit: "10mb" }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
        // Logger de requests
        this.app.use(requestLogger_1.requestLogger);
        // Health check endpoint
        this.app.get("/health", (req, res) => {
            res.status(200).json({
                status: "OK",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || "development",
            });
        });
    }
    initializeRoutes() {
        // Rutas API
        this.app.use("/api/auth", auth_1.default);
        this.app.use("/api/users", users_1.default);
        this.app.use("/api/events", events_1.default);
        this.app.use("/api/fights", fights_1.default);
        this.app.use("/api/bets", bets_1.default);
        this.app.use("/api/wallet", wallet_1.default);
        this.app.use("/api/venues", venues_1.default);
        this.app.use("/api/subscriptions", subscriptions_1.default);
        this.app.use("/api/notifications", notifications_1.default);
        this.app.use("/api/articles", articles_1.default);
        // Ruta para servir archivos estáticos si es necesario
        this.app.use("/uploads", express_1.default.static("uploads"));
        // Ruta 404
        this.app.use((req, res) => {
            res.status(404).json({
                error: "Route not found",
                path: req.originalUrl,
            });
        });
    }
    initializeWebSocket() {
        this.io.on("connection", (socket) => {
            logger_1.logger.info(`Client connected: ${socket.id}`);
            // Unirse a una sala específica (evento)
            socket.on("join_event", (eventId) => {
                socket.join(`event_${eventId}`);
                logger_1.logger.info(`Socket ${socket.id} joined event_${eventId}`);
            });
            // Salir de una sala específica
            socket.on("leave_event", (eventId) => {
                socket.leave(`event_${eventId}`);
                logger_1.logger.info(`Socket ${socket.id} left event_${eventId}`);
            });
            // Unirse a sala de operador
            socket.on("join_operator", (eventId) => {
                socket.join(`operator_${eventId}`);
                logger_1.logger.info(`Operator ${socket.id} joined event_${eventId}`);
            });
            // Desconexión
            socket.on("disconnect", () => {
                logger_1.logger.info(`Client disconnected: ${socket.id}`);
            });
        });
        // Hacer disponible el socket para otros módulos
        this.app.set("io", this.io);
    }
    initializeErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
        // Manejo de promesas no capturadas
        process.on("unhandledRejection", (reason, promise) => {
            logger_1.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
        });
        process.on("uncaughtException", (error) => {
            logger_1.logger.error("Uncaught Exception:", error);
            process.exit(1);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Conectar a la base de datos
                yield (0, database_1.connectDatabase)();
                // Iniciar el servidor
                this.httpServer.listen(this.port, () => {
                    logger_1.logger.info(`🚀 Server running on port ${this.port}`);
                    logger_1.logger.info(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
                    logger_1.logger.info(`📊 Health check: http://localhost:${this.port}/health`);
                });
            }
            catch (error) {
                logger_1.logger.error("Failed to start server:", error);
                process.exit(1);
            }
        });
    }
    getApp() {
        return this.app;
    }
    getIO() {
        return this.io;
    }
}
// Inicializar y arrancar el servidor
const server = new Server();
server.start();
exports.default = server;
