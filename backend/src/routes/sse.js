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
var express_1 = __importDefault(require("express"));
var sseService_1 = require("../services/sseService");
var auth_1 = require("../middleware/auth");
var logger_1 = require("../config/logger");
var router = express_1.default.Router();
logger_1.logger.info('🔄 SSE routes loading with admin authentication...');
/**
 * SSE Authentication Middleware
 * Handles authentication for SSE connections with proper error handling
 */
var sseAuthenticate = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, auth_1.authenticate)(req, res, next)];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.logger.error('SSE Authentication failed:', error_1);
                res.status(401).json({ error: 'Authentication required for SSE connection' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * ADMIN SSE ENDPOINTS - Authenticated and Role-Based
 */
// Admin System Monitoring Channel
router.get('/admin/system', sseAuthenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) {
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.SYSTEM_MONITORING, req.user.id, req.user.role, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger_1.logger.info("\uD83D\uDC64 Admin system monitoring connected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    // Handle connection cleanup on disconnect
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
        logger_1.logger.info("\uD83D\uDC64 Admin system monitoring disconnected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    });
    req.on('error', function (error) {
        logger_1.logger.error("SSE connection error for ".concat(connectionId, ":"), error);
        sseService_1.sseService.removeConnection(connectionId);
    });
});
// Admin Fight Management Channel
router.get('/admin/fights', sseAuthenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) {
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.FIGHT_MANAGEMENT, req.user.id, req.user.role, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger_1.logger.info("\u2694\uFE0F Admin fight management connected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
        logger_1.logger.info("\u2694\uFE0F Admin fight management disconnected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    });
    req.on('error', function (error) {
        logger_1.logger.error("SSE connection error for ".concat(connectionId, ":"), error);
        sseService_1.sseService.removeConnection(connectionId);
    });
});
// Admin Bet Monitoring Channel
router.get('/admin/bets', sseAuthenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) {
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.BET_MONITORING, req.user.id, req.user.role, {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        fightFilters: req.query.fightIds ? String(req.query.fightIds).split(',') : undefined
    });
    logger_1.logger.info("\uD83D\uDCB0 Admin bet monitoring connected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
        logger_1.logger.info("\uD83D\uDCB0 Admin bet monitoring disconnected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    });
    req.on('error', function (error) {
        logger_1.logger.error("SSE connection error for ".concat(connectionId, ":"), error);
        sseService_1.sseService.removeConnection(connectionId);
    });
});
// Admin User Management Channel
router.get('/admin/users', sseAuthenticate, (0, auth_1.authorize)('admin'), function (req, res) {
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.USER_MANAGEMENT, req.user.id, req.user.role, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger_1.logger.info("\uD83D\uDC65 Admin user management connected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
        logger_1.logger.info("\uD83D\uDC65 Admin user management disconnected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    });
    req.on('error', function (error) {
        logger_1.logger.error("SSE connection error for ".concat(connectionId, ":"), error);
        sseService_1.sseService.removeConnection(connectionId);
    });
});
// Admin Financial Monitoring Channel
router.get('/admin/finance', sseAuthenticate, (0, auth_1.authorize)('admin'), function (req, res) {
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.FINANCIAL_MONITORING, req.user.id, req.user.role, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger_1.logger.info("\uD83D\uDCB5 Admin financial monitoring connected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
        logger_1.logger.info("\uD83D\uDCB5 Admin financial monitoring disconnected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    });
    req.on('error', function (error) {
        logger_1.logger.error("SSE connection error for ".concat(connectionId, ":"), error);
        sseService_1.sseService.removeConnection(connectionId);
    });
});
// Admin Streaming Monitoring Channel
router.get('/admin/streaming', sseAuthenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) {
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.STREAMING_MONITORING, req.user.id, req.user.role, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger_1.logger.info("\uD83D\uDCF9 Admin streaming monitoring connected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
        logger_1.logger.info("\uD83D\uDCF9 Admin streaming monitoring disconnected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    });
    req.on('error', function (error) {
        logger_1.logger.error("SSE connection error for ".concat(connectionId, ":"), error);
        sseService_1.sseService.removeConnection(connectionId);
    });
});
// Admin Notifications Channel
router.get('/admin/notifications', sseAuthenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) {
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.NOTIFICATIONS, req.user.id, req.user.role, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger_1.logger.info("\uD83D\uDD14 Admin notifications connected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
        logger_1.logger.info("\uD83D\uDD14 Admin notifications disconnected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    });
    req.on('error', function (error) {
        logger_1.logger.error("SSE connection error for ".concat(connectionId, ":"), error);
        sseService_1.sseService.removeConnection(connectionId);
    });
});
// Admin Global Channel (all events)
router.get('/admin/global', sseAuthenticate, (0, auth_1.authorize)('admin'), function (req, res) {
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.GLOBAL, req.user.id, req.user.role, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger_1.logger.info("\uD83C\uDF10 Admin global monitoring connected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
        logger_1.logger.info("\uD83C\uDF10 Admin global monitoring disconnected: ".concat(req.user.username, " (").concat(connectionId, ")"));
    });
    req.on('error', function (error) {
        logger_1.logger.error("SSE connection error for ".concat(connectionId, ":"), error);
        sseService_1.sseService.removeConnection(connectionId);
    });
});
/**
 * SSE CONNECTION MANAGEMENT ENDPOINTS
 */
// Get SSE connection statistics
router.get('/admin/stats', sseAuthenticate, (0, auth_1.authorize)('admin'), function (req, res) {
    try {
        var stats = sseService_1.sseService.getConnectionStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting SSE stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve SSE statistics'
        });
    }
});
// Test SSE event broadcast (for testing purposes)
router.post('/admin/test-broadcast', sseAuthenticate, (0, auth_1.authorize)('admin'), function (req, res) {
    try {
        var _a = req.body, channel = _a.channel, eventType = _a.eventType, data = _a.data;
        if (!channel || !eventType) {
            return res.status(400).json({
                success: false,
                error: 'Channel and eventType are required'
            });
        }
        var event_1 = {
            id: Date.now().toString(),
            type: eventType,
            data: data || { message: 'Test broadcast from admin', timestamp: new Date() },
            timestamp: new Date(),
            priority: 'medium',
            metadata: {
                adminId: req.user.id
            }
        };
        var sentCount = sseService_1.sseService.broadcastToChannel(channel, event_1);
        res.json({
            success: true,
            data: {
                eventId: event_1.id,
                channel: channel,
                eventType: eventType,
                sentToConnections: sentCount
            }
        });
        logger_1.logger.info("\uD83D\uDCE1 Test broadcast sent by ".concat(req.user.username, ": ").concat(eventType, " to ").concat(channel, " (").concat(sentCount, " connections)"));
    }
    catch (error) {
        logger_1.logger.error('Error sending test broadcast:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test broadcast'
        });
    }
});
/**
 * LEGACY ENDPOINTS (for backwards compatibility)
 * These will be deprecated in future versions
 */
// Legacy system status endpoint
router.get('/admin/system-status', sseAuthenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) {
    logger_1.logger.warn('⚠️ Using deprecated SSE endpoint /admin/system-status - use /admin/system instead');
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.SYSTEM_MONITORING, req.user.id, req.user.role);
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
    });
});
// Legacy event updates endpoint
router.get('/admin/events/:eventId', sseAuthenticate, (0, auth_1.authorize)('admin', 'operator'), function (req, res) {
    logger_1.logger.warn('⚠️ Using deprecated SSE endpoint /admin/events/:eventId - use /admin/fights instead');
    var connectionId = sseService_1.sseService.addConnection(res, sseService_1.AdminChannel.FIGHT_MANAGEMENT, req.user.id, req.user.role, {
        eventFilters: [req.params.eventId]
    });
    req.on('close', function () {
        sseService_1.sseService.removeConnection(connectionId);
    });
});
exports.default = router;
