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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const sequelize_1 = require("sequelize");
const redis_1 = require("../config/redis");
const notificationService_1 = __importDefault(require("../services/notificationService"));
function getEventAttributes(role, type) {
    const publicAttributes = [
        "id",
        "name",
        "scheduledDate",
        "status",
        "venueId",
        "createdAt",
        "updatedAt",
        "endDate",
    ];
    const authenticatedAttributes = [
        ...publicAttributes,
        "totalFights",
        "completedFights",
    ];
    const operatorAttributes = [
        ...authenticatedAttributes,
        "streamKey",
        "streamUrl",
        "operatorId",
    ];
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
const router = (0, express_1.Router)();
// GET /api/events - Listar eventos con filtros
router.get("/", auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { venueId, status, upcoming, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (venueId)
        where.venueId = venueId;
    if (status)
        where.status = status;
    if (upcoming === "true") {
        where.scheduledDate = {
            [sequelize_1.Op.gte]: new Date(),
        };
        where.status = "scheduled";
    }
    const attributes = getEventAttributes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role, "list");
    const events = yield models_1.Event.findAndCountAll({
        where,
        attributes,
        include: [
            {
                model: models_1.Venue,
                as: "venue",
                attributes: ["id", "name", "location"],
            },
            {
                model: models_1.User,
                as: "operator",
                attributes: ["id", "username"],
            },
        ],
        order: [["scheduledDate", "ASC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });
    res.json({
        success: true,
        data: {
            events: events.rows.map((e) => e.toJSON({ attributes })),
            total: events.count,
            limit: parseInt(limit),
            offset: parseInt(offset),
        },
    });
})));
// GET /api/events/:id - Obtener evento específico
router.get("/:id", auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const attributes = getEventAttributes((_a = req.user) === null || _a === void 0 ? void 0 : _a.role, "detail");
    const event = yield models_1.Event.findByPk(req.params.id, {
        attributes,
        include: [
            { model: models_1.Venue, as: "venue" },
            { model: models_1.User, as: "operator", attributes: ["id", "username"] },
            { model: models_1.User, as: "creator", attributes: ["id", "username"] },
            {
                model: models_1.Fight,
                as: "fights",
                order: [["number", "ASC"]],
            },
        ],
    });
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    res.json({
        success: true,
        data: event.toJSON({ attributes }),
    });
})));
// POST /api/events - Crear nuevo evento (admin/venue)
router.post("/", auth_1.authenticate, (0, auth_1.authorize)("admin", "venue"), [
    (0, express_validator_1.body)("name")
        .isLength({ min: 3, max: 255 })
        .withMessage("Name must be between 3 and 255 characters"),
    (0, express_validator_1.body)("venueId").isUUID().withMessage("Valid venue ID is required"),
    (0, express_validator_1.body)("scheduledDate")
        .isISO8601()
        .withMessage("Valid date is required")
        .custom((value) => {
        if (new Date(value) <= new Date()) {
            throw new Error("Scheduled date must be in the future");
        }
        return true;
    }),
    (0, express_validator_1.body)("operatorId")
        .optional()
        .isUUID()
        .withMessage("Valid operator ID is required"),
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const { name, venueId, scheduledDate, operatorId } = req.body;
    const venue = yield models_1.Venue.findByPk(venueId);
    if (!venue) {
        throw errorHandler_1.errors.notFound("Venue not found");
    }
    if (req.user.role === "venue" && venue.ownerId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You can only create events for your own venues");
    }
    if (operatorId) {
        const operator = yield models_1.User.findByPk(operatorId);
        if (!operator || operator.role !== "operator") {
            throw errorHandler_1.errors.badRequest("Invalid operator specified");
        }
    }
    const event = yield models_1.Event.create({
        name,
        venueId,
        scheduledDate,
        operatorId,
        createdBy: req.user.id,
        totalFights: 0,
        completedFights: 0,
        totalBets: 0,
        totalPrizePool: 0,
    });
    yield event.reload({
        include: [
            { model: models_1.Venue, as: "venue" },
            { model: models_1.User, as: "operator", attributes: ["id", "username"] },
        ],
    });
    res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: event.toJSON(),
    });
})));
// PUT /api/events/:id - Actualizar evento
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), [
    (0, express_validator_1.body)("name")
        .optional()
        .isLength({ min: 3, max: 255 })
        .withMessage("Name must be between 3 and 255 characters"),
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
], (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest("Validation failed: " +
            validationErrors
                .array()
                .map((err) => err.msg)
                .join(", "));
    }
    const event = yield models_1.Event.findByPk(req.params.id);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    if (req.user.role === "operator" && event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    const allowedFields = ["name", "scheduledDate", "operatorId", "status"];
    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            event[field] = req.body[field];
        }
    });
    yield event.save();
    res.json({
        success: true,
        message: "Event updated successfully",
        data: event.toJSON(),
    });
})));
// POST /api/events/:id/activate - Activar evento para transmisión
router.post("/:id/activate", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id, {
        include: [
            {
                model: models_1.Fight,
                as: "fights",
            },
        ],
    });
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    if (req.user.role === "operator" && event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    if (event.status !== "scheduled") {
        throw errorHandler_1.errors.badRequest("Only scheduled events can be activated");
    }
    const eventData = event.toJSON();
    if (!eventData.fights || eventData.fights.length === 0) {
        throw errorHandler_1.errors.badRequest("Event must have at least one fight scheduled");
    }
    event.status = "in-progress";
    event.streamKey = event.generateStreamKey();
    event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
    yield event.save();
    const sseService = req.app.get("sseService");
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
    try {
        yield notificationService_1.default.createEventNotification('event_activated', event.id, [], {
            eventName: event.name,
            streamUrl: event.streamUrl
        });
    }
    catch (notificationError) {
        console.error('Error creating event activation notification:', notificationError);
    }
    res.json({
        success: true,
        message: "Event activated successfully",
        data: {
            event: event.toJSON(),
            streamKey: event.streamKey,
        },
    });
})));
// POST /api/events/:id/stream/start - Iniciar transmisión
router.post("/:id/stream/start", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id);
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
    event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
    yield event.save();
    try {
        const streamHealthy = true;
        if (!streamHealthy) {
            throw new Error("Streaming server is not available");
        }
    }
    catch (error) {
        throw errorHandler_1.errors.conflict("Streaming server is not available");
    }
    const sseService = req.app.get("sseService");
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
    try {
        yield notificationService_1.default.createStreamNotification('stream_started', event.id, {
            streamUrl: event.streamUrl,
            rtmpUrl: `rtmp://${process.env.STREAM_SERVER_HOST || "localhost"}/live/${event.streamKey}`
        });
    }
    catch (notificationError) {
        console.error('Error creating stream start notification:', notificationError);
    }
    res.json({
        success: true,
        message: "Stream started successfully",
        data: {
            event: event.toJSON(),
            streamKey: event.streamKey,
            streamUrl: event.streamUrl,
            rtmpUrl: `rtmp://${process.env.STREAM_SERVER_HOST || "localhost"}/live/${event.streamKey}`,
        },
    });
})));
// POST /api/events/:id/stream/stop - Detener transmisión
router.post("/:id/stream/stop", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id);
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
    yield event.save();
    const sseService = req.app.get("sseService");
    if (sseService) {
        sseService.broadcastToEvent(event.id, {
            type: "STREAM_STOPPED",
            data: {
                eventId: event.id,
                timestamp: new Date()
            }
        });
    }
    try {
        yield notificationService_1.default.createStreamNotification('stream_stopped', event.id);
    }
    catch (notificationError) {
        console.error('Error creating stream stop notification:', notificationError);
    }
    res.json({
        success: true,
        message: "Stream stopped successfully",
        data: event.toJSON(),
    });
})));
// GET /api/events/:id/stream/status - Obtener estado del stream
router.get("/:id/stream/status", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    const isStreaming = !!event.streamUrl;
    const streamHealth = isStreaming ? "healthy" : "offline";
    res.json({
        success: true,
        data: {
            isStreaming,
            streamHealth,
            streamUrl: event.streamUrl,
            viewers: 0,
        },
    });
})));
// POST /api/events/:id/complete - Completar evento
router.post("/:id/complete", auth_1.authenticate, (0, auth_1.authorize)("admin", "operator"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id);
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
    yield event.save();
    const sseService = req.app.get("sseService");
    if (sseService) {
        sseService.broadcastToEvent(event.id, {
            type: "EVENT_COMPLETED",
            data: {
                eventId: event.id,
                timestamp: new Date()
            }
        });
    }
    try {
        yield notificationService_1.default.createEventNotification('event_completed', event.id, [], {
            eventName: event.name
        });
    }
    catch (notificationError) {
        console.error('Error creating event completion notification:', notificationError);
    }
    res.json({
        success: true,
        message: "Event completed successfully",
        data: event.toJSON(),
    });
})));
// GET /api/events/:id/stats - Obtener estadísticas del evento
router.get("/:id/stats", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    const stats = {
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
})));
// DELETE /api/events/:id - Cancelar evento (solo admin)
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)("admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    if (event.status === "in-progress") {
        throw errorHandler_1.errors.badRequest("Cannot delete an active event");
    }
    event.status = "cancelled";
    yield event.save();
    res.json({
        success: true,
        message: "Event cancelled successfully",
        data: event.toJSON(),
    });
})));
const invalidateEventCache = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, redis_1.delCache)("events:in-progress");
});
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        yield invalidateEventCache();
    });
}
init();
exports.default = router;
