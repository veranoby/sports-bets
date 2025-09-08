import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "dotenv";
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
import webhookRoutes from "./routes/webhooks";
import notificationRoutes from "./routes/notifications";
import articleRoutes from "./routes/articles";
import sseRoutes from "./routes/sse";
import pushRoutes from "./routes/push";
import settingsRoutes from "./routes/settings";

// Cargar variables de entorno
config();

// Importar Redis
import { initRedis } from "./config/redis";

// Importar middleware de configuración global
import { checkMaintenanceMode, injectPublicSettings } from "./middleware/settingsMiddleware";

class Server {
  private app: express.Application;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;

    // Inicializar Redis (no bloqueante)
    initRedis().catch((err) => {
      logger.error("Redis initialization error:", err);
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
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

    // Global settings middleware
    this.app.use(checkMaintenanceMode);
    this.app.use(injectPublicSettings);

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
    this.app.use("/api/webhooks", webhookRoutes);
    this.app.use("/api/notifications", notificationRoutes);
    this.app.use("/api/articles", articleRoutes);
    this.app.use("/api/sse", sseRoutes);
    this.app.use("/api/push", pushRoutes);
    this.app.use("/api/settings", settingsRoutes);

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
      this.app.listen(this.port, () => {
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
}

// Inicializar y arrancar el servidor
const server = new Server();
server.start();

export default server;
