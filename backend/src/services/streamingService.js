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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopStreaming = exports.startStreaming = exports.getStreamInfo = exports.getStreamUrl = exports.checkStreamHealth = exports.generateStreamKey = void 0;
var streaming_1 = require("../config/streaming");
var axios_1 = __importDefault(require("axios"));
var logger_1 = require("../config/logger");
// Generar clave única de stream
var generateStreamKey = function (eventId) {
    return "event_".concat(eventId, "_").concat(Date.now());
};
exports.generateStreamKey = generateStreamKey;
// Verificar si el stream está activo
var checkStreamHealth = function (streamKey) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!process.env.STREAM_HEALTH_CHECK_URL) {
                    logger_1.logger.warn("STREAM_HEALTH_CHECK_URL not configured");
                    return [2 /*return*/, true]; // Asumimos que está bien en desarrollo
                }
                return [4 /*yield*/, axios_1.default.get("".concat(process.env.STREAM_HEALTH_CHECK_URL, "/stat"), {
                        timeout: 5000,
                    })];
            case 1:
                response = _a.sent();
                // Verificar si el streamKey está en la respuesta
                return [2 /*return*/, response.data.includes(streamKey)];
            case 2:
                error_1 = _a.sent();
                logger_1.logger.error("Error checking stream health:", error_1);
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.checkStreamHealth = checkStreamHealth;
// Obtener URLs de streaming para todas las calidades
var getStreamUrl = function (streamKey) {
    return (0, streaming_1.getStreamUrls)(streamKey).master;
};
exports.getStreamUrl = getStreamUrl;
// Obtener información del stream
var getStreamInfo = function (streamKey) { return __awaiter(void 0, void 0, void 0, function () {
    var isHealthy, urls;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.checkStreamHealth)(streamKey)];
            case 1:
                isHealthy = _a.sent();
                urls = (0, streaming_1.getStreamUrls)(streamKey);
                return [2 /*return*/, {
                        isActive: isHealthy,
                        streamKey: streamKey,
                        urls: urls,
                        rtmpUrl: "".concat(streaming_1.streamingConfig.rtmpServer, "/").concat(streamKey),
                        status: isHealthy ? "healthy" : "offline",
                    }];
        }
    });
}); };
exports.getStreamInfo = getStreamInfo;
// Iniciar streaming (placeholder para integración futura)
var startStreaming = function (eventId, streamKey) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        logger_1.logger.info("Starting stream for event ".concat(eventId, " with key ").concat(streamKey));
        // Aquí iría la lógica para configurar el stream en el servidor RTMP
        return [2 /*return*/, true];
    });
}); };
exports.startStreaming = startStreaming;
// Detener streaming (placeholder para integración futura)
var stopStreaming = function (streamKey) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        logger_1.logger.info("Stopping stream with key ".concat(streamKey));
        // Aquí iría la lógica para detener el stream en el servidor RTMP
        return [2 /*return*/, true];
    });
}); };
exports.stopStreaming = stopStreaming;
