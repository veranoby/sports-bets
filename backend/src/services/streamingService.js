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
exports.stopStreaming = exports.startStreaming = exports.getStreamInfo = exports.getStreamUrl = exports.checkStreamHealth = exports.generateStreamKey = void 0;
const streaming_1 = require("../config/streaming");
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../config/logger");
// Generar clave única de stream
const generateStreamKey = (eventId) => {
    return `event_${eventId}_${Date.now()}`;
};
exports.generateStreamKey = generateStreamKey;
// Verificar si el stream está activo
const checkStreamHealth = (streamKey) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.STREAM_HEALTH_CHECK_URL) {
            logger_1.logger.warn("STREAM_HEALTH_CHECK_URL not configured");
            return true; // Asumimos que está bien en desarrollo
        }
        const response = yield axios_1.default.get(`${process.env.STREAM_HEALTH_CHECK_URL}/stat`, {
            timeout: 5000,
        });
        // Verificar si el streamKey está en la respuesta
        return response.data.includes(streamKey);
    }
    catch (error) {
        logger_1.logger.error("Error checking stream health:", error);
        return false;
    }
});
exports.checkStreamHealth = checkStreamHealth;
// Obtener URLs de streaming para todas las calidades
const getStreamUrl = (streamKey) => {
    return (0, streaming_1.getStreamUrls)(streamKey).master;
};
exports.getStreamUrl = getStreamUrl;
// Obtener información del stream
const getStreamInfo = (streamKey) => __awaiter(void 0, void 0, void 0, function* () {
    const isHealthy = yield (0, exports.checkStreamHealth)(streamKey);
    const urls = (0, streaming_1.getStreamUrls)(streamKey);
    return {
        isActive: isHealthy,
        streamKey,
        urls,
        rtmpUrl: `${streaming_1.streamingConfig.rtmpServer}/${streamKey}`,
        status: isHealthy ? "healthy" : "offline",
    };
});
exports.getStreamInfo = getStreamInfo;
// Iniciar streaming (placeholder para integración futura)
const startStreaming = (eventId, streamKey) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info(`Starting stream for event ${eventId} with key ${streamKey}`);
    // Aquí iría la lógica para configurar el stream en el servidor RTMP
    return true;
});
exports.startStreaming = startStreaming;
// Detener streaming (placeholder para integración futura)
const stopStreaming = (streamKey) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info(`Stopping stream with key ${streamKey}`);
    // Aquí iría la lógica para detener el stream en el servidor RTMP
    return true;
});
exports.stopStreaming = stopStreaming;
