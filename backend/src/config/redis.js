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
exports.cacheDel = exports.cacheSet = exports.cacheGet = void 0;
const redis_1 = require("redis");
const logger_1 = require("./logger");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});
// Conexión y manejo de errores
redisClient.on("error", (err) => {
    logger_1.logger.warn(`Redis error: ${err.message} - Falling back to database`);
});
// Conectar al iniciar
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisClient.connect();
        logger_1.logger.info("✅ Redis connected");
    }
    catch (err) {
        logger_1.logger.error("❌ Redis connection failed - Using database fallback");
    }
}))();
// Helper functions
const cacheGet = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield redisClient.get(key);
    }
    catch (_a) {
        return null;
    }
});
exports.cacheGet = cacheGet;
const cacheSet = (key, value, ttl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisClient.set(key, value, { EX: ttl });
    }
    catch (_a) {
        // Silently fail
    }
});
exports.cacheSet = cacheSet;
const cacheDel = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisClient.del(key);
    }
    catch (_a) {
        // Silently fail
    }
});
exports.cacheDel = cacheDel;
exports.default = redisClient;
