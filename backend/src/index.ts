import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "dotenv";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { connectDatabase } from "./config/database";
import { logger } from "./config/logger";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

// Importar rutas
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import eventRoutes from "./routes/events";
import fightRoutes from "./routes/fights";
import betRoutes from "./routes/bets";
import walletRoutes from "./routes/wallet";
import venueRoutes from "./routes/venues";
import subscriptionRoutes from "./routes/subscriptions";

// Cargar variables de entorno
config();

class Server {
  private app: express.Application;
  private httpServer: any;
  private io: SocketServer;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.httpServer = createServer(this.app);
    this.io = new SocketServer(this.httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Middleware de seguridad
    this.app.use(
      helmet({
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
      })
    );

    // CORS
    this.app.use(
      cors({
        origin: function (origin, callback) {
          const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:5174",
          ];
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      })
    );

    // Parsing del body
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logger de requests
    this.app.use(requestLogger);

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

  private initializeRoutes(): void {
    // Rutas API
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/users", userRoutes);
    this.app.use("/api/events", eventRoutes);
    this.app.use("/api/fights", fightRoutes);
    this.app.use("/api/bets", betRoutes);
    this.app.use("/api/wallet", walletRoutes);
    this.app.use("/api/venues", venueRoutes);
    this.app.use("/api/subscriptions", subscriptionRoutes);

    // Ruta para servir archivos estáticos si es necesario
    this.app.use("/uploads", express.static("uploads"));

    // Ruta 404
    this.app.use((req, res) => {
      res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
      });
    });
  }

  private initializeWebSocket(): void {
    this.io.on("connection", (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Unirse a una sala específica (evento)
      socket.on("join_event", (eventId: string) => {
        socket.join(`event_${eventId}`);
        logger.info(`Socket ${socket.id} joined event_${eventId}`);
      });

      // Salir de una sala específica
      socket.on("leave_event", (eventId: string) => {
        socket.leave(`event_${eventId}`);
        logger.info(`Socket ${socket.id} left event_${eventId}`);
      });

      // Unirse a sala de operador
      socket.on("join_operator", (eventId: string) => {
        socket.join(`operator_${eventId}`);
        logger.info(`Operator ${socket.id} joined event_${eventId}`);
      });

      // Desconexión
      socket.on("disconnect", () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Hacer disponible el socket para otros módulos
    this.app.set("io", this.io);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);

    // Manejo de promesas no capturadas
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // Conectar a la base de datos
      await connectDatabase();

      // Iniciar el servidor
      this.httpServer.listen(this.port, () => {
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
        logger.info(`📊 Health check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getIO(): SocketServer {
    return this.io;
  }
}

// Inicializar y arrancar el servidor
const server = new Server();
server.start();

export default server;
