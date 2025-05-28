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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// GET /api/events - Listar eventos con filtros
router.get("/", (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const events = yield models_1.Event.findAndCountAll({
        where,
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
            events: events.rows.map((event) => event.toPublicJSON()),
            total: events.count,
            limit: parseInt(limit),
            offset: parseInt(offset),
        },
    });
})));
// GET /api/events/:id - Obtener evento específico
router.get("/:id", (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id, {
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
        data: event.toPublicJSON(),
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
    // Verificar que la gallera existe
    const venue = yield models_1.Venue.findByPk(venueId);
    if (!venue) {
        throw errorHandler_1.errors.notFound("Venue not found");
    }
    // Si es un usuario venue, verificar que es dueño de la gallera
    if (req.user.role === "venue" && venue.ownerId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You can only create events for your own venues");
    }
    // Si se especifica operador, verificar que existe y tiene el rol correcto
    if (operatorId) {
        const operator = yield models_1.User.findByPk(operatorId);
        if (!operator || operator.role !== "operator") {
            throw errorHandler_1.errors.badRequest("Invalid operator specified");
        }
    }
    // Crear evento con campos inicializados
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
    // Recargar con asociaciones
    yield event.reload({
        include: [
            { model: models_1.Venue, as: "venue" },
            { model: models_1.User, as: "operator", attributes: ["id", "username"] },
        ],
    });
    res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: event.toPublicJSON(),
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
    // Verificar permisos
    if (req.user.role === "operator" && event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Actualizar campos permitidos
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
        data: event.toPublicJSON(),
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
    // Verificar que el operador está asignado
    if (req.user.role === "operator" && event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Verificar que el evento puede ser activado
    if (event.status !== "scheduled") {
        throw errorHandler_1.errors.badRequest("Only scheduled events can be activated");
    }
    // Verificar que hay peleas programadas
    const eventData = event.toJSON();
    if (!eventData.fights || eventData.fights.length === 0) {
        throw errorHandler_1.errors.badRequest("Event must have at least one fight scheduled");
    }
    // Activar evento
    event.status = "in-progress";
    event.streamKey = event.generateStreamKey();
    event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
    yield event.save();
    // Emitir evento via WebSocket
    const io = req.app.get("io");
    if (io) {
        io.emit("event_activated", {
            eventId: event.id,
            streamUrl: event.streamUrl,
        });
    }
    res.json({
        success: true,
        message: "Event activated successfully",
        data: {
            event: event.toPublicJSON(),
            streamKey: event.streamKey, // Solo para el operador
        },
    });
})));
// POST /api/events/:id/stream/start - Iniciar transmisión
router.post("/:id/stream/start", auth_1.authenticate, (0, auth_1.authorize)("operator", "admin"), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    // Verificar permisos
    if (req.user.role === "operator" && event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Verificar que el evento está activo
    if (event.status !== "in-progress") {
        throw errorHandler_1.errors.badRequest("Event must be activated first");
    }
    // Verificar si ya hay stream activo
    if (event.streamUrl) {
        throw errorHandler_1.errors.conflict("Stream is already active");
    }
    // Generar nueva stream key si no existe
    if (!event.streamKey) {
        event.streamKey = event.generateStreamKey();
    }
    // Configurar URL del stream
    event.streamUrl = `${process.env.STREAM_SERVER_URL}/${event.streamKey}`;
    yield event.save();
    // Verificar salud del servidor de streaming
    try {
        // Aquí iría la verificación real del servidor RTMP
        // Por ahora simulamos que está funcionando
        const streamHealthy = true;
        if (!streamHealthy) {
            throw new Error("Streaming server is not available");
        }
    }
    catch (error) {
        throw errorHandler_1.errors.conflict("Streaming server is not available");
    }
    // Emitir evento via WebSocket
    const io = req.app.get("io");
    if (io) {
        io.to(`event_${event.id}`).emit("stream_started", {
            eventId: event.id,
            streamUrl: event.streamUrl,
        });
    }
    res.json({
        success: true,
        message: "Stream started successfully",
        data: {
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
    // Verificar permisos
    if (req.user.role === "operator" && event.operatorId !== req.user.id) {
        throw errorHandler_1.errors.forbidden("You are not assigned to this event");
    }
    // Verificar que hay stream activo
    if (!event.streamUrl) {
        throw errorHandler_1.errors.badRequest("No active stream found");
    }
    // Detener stream
    event.streamUrl = null;
    // Mantener streamKey para poder reiniciar si es necesario
    yield event.save();
    // Emitir evento via WebSocket
    const io = req.app.get("io");
    if (io) {
        io.to(`event_${event.id}`).emit("stream_stopped", {
            eventId: event.id,
        });
    }
    res.json({
        success: true,
        message: "Stream stopped successfully",
    });
})));
// GET /api/events/:id/stream/status - Obtener estado del stream
router.get("/:id/stream/status", auth_1.authenticate, (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield models_1.Event.findByPk(req.params.id);
    if (!event) {
        throw errorHandler_1.errors.notFound("Event not found");
    }
    const isStreaming = !!event.streamUrl;
    const streamHealth = isStreaming ? "healthy" : "offline"; // Simplificado
    res.json({
        success: true,
        data: {
            isStreaming,
            streamHealth,
            streamUrl: event.streamUrl,
            viewers: 0, // Implementar contador real más adelante
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
    // Detener stream si está activo
    if (event.streamUrl) {
        event.streamUrl = null;
    }
    // Completar evento
    event.status = "completed";
    event.endDate = new Date();
    event.streamKey = null;
    yield event.save();
    // Emitir evento via WebSocket
    const io = req.app.get("io");
    if (io) {
        io.emit("event_completed", {
            eventId: event.id,
        });
    }
    res.json({
        success: true,
        message: "Event completed successfully",
        data: event.toPublicJSON(),
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
    });
})));
exports.default = router;
