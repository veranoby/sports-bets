"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.EventService = void 0;
var Event_1 = require("../models/Event");
var User_1 = require("../models/User");
var Fight_1 = require("../models/Fight");
var Bet_1 = require("../models/Bet");
var sequelize_1 = require("sequelize");
var notificationService_1 = __importDefault(require("./notificationService"));
// Enhanced EventService with workflow logic and SSE integration
var EventService = /** @class */ (function () {
    function EventService() {
    }
    // Generate improved stream key with venue name, date, and event ID
    EventService.generateStreamKey = function (event) {
        var _a;
        var venueName = event.venue ? (((_a = event.venue.profileInfo) === null || _a === void 0 ? void 0 : _a.venueName) || event.venue.username).replace(/\s+/g, '_').toLowerCase() : 'unknown';
        var date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        var eventId = event.id.substring(0, 8); // First 8 chars of event ID
        return "".concat(venueName, "_").concat(date, "_").concat(eventId);
    };
    // Validate event status transitions
    EventService.validateEventStatusTransition = function (currentStatus, newStatus) {
        var _a;
        var validTransitions = {
            'scheduled': ['in-progress', 'cancelled'],
            'in-progress': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        };
        return ((_a = validTransitions[currentStatus]) === null || _a === void 0 ? void 0 : _a.includes(newStatus)) || false;
    };
    // Update event status with workflow logic
    EventService.updateEventStatus = function (eventId, action, sseServiceInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var event, currentStatus, newStatus, eventData, notificationType, metadata, notificationError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Event_1.Event.findByPk(eventId, {
                            include: [
                                { model: Fight_1.Fight, as: 'fights' },
                                { model: User_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
                                { model: User_1.User, as: 'operator', attributes: ['id', 'username'] }
                            ]
                        })];
                    case 1:
                        event = _a.sent();
                        if (!event) {
                            throw new Error('Event not found');
                        }
                        currentStatus = event.status;
                        switch (action) {
                            case 'activate':
                                if (currentStatus !== 'scheduled') {
                                    throw new Error('Only scheduled events can be activated');
                                }
                                eventData = event.toJSON();
                                if (!eventData.fights || eventData.fights.length === 0) {
                                    throw new Error('Event must have at least one fight scheduled');
                                }
                                newStatus = 'in-progress';
                                // Generate stream key with improved format
                                if (!event.streamKey) {
                                    event.streamKey = this.generateStreamKey(event);
                                }
                                event.streamUrl = "".concat(process.env.STREAM_SERVER_URL, "/").concat(event.streamKey);
                                break;
                            case 'complete':
                                if (currentStatus !== 'in-progress') {
                                    throw new Error('Only active events can be completed');
                                }
                                newStatus = 'completed';
                                event.endDate = new Date();
                                if (event.streamUrl) {
                                    event.streamUrl = null;
                                }
                                event.streamKey = null;
                                break;
                            case 'cancel':
                                if (currentStatus === 'completed') {
                                    throw new Error('Completed events cannot be cancelled');
                                }
                                newStatus = 'cancelled';
                                if (event.streamUrl) {
                                    event.streamUrl = null;
                                }
                                event.streamKey = null;
                                break;
                            default:
                                throw new Error('Invalid action');
                        }
                        event.status = newStatus;
                        return [4 /*yield*/, event.save()];
                    case 2:
                        _a.sent();
                        // Broadcast via SSE
                        if (sseServiceInstance) {
                            sseServiceInstance.broadcastToEvent(event.id, {
                                type: "EVENT_".concat(action.toUpperCase(), "D"),
                                data: {
                                    eventId: event.id,
                                    status: newStatus,
                                    streamUrl: event.streamUrl,
                                    streamKey: event.streamKey,
                                    timestamp: new Date()
                                }
                            });
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        notificationType = action === 'activate' ? 'event_activated' :
                            action === 'complete' ? 'event_completed' : 'event_cancelled';
                        metadata = __assign({ eventName: event.name }, (event.streamUrl && { streamUrl: event.streamUrl }));
                        return [4 /*yield*/, notificationService_1.default.createEventNotification(notificationType, event.id, [], metadata)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        notificationError_1 = _a.sent();
                        console.error("Error creating ".concat(action, " notification:"), notificationError_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, event];
                }
            });
        });
    };
    // Get all events with optimized includes
    EventService.getAllEvents = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Event_1.Event.findAll({
                        include: [
                            { model: User_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
                            { model: User_1.User, as: 'operator', attributes: ['id', 'username'] },
                            { model: User_1.User, as: 'creator', attributes: ['id', 'username'] },
                            { model: Fight_1.Fight, as: 'fights', attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'] }
                        ],
                        where: filters || {},
                        order: [['scheduledDate', 'DESC']],
                        limit: 50 // Default limit to prevent large queries
                    })];
            });
        });
    };
    // Get single event with full data in one query
    EventService.getEventById = function (eventId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Event_1.Event.findByPk(eventId, {
                        include: [
                            { model: User_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
                            { model: User_1.User, as: 'operator', attributes: ['id', 'username', 'email'] },
                            { model: User_1.User, as: 'creator', attributes: ['id', 'username', 'email'] },
                            {
                                model: Fight_1.Fight,
                                as: 'fights',
                                include: [{ model: Bet_1.Bet, as: 'bets', attributes: ['id', 'amount', 'status'] }]
                            }
                        ]
                    })];
            });
        });
    };
    // Paginated events for admin interface
    EventService.getEventsPaginated = function () {
        return __awaiter(this, arguments, void 0, function (page, limit, filters) {
            var offset;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                offset = (page - 1) * limit;
                return [2 /*return*/, Event_1.Event.findAndCountAll({
                        offset: offset,
                        limit: limit,
                        include: [
                            { model: User_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
                            { model: User_1.User, as: 'operator', attributes: ['id', 'username'] },
                            { model: User_1.User, as: 'creator', attributes: ['id', 'username'] }
                        ],
                        where: filters || {},
                        order: [['scheduledDate', 'DESC']]
                    })];
            });
        });
    };
    // Get upcoming events (optimized for homepage)
    EventService.getUpcomingEvents = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var _a;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_b) {
                return [2 /*return*/, Event_1.Event.findAll({
                        where: {
                            status: 'scheduled',
                            scheduledDate: (_a = {},
                                _a[sequelize_1.Op.gte] = new Date(),
                                _a)
                        },
                        include: [
                            { model: User_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] }
                        ],
                        order: [['scheduledDate', 'ASC']],
                        limit: limit
                    })];
            });
        });
    };
    // Get live events (for streaming)
    EventService.getLiveEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Event_1.Event.findAll({
                        where: { status: 'in-progress' },
                        include: [
                            { model: User_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
                            {
                                model: Fight_1.Fight,
                                as: 'fights',
                                where: { status: 'live' },
                                required: false
                            }
                        ],
                        order: [['scheduledDate', 'ASC']]
                    })];
            });
        });
    };
    // Create event with transaction
    EventService.createEvent = function (eventData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Event_1.Event.create(eventData)];
            });
        });
    };
    // Get events by operator (for operator dashboard)
    EventService.getEventsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Event_1.Event.findAll({
                        where: { operatorId: operatorId },
                        include: [
                            { model: User_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
                            { model: Fight_1.Fight, as: 'fights', attributes: ['id', 'number', 'status'] }
                        ],
                        order: [['scheduledDate', 'DESC']]
                    })];
            });
        });
    };
    return EventService;
}());
exports.EventService = EventService;
exports.default = EventService;
