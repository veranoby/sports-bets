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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.transaction = exports.closeDatabase = exports.connectDatabase = exports.getPoolStats = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)(); // ← CRÍTICO: DEBE IR AQUÍ
const sequelize_1 = require("sequelize");
const logger_1 = require("./logger");
// Configuración optimizada para Neon.tech
const poolSettings = {
    max: 10, // Máximo conexiones (Neon free tier)
    min: 0, // Mínimo conexiones activas
    acquire: 60000, // 30s máximo para obtener conexión
    idle: 30000, // 10s antes de cerrar conexión inactiva
    evict: 5000, // Intervalo de validación (5s)
};
const sequelize = process.env.DATABASE_URL
    ? new sequelize_1.Sequelize(process.env.DATABASE_URL, {
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
                logger_1.logger.debug(msg); // Log queries y pool activity
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
    : new sequelize_1.Sequelize({
        dialect: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PASSWORD || "5432"),
        database: process.env.DB_NAME || "sports_bets",
        username: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "password",
        pool: poolSettings, // Misma configuración para desarrollo
        dialectOptions: Object.assign({}, (process.env.NODE_ENV === "production" && {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
            // Neon optimizations
            connectionTimeoutMillis: 5000,
        })),
        logging: (msg) => {
            if (process.env.NODE_ENV === "development") {
                logger_1.logger.debug(msg);
            }
            else if (msg.includes("ERROR") || msg.startsWith("Pool")) {
                logger_1.logger.warn(msg); // Solo logs importantes en producción
            }
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true,
        },
        timezone: "America/Guayaquil",
    });
exports.sequelize = sequelize;
// Función mejorada para monitoreo del pool
const getPoolStats = () => {
    var _a, _b, _c;
    const pool = sequelize.pool; // Usamos 'as any' temporalmente para evitar errores de tipo
    return {
        using: ((_a = pool === null || pool === void 0 ? void 0 : pool._inUseObjects) === null || _a === void 0 ? void 0 : _a.length) || 0,
        free: ((_b = pool === null || pool === void 0 ? void 0 : pool._availableObjects) === null || _b === void 0 ? void 0 : _b.length) || 0,
        queue: ((_c = pool === null || pool === void 0 ? void 0 : pool._waitingClientsQueue) === null || _c === void 0 ? void 0 : _c.length) || 0,
    };
};
exports.getPoolStats = getPoolStats;
// Función de conexión con monitoreo mejorado
const connectDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.authenticate();
        logger_1.logger.info("✅ Database connection established", {
            poolStats: (0, exports.getPoolStats)(),
            config: {
                dialect: sequelize.getDialect(),
                database: sequelize.getDatabaseName(),
            },
        });
        if (process.env.NODE_ENV === "development") {
            yield sequelize.sync({ alter: true });
            logger_1.logger.info("✅ Database models synchronized");
        }
        // Log periódico del estado del pool
        setInterval(() => {
            logger_1.logger.debug("Database Pool Status", (0, exports.getPoolStats)());
        }, 30000); // Cada 30 segundos
    }
    catch (error) {
        logger_1.logger.error("❌ Database connection failed", {
            error: error.message,
            stack: error.stack,
            poolStats: (0, exports.getPoolStats)(),
        });
        throw error;
    }
});
exports.connectDatabase = connectDatabase;
// Función para cerrar la conexión
const closeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.close();
        logger_1.logger.info("✅ Database connection closed");
    }
    catch (error) {
        logger_1.logger.error("❌ Error closing database connection:", error);
        throw error;
    }
});
exports.closeDatabase = closeDatabase;
// Función para ejecutar transacciones
const transaction = (callback) => __awaiter(void 0, void 0, void 0, function* () {
    const t = yield sequelize.transaction();
    try {
        const result = yield callback(t);
        yield t.commit();
        return result;
    }
    catch (error) {
        yield t.rollback();
        throw error;
    }
});
exports.transaction = transaction;
exports.default = sequelize;
