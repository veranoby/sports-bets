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
exports.getActiveStreams = exports.getStreamServerStats = exports.checkStreamServerHealth = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../config/logger");
// Verificar salud del servidor de streaming
const checkStreamServerHealth = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.STREAM_HEALTH_CHECK_URL) {
            return true; // En desarrollo asumimos que está funcionando
        }
        const response = yield axios_1.default.get(process.env.STREAM_HEALTH_CHECK_URL, {
            timeout: 3000,
        });
        return response.status === 200;
    }
    catch (error) {
        logger_1.logger.error("Stream server health check failed:", error);
        return false;
    }
});
exports.checkStreamServerHealth = checkStreamServerHealth;
// Obtener estadísticas del servidor
const getStreamServerStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.STREAM_HEALTH_CHECK_URL) {
            return null;
        }
        const response = yield axios_1.default.get(`${process.env.STREAM_HEALTH_CHECK_URL}/stat`, {
            timeout: 5000,
        });
        // Parsear estadísticas del servidor RTMP
        return {
            active: true,
            data: response.data,
        };
    }
    catch (error) {
        logger_1.logger.error("Failed to get stream server stats:", error);
        return {
            active: false,
            error: error.message,
        };
    }
});
exports.getStreamServerStats = getStreamServerStats;
// Monitor de streams activos
const getActiveStreams = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield (0, exports.getStreamServerStats)();
        if (!stats || !stats.active)
            return [];
        // Extraer streamKeys activos del XML/JSON de estadísticas
        // Esto dependerá del formato exacto del servidor RTMP
        const activeStreams = [];
        // Placeholder - implementar según formato real
        const streamRegex = /stream_key="([^"]+)"/g;
        let match;
        while ((match = streamRegex.exec(stats.data)) !== null) {
            activeStreams.push(match[1]);
        }
        return activeStreams;
    }
    catch (error) {
        logger_1.logger.error("Failed to get active streams:", error);
        return [];
    }
});
exports.getActiveStreams = getActiveStreams;
