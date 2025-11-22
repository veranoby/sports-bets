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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventsPaginated = void 0;
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var errorHandler_1 = require("../middleware/errorHandler");
var models_1 = require("../models");
var express_validator_1 = require("express-validator");
var sequelize_1 = require("sequelize");
var redis_1 = require("../config/redis");
var notificationService_1 = __importDefault(require("../services/notificationService"));
function getEventAttributes(role, type) {
    var publicAttributes = [
        "id",
        "name",
        "scheduledDate",
        "status",
        "venueId",
        "createdAt",
        "updatedAt",
        "endDate",
    ];
    var authenticatedAttributes = __spreadArray(__spreadArray([], publicAttributes, true), [
        "totalFights",
        "completedFights",
    ], false);
    var operatorAttributes = __spreadArray(__spreadArray([], authenticatedAttributes, true), [
        "streamKey",
        "streamUrl",
        "operatorId",
    ], false);
    switch (role) {
        case "admin":
            return undefined; // Return all attributes
        case "operator":
            return operatorAttributes;
        case "user":
        case "gallera":
        case "venue":
            return authenticatedAttributes;
        default:
            return publicAttributes;
    }
}
var router = (0, express_1.Router)();
// Add pagination method for events
var getEventsPaginated = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (page, limit, filters) {
        var offset;
        if (page === void 0) { page = 1; }
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            offset = (page - 1) * limit;
            return [2 /*return*/, models_1.Event.findAndCountAll({
                    offset: offset,
                    limit: limit,
                    include: [
                        { model: models_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'] },
                        { model: models_1.User, as: 'operator', attributes: ['id', 'username'] },
                        { model: models_1.User, as: 'creator', attributes: ['id', 'username'] },
                        { model: models_1.Fight, as: 'fights', attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'] }
                    ],
                    where: filters || {},
                    order: [['scheduledDate', 'DESC']]
                })];
        });
    });
};
exports.getEventsPaginated = getEventsPaginated;
// GET /api/events - Listar eventos con filtros
router.get("/", auth_1.optionalAuth, auth_1.filterByOperatorAssignment, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, venueId, status, upcoming, dateRange, category, userRole, limit, offset, cacheKey, cachedData, where, todayStart, todayEnd, tomorrowStart, tomorrowEnd, weekStart, weekEnd, attributes, events, totalPages, currentPage, responseData;
    var _b, _c, _d, _e, _f, _g;
    var _h, _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                _a = req.query, venueId = _a.venueId, status = _a.status, upcoming = _a.upcoming, dateRange = _a.dateRange, category = _a.category;
                userRole = ((_h = req.user) === null || _h === void 0 ? void 0 : _h.role) || 'public';
                limit = Math.min(parseInt(req.query.limit) || 10, 50);
                offset = Math.max(parseInt(req.query.offset) || 0, 0);
                cacheKey = "events:list:".concat(userRole, ":").concat(venueId || '', ":").concat(status || '', ":").concat(upcoming || '', ":").concat(dateRange || '', ":").concat(category || '', ":").concat(limit, ":").concat(offset);
                return [4 /*yield*/, (0, redis_1.getCache)(cacheKey)];
            case 1:
                cachedData = _k.sent();
                if (cachedData) {
                    return [2 /*return*/, res.json(JSON.parse(cachedData))];
                }
                where = __assign({}, req.queryFilter);
                if (venueId)
                    where.venueId = venueId;
                if (status)
                    where.status = status;
                // Enhanced date-based filtering for cost optimization
                if (dateRange === "today") {
                    todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    todayEnd = new Date(todayStart);
                    todayEnd.setHours(23, 59, 59, 999);
                    where.scheduledDate = (_b = {}, _b[sequelize_1.Op.between] = [todayStart, todayEnd], _b);
                }
                else if (dateRange === "tomorrow") {
                    tomorrowStart = new Date();
                    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
                    tomorrowStart.setHours(0, 0, 0, 0);
                    tomorrowEnd = new Date(tomorrowStart);
                    tomorrowEnd.setHours(23, 59, 59, 999);
                    where.scheduledDate = (_c = {}, _c[sequelize_1.Op.between] = [tomorrowStart, tomorrowEnd], _c);
                }
                else if (dateRange === "this-week") {
                    weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    where.scheduledDate = (_d = {}, _d[sequelize_1.Op.between] = [weekStart, weekEnd], _d);
                }
                else if (upcoming === "true") {
                    where.scheduledDate = (_e = {}, _e[sequelize_1.Op.gte] = new Date(), _e);
                    where.status = "scheduled";
                }
                else if (category === "past") {
                    // Show ALL past events regardless of status (completed, cancelled, etc.)
                    where.scheduledDate = (_f = {}, _f[sequelize_1.Op.lt] = new Date(), _f);
                }
                else if (category === "live") {
                    where.status = "in-progress";
                }
                else if (category === "upcoming") {
                    // Show all future events
                    where.scheduledDate = (_g = {}, _g[sequelize_1.Op.gte] = new Date(), _g);
                }
                attributes = getEventAttributes((_j = req.user) === null || _j === void 0 ? void 0 : _j.role, "list");
                return [4 /*yield*/, models_1.Event.findAndCountAll({
                        where: where,
                        attributes: attributes,
                        include: [
                            { model: models_1.User, as: 'venue', attributes: ['id', 'username', 'profileInfo'], separate: false },
                            { model: models_1.User, as: 'operator', attributes: ['id', 'username'], separate: false },
                            { model: models_1.User, as: 'creator', attributes: ['id', 'username'], separate: false },
                            { model: models_1.Fight, as: 'fights', attributes: ['id', 'number', 'status', 'red_corner', 'blue_corner'], separate: false }
                        ],
                        order: [["scheduledDate", "ASC"]],
                        limit: limit,
                        offset: offset,
                    })];
            case 2:
                events = _k.sent();
                totalPages = Math.ceil(events.count / limit);
                currentPage = Math.floor(offset / limit) + 1;
                responseData = {
                    success: true,
                    data: {
                        events: events.rows.map(function (e) { return e.toJSON({ attributes: attributes }); }),
                        pagination: {
                            limit: limit,
                            offset: offset,
                            total: events.count,
                            totalPages: totalPages,
                            currentPage: currentPage,
                            hasNext: offset + limit < events.count,
                            hasPrev: offset > 0,
                            nextOffset: offset + limit < events.count ? offset + limit : null,
                            prevOffset: offset > 0 ? Math.max(0, offset - limit) : null
                        }
                    },
                };
                // Store data in cache for 5 minutes (300 seconds)
                return [4 /*yield*/, (0, redis_1.setCache)(cacheKey, JSON.stringify(responseData), 300)];
            case 3:
                // Store data in cache for 5 minutes (300 seconds)
                _k.sent();
                res.json(responseData);
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/events/:id - Obtener evento específico
router.get("/:id", auth_1.optionalAuth, auth_1.filterByOperatorAssignment, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var attributes, event;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                attributes = getEventAttributes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role, "detail");
                return [4 /*yield*/, models_1.Event.findByPk(req.params.id, {
                        include: [
                            { model: models_1.User, as: 'venue' },
                            { model: models_1.User, as: 'operator', attributes: ['id', 'username', 'email'] },
                            { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'email'] },
                            {
                                model: models_1.Fight,
                                as: 'fights',
                                include: [{ model: models_1.Bet, as: 'bets', attributes: ['id', 'amount', 'status'] }]
                            }
                        ]
                    })];
            case 1:
                event = _b.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                res.json({
                    success: true,
                    data: event.toJSON({ attributes: attributes }),
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/events - Crear nuevo evento (admin/venue)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin", "venue"), [
    (0, express_validator_1.body)("name")
        .isLength({ min: 3, max: 255 })
        .withMessage("Name must be between 3 and 255 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("venueId").isUUID().withMessage("Valid venue ID is required"),
    (0, express_validator_1.body)("scheduledDate")
        .isISO8601()
        .withMessage("Valid date is required")
        .custom(function (value) {
        if (new Date(value) <= new Date()) {
            throw new Error("Scheduled date must be in the future");
        }
        return true;
    }),
    (0, express_validator_1.body)("operatorId")
        .optional()
        .isUUID()
        .withMessage("Valid operator ID is required"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, _a, name, venueId, scheduledDate, operatorId, venue, operator, event;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                _a = req.body, name = _a.name, venueId = _a.venueId, scheduledDate = _a.scheduledDate, operatorId = _a.operatorId;
                return [4 /*yield*/, models_1.User.findOne({ where: { id: venueId, role: 'venue' } })];
            case 1:
                venue = _b.sent();
                if (!venue) {
                    throw errorHandler_1.errors.notFound("Venue (User with role='venue') not found");
                }
                if (req.user.role === "venue" && venue.id !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You can only create events for your own venue");
                }
                if (!operatorId) return [3 /*break*/, 3];
                return [4 /*yield*/, models_1.User.findByPk(operatorId)];
            case 2:
                operator = _b.sent();
                if (!operator || operator.role !== "operator") {
                    throw errorHandler_1.errors.badRequest("Invalid operator specified");
                }
                _b.label = 3;
            case 3: return [4 /*yield*/, models_1.Event.create({
                    name: name,
                    venueId: venueId,
                    scheduledDate: scheduledDate,
                    operatorId: operatorId,
                    createdBy: req.user.id,
                    totalFights: 0,
                    completedFights: 0,
                    totalBets: 0,
                    totalPrizePool: 0,
                })];
            case 4:
                event = _b.sent();
                return [4 /*yield*/, event.reload({
                        include: [
                            { model: models_1.User, as: "venue" },
                            { model: models_1.User, as: "operator", attributes: ["id", "username"] },
                        ],
                    })];
            case 5:
                _b.sent();
                res.status(201).json({
                    success: true,
                    message: "Event created successfully",
                    data: event.toJSON(),
                });
                return [2 /*return*/];
        }
    });
}); }));
// PUT /api/events/:id - Actualizar evento
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("name")
        .optional()
        .isLength({ min: 3, max: 255 })
        .withMessage("Name must be between 3 and 255 characters")
        .trim()
        .escape(),
    (0, express_validator_1.body)("scheduledDate")
        .optional()
        .isISO8601()
        .withMessage("Valid date is required"),
    (0, express_validator_1.body)("operatorId")
        .optional()
        .isUUID()
        .withMessage("Valid operator ID is required"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["scheduled", "in-progress", "completed", "cancelled"])
        .withMessage("Invalid status"),
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, event, allowedFields;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                return [4 /*yield*/, models_1.Event.findByPk(req.params.id)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                if (req.user.role === "operator" && event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                allowedFields = ["name", "scheduledDate", "operatorId", "status"];
                allowedFields.forEach(function (field) {
                    if (req.body[field] !== undefined) {
                        event[field] = req.body[field];
                    }
                });
                return [4 /*yield*/, event.save()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    message: "Event updated successfully",
                    data: event.toJSON(),
                });
                return [2 /*return*/];
        }
    });
}); }));
// PATCH /api/events/:id/status - Event status transitions with workflow logic
router.patch("/:id/status", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("action")
        .isIn(["activate", "complete", "cancel"])
        .withMessage("Action must be activate, complete, or cancel")
], (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validationErrors, action, event, currentStatus, newStatus, eventData, sseService, notificationType, metadata, notificationError_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validationErrors = (0, express_validator_1.validationResult)(req);
                if (!validationErrors.isEmpty()) {
                    throw errorHandler_1.errors.badRequest("Validation failed: " +
                        validationErrors
                            .array()
                            .map(function (err) { return err.msg; })
                            .join(", "));
                }
                action = req.body.action;
                return [4 /*yield*/, models_1.Event.findByPk(req.params.id, {
                        include: [
                            { model: models_1.Fight, as: "fights" },
                            { model: models_1.User, as: "venue" },
                            { model: models_1.User, as: "operator", attributes: ["id", "username"] }
                        ],
                    })];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                if (req.user.role === "operator" && event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                currentStatus = event.status;
                switch (action) {
                    case "activate":
                        if (currentStatus !== "scheduled") {
                            throw errorHandler_1.errors.badRequest("Only scheduled events can be activated");
                        }
                        eventData = event.toJSON();
                        if (!eventData.fights || eventData.fights.length === 0) {
                            throw errorHandler_1.errors.badRequest("Event must have at least one fight scheduled");
                        }
                        newStatus = "in-progress";
                        // Generate stream key with improved format
                        if (!event.streamKey) {
                            event.streamKey = event.generateStreamKey();
                        }
                        event.streamUrl = "".concat(process.env.STREAM_SERVER_URL, "/").concat(event.streamKey);
                        break;
                    case "complete":
                        if (currentStatus !== "in-progress") {
                            throw errorHandler_1.errors.badRequest("Only active events can be completed");
                        }
                        newStatus = "completed";
                        event.endDate = new Date();
                        if (event.streamUrl) {
                            event.streamUrl = null;
                        }
                        event.streamKey = null;
                        break;
                    case "cancel":
                        if (currentStatus === "completed") {
                            throw errorHandler_1.errors.badRequest("Completed events cannot be cancelled");
                        }
                        newStatus = "cancelled";
                        if (event.streamUrl) {
                            event.streamUrl = null;
                        }
                        event.streamKey = null;
                        break;
                    default:
                        throw errorHandler_1.errors.badRequest("Invalid action");
                }
                event.status = newStatus;
                return [4 /*yield*/, event.save()];
            case 2:
                _a.sent();
                sseService = req.app.get("sseService");
                if (sseService) {
                    sseService.broadcastToEvent(event.id, {
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
                notificationType = action === "activate" ? "event_activated" :
                    action === "complete" ? "event_completed" : "event_cancelled";
                metadata = __assign({ eventName: event.name }, (event.streamUrl && { streamUrl: event.streamUrl }));
                return [4 /*yield*/, notificationService_1.default.createEventNotification(notificationType, event.id, [], metadata)];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                notificationError_1 = _a.sent();
                console.error("Error creating ".concat(action, " notification:"), notificationError_1);
                return [3 /*break*/, 6];
            case 6:
                res.json({
                    success: true,
                    message: "Event ".concat(action, "d successfully"),
                    data: {
                        event: event.toJSON(),
                        streamKey: event.streamKey,
                        streamUrl: event.streamUrl
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/events/:id/activate - Activar evento para transmisión (DEPRECATED - use PATCH /api/events/:id/status)
router.post("/:id/activate", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event, eventData, sseService, notificationError_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Event.findByPk(req.params.id, {
                    include: [
                        {
                            model: models_1.Fight,
                            as: "fights",
                        },
                    ],
                })];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                if (req.user.role === "operator" && event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                if (event.status !== "scheduled") {
                    throw errorHandler_1.errors.badRequest("Only scheduled events can be activated");
                }
                eventData = event.toJSON();
                if (!eventData.fights || eventData.fights.length === 0) {
                    throw errorHandler_1.errors.badRequest("Event must have at least one fight scheduled");
                }
                event.status = "in-progress";
                event.streamKey = event.generateStreamKey();
                event.streamUrl = "".concat(process.env.STREAM_SERVER_URL, "/").concat(event.streamKey);
                return [4 /*yield*/, event.save()];
            case 2:
                _a.sent();
                sseService = req.app.get("sseService");
                if (sseService) {
                    sseService.broadcastToEvent(event.id, {
                        type: "EVENT_ACTIVATED",
                        data: {
                            eventId: event.id,
                            streamUrl: event.streamUrl,
                            timestamp: new Date()
                        }
                    });
                }
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, notificationService_1.default.createEventNotification('event_activated', event.id, [], {
                        eventName: event.name,
                        streamUrl: event.streamUrl
                    })];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                notificationError_2 = _a.sent();
                console.error('Error creating event activation notification:', notificationError_2);
                return [3 /*break*/, 6];
            case 6:
                res.json({
                    success: true,
                    message: "Event activated successfully",
                    data: {
                        event: event.toJSON(),
                        streamKey: event.streamKey,
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/events/:id/stream/start - Iniciar transmisión
router.post("/:id/stream/start", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event, streamHealthy, sseService, notificationError_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Event.findByPk(req.params.id)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                if (req.user.role === "operator" && event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                if (event.status !== "in-progress") {
                    throw errorHandler_1.errors.badRequest("Event must be activated first");
                }
                if (event.streamUrl) {
                    throw errorHandler_1.errors.conflict("Stream is already active");
                }
                if (!event.streamKey) {
                    event.streamKey = event.generateStreamKey();
                }
                event.streamUrl = "".concat(process.env.STREAM_SERVER_URL, "/").concat(event.streamKey);
                return [4 /*yield*/, event.save()];
            case 2:
                _a.sent();
                try {
                    streamHealthy = true;
                    if (!streamHealthy) {
                        throw new Error("Streaming server is not available");
                    }
                }
                catch (error) {
                    throw errorHandler_1.errors.conflict("Streaming server is not available");
                }
                sseService = req.app.get("sseService");
                if (sseService) {
                    sseService.broadcastToEvent(event.id, {
                        type: "STREAM_STARTED",
                        data: {
                            eventId: event.id,
                            streamUrl: event.streamUrl,
                            timestamp: new Date()
                        }
                    });
                }
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, notificationService_1.default.createStreamNotification('stream_started', event.id, [], {
                        streamUrl: event.streamUrl,
                        rtmpUrl: "rtmp://".concat(process.env.STREAM_SERVER_HOST || "localhost", "/live/").concat(event.streamKey)
                    })];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                notificationError_3 = _a.sent();
                console.error('Error creating stream start notification:', notificationError_3);
                return [3 /*break*/, 6];
            case 6:
                res.json({
                    success: true,
                    message: "Stream started successfully",
                    data: {
                        event: event.toJSON(),
                        streamKey: event.streamKey,
                        streamUrl: event.streamUrl,
                        rtmpUrl: "rtmp://".concat(process.env.STREAM_SERVER_HOST || "localhost", "/live/").concat(event.streamKey),
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/events/:id/stream/stop - Detener transmisión
router.post("/:id/stream/stop", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event, sseService, notificationError_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Event.findByPk(req.params.id)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                if (req.user.role === "operator" && event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                if (!event.streamUrl) {
                    throw errorHandler_1.errors.badRequest("No active stream found");
                }
                event.streamUrl = null;
                return [4 /*yield*/, event.save()];
            case 2:
                _a.sent();
                sseService = req.app.get("sseService");
                if (sseService) {
                    sseService.broadcastToEvent(event.id, {
                        type: "STREAM_STOPPED",
                        data: {
                            eventId: event.id,
                            timestamp: new Date()
                        }
                    });
                }
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, notificationService_1.default.createStreamNotification('stream_stopped', event.id, [])];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                notificationError_4 = _a.sent();
                console.error('Error creating stream stop notification:', notificationError_4);
                return [3 /*break*/, 6];
            case 6:
                res.json({
                    success: true,
                    message: "Stream stopped successfully",
                    data: event.toJSON(),
                });
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/events/:id/stream/status - Obtener estado del stream
router.get("/:id/stream/status", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event, isStreaming, streamHealth;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Event.findByPk(req.params.id)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                isStreaming = !!event.streamUrl;
                streamHealth = isStreaming ? "healthy" : "offline";
                res.json({
                    success: true,
                    data: {
                        isStreaming: isStreaming,
                        streamHealth: streamHealth,
                        streamUrl: event.streamUrl,
                        viewers: 0,
                    },
                });
                return [2 /*return*/];
        }
    });
}); }));
// POST /api/events/:id/complete - Completar evento
router.post("/:id/complete", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event, sseService, notificationError_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Event.findByPk(req.params.id)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                if (req.user.role === "operator" && event.operatorId !== req.user.id) {
                    throw errorHandler_1.errors.forbidden("You are not assigned to this event");
                }
                if (event.status !== "in-progress") {
                    throw errorHandler_1.errors.badRequest("Only active events can be completed");
                }
                if (event.streamUrl) {
                    event.streamUrl = null;
                }
                event.status = "completed";
                event.endDate = new Date();
                event.streamKey = null;
                return [4 /*yield*/, event.save()];
            case 2:
                _a.sent();
                sseService = req.app.get("sseService");
                if (sseService) {
                    sseService.broadcastToEvent(event.id, {
                        type: "EVENT_COMPLETED",
                        data: {
                            eventId: event.id,
                            timestamp: new Date()
                        }
                    });
                }
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, notificationService_1.default.createEventNotification('event_completed', event.id, [], {
                        eventName: event.name
                    })];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                notificationError_5 = _a.sent();
                console.error('Error creating event completion notification:', notificationError_5);
                return [3 /*break*/, 6];
            case 6:
                res.json({
                    success: true,
                    message: "Event completed successfully",
                    data: event.toJSON(),
                });
                return [2 /*return*/];
        }
    });
}); }));
// GET /api/events/:id/stats - Obtener estadísticas del evento
router.get("/:id/stats", auth_1.authenticate, (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event, stats;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Event.findByPk(req.params.id)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                stats = {
                    totalFights: event.totalFights,
                    completedFights: event.completedFights,
                    totalBets: event.totalBets,
                    totalPrizePool: event.totalPrizePool,
                    progress: event.totalFights > 0
                        ? Math.round((event.completedFights / event.totalFights) * 100)
                        : 0,
                };
                res.json({
                    success: true,
                    data: stats,
                });
                return [2 /*return*/];
        }
    });
}); }));
// DELETE /api/events/:id - Cancelar evento (solo admin)
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.Event.findByPk(req.params.id)];
            case 1:
                event = _a.sent();
                if (!event) {
                    throw errorHandler_1.errors.notFound("Event not found");
                }
                if (event.status === "in-progress") {
                    throw errorHandler_1.errors.badRequest("Cannot delete an active event");
                }
                event.status = "cancelled";
                return [4 /*yield*/, event.save()];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    message: "Event cancelled successfully",
                    data: event.toJSON(),
                });
                return [2 /*return*/];
        }
    });
}); }));
var invalidateEventCache = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, redis_1.delCache)("events:in-progress")];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
function init() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, invalidateEventCache()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
init();
// Get live viewer count
router.get('/:id/viewers', (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var eventId, activeConnections;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                eventId = req.params.id;
                return [4 /*yield*/, models_1.EventConnection.count({
                        where: {
                            event_id: eventId,
                            disconnected_at: null
                        }
                    })];
            case 1:
                activeConnections = _a.sent();
                res.json({
                    success: true,
                    data: {
                        currentViewers: activeConnections,
                        eventId: eventId
                    }
                });
                return [2 /*return*/];
        }
    });
}); }));
// Get event analytics
router.get('/:id/analytics', (0, auth_1.authorize)('admin', 'operator'), (0, errorHandler_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var eventId, analytics, totalConnections, uniqueViewers, avgDuration;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                eventId = req.params.id;
                return [4 /*yield*/, models_1.EventConnection.findAll({
                        where: { event_id: eventId },
                        include: [
                            {
                                model: models_1.User,
                                attributes: ['id', 'username']
                            }
                        ],
                        order: [['connected_at', 'DESC']]
                    })];
            case 1:
                analytics = _a.sent();
                totalConnections = analytics.length;
                uniqueViewers = new Set(analytics.map(function (a) { return a.user_id; })).size;
                avgDuration = analytics
                    .filter(function (a) { return a.duration_seconds; })
                    .reduce(function (sum, a) { return sum + a.duration_seconds; }, 0) / analytics.filter(function (a) { return a.duration_seconds; }).length;
                res.json({
                    success: true,
                    data: {
                        totalConnections: totalConnections,
                        uniqueViewers: uniqueViewers,
                        averageDurationSeconds: Math.round(avgDuration || 0),
                        connections: analytics
                    }
                });
                return [2 /*return*/];
        }
    });
}); }));
exports.default = router;
