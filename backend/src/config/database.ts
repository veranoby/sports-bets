import { config } from "dotenv";
config(); // ← CRÍTICO: DEBE IR AQUÍ

import { Sequelize } from "sequelize";
import { logger } from "./logger";

// Configuración optimizada para Neon.tech
const poolSettings = {
  max: 10, // Máximo conexiones (Neon free tier)
  min: 0, // Mínimo conexiones activas
  acquire: 60000, // 30s máximo para obtener conexión
  idle: 30000, // 10s antes de cerrar conexión inactiva
  evict: 5000, // Intervalo de validación (5s)
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        // Neon-specific optimizations
        connectionTimeoutMillis: 5000,
        idle_in_transaction_session_timeout: 10000,
      },
      logging: (msg) => {
        if (msg.startsWith("Executing") || msg.startsWith("Pool")) {
          logger.debug(msg); // Log queries y pool activity
        }
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      timezone: "America/Guayaquil",
      pool: poolSettings, // Configuración optimizada aquí
      benchmark: true, // Para monitoreo de performance
    })
  : new Sequelize({
      dialect: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PASSWORD || "5432"),
      database: process.env.DB_NAME || "sports_bets",
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      pool: poolSettings, // Misma configuración para desarrollo
      dialectOptions: {
        ...(process.env.NODE_ENV === "production" && {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
          // Neon optimizations
          connectionTimeoutMillis: 5000,
        }),
      },
      logging: (msg) => {
        if (process.env.NODE_ENV === "development") {
          logger.debug(msg);
        } else if (msg.includes("ERROR") || msg.startsWith("Pool")) {
          logger.warn(msg); // Solo logs importantes en producción
        }
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      timezone: "America/Guayaquil",
    });

// Función mejorada para monitoreo del pool
export const getPoolStats = () => {
  const pool = (sequelize as any).pool; // Usamos 'as any' temporalmente para evitar errores de tipo
  return {
    using: pool?._inUseObjects?.length || 0,
    free: pool?._availableObjects?.length || 0,
    queue: pool?._waitingClientsQueue?.length || 0,
  };
};

// Función de conexión con monitoreo mejorado
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connection established", {
      poolStats: getPoolStats(),
      config: {
        dialect: sequelize.getDialect(),
        database: sequelize.getDatabaseName(),
      },
    });

    // 🚫 SYNC DISABLED - MIGRATION-ONLY ARCHITECTURE
    // Never use sync in production or any environment - causes constraint bloat
    // All schema changes MUST go through controlled migrations
    if (process.env.ENABLE_DANGEROUS_SYNC === "true") {
      logger.warn("⚠️  DANGEROUS: Sequelize sync enabled via ENABLE_DANGEROUS_SYNC");
      logger.warn("🚫 This should NEVER be used in production");
      await sequelize.sync({ alter: true });
      logger.info("⚠️  Database models synchronized (DANGEROUS MODE)");
    } else {
      logger.info("✅ Database sync DISABLED - using migration-only architecture");
    }

    // Log periódico del estado del pool
    setInterval(() => {
      logger.debug("Database Pool Status", getPoolStats());
    }, 30000); // Cada 30 segundos
  } catch (error) {
    logger.error("❌ Database connection failed", {
      error: error.message,
      stack: error.stack,
      poolStats: getPoolStats(),
    });
    throw error;
  }
};

// Función para cerrar la conexión
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info("✅ Database connection closed");
  } catch (error) {
    logger.error("❌ Error closing database connection:", error);
    throw error;
  }
};

// Función para ejecutar transacciones
export const transaction = async <T>(
  callback: (transaction: any) => Promise<T>
): Promise<T> => {
  const t = await sequelize.transaction();
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export { sequelize };
export default sequelize;
