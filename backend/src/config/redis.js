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
exports.redisAvailable = exports.redisClient = exports.delCache = exports.setCache = exports.getCache = exports.initRedis = void 0;
const redis_1 = require("redis");
const logger_1 = require("./logger");
let redisClient = null;
exports.redisClient = redisClient;
let redisAvailable = false;
exports.redisAvailable = redisAvailable;
const initRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.REDIS_URL) {
            logger_1.logger.info("Redis URL not configured, running without cache");
            return;
        }
        exports.redisClient = redisClient = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
        redisClient.on("error", (err) => {
            logger_1.logger.warn(`Redis error: ${err.message} - Falling back to database`);
            exports.redisAvailable = redisAvailable = false;
        });
        yield redisClient.connect();
        exports.redisAvailable = redisAvailable = true;
        logger_1.logger.info("✅ Redis connected successfully");
    }
    catch (error) {
        logger_1.logger.warn("Redis connection failed, falling back to database");
        exports.redisAvailable = redisAvailable = false;
    }
});
exports.initRedis = initRedis;
const getCache = (key) => __awaiter(void 0, void 0, void 0, function* () {
    if (!redisAvailable || !redisClient)
        return null;
    try {
        const value = yield redisClient.get(key);
        return (value === null || value === void 0 ? void 0 : value.toString()) || null; // Convertir Buffer a string si es necesario
    }
    catch (_a) {
        return null;
    }
});
exports.getCache = getCache;
const setCache = (key_1, value_1, ...args_1) => __awaiter(void 0, [key_1, value_1, ...args_1], void 0, function* (key, value, ttl = 300) {
    if (!redisAvailable || !redisClient)
        return;
    try {
        yield redisClient.setEx(key, ttl, value);
    }
    catch (_a) {
        // Silently fail
    }
});
exports.setCache = setCache;
const delCache = (key) => __awaiter(void 0, void 0, void 0, function* () {
    if (!redisAvailable || !redisClient)
        return;
    try {
        yield redisClient.del(key);
    }
    catch (_a) {
        // Silently fail
    }
});
exports.delCache = delCache;
