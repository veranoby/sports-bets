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
exports.sequelize = exports.transaction = exports.closeDatabase = exports.connectDatabase = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)(); // ← CRÍTICO: DEBE IR AQUÍ
const sequelize_1 = require("sequelize");
const logger_1 = require("./logger");
// Configuración de la base de datos
const sequelize = process.env.DATABASE_URL
    ? new sequelize_1.Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: process.env.NODE_ENV === "development"
            ? (msg) => logger_1.logger.debug(msg)
            : false,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true,
        },
        timezone: "America/Guayaquil",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    })
    : new sequelize_1.Sequelize({
        dialect: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME || "sports_bets",
        username: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "password",
        pool: {
            max: 20,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        dialectOptions: process.env.NODE_ENV === "production"
            ? {
                ssl: {
                    require: true,
                    rejectUnauthorized: false,
                },
            }
            : {},
        logging: process.env.NODE_ENV === "development"
            ? (msg) => logger_1.logger.debug(msg)
            : false,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true,
        },
        timezone: "America/Guayaquil",
    });
exports.sequelize = sequelize;
// Función para conectar a la base de datos
const connectDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.authenticate();
        logger_1.logger.info("✅ Database connection established successfully");
        // En desarrollo, sincronizar modelos
        if (process.env.NODE_ENV === "development") {
            yield sequelize.sync({ alter: true });
            logger_1.logger.info("✅ Database models synchronized");
        }
    }
    catch (error) {
        logger_1.logger.error("❌ Unable to connect to the database:", error);
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
